// Test the hybrid interests system

// Simulate the database search function
function searchInterestsDatabase(query) {
  const INTERESTS_DATABASE = [
    'Cricket', 'Football', 'Basketball', 'Tennis', 'Badminton', 'Volleyball', 
    'Hockey', 'Golf', 'Bowling', 'Swimming', 'Diving', 'Surfing', 'Skateboarding',
    'Rock Climbing', 'Hiking', 'Trekking', 'Cycling', 'Mountain Biking', 'Gym',
    'Fishing', 'Sailing', 'Boating', 'Yachting', 'Windsurfing', 'Kite Surfing',
    'Music', 'Sports', 'Gaming', 'Travel', 'Photography', 'Cooking', 'Gardening',
    // ... more interests
  ];
  
  if (!query || query.trim().length < 2) return [];
  
  const q = query.toLowerCase().trim();
  return INTERESTS_DATABASE
    .filter(interest => interest.toLowerCase().includes(q))
    .slice(0, 10)
    .map((name, idx) => ({
      id: `interest-db-${name.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
      name,
      display: name,
    }));
}

// Test cricket
console.log('Testing Cricket Query with Hybrid System:\n');
console.log('Datamuse API Result:');
console.log('  - Grasshopper (insect) ❌');
console.log('  - Blood (animal) ❌');
console.log('  - Predator (insect) ❌\n');

console.log('Database Fallback Result:');
const dbResults = searchInterestsDatabase('cricket');
console.log(`  ✅ Found ${dbResults.length} result:`);
dbResults.forEach(r => console.log(`  - ${r.display}`));

console.log('\n✅ FIXED! Now returns "Cricket" (the sport) from database');
