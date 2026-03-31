import { useState, useEffect, useRef } from 'react';
import {
  debounce,
  AutocompleteCache,
  fetchCompanySuggestions,
  searchJobTitles,
} from '../utils/autocompleteUtils';

/**
 * Custom hook for autocomplete functionality
 * @param {string} type - 'company' or 'jobTitle'
 * @param {Array} jobTitlesList - List of job titles (for job title autocomplete)
 * @returns {Object} Autocomplete state and handlers
 */
export const useAutocomplete = (type, jobTitlesList = []) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache for suggestions
  // Note: Current implementation uses separate caches per type below
  // This ref is intentionally separate to maintain flexibility if needed for future enhancements

  // Separate cache for each type
  const companyCacheRef = useRef(new AutocompleteCache());
  const jobTitleCacheRef = useRef(new AutocompleteCache());

  // Fetch suggestions based on query
  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 1) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let results = [];

      if (type === 'company') {
        // Check cache first
        const cached = companyCacheRef.current.get(searchQuery);
        if (cached) {
          results = cached;
        } else {
          // Fetch from Clearbit API
          results = await fetchCompanySuggestions(searchQuery);
          companyCacheRef.current.set(searchQuery, results);
        }
      } else if (type === 'jobTitle') {
        // Check cache first
        const cached = jobTitleCacheRef.current.get(searchQuery);
        if (cached) {
          results = cached;
        } else {
          // Search in job titles list
          results = searchJobTitles(searchQuery, jobTitlesList, 8);
          jobTitleCacheRef.current.set(searchQuery, results);
        }
      }

      setSuggestions(results);
      setSelectedIndex(-1);
      setIsOpen(results.length > 0);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError(err.message);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch function
  const debouncedFetch = useRef(debounce(fetchSuggestions, 300)).current;

  // Handle input change
  const handleInputChange = (value) => {
    setQuery(value);
    debouncedFetch(value);
  };

  // Handle suggestion selection
  const handleSelect = (suggestion) => {
    setQuery(type === 'company' ? suggestion.name : suggestion);
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    return type === 'company' ? suggestion.name : suggestion;
  };

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (!isOpen || suggestions.length === 0) {
      if (event.key === 'Enter' && query) {
        // Allow custom entry
        return;
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        } else if (query) {
          // Allow custom entry
          setSuggestions([]);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsOpen(false);
      setSelectedIndex(-1);
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Clear cache on unmount or type change
  useEffect(() => {
    return () => {
      // Optional: clear cache on unmount
      // cacheRef.current.clear();
    };
  }, [type]);

  return {
    query,
    suggestions,
    isOpen,
    selectedIndex,
    loading,
    error,
    handleInputChange,
    handleSelect,
    handleKeyDown,
    setIsOpen,
    setSuggestions,
    setQuery,
    setSelectedIndex,
  };
};
