# Structured Interests Database - Developer Quick Reference

## Quick Start

### Import the Database
```javascript
import {
  INTERESTS_DATABASE,
  searchInterestsDatabase,
  getInterestsByCategory,
  getAllCategories,
  getAllInterests,
  TOTAL_INTERESTS,
  TOTAL_CATEGORIES,
} from '../utils/interestsDatabase';
```

---

## Common Use Cases

### 1. Search Interests (Most Common)
```javascript
// Search for interests matching user query
const results = searchInterestsDatabase(userInput);
// Returns: Top 10 interests sorted by relevance

results.forEach(interest => {
  console.log(interest.name);              // "Cricket"
  console.log(interest.category);          // "Fitness & Sports"
  console.log(interest.tags);              // ["cricket", "sport", "team", ...]
  console.log(interest.popularityScore);   // 95
  console.log(interest.matchScore);        // 150 (internal scoring)
});
```

### 2. Get All Interests in a Category
```javascript
// Get all fitness interests
const sportInterests = getInterestsByCategory('Fitness & Sports');
// Returns: 60+ interest objects with all metadata

// Show as dropdown options
const options = sportInterests.map(i => ({
  label: i.name,
  value: i.id,
  category: i.category,
}));
```

### 3. List All Categories
```javascript
// Get all available categories for filtering
const categories = getAllCategories();
// Returns: ['Adventure & Travel', 'Art & Creativity', ..., 'Volunteering & Social Causes']

// Use for category dropdown
<select onChange={(e) => filterByCategory(e.target.value)}>
  {categories.map(cat => <option key={cat}>{cat}</option>)}
</select>
```

### 4. Get All Interests
```javascript
// Get complete interest database with IDs
const allInterests = getAllInterests();
// Returns: 750+ interests with auto-generated IDs
```

### 5. Display Stats
```javascript
// Show database statistics
console.log(`Total interests: ${TOTAL_INTERESTS}`);        // 750+
console.log(`Total categories: ${TOTAL_CATEGORIES}`);      // 21
console.log(`Avg per category: ${TOTAL_INTERESTS / TOTAL_CATEGORIES}`);  // ~36
```

---

## Search Detail Examples

### Basic Search
```javascript
const results = searchInterestsDatabase('cricket');

// Single result:
[{
  id: 'interest-db-cricket-26',
  name: 'Cricket',
  category: 'Fitness & Sports',
  tags: ['cricket', 'sport', 'team', 'ball', 'outdoor'],
  popularityScore: 95,
  matchScore: 150  // Name prefix match + name match bonus
}]
```

### Multi-Result Search
```javascript
const results = searchInterestsDatabase('photo');

// Returns up to 10:
[
  {
    name: 'Photography',
    tags: ['photography', 'visual', 'creative', 'hobby', 'art'],
    popularityScore: 91,
    matchScore: 150  // Prefix match on name
  },
  {
    name: 'Food Photography',
    tags: ['food', 'photography', 'visual', 'social media', 'creative'],
    popularityScore: 84,
    matchScore: 100  // Contains 'photo' in name
  },
  {
    name: 'Travel Photography',
    tags: ['travel', 'photography', 'exploration', 'documenting', 'adventure'],
    popularityScore: 86,
    matchScore: 100
  },
  // ... more photography interests sorted by relevance
]
```

### Tag-Based Match
```javascript
const results = searchInterestsDatabase('mountain');

// Matches both by name AND tags:
[
  {
    name: 'Mountain Climbing',  // Name match
    tags: ['mountain', 'climbing', 'adventure', 'hiking', 'trekking'],
    matchScore: 150  // Name match
  },
  {
    name: 'Mountaineering',     // Name match
    matchScore: 150
  },
  {
    name: 'Hiking',             // Tag match (mountain tag present)
    tags: ['hiking', 'outdoors', 'nature', 'trail', 'walking'],
    matchScore: 50  // Tag match only
  }
]
```

---

## Data Structure Reference

### Interest Object
```javascript
{
  // Display Information
  id: string,                    // Auto-generated: "interest-db-cricket-26"
  name: string,                  // "Cricket"
  category: string,              // "Fitness & Sports"
  
  // Categorization
  tags: string[],               // ["cricket", "sport", "team", "ball", "outdoor"]
  
  // Ranking
  popularityScore: number,       // 1-100 scale (95 for Cricket)
  
  // Search Results Only
  matchScore?: number           // Internal relevance score (100-150+)
}
```

### Category Names (21 Total)
```javascript
'Adventure & Travel'
'Fitness & Sports'
'Food & Drinks'
'Music'
'Movies & TV Shows'
'Books & Reading'
'Gaming'
'Technology'
'Art & Creativity'
'Photography'
'Social & Nightlife'
'Outdoors & Nature'
'Pets & Animals'
'Spirituality & Mindfulness'
'Career & Business'
'Fashion & Lifestyle'
'Volunteering & Social Causes'
'Events & Festivals'
'Learning & Education'
'Cars & Bikes'
'Content Creation & Social Media'
```

---

## React Component Examples

### Search Autocomplete
```javascript
import { searchInterestsDatabase } from '../utils/interestsDatabase';

function InterestSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length >= 2) {
      const suggestions = searchInterestsDatabase(value);
      setResults(suggestions);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={handleSearch}
        placeholder="Search interests..."
      />
      <ul>
        {results.map(interest => (
          <li key={interest.id}>
            {interest.name}
            <span className="category">{interest.category}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Category Filter
```javascript
import { getInterestsByCategory, getAllCategories } from '../utils/interestsDatabase';

function InterestsByCategory() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [interests, setInterests] = useState([]);

  const categories = getAllCategories();

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    const filtered = getInterestsByCategory(category);
    setInterests(filtered);
  };

  return (
    <div>
      <select onChange={(e) => handleCategoryChange(e.target.value)}>
        <option>Select category...</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      
      <div className="interests-grid">
        {interests.map(interest => (
          <div key={interest.id} className="interest-card">
            <h3>{interest.name}</h3>
            <p>{interest.category}</p>
            <div className="tags">
              {interest.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Multi-Select with Search
```javascript
import { searchInterestsDatabase } from '../utils/interestsDatabase';

function InterestSelector() {
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const suggestions = searchInterestsDatabase(searchQuery);

  const toggleInterest = (interest) => {
    if (selected.find(i => i.id === interest.id)) {
      setSelected(selected.filter(i => i.id !== interest.id));
    } else {
      setSelected([...selected, interest]);
    }
  };

  return (
    <div className="interest-selector">
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search interests..."
      />

      <div className="suggestions">
        {suggestions.map(interest => (
          <button
            key={interest.id}
            onClick={() => toggleInterest(interest)}
            className={selected.find(i => i.id === interest.id) ? 'selected' : ''}
          >
            {interest.name}
          </button>
        ))}
      </div>

      <div className="selected">
        <h4>Selected ({selected.length})</h4>
        {selected.map(interest => (
          <div key={interest.id} className="selected-tag">
            {interest.name}
            <button onClick={() => toggleInterest(interest)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Validation & Error Handling

### Check Minimum Query Length
```javascript
function searchSafely(query) {
  if (!query || query.trim().length < 2) {
    console.warn('Query must be at least 2 characters');
    return [];
  }
  return searchInterestsDatabase(query);
}
```

### Validate Interest Object
```javascript
function isValidInterest(interest) {
  return (
    interest.name &&
    interest.category &&
    Array.isArray(interest.tags) &&
    typeof interest.popularityScore === 'number'
  );
}
```

### Duplicate Prevention
```javascript
function addInterestUniquelyToSelection(interest, selected) {
  const exists = selected.some(i => i.id === interest.id);
  if (exists) {
    console.warn('Interest already selected');
    return selected;
  }
  return [...selected, interest];
}
```

---

## Performance Tips

### 1. Debounce Search Input
```javascript
import { useCallback, useState } from 'react';
import { debounce } from 'lodash';

function SearchInterests() {
  const debouncedSearch = useCallback(
    debounce((query) => {
      const results = searchInterestsDatabase(query);
      setResults(results);
    }, 300),  // Wait 300ms after user stops typing
    []
  );

  return (
    <input onChange={(e) => debouncedSearch(e.target.value)} />
  );
}
```

### 2. Memoize Category List
```javascript
const CATEGORIES = getAllCategories();  // Call once at module load

function FilterComponent() {
  return (
    <select>
      {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
    </select>
  );
}
```

### 3. Lazy Load Category Data
```javascript
const interestsByCategory = new Map();  // Lazy cache

function getInterestsCached(category) {
  if (!interestsByCategory.has(category)) {
    interestsByCategory.set(category, getInterestsByCategory(category));
  }
  return interestsByCategory.get(category);
}
```

---

## Statistics & Analytics

### Get Database Stats
```javascript
console.log('=== Interests Database Stats ===');
console.log(`Total Interests: ${TOTAL_INTERESTS}`);
console.log(`Total Categories: ${TOTAL_CATEGORIES}`);
console.log(`Avg per Category: ${(TOTAL_INTERESTS / TOTAL_CATEGORIES).toFixed(1)}`);

// Per-category breakdown
const allInterests = getAllInterests();
const byCategory = new Map();

allInterests.forEach(interest => {
  if (!byCategory.has(interest.category)) {
    byCategory.set(interest.category, []);
  }
  byCategory.get(interest.category).push(interest);
});

Array.from(byCategory.entries()).forEach(([category, interests]) => {
  console.log(`${category}: ${interests.length}`);
});
```

### Popular Interests (by Score)
```javascript
const topInterests = getAllInterests()
  .sort((a, b) => b.popularityScore - a.popularityScore)
  .slice(0, 20);

console.log('Top 20 Most Popular Interests:');
topInterests.forEach((interest, idx) => {
  console.log(`${idx + 1}. ${interest.name} (${interest.popularityScore})`);
});
```

---

## Troubleshooting

### Search Returns Empty
```javascript
// Check 1: Query must be 2+ characters
if (query.length < 2) return [];

// Check 2: Check for typos
const trimmed = query.trim().toLowerCase();
console.log(`Searching for: "${trimmed}"`);

// Check 3: Try broader search
const results = searchInterestsDatabase(trimmed);
console.log(`Found ${results.length} results`);
```

### Interest Not Found
```javascript
// Check 1: Verify interest exists
const allInterests = getAllInterests();
const found = allInterests.find(i => i.name === 'SearchedName');
if (!found) {
  console.warn('Interest not in database');
  // Suggest alternatives via tags
}

// Check 2: Try partial search
const partial = searchInterestsDatabase('search');  // Search for similar
```

### Category Filter Returns Empty
```javascript
// Check 1: Verify category name matches exactly
const categories = getAllCategories();
console.log('Available categories:', categories);

// Check 2: Use case-insensitive matching
const filtered = getInterestsByCategory(userCategory);
if (filtered.length === 0) {
  console.warn(`No interests for category: ${userCategory}`);
}
```

---

## Migration Guide (If Applicable)

### Converting From Old System
```javascript
// OLD (flat string array):
const oldInterests = ['Cricket', 'Football', 'Music'];

// NEW (structured objects):
const newInterests = getAllInterests()
  .filter(i => oldInterests.includes(i.name))
  .map(i => ({
    name: i.name,
    category: i.category,
    tags: i.tags,
    score: i.popularityScore
  }));
```

### Backward Compatibility
```javascript
// If code expects string names only:
function getInterestNames(category) {
  return getInterestsByCategory(category).map(i => i.name);
}

// Extract just names from search results:
const names = searchInterestsDatabase('music').map(i => i.name);
```

---

## Version Information

- **Database Version:** 1.0 (Structured Format)
- **Total Interests:** 750+
- **Total Categories:** 21
- **Last Updated:** January 2025
- **Status:** Production Ready ✅

---

**For more details, see:** [STRUCTURED_INTERESTS_DATABASE_REPORT.md](STRUCTURED_INTERESTS_DATABASE_REPORT.md)
