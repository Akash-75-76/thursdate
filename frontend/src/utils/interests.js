// frontend/src/utils/interests.js
const INTERESTS = [
  'Football', 'Soccer', 'Basketball', 'Tennis', 'Cricket', 'Hockey',
  'Cooking', 'Baking', 'Hiking', 'Running', 'Cycling', 'Swimming',
  'Photography', 'Travel', 'Reading', 'Writing', 'Gardening', 'Yoga',
  'Meditation', 'Gaming', 'Board games', 'Movies', 'TV shows', 'Art',
  'Music', 'Dancing', 'Fitness', 'Weightlifting', 'Karaoke', 'Pets',
  'Volunteering', 'Tech', 'Programming', 'Startups', 'Investing', 'History',
  'Science', 'Theatre', 'Crafts', 'DIY', 'Fashion', 'Shopping', 'Comedy'
];

export async function searchInterests(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const results = INTERESTS
    .filter(i => i.toLowerCase().includes(q))
    .slice(0, 20)
    .map((name, idx) => ({ id: `${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${idx}`, name, display: name }));

  // Simulate async API (AutocompleteInput expects a promise)
  return new Promise(resolve => setTimeout(() => resolve(results), 80));
}

export default INTERESTS;
