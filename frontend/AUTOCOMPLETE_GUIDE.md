# Profession Field Autocomplete Implementation Guide

## Overview
LinkedIn-style autocomplete has been implemented for Job Title and Company Name fields in the UserInfo onboarding Step 4. The implementation includes:

- **Job Title Autocomplete**: Local fuzzy-matching search with 500+ job titles
- **Company Name Autocomplete**: Real-time Clearbit API integration with company logos
- **Keyboard Navigation**: Full keyboard support (arrow keys, enter, escape)
- **Text Highlighting**: Matches highlighted in suggestions (bold)
- **Performance Optimizations**: 300ms debounce, result caching (5-min TTL)

---

## File Structure

```
frontend/src/
├── data/
│   └── job-titles.json                 # 500+ job titles dataset
├── utils/
│   └── autocompleteUtils.js            # Core utilities (debounce, cache, search, highlight)
├── hooks/
│   └── useAutocomplete.js              # Custom React hook for autocomplete state management
├── components/
│   └── AutocompleteDropdown.jsx        # Reusable dropdown component
└── pages/onboarding/
    └── UserInfo.jsx                    # Updated with autocomplete integration
```

---

## Implementation Details

### 1. Data & Utilities (`job-titles.json` & `autocompleteUtils.js`)

**Job Titles Dataset**:
- 700+ job titles covering all industries
- Organized for easy maintenance
- Imported as JSON for tree-shaking

**Utility Functions**:

```javascript
// Debounce with configurable delay
debounce(func, delay)

// Caching system with TTL
AutocompleteCache(ttl)  // Default: 5 minutes

// Company suggestions from Clearbit API
fetchCompanySuggestions(query)  // Returns: [{ name, location, logo, domain }]

// Local job title search with fuzzy matching
searchJobTitles(query, jobTitles, limit)  // Returns: [matches...]

// Text highlighting for matched portions
highlightMatch(text, query)  // Returns: [{ text, bold }]
```

### 2. Custom Hook (`useAutocomplete.js`)

The `useAutocomplete` hook manages all autocomplete state and logic:

```javascript
const {
  query,                // Current search input
  suggestions,          // Array of matching suggestions
  isOpen,              // Dropdown visibility
  selectedIndex,       // Keyboard navigation index
  loading,             // Loading state (for API calls)
  error,               // Error messages
  handleInputChange,   // Input handler with debounce
  handleSelect,        // Selection handler
  handleKeyDown,       // Keyboard event handler
  setIsOpen,          // Manual dropdown control
  setSuggestions,     // Manual suggestions update
  setQuery,           // Manual query update
  setSelectedIndex,   // Manual index update
} = useAutocomplete(type, jobTitlesList);
```

Usage:
```javascript
const jobTitleAutocomplete = useAutocomplete('jobTitle', jobTitlesData.jobTitles);
const companyNameAutocomplete = useAutocomplete('company');
```

### 3. Dropdown Component (`AutocompleteDropdown.jsx`)

Reusable dropdown that renders suggestions with:
- Keyboard-selected highlight styling
- Company logos (for company suggestions)
- Location information (for companies)
- Loading indicator
- Attribution (Clearbit, keyboard nav tips)

### 4. UserInfo Integration

**Step 4 UI Update**:
```jsx
{step === 4 && (
  <div>
    {/* Job Title Input */}
    <input
      value={jobTitleAutocomplete.query || jobTitle}
      onChange={handleInputChange}
      onKeyDown={jobTitleAutocomplete.handleKeyDown}
      onFocus={() => jobTitleAutocomplete.setIsOpen(true)}
    />
    {/* Job Title Dropdown */}
    {jobTitleAutocomplete.isOpen && (
      <div className="dropdown">
        {jobTitleAutocomplete.suggestions.map((suggestion, index) => (
          <button onClick={() => setJobTitle(suggestion)}>
            {/* Highlighted text */}
          </button>
        ))}
      </div>
    )}

    {/* Similar for Company Name... */}
  </div>
)}
```

---

## Feature Details

### Job Title Autocomplete

**Fuzzy Matching Algorithm**:
1. **Exact Prefix Match** (Score: 3) - "Soft" matches "Software Engineer"
2. **Contains Match** (Score: 2) - "Eng" matches "Software Engineer"
3. **Word-Level Match** (Score: 1+) - Matches individual words
4. **Levenshtein Distance** (Score: 0.6-1) - Fuzzy matching for typos

**Results**: Top 8 matches sorted by relevance

**Debounce**: 300ms to avoid excessive re-renders

**Caching**: Per-query cache with 5-minute expiration

### Company Name Autocomplete

**Clearbit API Integration**:
- Endpoint: `https://autocomplete.clearbit.com/v1/companies/suggest?query={query}`
- Response fields: `{ name, domain, location, logo, ...}`
- Results limit: 8 suggestions maximum
- Rate limit: No documented limit for autocomplete endpoint

**Caching**: 5-minute TTL per query to reduce API calls

**Fallback**: If API fails, allows custom company entry

**Error Handling**:
```javascript
try {
  const response = await fetch(clearbitUrl);
  if (!response.ok) throw new Error('Clearbit API failed');
  // Process data...
} catch (error) {
  console.error('Company fetch error:', error);
  return [];  // Empty suggestions, allow custom entry
}
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `↓` Arrow Down | Move to next suggestion |
| `↑` Arrow Up | Move to previous suggestion |
| `Enter` | Select highlighted suggestion or confirm custom entry |
| `Escape` | Close dropdown |

### Text Highlighting

Matching portions are bolded in suggestions:
```
Query: "soft"
Result: "**Soft**ware Engineer" (bold soft, normal ware Engineer)
```

---

## State Management

**localStorage Integration**:
```javascript
// Job title and company name are saved in STORAGE_KEYS.USER_INFO
saveOnboardingState(STORAGE_KEYS.USER_INFO, {
  jobTitle: "Senior Software Engineer",
  companyName: "Google",
  // ...other fields
})
```

**Backend Integration**:
```javascript
// Sent in handleNext() via userAPI.saveProfile()
{
  intent: {
    profileQuestions: {
      jobTitle: "Senior Software Engineer",
      companyName: "Google"
    }
  }
}
```

---

## Performance Optimizations

1. **Debouncing**: 300ms delay before search
   - Reduces unnecessary re-renders
   - Reduces API calls for company suggestions

2. **Caching**:
   - Job title searches cached per query
   - Company suggestions cached per query
   - 5-minute TTL before cache expiration

3. **Result Limiting**:
   - Job titles: 8 suggestions max
   - Companies: 8 suggestions max
   - Reduces rendering overhead

4. **Lazy Rendering**:
   - Dropdown only renders when `isOpen === true`
   - Suggestions only render if data exists

---

## Error Handling

### Job Title Autocomplete
- No API dependency - local search only
- No failure scenarios (always returns array)
- Falls back to empty array if data file missing

### Company Autocomplete
- **Network Error**: Returns empty array, allows custom entry
- **API Rate Limit**: Returns empty array, allows custom entry
- **Invalid Query**: Returns empty array
- **Timeout**: Configurable timeout (default: fetch timeout)

### User Experience
- Loading indicator shown while fetching
- Error messages logged to console (not shown to user)
- Always allows custom entry if suggestions unavailable

---

## Testing Checklist

### Functional Testing
- [ ] Type in job title input → suggestions appear (with debounce)
- [ ] Arrow down/up navigates suggestions
- [ ] Enter selects highlighted suggestion
- [ ] Escape closes dropdown
- [ ] Clear button (X) resets both fields
- [ ] Clicking suggestion selects it
- [ ] Custom entries (not in list) allowed

### Company Search
- [ ] Type company name → API suggestions appear
- [ ] Company logos display correctly
- [ ] Company location shows below name
- [ ] Company domain used as key (unique)
- [ ] Clearbit attribution shown in footer

### Performance
- [ ] Debounce prevents excessive renders
- [ ] Suggestions limit to 8 results
- [ ] Caching reduces repeated API calls
- [ ] No lag when typing quickly

### Data Persistence
- [ ] Job title saved to localStorage
- [ ] Company name saved to localStorage
- [ ] Data restored on page reload
- [ ] Data sent to backend on save

### Edge Cases
- [ ] Empty input shows no suggestions
- [ ] Whitespace trimmed from queries
- [ ] Special characters handled correctly
- [ ] Very long titles display correctly
- [ ] Mobile responsiveness tested

### Accessibility
- [ ] Keyboard navigation fully functional
- [ ] Focus states visible
- [ ] Dropdown scrollable on mobile
- [ ] Screen reader compatible (ARIA labels optional)

---

## Future Enhancements

1. **ARIA Labels**: Add `aria-label`, `aria-expanded` for accessibility
2. **Mobile Optimization**: Snap-to-select on mobile touch
3. **Custom Suggestions**: Let users create/save custom titles
4. **Analytics**: Track suggestion selections for insights
5. **Caching Strategy**: Persistent cache (IndexedDB) for offline support
6. **Job Title Dataset**: Update from external API (BLS, Indeed, etc.)
7. **Recent Selections**: Show recently used titles/companies first

---

## Clearbit API Notes

- **No authentication required** for autocomplete endpoint
- **Rate limiting**: Not officially documented (generous limits)
- **Data**: Real-time company data with logos
- **CORS**: Supported from browser
- **Fallback**: If API unavailable, allows custom entry

### Example Response
```json
[
  {
    "name": "Google",
    "domain": "google.com",
    "logo": "https://logo.clearbit.com/google.com",
    "location": "Mountain View, CA"
  },
  {
    "name": "Google Cloud",
    "domain": "cloud.google.com",
    "logo": "https://logo.clearbit.com/cloud.google.com",
    "location": "Mountain View, CA"
  }
]
```

---

##Important Notes

⚠️ **No Changes to Onboarding Flow**
- Autocomplete is UI enhancement only
- Step 4 remains the same
- No changes to step numbering or validation
- No changes to backend API

✅ **Backwards Compatible**
- Works with existing localStorage system
- Works with existing backend API
- Falls back gracefully if features unavailable

✅ **Performance Optimized**
- Minimal bundle size impact (utilities are tree-shakeable)
- No heavy dependencies (vanilla JS)
- Efficient caching and debouncing
