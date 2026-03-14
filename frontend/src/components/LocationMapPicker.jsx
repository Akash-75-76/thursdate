import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { formatLocationLabel, reverseGeocode } from '../services/locationService';

const DEFAULT_CENTER = { latitude: 20.5937, longitude: 78.9629 };

// Leaflet's default icon URLs are not auto-resolved by Vite, so set them once.
let leafletIconConfigured = false;

const ensureLeafletIconConfig = () => {
  if (leafletIconConfigured) {
    return;
  }

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
  });

  leafletIconConfigured = true;
};

export default function LocationMapPicker({
  isOpen,
  title,
  initialPosition,
  onClose,
  onConfirm
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [error, setError] = useState('');

  const startPosition = useMemo(() => {
    const latitude =
      initialPosition?.latitude ??
      initialPosition?.lat ??
      DEFAULT_CENTER.latitude;
    const longitude =
      initialPosition?.longitude ??
      initialPosition?.lng ??
      DEFAULT_CENTER.longitude;

    return {
      latitude,
      longitude,
      hasInitial: Number.isFinite(initialPosition?.latitude) || Number.isFinite(initialPosition?.lat)
    };
  }, [initialPosition]);

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) {
      return undefined;
    }

    ensureLeafletIconConfig();

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true
    }).setView([startPosition.latitude, startPosition.longitude], startPosition.hasInitial ? 12 : 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([startPosition.latitude, startPosition.longitude], {
      draggable: true
    }).addTo(map);

    const updateSelectedCoords = (latitude, longitude) => {
      setSelectedCoords({ latitude, longitude });
      setError('');
      marker.setLatLng([latitude, longitude]);
    };

    updateSelectedCoords(startPosition.latitude, startPosition.longitude);

    map.on('click', (event) => {
      updateSelectedCoords(event.latlng.lat, event.latlng.lng);
    });

    marker.on('dragend', () => {
      const latLng = marker.getLatLng();
      updateSelectedCoords(latLng.lat, latLng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 0);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [isOpen, startPosition]);

  if (!isOpen) {
    return null;
  }

  const previewLabel = formatLocationLabel(selectedCoords || {});

  const handleConfirm = async () => {
    if (!selectedCoords || resolvingAddress) {
      return;
    }

    setResolvingAddress(true);
    setError('');

    try {
      const location = await reverseGeocode(selectedCoords.latitude, selectedCoords.longitude);
      onConfirm?.(location);
    } catch (mapError) {
      console.error('Map picker reverse geocode error:', mapError);
      setError('Unable to resolve the selected pin. Please try another point.');
    } finally {
      setResolvingAddress(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-black/50 backdrop-blur-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/20 flex items-center justify-between">
          <div className="text-white text-sm font-medium">{title || 'Select location on map'}</div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
            aria-label="Close map picker"
          >
            ✕
          </button>
        </div>

        <div ref={mapContainerRef} className="w-full" style={{ height: '320px' }} />

        <div className="px-4 py-3 border-t border-white/20">
          {selectedCoords && (
            <div className="text-xs text-white/70 mb-2">
              {`Lat: ${selectedCoords.latitude.toFixed(6)}, Lng: ${selectedCoords.longitude.toFixed(6)}`}
            </div>
          )}

          {previewLabel && (
            <div className="text-xs text-white/80 mb-3">
              {previewLabel}
            </div>
          )}

          {error && <div className="text-xs text-red-300 mb-3">{error}</div>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/30 text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedCoords || resolvingAddress}
              className="flex-1 py-2.5 rounded-xl bg-white text-black font-medium disabled:opacity-60"
            >
              {resolvingAddress ? 'Resolving...' : 'Use this location'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
