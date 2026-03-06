// src/components/MediaItemCard.jsx
import React from 'react';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';

/**
 * MediaItemCard - Displays media items (movies, TV shows, artists, songs) with thumbnail
 * Matches Figma design at node-id=2254-7785
 * 
 * @param {Object} props
 * @param {string} props.type - Type of media: 'movie', 'tv', 'artist', 'song'
 * @param {string} props.title - Main title of the item
 * @param {string} props.subtitle - Subtitle/description
 * @param {string} props.image - Image URL or TMDB poster path
 * @param {Object} props.item - Full item object (for backward compatibility)
 * @param {string} props.className - Additional CSS classes
 */
export default function MediaItemCard({ type, title, subtitle, image, item, className = '' }) {
  // Backward compatibility: if item is a plain string, render as text
  if (typeof item === 'string') {
    return (
      <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
        <span className="text-white text-xs">{item}</span>
      </div>
    );
  }

  // Extract data from item object if provided
  const itemData = item || {};
  const displayTitle = title || itemData.name || itemData.title || '';
  let displaySubtitle = subtitle || '';
  let imageUrl = image || itemData.image || null;

  // Build appropriate subtitle based on type and available data
  if (!displaySubtitle) {
    switch (type) {
      case 'movie':
        if (itemData.release_date) {
          const year = new Date(itemData.release_date).getFullYear();
          const rating = itemData.vote_average ? ` ⭐ ${itemData.vote_average.toFixed(1)}` : '';
          displaySubtitle = `Released ${year}${rating}`;
        } else {
          displaySubtitle = 'Movie';
        }
        break;
      
      case 'tv':
        if (itemData.first_air_date) {
          const year = new Date(itemData.first_air_date).getFullYear();
          displaySubtitle = `TV Series • ${year}`;
        } else {
          displaySubtitle = 'TV Series';
        }
        break;
      
      case 'artist':
        if (itemData.genres && itemData.genres.length > 0) {
          displaySubtitle = itemData.genres
            .slice(0, 2)
            .map(g => g.charAt(0).toUpperCase() + g.slice(1))
            .join(' • ');
        } else {
          displaySubtitle = 'Artist';
        }
        break;
      
      case 'song':
        if (itemData.artists && Array.isArray(itemData.artists)) {
          displaySubtitle = `By ${itemData.artists.map(a => a.name || a).join(', ')}`;
        } else if (itemData.subtitle) {
          displaySubtitle = itemData.subtitle;
        } else {
          displaySubtitle = 'Song';
        }
        break;
      
      default:
        displaySubtitle = itemData.subtitle || '';
    }
  }

  // Handle TMDB poster_path (needs base URL prefix)
  if (itemData.poster_path && !imageUrl) {
    imageUrl = `${TMDB_IMAGE_BASE}${itemData.poster_path}`;
  }

  // Handle Spotify album images
  if (!imageUrl && itemData.album && itemData.album.images && itemData.album.images.length > 0) {
    imageUrl = itemData.album.images[0].url;
  }

  // Handle Spotify artist images
  if (!imageUrl && itemData.images && Array.isArray(itemData.images) && itemData.images.length > 0) {
    imageUrl = itemData.images[0].url;
  }

  return (
    <div className={`flex gap-2 items-center py-2 ${className}`}>
      {/* Thumbnail - 48x48 rounded */}
      <div className="flex-shrink-0 w-12 h-12 rounded-sm overflow-hidden bg-white/5">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={displayTitle}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder on image load error
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <div class="w-full h-full flex items-center justify-center text-white/30">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                  </svg>
                </div>
              `;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        {/* Title */}
        <p className="text-white text-sm font-normal leading-5 truncate">
          {displayTitle}
        </p>
        
        {/* Subtitle */}
        {displaySubtitle && (
          <div className="flex items-center">
            <p className="text-white text-sm leading-5 truncate">
              {/* Parse subtitle to handle "Directed by **Name**" format from Figma */}
              {displaySubtitle.includes('**') ? (
                displaySubtitle.split('**').map((part, idx) => 
                  idx % 2 === 0 ? (
                    <span key={idx} className="font-normal">{part}</span>
                  ) : (
                    <span key={idx} className="font-bold">{part}</span>
                  )
                )
              ) : (
                <span className="font-normal">{displaySubtitle}</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
