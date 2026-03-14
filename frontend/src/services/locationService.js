const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const DEFAULT_SEARCH_LIMIT = 5;
const CITY_LIKE_TYPES = new Set([
  'city',
  'town',
  'village',
  'municipality',
  'hamlet',
  'suburb',
  'neighbourhood',
  'administrative'
]);

const normalizeCityName = (cityName = '') => {
  return cityName
    .replace(/\s+District$/i, '')
    .replace(/\s+City$/i, '')
    .replace(/\s+Metropolitan$/i, '')
    .replace(/\s+Metro$/i, '')
    .replace(/\s+Urban$/i, '')
    .replace(/\s+Area$/i, '')
    .trim();
};

const extractAddressParts = (address = {}) => {
  const rawCity =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.hamlet ||
    address.suburb ||
    address.neighbourhood ||
    '';

  return {
    city: normalizeCityName(rawCity),
    state: address.state || address.region || address.state_district || address.province || '',
    country: address.country || ''
  };
};

export const formatLocationLabel = (location = {}) => {
  const primary = location.city || location.state || '';
  if (primary && location.country) {
    return `${primary}, ${location.country}`;
  }
  return primary || location.country || location.name || '';
};

const mapNominatimRecord = (record = {}) => {
  const address = record.address || {};
  const { city, state, country } = extractAddressParts(address);
  const latitude = Number.parseFloat(record.lat);
  const longitude = Number.parseFloat(record.lon);

  return {
    id: String(record.place_id || `${record.lat || ''}:${record.lon || ''}`),
    name: record.display_name || '',
    display: formatLocationLabel({ city, state, country, name: record.display_name || '' }),
    city,
    state,
    country,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    type: record.type || '',
    importance: Number.isFinite(Number(record.importance)) ? Number(record.importance) : 0,
    rawAddress: address
  };
};

const dedupeLocations = (locations) => {
  const seen = new Set();
  const unique = [];

  for (const location of locations) {
    const key = `${(location.city || '').toLowerCase()}|${(location.state || '').toLowerCase()}|${(location.country || '').toLowerCase()}|${(location.display || '').toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(location);
    }
  }

  return unique;
};

export async function searchLocations(query, { limit = DEFAULT_SEARCH_LIMIT, signal } = {}) {
  const trimmedQuery = (query || '').trim();
  if (trimmedQuery.length < 2) {
    return [];
  }

  const normalizedQuery = trimmedQuery.toLowerCase();
  const requestLimit = Math.max(limit * 4, 20);

  const params = new URLSearchParams({
    q: trimmedQuery,
    format: 'jsonv2',
    addressdetails: '1',
    dedupe: '1',
    limit: String(requestLimit)
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
    signal,
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Location search failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  const mapped = data
    .map(mapNominatimRecord)
    .filter((location) => location.display || location.name);

  const cityLikeLocations = mapped.filter((location) => {
    if (location.city) {
      return true;
    }
    return CITY_LIKE_TYPES.has((location.type || '').toLowerCase());
  });

  const candidates = cityLikeLocations.length > 0 ? cityLikeLocations : mapped;

  const scoreLocation = (location) => {
    const city = (location.city || '').toLowerCase();
    const label = (location.display || location.name || '').toLowerCase();
    let score = 0;

    if (city.startsWith(normalizedQuery)) {
      score += 70;
    } else if (city.includes(normalizedQuery)) {
      score += 30;
    }

    if (label.startsWith(normalizedQuery)) {
      score += 25;
    } else if (label.includes(normalizedQuery)) {
      score += 10;
    }

    if (CITY_LIKE_TYPES.has((location.type || '').toLowerCase())) {
      score += 10;
    }

    score += Math.round((location.importance || 0) * 10);
    return score;
  };

  const ranked = candidates
    .map((location) => ({ location, score: scoreLocation(location) }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return (b.location.importance || 0) - (a.location.importance || 0);
    })
    .map((item) => item.location);

  const startsWithMatches = ranked.filter((location) => {
    const city = (location.city || '').toLowerCase();
    const label = (location.display || location.name || '').toLowerCase();
    return city.startsWith(normalizedQuery) || label.startsWith(normalizedQuery);
  });

  const includesMatches = ranked.filter((location) => {
    const city = (location.city || '').toLowerCase();
    const label = (location.display || location.name || '').toLowerCase();
    return city.includes(normalizedQuery) || label.includes(normalizedQuery);
  });

  const ordered =
    startsWithMatches.length > 0
      ? startsWithMatches
      : includesMatches.length > 0
        ? includesMatches
        : ranked;

  return dedupeLocations(ordered).slice(0, limit);
}

export async function reverseGeocode(latitude, longitude, { signal } = {}) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Invalid coordinates for reverse geocoding');
  }

  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'jsonv2',
    addressdetails: '1'
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params.toString()}`, {
    signal,
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data || data.error) {
    throw new Error('Reverse geocoding failed to return a valid address');
  }

  return mapNominatimRecord({
    ...data,
    lat: String(latitude),
    lon: String(longitude)
  });
}

export function getCurrentCoordinates(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation?.getCurrentPosition) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
        ...options
      }
    );
  });
}

export async function getCurrentLocationDetails({ geolocationOptions, signal } = {}) {
  const coords = await getCurrentCoordinates(geolocationOptions);
  const location = await reverseGeocode(coords.latitude, coords.longitude, { signal });
  return {
    ...location,
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy
  };
}
