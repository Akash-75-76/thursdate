# Autocomplete Quick Reference

## Quick Start

### 1. Use the Hook
```javascript
import { useAutocomplete } from '../../hooks/useAutocomplete';
import jobTitlesData from '../../data/job-titles.json';

// For job titles (local search)
const jobTitleAutocomplete = useAutocomplete('jobTitle', jobTitlesData.jobTitles);

// For companies (Clearbit API)
const companyAutocomplete = useAutocomplete('company');
```

### 2. Connect to Input
```javascript
<input
  value={jobTitleAutocomplete.query || jobTitle}
  onChange={(e) => {
    jobTitleAutocomplete.handleInputChange(e.target.value);
    setJobTitle(e.target.value);
  }}
  onKeyDown={jobTitleAutocomplete.handleKeyDown}
  onFocus={() => jobTitleAutocomplete.setIsOpen(true)}
/>
```

### 3. Render Suggestions
```javascript
{jobTitleAutocomplete.isOpen && jobTitleAutocomplete.suggestions.length > 0 && (
  <div className="dropdown">
    {jobTitleAutocomplete.suggestions.map((suggestion, index) => (
      <button
        onClick={() => {
          setJobTitle(suggestion);
          jobTitleAutocomplete.handleSelect(suggestion);
        }}
        className={index === jobTitleAutocomplete.selectedIndex ? 'active' : ''}
      >
        {suggestion}
      </button>
    ))}
  </div>
)}
```

---

## API Reference

### `useAutocomplete(type, jobTitlesList?)`

**Parameters**:
- `type` (string): `'jobTitle'` or `'company'`
- `jobTitlesList` (array, optional): Array of job titles for local search

**Returns**:
```javascript
{
  query: string,                           // Current search input
  suggestions: array,                      // Array of matches
  isOpen: boolean,                         // Dropdown visibility
  selectedIndex: number,                   // Keyboard nav index (-1 = none)
  loading: boolean,                        // Loading indicator (API calls)
  error: string|null,                      // Error message if any
  handleInputChange: (value) => void,      // Input handler with debounce
  handleSelect: (suggestion) => any,       // Selection handler
  handleKeyDown: (event) => void,          // Keyboard handler
  setIsOpen: (boolean) => void,            // Manual dropdown toggle
  setSuggestions: (array) => void,         // Manual suggestions update
  setQuery: (string) => void,              // Manual query update
  setSelectedIndex: (number) => void,      // Manual index update
}
```

### `searchJobTitles(query, jobTitlesList, limit = 8)`

**Parameters**:
- `query` (string): Search term
- `jobTitlesList` (array): Array of job titles to search
- `limit` (number, optional): Max results to return

**Returns**: Array of matching job titles

**Scoring**:
- Exact prefix match: Score 3
- Contains match: Score 2
- Word-level match: Score 1+
- Fuzzy match (Levenshtein): Score 0.6-1

### `fetchCompanySuggestions(query)`

**Parameters**:
- `query` (string): Company name to search

**Returns**: Promise<Array> with suggestions:
```javascript
[
  {
    id: "google.com",
    name: "Google",
    location: "Mountain View, CA",
    logo: "https://logo.clearbit.com/google.com",
    domain: "google.com"
  },
  // ...
]
```

**Errors**: Returns empty array on any error (graceful fallback)

### `debounce(func, delay)`

**Parameters**:
- `func` (function): Function to debounce
- `delay` (number): Delay in milliseconds

**Returns**: Debounced function

**Example**:
```javascript
const debouncedSearch = debounce((query) => {
  console.log('Searching:', query);
}, 300);

debouncedSearch('sof');  // Wait 300ms...
debouncedSearch('tware'); // Reset counter...
debouncedSearch('engineer'); // 300ms+ passes → executes once
```

### `AutocompleteCache(ttl = 5 * 60 * 1000)`

**Methods**:
```javascript
const cache = new AutocompleteCache(5 * 60 * 1000); // 5 min default

cache.set(key, value);     // Store value with timestamp
cache.get(key);            // Get value if not expired, else null
cache.clear();             // Clear all cache
```

### `highlightMatch(text, query)`

**Parameters**:
- `text` (string): Full text to highlight
- `query` (string): Query to highlight

**Returns**: Array of parts:
```javascript
[
  { text: "Soft", bold: true },
  { text: "ware ", bold: false },
  { text: "Engineer", bold: false }
]
```

---

## Keyboard Navigation

```javascript
// Automatically handled by useAutocomplete hook
// Connect to input with: onKeyDown={autocomplete.handleKeyDown}

ArrowDown   → Move to next suggestion
ArrowUp     → Move to previous suggestion
Enter       → Select current suggestion
Escape      → Close dropdown
```

---

## Examples

### Example 1: Basic Job Title Input
```javascript
const jobAutocomplete = useAutocomplete('jobTitle', jobTitles);

return (
  <div>
    <input
      value={jobAutocomplete.query || jobTitle}
      onChange={(e) => jobAutocomplete.handleInputChange(e.target.value)}
      onKeyDown={jobAutocomplete.handleKeyDown}
    />
    {jobAutocomplete.isOpen && (
      <ul>
        {jobAutocomplete.suggestions.map((job, i) => (
          <li key={i} onClick={() => jobAutocomplete.handleSelect(job)}>
            {job}
          </li>
        ))}
      </ul>
    )}
  </div>
);
```

### Example 2: Company with Logo
```javascript
const companyAutocomplete = useAutocomplete('company');

return (
  <div>
    <input
      value={companyAutocomplete.query}
      onChange={(e) => companyAutocomplete.handleInputChange(e.target.value)}
    />
    {companyAutocomplete.loading && <Spinner />}
    {companyAutocomplete.isOpen && (
      <ul>
        {companyAutocomplete.suggestions.map((company) => (
          <li key={company.id} onClick={() => companyAutocomplete.handleSelect(company)}>
            <img src={company.logo} alt={company.name} />
            <span>{company.name}</span>
            <small>{company.location}</small>
          </li>
        ))}
      </ul>
    )}
  </div>
);
```

### Example 3: Fuzzy Search Directly
```javascript
import { searchJobTitles } from '../../utils/autocompleteUtils';
import jobTitles from '../../data/job-titles.json';

const results = searchJobTitles('engi', jobTitles.jobTitles, 10);
// Returns: ["Engineer", "Engineering Manager", "Software Engineer", ...]
```

---

## Troubleshooting

### Suggestions not appearing?
- Check `isOpen` is true: `console.log(autocomplete.isOpen)`
- Check `suggestions` array: `console.log(autocomplete.suggestions)`
- Verify input handler calls `handleInputChange`: `onChange={() => handleInputChange(...)}`

### Keyboard navigation not working?
- Connect `onKeyDown` handler: `onKeyDown={autocomplete.handleKeyDown}`
- Check `selectedIndex` changes: `console.log(autocomplete.selectedIndex)`

### Clearbit API not working?
- Check network tab for failing requests
- Verify API endpoint: `https://autocomplete.clearbit.com/v1/companies/suggest`
- Check `loading` state: `console.log(autocomplete.loading)`
- Check `error`: `console.log(autocomplete.error)`

### Performance issues?
- Debounce interval too short? (default 300ms is optimal)
- Cache TTL too short? (default 5 min is balanced)
- Too many suggestions? (limit is 8, can adjust)

---

## Configuration

### Change Debounce Delay
```javascript
// In useAutocomplete hook (line 42)
const debouncedFetch = useRef(
  debounce(fetchSuggestions, 500)  // Change from 300 to 500ms
).current;
```

### Change Result Limit
```javascript
// In searchJobTitles call
const results = searchJobTitles(query, titles, 10);  // Was 8, now 10

// Or in useAutocomplete hook
results = fetchCompanySuggestions(query);  // Hardcoded to 8 in function
```

### Change Cache TTL
```javascript
// In useAutocomplete hook
const companyCacheRef = useRef(
  new AutocompleteCache(10 * 60 * 1000)  // 10 minutes instead of 5
).current;
```

---

## Best Practices

1. **Always handle errors**: Clearbit API can fail - always show fallback
2. **Debounce aggressively**: 300ms is minimum, 500ms is safer
3. **Limit results**: 8-10 suggestions max, more is overwhelming
4. **Cache sensibly**: 5 min TTL balances freshness vs performance
5. **Keyboard nav**: Always include full keyboard support
6. **Mobile friendly**: Test on touch devices, use larger tap targets
7. **Graceful degradation**: Always allow custom entry if suggestions unavailable

---

## Performance Tips

- Use `debounce` for both job title and company searches
- Enable caching on all autocomplete fields
- Limit results to 8 suggestions
- Close dropdown on blur (with delay) to avoid refocus flicker
- Use lazy rendering (only render dropdown when open)
- Avoid inline functions in render (memoize if needed)

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Basic autocomplete | ✅ | ✅ | ✅ | ✅ |
| Keyboard nav | ✅ | ✅ | ✅ | ✅ |
| Clearbit API | ✅ | ✅ | ✅ | ✅ |
| Caching (Map) | ✅ | ✅ | ✅ | ✅ |
| Debounce | ✅ | ✅ | ✅ | ✅ |

---

## Performance Metrics

**Typical Performance**:
- Input → suggestions: 300ms (debounce) + render time
- Keyboard navigation: < 16ms (60 fps)
- Cache hits: < 1ms
- Clearbit API: 100-500ms (network dependent)

**Bundle Size Impact**:
- `autocompleteUtils.js`: ~4 KB
- `useAutocomplete.js`: ~3 KB
- `AutocompleteDropdown.jsx`: ~2 KB
- `job-titles.json`: ~15 KB
- **Total**: ~24 KB

---

## Related Documentation

- [AUTOCOMPLETE_GUIDE.md](./AUTOCOMPLETE_GUIDE.md) - Full feature guide
- [AUTOCOMPLETE_IMPLEMENTATION.md](./AUTOCOMPLETE_IMPLEMENTATION.md) - Implementation summary
- Clearbit API: https://clearbit.com/autocomplete
