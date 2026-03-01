// frontend/src/components/AutocompleteInput.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * AutocompleteInput - A reusable input component with autocomplete suggestions
 * 
 * @param {Object} props
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Handler for input change
 * @param {Function} props.onKeyDown - Handler for key down events
 * @param {Function} props.onBlur - Handler for blur events
 * @param {Function} props.onSelect - Handler when a suggestion is selected (receives display value)
 * @param {string} props.placeholder - Input placeholder text
 * @param {Function} props.searchFn - Async function that takes a query and returns suggestions
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 */
export default function AutocompleteInput({
  value,
  onChange,
  onKeyDown,
  onBlur,
  onSelect,
  placeholder,
  searchFn,
  className = '',
  style = {}
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search function
  const performSearch = useCallback(async (query) => {
    if (!query || !query.trim() || !searchFn) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    
    try {
      const results = await searchFn(query);
      setSuggestions(results || []);
      setShowSuggestions(results && results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
      }
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, [searchFn]);

  // Handle input change with debouncing
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    onChange(e);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      performSearch(newValue);
    }, 400); // 400ms debounce
  }, [onChange, performSearch]);

  // Handle suggestion selection
  const handleSuggestionClick = useCallback((suggestion) => {
    const displayValue = suggestion.display || suggestion.name;
    
    // Create a synthetic event to maintain compatibility
    const syntheticEvent = {
      target: {
        value: displayValue
      }
    };
    
    onChange(syntheticEvent);
    
    if (onSelect) {
      // Pass the full suggestion object instead of just the display string
      onSelect(suggestion);
    }
    
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, [onChange, onSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (onKeyDown) onKeyDown(e);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (onKeyDown) {
          onKeyDown(e);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      
      default:
        if (onKeyDown) onKeyDown(e);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, onKeyDown, handleSuggestionClick]);

  // Handle blur with delay to allow suggestion clicks
  const handleBlur = useCallback((e) => {
    // Delay hiding suggestions to allow click events to fire
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      if (onBlur) onBlur(e);
    }, 200);
  }, [onBlur]);

  // Handle focus
  const handleFocus = useCallback(() => {
    if (value && value.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [value, suggestions]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    const currentAbortController = abortControllerRef.current;
    const currentTimer = debounceTimerRef.current;
    
    return () => {
      if (currentTimer) {
        clearTimeout(currentTimer);
      }
      if (currentAbortController) {
        currentAbortController.abort();
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={className}
        style={style}
        autoComplete="off"
      />
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
          style={{
            background: 'rgba(30, 30, 30, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            maxHeight: '320px',
            overflowY: 'auto'
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id || index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-3 cursor-pointer transition-colors flex items-center gap-3"
              style={{
                background: selectedIndex === index 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'transparent',
                borderBottom: index < suggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {/* Thumbnail image */}
              {suggestion.image ? (
                <img 
                  src={suggestion.image} 
                  alt=""
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                  style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  onError={(e) => { e.target.style.opacity = '0.3'; }}
                />
              ) : (
                <div className="w-12 h-12 rounded flex-shrink-0" style={{ background: 'rgba(255, 255, 255, 0.05)' }} />
              )}
              
              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm truncate">
                  {suggestion.name || suggestion.display}
                </div>
                {suggestion.subtitle && (
                  <div className="text-white/60 text-xs mt-0.5 truncate">
                    {suggestion.subtitle}
                  </div>
                )}
                {!suggestion.subtitle && suggestion.year && (
                  <div className="text-white/60 text-xs mt-0.5">
                    {suggestion.year}
                  </div>
                )}
                {!suggestion.subtitle && !suggestion.year && suggestion.artist && (
                  <div className="text-white/60 text-xs mt-0.5 truncate">
                    {suggestion.artist}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div 
          className="absolute right-3 top-1/2"
          style={{ transform: 'translateY(-50%)' }}
        >
          <div 
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          />
        </div>
      )}
    </div>
  );
}
