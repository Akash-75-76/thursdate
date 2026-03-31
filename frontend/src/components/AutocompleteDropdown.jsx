import React from 'react';
import { highlightMatch } from '../utils/autocompleteUtils';

/**
 * AutocompleteDropdown Component
 * Displays suggestions with highlighting and keyboard navigation
 */
export const AutocompleteDropdown = ({
  suggestions,
  isOpen,
  selectedIndex,
  query,
  onSelect,
  type,
  loading,
}) => {
  if (!isOpen || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-black/80 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
      {loading && (
        <div className="px-4 py-3 text-white/60 text-sm text-center">
          Loading suggestions...
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <div className="px-4 py-3 text-white/60 text-sm text-center">
          No suggestions found
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <ul className="py-2">
          {suggestions.map((suggestion, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => onSelect(suggestion)}
                className={`w-full px-4 py-2 text-left transition-colors ${
                  index === selectedIndex
                    ? 'bg-white/20'
                    : 'hover:bg-white/10'
                }`}
              >
                {type === 'company' && suggestion.logo ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={suggestion.logo}
                      alt={suggestion.name}
                      className="w-6 h-6 rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="text-white text-sm font-medium">
                      {renderHighlight(suggestion.name, query)}
                    </div>
                  </div>
                ) : (
                  <div className="text-white text-sm">
                    {renderHighlight(
                      type === 'company' ? suggestion.name : suggestion,
                      query
                    )}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="px-3 py-2 border-t border-white/10 text-white/40 text-xs">
        {type === 'company' ? 'Powered by Clearbit' : 'Use arrow keys to navigate'}
      </div>
    </div>
  );
};

/**
 * Render highlighted text with bold matching portions
 */
const renderHighlight = (text, query) => {
  const parts = highlightMatch(text, query);

  return (
    <>
      {parts.map((part, idx) => (
        <span key={idx} className={part.bold ? 'font-bold text-white' : ''}>
          {part.text}
        </span>
      ))}
    </>
  );
};

export default AutocompleteDropdown;
