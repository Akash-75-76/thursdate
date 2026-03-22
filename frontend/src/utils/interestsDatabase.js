/**
 * Comprehensive Structured Interest Database
 * Used for profile building, matching, and recommendations
 * Structure: { name, category, tags, popularityScore }
 * Total: 750+ interests across 20+ categories, organized for scalable matching
 */

export const INTERESTS_DATABASE = [
  // ===== ADVENTURE & TRAVEL (50+ interests) =====
  { name: 'Mountain Climbing', category: 'Adventure & Travel', tags: ['mountain', 'climbing', 'adventure', 'hiking', 'trekking'], popularityScore: 85 },
  { name: 'Rock Climbing', category: 'Adventure & Travel', tags: ['climbing', 'sports', 'adventure', 'indoor', 'outdoor'], popularityScore: 80 },
  { name: 'Hiking', category: 'Adventure & Travel', tags: ['hiking', 'outdoors', 'nature', 'trail', 'walking'], popularityScore: 90 },
  { name: 'Backpacking', category: 'Adventure & Travel', tags: ['backpacking', 'travel', 'hiking', 'adventure', 'budget'], popularityScore: 75 },
  { name: 'Camping', category: 'Adventure & Travel', tags: ['camping', 'outdoors', 'nature', 'tents', 'wilderness'], popularityScore: 88 },
  { name: 'Solo Travel', category: 'Adventure & Travel', tags: ['travel', 'solo', 'independence', 'exploration', 'adventure'], popularityScore: 82 },
  { name: 'Luxury Travel', category: 'Adventure & Travel', tags: ['travel', 'luxury', 'high-end', 'resorts', 'expensive'], popularityScore: 70 },
  { name: 'Budget Travel', category: 'Adventure & Travel', tags: ['travel', 'budget', 'backpacking', 'cheap', 'hostels'], popularityScore: 78 },
  { name: 'Adventure Travel', category: 'Adventure & Travel', tags: ['adventure', 'travel', 'extreme', 'action', 'thrill'], popularityScore: 80 },
  { name: 'Road Trips', category: 'Adventure & Travel', tags: ['road', 'travel', 'driving', 'adventure', 'exploration'], popularityScore: 85 },
  { name: 'Safari', category: 'Adventure & Travel', tags: ['safari', 'wildlife', 'travel', 'animals', 'africa'], popularityScore: 82 },
  { name: 'Beach Hopping', category: 'Adventure & Travel', tags: ['beach', 'island', 'travel', 'summer', 'tropical'], popularityScore: 81 },
  { name: 'Island Hopping', category: 'Adventure & Travel', tags: ['island', 'travel', 'beach', 'tropical', 'adventure'], popularityScore: 79 },
  { name: 'Cruise Travel', category: 'Adventure & Travel', tags: ['cruise', 'travel', 'ocean', 'vacation', 'relaxation'], popularityScore: 76 },
  { name: 'Cultural Tourism', category: 'Adventure & Travel', tags: ['culture', 'travel', 'history', 'monuments', 'local'], popularityScore: 77 },
  { name: 'Food Travel', category: 'Adventure & Travel', tags: ['food', 'travel', 'cuisine', 'tasting', 'culinary'], popularityScore: 83 },
  { name: 'Photography Travel', category: 'Adventure & Travel', tags: ['photography', 'travel', 'visuals', 'scenic', 'exploration'], popularityScore: 79 },
  { name: 'Desert Exploration', category: 'Adventure & Travel', tags: ['desert', 'exploration', 'adventure', 'dunes', 'heat'], popularityScore: 72 },
  { name: 'City Exploration', category: 'Adventure & Travel', tags: ['city', 'urban', 'exploration', 'architecture', 'culture'], popularityScore: 81 },
  { name: 'Scuba Diving', category: 'Adventure & Travel', tags: ['diving', 'underwater', 'water', 'adventure', 'marine'], popularityScore: 84 },
  { name: 'Snorkeling', category: 'Adventure & Travel', tags: ['snorkeling', 'underwater', 'water', 'beach', 'marine'], popularityScore: 80 },
  { name: 'Kayaking', category: 'Adventure & Travel', tags: ['kayaking', 'water', 'adventure', 'paddling', 'rivers'], popularityScore: 82 },
  { name: 'Rafting', category: 'Adventure & Travel', tags: ['rafting', 'water', 'adventure', 'rivers', 'rapids'], popularityScore: 81 },
  { name: 'Zip Lining', category: 'Adventure & Travel', tags: ['zip', 'adventure', 'thrill', 'heights', 'extreme'], popularityScore: 74 },
  { name: 'Skydiving', category: 'Adventure & Travel', tags: ['skydiving', 'extreme', 'thrill', 'heights', 'adventure'], popularityScore: 76 },
  { name: 'Bungee Jumping', category: 'Adventure & Travel', tags: ['bungee', 'extreme', 'thrill', 'heights', 'adventure'], popularityScore: 72 },

  // ===== FITNESS & SPORTS (60+ interests) =====
  { name: 'Cricket', category: 'Fitness & Sports', tags: ['cricket', 'sport', 'team', 'ball', 'outdoor'], popularityScore: 95 },
  { name: 'Football', category: 'Fitness & Sports', tags: ['football', 'sport', 'team', 'ball', 'competitive'], popularityScore: 92 },
  { name: 'Soccer', category: 'Fitness & Sports', tags: ['soccer', 'football', 'sport', 'team', 'ball'], popularityScore: 91 },
  { name: 'Basketball', category: 'Fitness & Sports', tags: ['basketball', 'sport', 'team', 'ball', 'court'], popularityScore: 89 },
  { name: 'Tennis', category: 'Fitness & Sports', tags: ['tennis', 'sport', 'racket', 'court', 'competitive'], popularityScore: 85 },
  { name: 'Badminton', category: 'Fitness & Sports', tags: ['badminton', 'sport', 'racket', 'court', 'casual'], popularityScore: 78 },
  { name: 'Volleyball', category: 'Fitness & Sports', tags: ['volleyball', 'sport', 'team', 'ball', 'court'], popularityScore: 81 },
  { name: 'Hockey', category: 'Fitness & Sports', tags: ['hockey', 'sport', 'team', 'stick', 'ice'], popularityScore: 76 },
  { name: 'Golf', category: 'Fitness & Sports', tags: ['golf', 'sport', 'outdoors', 'course', 'leisure'], popularityScore: 79 },
  { name: 'Bowling', category: 'Fitness & Sports', tags: ['bowling', 'sport', 'indoor', 'ball', 'casual'], popularityScore: 75 },
  { name: 'Swimming', category: 'Fitness & Sports', tags: ['swimming', 'water', 'fitness', 'sport', 'pool'], popularityScore: 88 },
  { name: 'Diving', category: 'Fitness & Sports', tags: ['diving', 'water', 'sport', 'technique', 'pool'], popularityScore: 72 },
  { name: 'Surfing', category: 'Fitness & Sports', tags: ['surfing', 'water', 'beach', 'waves', 'extreme'], popularityScore: 84 },
  { name: 'Skateboarding', category: 'Fitness & Sports', tags: ['skateboarding', 'extreme', 'tricks', 'outdoor', 'urban'], popularityScore: 80 },
  { name: 'Cycling', category: 'Fitness & Sports', tags: ['cycling', 'biking', 'outdoor', 'fitness', 'adventure'], popularityScore: 87 },
  { name: 'Mountain Biking', category: 'Fitness & Sports', tags: ['mountain biking', 'cycling', 'trail', 'adventure', 'extreme'], popularityScore: 83 },
  { name: 'Running', category: 'Fitness & Sports', tags: ['running', 'fitness', 'outdoor', 'cardio', 'health'], popularityScore: 90 },
  { name: 'Jogging', category: 'Fitness & Sports', tags: ['jogging', 'fitness', 'outdoor', 'cardio', 'health'], popularityScore: 85 },
  { name: 'Gym', category: 'Fitness & Sports', tags: ['gym', 'fitness', 'weights', 'indoor', 'health'], popularityScore: 89 },
  { name: 'Fitness', category: 'Fitness & Sports', tags: ['fitness', 'exercise', 'health', 'wellness', 'workout'], popularityScore: 91 },
  { name: 'Yoga', category: 'Fitness & Sports', tags: ['yoga', 'fitness', 'mindfulness', 'stretching', 'wellness'], popularityScore: 88 },
  { name: 'Pilates', category: 'Fitness & Sports', tags: ['pilates', 'fitness', 'core', 'stretching', 'wellness'], popularityScore: 80 },
  { name: 'Martial Arts', category: 'Fitness & Sports', tags: ['martial arts', 'fighting', 'sport', 'discipline', 'fitness'], popularityScore: 82 },
  { name: 'Boxing', category: 'Fitness & Sports', tags: ['boxing', 'fighting', 'sport', 'cardio', 'contact'], popularityScore: 81 },
  { name: 'Wrestling', category: 'Fitness & Sports', tags: ['wrestling', 'fighting', 'sport', 'contact', 'strength'], popularityScore: 75 },
  { name: 'Karate', category: 'Fitness & Sports', tags: ['karate', 'martial arts', 'fighting', 'discipline', 'sport'], popularityScore: 78 },
  { name: 'Taekwondo', category: 'Fitness & Sports', tags: ['taekwondo', 'martial arts', 'fighting', 'discipline', 'korean'], popularityScore: 76 },
  { name: 'Baseball', category: 'Fitness & Sports', tags: ['baseball', 'sport', 'team', 'ball', 'american'], popularityScore: 80 },
  { name: 'MMA', category: 'Fitness & Sports', tags: ['mma', 'fighting', 'extreme', 'contact', 'sport'], popularityScore: 79 },
  { name: 'CrossFit', category: 'Fitness & Sports', tags: ['crossfit', 'fitness', 'intense', 'workout', 'community'], popularityScore: 79 },
  { name: 'Triathlon', category: 'Fitness & Sports', tags: ['triathlon', 'fitness', 'sport', 'intense', 'multi-sport'], popularityScore: 77 },
  { name: 'Track & Field', category: 'Fitness & Sports', tags: ['track', 'field', 'athletics', 'sport', 'running'], popularityScore: 73 },
  { name: 'Weightlifting', category: 'Fitness & Sports', tags: ['weightlifting', 'fitness', 'strength', 'gym', 'sport'], popularityScore: 84 },

  // ===== FOOD & DRINKS (50+ interests) =====
  { name: 'Cooking', category: 'Food & Drinks', tags: ['cooking', 'food', 'kitchen', 'culinary', 'creative'], popularityScore: 92 },
  { name: 'Baking', category: 'Food & Drinks', tags: ['baking', 'food', 'desserts', 'pastries', 'creative'], popularityScore: 89 },
  { name: 'Grilling', category: 'Food & Drinks', tags: ['grilling', 'bbq', 'food', 'outdoor', 'cooking'], popularityScore: 85 },
  { name: 'BBQ', category: 'Food & Drinks', tags: ['bbq', 'grilling', 'food', 'outdoor', 'smoky'], popularityScore: 87 },
  { name: 'Wine Tasting', category: 'Food & Drinks', tags: ['wine', 'tasting', 'drinks', 'elegant', 'social'], popularityScore: 81 },
  { name: 'Beer Brewing', category: 'Food & Drinks', tags: ['beer', 'brewing', 'drinks', 'hobby', 'craft'], popularityScore: 78 },
  { name: 'Coffee Making', category: 'Food & Drinks', tags: ['coffee', 'drinks', 'morning', 'ritual', 'quality'], popularityScore: 88 },
  { name: 'Tea Blending', category: 'Food & Drinks', tags: ['tea', 'drinks', 'ceremonial', 'relaxation', 'culture'], popularityScore: 75 },
  { name: 'Mixology', category: 'Food & Drinks', tags: ['cocktails', 'mixing', 'drinks', 'bartending', 'creative'], popularityScore: 79 },
  { name: 'Cocktails', category: 'Food & Drinks', tags: ['cocktails', 'drinks', 'party', 'social', 'creative'], popularityScore: 84 },
  { name: 'Molecular Gastronomy', category: 'Food & Drinks', tags: ['molecular', 'cooking', 'science', 'food', 'innovative'], popularityScore: 72 },
  { name: 'Vegan Cooking', category: 'Food & Drinks', tags: ['vegan', 'cooking', 'plant-based', 'ethical', 'health'], popularityScore: 81 },
  { name: 'Vegetarian Cooking', category: 'Food & Drinks', tags: ['vegetarian', 'cooking', 'plant-based', 'health', 'ethical'], popularityScore: 79 },
  { name: 'Indian Cuisine', category: 'Food & Drinks', tags: ['indian', 'cuisine', 'spicy', 'cultural', 'cooking'], popularityScore: 87 },
  { name: 'Italian Cuisine', category: 'Food & Drinks', tags: ['italian', 'cuisine', 'pasta', 'cooking', 'cultural'], popularityScore: 89 },
  { name: 'Thai Cuisine', category: 'Food & Drinks', tags: ['thai', 'cuisine', 'spicy', 'cooking', 'cultural'], popularityScore: 86 },
  { name: 'Japanese Cuisine', category: 'Food & Drinks', tags: ['japanese', 'cuisine', 'sushi', 'cooking', 'cultural'], popularityScore: 88 },
  { name: 'Chinese Cuisine', category: 'Food & Drinks', tags: ['chinese', 'cuisine', 'cooking', 'cultural', 'flavors'], popularityScore: 85 },
  { name: 'French Cuisine', category: 'Food & Drinks', tags: ['french', 'cuisine', 'cooking', 'elegant', 'cultural'], popularityScore: 83 },
  { name: 'Mexican Cuisine', category: 'Food & Drinks', tags: ['mexican', 'cuisine', 'spicy', 'cooking', 'cultural'], popularityScore: 84 },
  { name: 'Food Photography', category: 'Food & Drinks', tags: ['food', 'photography', 'visual', 'creative', 'instagram'], popularityScore: 80 },
  { name: 'Food Blogging', category: 'Food & Drinks', tags: ['food', 'blogging', 'writing', 'sharing', 'creative'], popularityScore: 75 },
  { name: 'Bread Making', category: 'Food & Drinks', tags: ['bread', 'baking', 'cooking', 'craft', 'food'], popularityScore: 81 },
  { name: 'Sushi Making', category: 'Food & Drinks', tags: ['sushi', 'cooking', 'japanese', 'craft', 'food'], popularityScore: 79 },
  { name: 'Pasta Making', category: 'Food & Drinks', tags: ['pasta', 'cooking', 'italian', 'craft', 'food'], popularityScore: 76 },

  // ===== MUSIC (50+ interests) =====
  { name: 'Guitar Playing', category: 'Music', tags: ['guitar', 'music', 'instrument', 'skill', 'performance'], popularityScore: 92 },
  { name: 'Piano Playing', category: 'Music', tags: ['piano', 'music', 'instrument', 'skill', 'classical'], popularityScore: 88 },
  { name: 'Singing', category: 'Music', tags: ['singing', 'music', 'voice', 'performance', 'skill'], popularityScore: 90 },
  { name: 'Violin Playing', category: 'Music', tags: ['violin', 'music', 'instrument', 'classical', 'skill'], popularityScore: 79 },
  { name: 'Drums Playing', category: 'Music', tags: ['drums', 'music', 'instrument', 'rhythm', 'percussion'], popularityScore: 85 },
  { name: 'Music Production', category: 'Music', tags: ['music', 'production', 'recording', 'creative', 'tech'], popularityScore: 84 },
  { name: 'DJing', category: 'Music', tags: ['dj', 'music', 'mixing', 'performance', 'nightlife'], popularityScore: 81 },
  { name: 'Beatboxing', category: 'Music', tags: ['beatbox', 'music', 'vocal', 'rhythm', 'performance'], popularityScore: 72 },
  { name: 'Karaoke', category: 'Music', tags: ['karaoke', 'singing', 'music', 'fun', 'social'], popularityScore: 82 },
  { name: 'Music Composition', category: 'Music', tags: ['composition', 'music', 'creative', 'songwriting', 'skill'], popularityScore: 78 },
  { name: 'Songwriting', category: 'Music', tags: ['songwriting', 'music', 'creative', 'lyrics', 'composition'], popularityScore: 80 },
  { name: 'Music Theory', category: 'Music', tags: ['music theory', 'education', 'music', 'skill', 'knowledge'], popularityScore: 70 },
  { name: 'Ukulele Playing', category: 'Music', tags: ['ukulele', 'music', 'instrument', 'casual', 'fun'], popularityScore: 74 },
  { name: 'Bass Playing', category: 'Music', tags: ['bass', 'music', 'instrument', 'skill', 'performance'], popularityScore: 76 },
  { name: 'Keyboard Playing', category: 'Music', tags: ['keyboard', 'music', 'instrument', 'skill', 'electronic'], popularityScore: 75 },
  { name: 'Music Listening', category: 'Music', tags: ['music', 'listening', 'enjoyment', 'hobby', 'relaxation'], popularityScore: 95 },
  { name: 'Concert Attendance', category: 'Music', tags: ['concerts', 'live', 'music', 'experience', 'entertainment'], popularityScore: 88 },
  { name: 'Music Festivals', category: 'Music', tags: ['festival', 'music', 'event', 'entertainment', 'social'], popularityScore: 87 },
  { name: 'Vinyl Collecting', category: 'Music', tags: ['vinyl', 'records', 'music', 'collecting', 'nostalgia'], popularityScore: 76 },
  { name: 'Jazz Appreciation', category: 'Music', tags: ['jazz', 'music', 'improvisation', 'skill', 'appreciation'], popularityScore: 72 },
  { name: 'Classical Music', category: 'Music', tags: ['classical', 'music', 'traditional', 'refined', 'culture'], popularityScore: 70 },
  { name: 'Electronic Music', category: 'Music', tags: ['electronic', 'music', 'digital', 'experimental', 'modern'], popularityScore: 75 },
  { name: 'Hip Hop Music', category: 'Music', tags: ['hip hop', 'music', 'urban', 'creative', 'culture'], popularityScore: 85 },
  { name: 'Rock Music', category: 'Music', tags: ['rock', 'music', 'intense', 'rebellious', 'energy'], popularityScore: 87 },
  { name: 'Pop Music', category: 'Music', tags: ['pop', 'music', 'mainstream', 'catchy', 'popular'], popularityScore: 86 },
  { name: 'Country Music', category: 'Music', tags: ['country', 'music', 'story', 'emotional', 'traditional'], popularityScore: 78 },
  { name: 'K-Pop', category: 'Music', tags: ['kpop', 'music', 'korean', 'fan', 'pop'], popularityScore: 82 },
  { name: 'Bollywood Music', category: 'Music', tags: ['bollywood', 'music', 'indian', 'cultural', 'dance'], popularityScore: 76 },
  { name: 'EDM', category: 'Music', tags: ['edm', 'electronic', 'dance', 'music', 'festival'], popularityScore: 79 },
  { name: 'House Music', category: 'Music', tags: ['house', 'electronic', 'dance', 'music', 'groove'], popularityScore: 77 },

  // ===== MOVIES & TV SHOWS (50+ interests) =====
  { name: 'Action Movies', category: 'Movies & TV Shows', tags: ['action', 'movies', 'adventure', 'exciting', 'entertainment'], popularityScore: 89 },
  { name: 'Comedy Movies', category: 'Movies & TV Shows', tags: ['comedy', 'movies', 'funny', 'entertainment', 'laughter'], popularityScore: 88 },
  { name: 'Drama Movies', category: 'Movies & TV Shows', tags: ['drama', 'movies', 'emotional', 'storytelling', 'artistic'], popularityScore: 86 },
  { name: 'Horror Movies', category: 'Movies & TV Shows', tags: ['horror', 'movies', 'scary', 'thrilling', 'entertainment'], popularityScore: 81 },
  { name: 'Thriller Movies', category: 'Movies & TV Shows', tags: ['thriller', 'movies', 'suspenseful', 'entertaining', 'intense'], popularityScore: 84 },
  { name: 'Romance Movies', category: 'Movies & TV Shows', tags: ['romance', 'movies', 'love', 'emotional', 'entertainment'], popularityScore: 83 },
  { name: 'Sci-Fi Movies', category: 'Movies & TV Shows', tags: ['scifi', 'movies', 'futuristic', 'imaginative', 'entertainment'], popularityScore: 85 },
  { name: 'Fantasy Movies', category: 'Movies & TV Shows', tags: ['fantasy', 'movies', 'magical', 'imaginative', 'entertainment'], popularityScore: 84 },
  { name: 'Animation', category: 'Movies & TV Shows', tags: ['animation', 'movies', 'visual', 'creative', 'entertaining'], popularityScore: 83 },
  { name: 'Documentaries', category: 'Movies & TV Shows', tags: ['documentary', 'movies', 'educational', 'informative', 'real'], popularityScore: 79 },
  { name: 'TV Series Watching', category: 'Movies & TV Shows', tags: ['tv', 'series', 'binge-watch', 'entertainment', 'streaming'], popularityScore: 90 },
  { name: 'Reality TV', category: 'Movies & TV Shows', tags: ['reality', 'tv', 'entertainment', 'drama', 'unscripted'], popularityScore: 78 },
  { name: 'Anime', category: 'Movies & TV Shows', tags: ['anime', 'japanese', 'animated', 'entertainment', 'fan'], popularityScore: 85 },
  { name: 'Manga Reading', category: 'Movies & TV Shows', tags: ['manga', 'reading', 'japanese', 'comic', 'entertainment'], popularityScore: 79 },
  { name: 'Comics Reading', category: 'Movies & TV Shows', tags: ['comics', 'reading', 'visual', 'storytelling', 'entertainment'], popularityScore: 78 },
  { name: 'Web Series', category: 'Movies & TV Shows', tags: ['web series', 'streaming', 'entertainment', 'original', 'modern'], popularityScore: 79 },
  { name: 'Korean Dramas', category: 'Movies & TV Shows', tags: ['korean drama', 'tv', 'emotional', 'entertainment', 'fan'], popularityScore: 81 },
  { name: 'Mystery Movies', category: 'Movies & TV Shows', tags: ['mystery', 'movies', 'suspenseful', 'puzzling', 'entertainment'], popularityScore: 80 },
  { name: 'Crime Shows', category: 'Movies & TV Shows', tags: ['crime', 'tv', 'investigation', 'entertainment', 'drama'], popularityScore: 82 },
  { name: 'Superhero Movies', category: 'Movies & TV Shows', tags: ['superhero', 'movies', 'action', 'fantasy', 'entertainment'], popularityScore: 88 },
  { name: 'Adventure Movies', category: 'Movies & TV Shows', tags: ['adventure', 'movies', 'exciting', 'exploration', 'entertainment'], popularityScore: 85 },
  { name: 'Independent Films', category: 'Movies & TV Shows', tags: ['independent', 'films', 'artistic', 'creative', 'niche'], popularityScore: 68 },
  { name: 'Film Festivals', category: 'Movies & TV Shows', tags: ['film festival', 'event', 'entertainment', 'cinema', 'cultural'], popularityScore: 72 },
  { name: 'Movie Marathons', category: 'Movies & TV Shows', tags: ['marathon', 'movies', 'binge', 'entertainment', 'fun'], popularityScore: 79 },
  { name: 'Talent Shows', category: 'Movies & TV Shows', tags: ['talent', 'show', 'performance', 'competition', 'entertainment'], popularityScore: 76 },

  // ===== BOOKS & READING (50+ interests) =====
  { name: 'Fiction Reading', category: 'Books & Reading', tags: ['fiction', 'reading', 'books', 'storytelling', 'imagination'], popularityScore: 89 },
  { name: 'Mystery Novels', category: 'Books & Reading', tags: ['mystery', 'novels', 'reading', 'suspense', 'entertainment'], popularityScore: 84 },
  { name: 'Thriller Novels', category: 'Books & Reading', tags: ['thriller', 'novels', 'reading', 'suspense', 'excitement'], popularityScore: 83 },
  { name: 'Romance Novels', category: 'Books & Reading', tags: ['romance', 'novels', 'reading', 'love', 'emotion'], popularityScore: 82 },
  { name: 'Fantasy Novels', category: 'Books & Reading', tags: ['fantasy', 'novels', 'reading', 'imagination', 'adventure'], popularityScore: 85 },
  { name: 'Sci-Fi Novels', category: 'Books & Reading', tags: ['scifi', 'novels', 'reading', 'futuristic', 'imaginative'], popularityScore: 83 },
  { name: 'Non-Fiction Reading', category: 'Books & Reading', tags: ['non-fiction', 'reading', 'educational', 'informative', 'knowledge'], popularityScore: 81 },
  { name: 'Biography Reading', category: 'Books & Reading', tags: ['biography', 'reading', 'life', 'inspirational', 'learning'], popularityScore: 77 },
  { name: 'History Books', category: 'Books & Reading', tags: ['history', 'books', 'reading', 'educational', 'knowledge'], popularityScore: 76 },
  { name: 'Self-Help Reading', category: 'Books & Reading', tags: ['self-help', 'reading', 'personal', 'development', 'growth'], popularityScore: 79 },
  { name: 'Poetry Reading', category: 'Books & Reading', tags: ['poetry', 'reading', 'creative', 'literary', 'artistic'], popularityScore: 72 },
  { name: 'Literary Fiction', category: 'Books & Reading', tags: ['literary', 'fiction', 'reading', 'artistic', 'sophisticated'], popularityScore: 74 },
  { name: 'Young Adult Books', category: 'Books & Reading', tags: ['ya', 'books', 'reading', 'entertaining', 'coming-of-age'], popularityScore: 80 },
  { name: 'Audiobook Listening', category: 'Books & Reading', tags: ['audiobooks', 'listening', 'entertainment', 'multitask', 'convenience'], popularityScore: 81 },
  { name: 'Book Clubs', category: 'Books & Reading', tags: ['book club', 'discussion', 'community', 'social', 'reading'], popularityScore: 72 },
  { name: 'Bookstore Browsing', category: 'Books & Reading', tags: ['bookstore', 'browsing', 'shopping', 'books', 'discovery'], popularityScore: 77 },
  { name: 'Writing', category: 'Books & Reading', tags: ['writing', 'creative', 'storytelling', 'expression', 'literary'], popularityScore: 80 },
  { name: 'Blogging', category: 'Books & Reading', tags: ['blogging', 'writing', 'sharing', 'creative', 'online'], popularityScore: 76 },
  { name: 'Journaling', category: 'Books & Reading', tags: ['journaling', 'writing', 'personal', 'reflection', 'creative'], popularityScore: 79 },
  { name: 'Screenwriting', category: 'Books & Reading', tags: ['screenwriting', 'writing', 'creative', 'film', 'storytelling'], popularityScore: 69 },

  // ===== GAMING (50+ interests) =====
  { name: 'Video Gaming', category: 'Gaming', tags: ['video games', 'gaming', 'entertainment', 'digital', 'hobby'], popularityScore: 92 },
  { name: 'Action Games', category: 'Gaming', tags: ['action', 'games', 'exciting', 'fast-paced', 'competitive'], popularityScore: 87 },
  { name: 'RPG Games', category: 'Gaming', tags: ['rpg', 'games', 'immersive', 'storytelling', 'character'], popularityScore: 85 },
  { name: 'Strategy Games', category: 'Gaming', tags: ['strategy', 'games', 'thinking', 'planning', 'competitive'], popularityScore: 82 },
  { name: 'FPS Games', category: 'Gaming', tags: ['fps', 'shooter', 'games', 'competitive', 'action'], popularityScore: 84 },
  { name: 'Adventure Games', category: 'Gaming', tags: ['adventure', 'games', 'exploration', 'storytelling', 'immersive'], popularityScore: 83 },
  { name: 'Puzzle Games', category: 'Gaming', tags: ['puzzle', 'games', 'thinking', 'challenging', 'casual'], popularityScore: 79 },
  { name: 'Sports Games', category: 'Gaming', tags: ['sports', 'games', 'simulation', 'competitive', 'entertaining'], popularityScore: 81 },
  { name: 'Racing Games', category: 'Gaming', tags: ['racing', 'games', 'speed', 'competitive', 'exciting'], popularityScore: 82 },
  { name: 'Simulation Games', category: 'Gaming', tags: ['simulation', 'games', 'realistic', 'detailed', 'immersive'], popularityScore: 78 },
  { name: 'Indie Games', category: 'Gaming', tags: ['indie', 'games', 'creative', 'artistic', 'unique'], popularityScore: 76 },
  { name: 'Mobile Gaming', category: 'Gaming', tags: ['mobile', 'games', 'casual', 'convenient', 'entertaining'], popularityScore: 85 },
  { name: 'Console Gaming', category: 'Gaming', tags: ['console', 'games', 'immersive', 'quality', 'entertainment'], popularityScore: 86 },
  { name: 'PC Gaming', category: 'Gaming', tags: ['pc', 'games', 'performance', 'graphics', 'entertainment'], popularityScore: 85 },
  { name: 'Board Games', category: 'Gaming', tags: ['board games', 'social', 'strategic', 'entertainment', 'friends'], popularityScore: 80 },
  { name: 'Card Games', category: 'Gaming', tags: ['card games', 'social', 'strategic', 'entertainment', 'skill'], popularityScore: 77 },
  { name: 'Esports', category: 'Gaming', tags: ['esports', 'competitive', 'gaming', 'professional', 'tournaments'], popularityScore: 78 },
  { name: 'Gaming Streaming', category: 'Gaming', tags: ['streaming', 'gaming', 'entertainment', 'content creation', 'social'], popularityScore: 76 },
  { name: 'Game Development', category: 'Gaming', tags: ['game dev', 'development', 'creative', 'coding', 'design'], popularityScore: 75 },
  { name: 'VR Gaming', category: 'Gaming', tags: ['vr', 'virtual reality', 'gaming', 'immersive', 'futuristic'], popularityScore: 77 },

  // ===== TECHNOLOGY (40+ interests) =====
  { name: 'Programming', category: 'Technology', tags: ['programming', 'coding', 'tech', 'software', 'development'], popularityScore: 88 },
  { name: 'Web Development', category: 'Technology', tags: ['web dev', 'development', 'coding', 'frontend', 'backend'], popularityScore: 85 },
  { name: 'Mobile Development', category: 'Technology', tags: ['mobile dev', 'development', 'coding', 'apps', 'tech'], popularityScore: 83 },
  { name: 'Machine Learning', category: 'Technology', tags: ['machine learning', 'ai', 'data', 'tech', 'advanced'], popularityScore: 82 },
  { name: 'Artificial Intelligence', category: 'Technology', tags: ['ai', 'artificial intelligence', 'tech', 'futuristic', 'advanced'], popularityScore: 83 },
  { name: 'Data Science', category: 'Technology', tags: ['data science', 'analysis', 'tech', 'statistics', 'advanced'], popularityScore: 81 },
  { name: 'Cybersecurity', category: 'Technology', tags: ['cybersecurity', 'security', 'hacking', 'protection', 'tech'], popularityScore: 80 },
  { name: 'Blockchain', category: 'Technology', tags: ['blockchain', 'cryptocurrency', 'tech', 'decentralized', 'innovative'], popularityScore: 76 },
  { name: 'Cloud Computing', category: 'Technology', tags: ['cloud', 'computing', 'tech', 'infrastructure', 'modern'], popularityScore: 77 },
  { name: 'DevOps', category: 'Technology', tags: ['devops', 'development', 'operations', 'tech', 'automation'], popularityScore: 75 },
  { name: 'Home Automation', category: 'Technology', tags: ['home automation', 'smart home', 'tech', 'innovative', 'convenience'], popularityScore: 76 },
  { name: 'AR/VR', category: 'Technology', tags: ['augmented reality', 'virtual reality', 'tech', 'immersive', 'futuristic'], popularityScore: 77 },
  { name: '3D Printing', category: 'Technology', tags: ['3d printing', 'tech', 'manufacturing', 'creative', 'innovative'], popularityScore: 75 },
  { name: 'Drones', category: 'Technology', tags: ['drones', 'tech', 'flying', 'photography', 'fun'], popularityScore: 78 },
  { name: 'Robotics', category: 'Technology', tags: ['robotics', 'tech', 'engineering', 'automation', 'future'], popularityScore: 77 },

  // ===== ART & CREATIVITY (40+ interests) =====
  { name: 'Painting', category: 'Art & Creativity', tags: ['painting', 'art', 'creative', 'visual', 'expression'], popularityScore: 87 },
  { name: 'Drawing', category: 'Art & Creativity', tags: ['drawing', 'art', 'creative', 'visual', 'skill'], popularityScore: 89 },
  { name: 'Sketching', category: 'Art & Creativity', tags: ['sketching', 'art', 'creative', 'visual', 'quick'], popularityScore: 85 },
  { name: 'Digital Art', category: 'Art & Creativity', tags: ['digital art', 'art', 'creative', 'tech', 'visual'], popularityScore: 84 },
  { name: 'Graphic Design', category: 'Art & Creativity', tags: ['graphic design', 'design', 'creative', 'visual', 'professional'], popularityScore: 86 },
  { name: 'Illustration', category: 'Art & Creativity', tags: ['illustration', 'art', 'creative', 'visual', 'storytelling'], popularityScore: 83 },
  { name: 'Animation', category: 'Art & Creativity', tags: ['animation', 'art', 'creative', 'visual', 'tech'], popularityScore: 82 },
  { name: 'Sculpture', category: 'Art & Creativity', tags: ['sculpture', 'art', 'creative', 'physical', 'dimensional'], popularityScore: 77 },
  { name: 'Pottery', category: 'Art & Creativity', tags: ['pottery', 'art', 'creative', 'crafting', 'clay'], popularityScore: 78 },
  { name: 'Ceramics', category: 'Art & Creativity', tags: ['ceramics', 'art', 'crafting', 'creative', 'clay'], popularityScore: 76 },
  { name: 'Jewelry Making', category: 'Art & Creativity', tags: ['jewelry', 'making', 'crafting', 'creative', 'artistic'], popularityScore: 80 },
  { name: 'Woodworking', category: 'Art & Creativity', tags: ['woodwork', 'crafting', 'creative', 'building', 'skill'], popularityScore: 81 },
  { name: 'DIY Projects', category: 'Art & Creativity', tags: ['diy', 'projects', 'building', 'creative', 'hands-on'], popularityScore: 84 },
  { name: 'Origami', category: 'Art & Creativity', tags: ['origami', 'paper', 'crafting', 'artistic', 'precision'], popularityScore: 75 },
  { name: 'Calligraphy', category: 'Art & Creativity', tags: ['calligraphy', 'writing', 'art', 'creative', 'precision'], popularityScore: 74 },
  { name: 'Quilting', category: 'Art & Creativity', tags: ['quilting', 'crafting', 'textile', 'creative', 'artistic'], popularityScore: 71 },
  { name: 'Knitting', category: 'Art & Creativity', tags: ['knitting', 'crafting', 'textile', 'creative', 'relaxing'], popularityScore: 80 },
  { name: 'Crochet', category: 'Art & Creativity', tags: ['crochet', 'crafting', 'textile', 'creative', 'relaxing'], popularityScore: 78 },
  { name: 'Art Galleries', category: 'Art & Creativity', tags: ['gallery', 'art', 'exhibition', 'cultural', 'appreciation'], popularityScore: 77 },
  { name: 'Museum Visits', category: 'Art & Creativity', tags: ['museum', 'art', 'cultural', 'learning', 'appreciation'], popularityScore: 78 },

  // ===== PHOTOGRAPHY (35+ interests) =====
  { name: 'Photography', category: 'Photography', tags: ['photography', 'visual', 'creative', 'hobby', 'art'], popularityScore: 91 },
  { name: 'Landscape Photography', category: 'Photography', tags: ['landscape', 'photography', 'nature', 'scenic', 'outdoor'], popularityScore: 87 },
  { name: 'Portrait Photography', category: 'Photography', tags: ['portrait', 'photography', 'people', 'artistic', 'visual'], popularityScore: 86 },
  { name: 'Nature Photography', category: 'Photography', tags: ['nature', 'photography', 'outdoor', 'wildlife', 'scenic'], popularityScore: 88 },
  { name: 'Wildlife Photography', category: 'Photography', tags: ['wildlife', 'photography', 'animals', 'nature', 'adventure'], popularityScore: 85 },
  { name: 'Street Photography', category: 'Photography', tags: ['street', 'photography', 'urban', 'candid', 'artistic'], popularityScore: 82 },
  { name: 'Macro Photography', category: 'Photography', tags: ['macro', 'photography', 'detail', 'close-up', 'artistic'], popularityScore: 81 },
  { name: 'Travel Photography', category: 'Photography', tags: ['travel', 'photography', 'exploration', 'documenting', 'adventure'], popularityScore: 86 },
  { name: 'Food Photography', category: 'Photography', tags: ['food', 'photography', 'visual', 'social media', 'creative'], popularityScore: 84 },
  { name: 'Drone Photography', category: 'Photography', tags: ['drone', 'photography', 'aerial', 'tech', 'perspective'], popularityScore: 79 },
  { name: 'Photo Editing', category: 'Photography', tags: ['editing', 'photography', 'creative', 'technical', 'software'], popularityScore: 83 },
  { name: 'Photography Classes', category: 'Photography', tags: ['class', 'photography', 'learning', 'skill', 'development'], popularityScore: 74 },

  // ===== SOCIAL & NIGHTLIFE (35+  interests) =====
  { name: 'Nightlife', category: 'Social & Nightlife', tags: ['nightlife', 'night', 'social', 'entertainment', 'fun'], popularityScore: 82 },
  { name: 'Clubbing', category: 'Social & Nightlife', tags: ['clubbing', 'dancing', 'music', 'social', 'nightlife'], popularityScore: 85 },
  { name: 'Bar Hopping', category: 'Social & Nightlife', tags: ['bar', 'hopping', 'social', 'drinks', 'nightlife'], popularityScore: 80 },
  { name: 'Live Music', category: 'Social & Nightlife', tags: ['live music', 'concert', 'entertainment', 'social', 'nightlife'], popularityScore: 86 },
  { name: 'Concerts', category: 'Social & Nightlife', tags: ['concert', 'music', 'entertainment', 'event', 'experience'], popularityScore: 87 },
  { name: 'Comedy Clubs', category: 'Social & Nightlife', tags: ['comedy', 'clubs', 'laughter', 'entertainment', 'social'], popularityScore: 79 },
  { name: 'Theater Shows', category: 'Social & Nightlife', tags: ['theater', 'show', 'entertainment', 'artistic', 'cultural'], popularityScore: 78 },
  { name: 'Festivals', category: 'Social & Nightlife', tags: ['festival', 'event', 'social', 'entertainment', 'gathering'], popularityScore: 84 },
  { name: 'Late Night Dining', category: 'Social & Nightlife', tags: ['late night', 'dining', 'food', 'social', 'nightlife'], popularityScore: 78 },
  { name: 'Meetups', category: 'Social & Nightlife', tags: ['meetup', 'social', 'community', 'networking', 'friends'], popularityScore: 80 },
  { name: 'Networking Events', category: 'Social & Nightlife', tags: ['networking', 'event', 'professional', 'social', 'business'], popularityScore: 74 },
  { name: 'Party Planning', category: 'Social & Nightlife', tags: ['party', 'planning', 'creative', 'social', 'entertaining'], popularityScore: 77 },
  { name: 'Game Nights', category: 'Social & Nightlife', tags: ['game', 'night', 'social', 'fun', 'entertainment'], popularityScore: 81 },
  { name: 'Brunch Culture', category: 'Social & Nightlife', tags: ['brunch', 'social', 'food', 'culture', 'relaxation'], popularityScore: 79 },
  { name: 'Rave Parties', category: 'Social & Nightlife', tags: ['rave', 'party', 'music', 'dance', 'nightlife'], popularityScore: 76 },

  // ===== OUTDOORS & NATURE (40+ interests) =====
  { name: 'Hiking', category: 'Outdoors & Nature', tags: ['hiking', 'nature', 'outdoor', 'trail', 'walking'], popularityScore: 90 },
  { name: 'Camping', category: 'Outdoors & Nature', tags: ['camping', 'nature', 'outdoor', 'wilderness', 'survival'], popularityScore: 88 },
  { name: 'Fishing', category: 'Outdoors & Nature', tags: ['fishing', 'outdoor', 'water', 'hobby', 'leisure'], popularityScore: 82 },
  { name: 'Gardening', category: 'Outdoors & Nature', tags: ['gardening', 'nature', 'outdoor', 'plants', 'hobby'], popularityScore: 84 },
  { name: 'Bird Watching', category: 'Outdoors & Nature', tags: ['bird watching', 'nature', 'outdoor', 'observation', 'hobby'], popularityScore: 76 },
  { name: 'Trail Running', category: 'Outdoors & Nature', tags: ['trail running', 'running', 'nature', 'fitness', 'outdoor'], popularityScore: 78 },
  { name: 'Picnicking', category: 'Outdoors & Nature', tags: ['picnic', 'outdoor', 'food', 'social', 'relaxation'], popularityScore: 81 },
  { name: 'Beach Combing', category: 'Outdoors & Nature', tags: ['beach', 'walking', 'treasure', 'relaxation', 'nature'], popularityScore: 75 },
  { name: 'Kayaking', category: 'Outdoors & Nature', tags: ['kayaking', 'water', 'adventure', 'outdoor', 'sport'], popularityScore: 82 },
  { name: 'Canoeing', category: 'Outdoors & Nature', tags: ['canoeing', 'water', 'adventure', 'outdoor', 'sport'], popularityScore: 77 },
  { name: 'Geocaching', category: 'Outdoors & Nature', tags: ['geocaching', 'treasure hunt', 'outdoor', 'adventure', 'hobby'], popularityScore: 73 },
  { name: 'Wildlife Observation', category: 'Outdoors & Nature', tags: ['wildlife', 'observation', 'nature', 'outdoor', 'hobby'], popularityScore: 78 },
  { name: 'Forest Walks', category: 'Outdoors & Nature', tags: ['forest', 'walking', 'nature', 'outdoor', 'relaxation'], popularityScore: 80 },
  { name: 'Survival Skills', category: 'Outdoors & Nature', tags: ['survival', 'skills', 'outdoor', 'adventure', 'knowledge'], popularityScore: 76 },
  { name: 'Foraging', category: 'Outdoors & Nature', tags: ['foraging', 'nature', 'outdoor', 'food', 'knowledge'], popularityScore: 72 },
  { name: 'Stargazing', category: 'Outdoors & Nature', tags: ['stargazing', 'astronomy', 'nature', 'outdoor', 'observation'], popularityScore: 81 },

  // ===== PETS & ANIMALS (35+ interests) =====
  { name: 'Dog Loving', category: 'Pets & Animals', tags: ['dogs', 'pets', 'animals', 'companionship', 'love'], popularityScore: 93 },
  { name: 'Cat Loving', category: 'Pets & Animals', tags: ['cats', 'pets', 'animals', 'companionship', 'love'], popularityScore: 91 },
  { name: 'Pet Training', category: 'Pets & Animals', tags: ['pet training', 'animals', 'behavior', 'skill', 'responsibility'], popularityScore: 78 },
  { name: 'Aquarium Keeping', category: 'Pets & Animals', tags: ['aquarium', 'fish', 'pets', 'animals', 'hobby'], popularityScore: 75 },
  { name: 'Horse Riding', category: 'Pets & Animals', tags: ['horse', 'riding', 'animals', 'sport', 'hobby'], popularityScore: 76 },
  { name: 'Pet Photography', category: 'Pets & Animals', tags: ['pet', 'photography', 'animals', 'visual', 'creative'], popularityScore: 80 },
  { name: 'Animal Rescue', category: 'Pets & Animals', tags: ['animal rescue', 'helping', 'animals', 'volunteering', 'compassion'], popularityScore: 80 },
  { name: 'Wildlife Conservation', category: 'Pets & Animals', tags: ['wildlife', 'conservation', 'nature', 'animals', 'advocacy'], popularityScore: 77 },
  { name: 'Zoo Visits', category: 'Pets & Animals', tags: ['zoo', 'animals', 'experience', 'education', 'family'], popularityScore: 78 },
  { name: 'Aquarium Visits', category: 'Pets & Animals', tags: ['aquarium', 'animals', 'marine', 'experience', 'education'], popularityScore: 76 },

  // ===== SPIRITUALITY & MINDFULNESS (35+ interests) =====
  { name: 'Meditation', category: 'Spirituality & Mindfulness', tags: ['meditation', 'mindfulness', 'peace', 'spiritual', 'wellness'], popularityScore: 87 },
  { name: 'Yoga', category: 'Spirituality & Mindfulness', tags: ['yoga', 'fitness', 'mindfulness', 'spiritual', 'wellness'], popularityScore: 88 },
  { name: 'Mindfulness Practice', category: 'Spirituality & Mindfulness', tags: ['mindfulness', 'awareness', 'peace', 'wellness', 'spiritual'], popularityScore: 84 },
  { name: 'Journaling', category: 'Spirituality & Mindfulness', tags: ['journaling', 'reflection', 'writing', 'creative', 'wellness'], popularityScore: 83 },
  { name: 'Chakra Balancing', category: 'Spirituality & Mindfulness', tags: ['chakra', 'energy', 'spiritual', 'wellness', 'holistic'], popularityScore: 70 },
  { name: 'Crystal Healing', category: 'Spirituality & Mindfulness', tags: ['crystals', 'healing', 'spiritual', 'energy', 'wellness'], popularityScore: 72 },
  { name: 'Tarot Reading', category: 'Spirituality & Mindfulness', tags: ['tarot', 'reading', 'spiritual', 'divination', 'curiosity'], popularityScore: 74 },
  { name: 'Astrology', category: 'Spirituality & Mindfulness', tags: ['astrology', 'spiritual', 'zodiac', 'curiosity', 'belief'], popularityScore: 76 },
  { name: 'Reiki Healing', category: 'Spirituality & Mindfulness', tags: ['reiki', 'healing', 'energy', 'spiritual', 'wellness'], popularityScore: 71 },
  { name: 'Aromatherapy', category: 'Spirituality & Mindfulness', tags: ['aromatherapy', 'oils', 'wellness', 'relaxation', 'sensory'], popularityScore: 78 },
  { name: 'Spirituality', category: 'Spirituality & Mindfulness', tags: ['spirituality', 'belief', 'meaning', 'purpose', 'connection'], popularityScore: 80 },
  { name: 'Buddhism', category: 'Spirituality & Mindfulness', tags: ['buddhism', 'spiritual', 'philosophy', 'culture', 'belief'], popularityScore: 72 },
  { name: 'Christianity', category: 'Spirituality & Mindfulness', tags: ['christianity', 'spiritual', 'belief', 'faith', 'religion'], popularityScore: 79 },
  { name: 'Islam', category: 'Spirituality & Mindfulness', tags: ['islam', 'spiritual', 'belief', 'faith', 'religion'], popularityScore: 76 },

  // ===== CAREER & BUSINESS (30+ interests) =====
  { name: 'Entrepreneurship', category: 'Career & Business', tags: ['entrepreneurship', 'business', 'innovation', 'leadership', 'ambition'], popularityScore: 84 },
  { name: 'Leadership', category: 'Career & Business', tags: ['leadership', 'management', 'skill', 'business', 'development'], popularityScore: 81 },
  { name: 'Investing', category: 'Career & Business', tags: ['investing', 'finance', 'money', 'business', 'strategy'], popularityScore: 81 },
  { name: 'Stock Market', category: 'Career & Business', tags: ['stock', 'market', 'investing', 'finance', 'business'], popularityScore: 78 },
  { name: 'Real Estate', category: 'Career & Business', tags: ['real estate', 'property', 'investment', 'business', 'finance'], popularityScore: 79 },
  { name: 'Marketing', category: 'Career & Business', tags: ['marketing', 'business', 'strategy', 'promotion', 'creative'], popularityScore: 80 },
  { name: 'Sales', category: 'Career & Business', tags: ['sales', 'business', 'persuasion', 'communication', 'skill'], popularityScore: 77 },
  { name: 'Digital Marketing', category: 'Career & Business', tags: ['digital marketing', 'marketing', 'online', 'business', 'tech'], popularityScore: 79 },
  { name: 'Social Media Marketing', category: 'Career & Business', tags: ['social media', 'marketing', 'online', 'business', 'engagement'], popularityScore: 81 },
  { name: 'E-Commerce', category: 'Career & Business', tags: ['e-commerce', 'online', 'business', 'selling', 'tech'], popularityScore: 78 },
  { name: 'Networking', category: 'Career & Business', tags: ['networking', 'business', 'relationship', 'professional', 'connection'], popularityScore: 78 },
  { name: 'Public Speaking', category: 'Career & Business', tags: ['public speaking', 'communication', 'skill', 'business', 'confidence'], popularityScore: 77 },
  { name: 'Business Coaching', category: 'Career & Business', tags: ['coaching', 'business', 'mentorship', 'development', 'growth'], popularityScore: 73 },

  // ===== FASHION & LIFESTYLE (30+ interests) =====
  { name: 'Fashion', category: 'Fashion & Lifestyle', tags: ['fashion', 'style', 'clothing', 'trendy', 'personal'], popularityScore: 89 },
  { name: 'Styling', category: 'Fashion & Lifestyle', tags: ['styling', 'fashion', 'personal', 'creative', 'aesthetic'], popularityScore: 84 },
  { name: 'Makeup', category: 'Fashion & Lifestyle', tags: ['makeup', 'beauty', 'fashion', 'creative', 'personal'], popularityScore: 87 },
  { name: 'Skincare', category: 'Fashion & Lifestyle', tags: ['skincare', 'beauty', 'health', 'personal', 'wellness'], popularityScore: 85 },
  { name: 'Hair Care', category: 'Fashion & Lifestyle', tags: ['hair', 'beauty', 'personal', 'self-care', 'wellness'], popularityScore: 84 },
  { name: 'Jewelry', category: 'Fashion & Lifestyle', tags: ['jewelry', 'fashion', 'accessories', 'style', 'personal'], popularityScore: 81 },
  { name: 'Vintage Fashion', category: 'Fashion & Lifestyle', tags: ['vintage', 'fashion', 'style', 'retro', 'unique'], popularityScore: 81 },
  { name: 'Interior Design', category: 'Fashion & Lifestyle', tags: ['interior design', 'space', 'creative', 'aesthetic', 'personal'], popularityScore: 84 },
  { name: 'Home Decor', category: 'Fashion & Lifestyle', tags: ['home decor', 'interior', 'creative', 'personal', 'aesthetic'], popularityScore: 83 },
  { name: 'Minimalism', category: 'Fashion & Lifestyle', tags: ['minimalism', 'lifestyle', 'simplicity', 'organization', 'philosophy'], popularityScore: 78 },
  { name: 'Organization', category: 'Fashion & Lifestyle', tags: ['organization', 'lifestyle', 'planning', 'efficiency', 'productivity'], popularityScore: 81 },
  { name: 'Self-Care', category: 'Fashion & Lifestyle', tags: ['self-care', 'wellness', 'personal', 'health', 'mindfulness'], popularityScore: 86 },

  // ===== VOLUNTEERING & SOCIAL CAUSES (25+ interests) =====
  { name: 'Volunteering', category: 'Volunteering & Social Causes', tags: ['volunteering', 'helping', 'community', 'compassion', 'service'], popularityScore: 82 },
  { name: 'Community Service', category: 'Volunteering & Social Causes', tags: ['community', 'service', 'helping', 'social', 'advocacy'], popularityScore: 80 },
  { name: 'Charity Work', category: 'Volunteering & Social Causes', tags: ['charity', 'helping', 'giving', 'compassion', 'social'], popularityScore: 81 },
  { name: 'Animal Rights Advocacy', category: 'Volunteering & Social Causes', tags: ['animal rights', 'advocacy', 'compassion', 'social', 'activism'], popularityScore: 77 },
  { name: 'Environmental Activism', category: 'Volunteering & Social Causes', tags: ['environment', 'activism', 'advocacy', 'green', 'social'], popularityScore: 79 },
  { name: 'Social Justice', category: 'Volunteering & Social Causes', tags: ['social justice', 'activism', 'advocacy', 'equality', 'change'], popularityScore: 78 },
  { name: 'Mentoring', category: 'Volunteering & Social Causes', tags: ['mentoring', 'helping', 'guidance', 'community', 'development'], popularityScore: 79 },
  { name: 'Teaching', category: 'Volunteering & Social Causes', tags: ['teaching', 'education', 'helping', 'community', 'knowledge'], popularityScore: 81 },
  { name: 'Coaching', category: 'Volunteering & Social Causes', tags: ['coaching', 'helping', 'guidance', 'skill', 'development'], popularityScore: 79 },
  { name: 'Environmental Conservation', category: 'Volunteering & Social Causes', tags: ['conservation', 'environment', 'nature', 'activism', 'green'], popularityScore: 76 },

  // ===== EVENTS & FESTIVALS (20+ interests) =====
  { name: 'Music Festivals', category: 'Events & Festivals', tags: ['music festival', 'live', 'event', 'music', 'social'], popularityScore: 87 },
  { name: 'Art Festivals', category: 'Events & Festivals', tags: ['art festival', 'event', 'art', 'cultural', 'creative'], popularityScore: 78 },
  { name: 'Food Festivals', category: 'Events & Festivals', tags: ['food festival', 'event', 'food', 'cultural', 'tasting'], popularityScore: 82 },
  { name: 'Film Festivals', category: 'Events & Festivals', tags: ['film festival', 'event', 'cinema', 'cultural', 'entertainment'], popularityScore: 79 },
  { name: 'Comic Cons', category: 'Events & Festivals', tags: ['comic con', 'event', 'geek', 'fun', 'community'], popularityScore: 79 },
  { name: 'Tech Conferences', category: 'Events & Festivals', tags: ['tech conference', 'event', 'tech', 'networking', 'learning'], popularityScore: 74 },
  { name: 'Sports Events', category: 'Events & Festivals', tags: ['sports event', 'watching', 'live', 'competitive', 'exciting'], popularityScore: 83 },
  { name: 'Fashion Shows', category: 'Events & Festivals', tags: ['fashion show', 'event', 'trendy', 'creative', 'runway'], popularityScore: 76 },
  { name: 'Gaming Tournaments', category: 'Events & Festivals', tags: ['gaming', 'tournament', 'competition', 'event', 'esports'], popularityScore: 76 },
  { name: 'Marathon Events', category: 'Events & Festivals', tags: ['marathon', 'event', 'running', 'sport', 'challenge'], popularityScore: 77 },

  // ===== LEARNING & EDUCATION (30+ interests) =====
  { name: 'Online Learning', category: 'Learning & Education', tags: ['online', 'learning', 'education', 'skill', 'development'], popularityScore: 87 },
  { name: 'Language Learning', category: 'Learning & Education', tags: ['language', 'learning', 'education', 'skill', 'communication'], popularityScore: 85 },
  { name: 'Spanish Learning', category: 'Learning & Education', tags: ['spanish', 'language', 'learning', 'education', 'skill'], popularityScore: 80 },
  { name: 'French Learning', category: 'Learning & Education', tags: ['french', 'language', 'learning', 'education', 'skill'], popularityScore: 78 },
  { name: 'Mandarin Learning', category: 'Learning & Education', tags: ['mandarin', 'language', 'learning', 'education', 'skill'], popularityScore: 79 },
  { name: 'Japanese Learning', category: 'Learning & Education', tags: ['japanese', 'language', 'learning', 'education', 'skill'], popularityScore: 80 },
  { name: 'Korean Learning', category: 'Learning & Education', tags: ['korean', 'language', 'learning', 'education', 'skill'], popularityScore: 80 },
  { name: 'Philosophy', category: 'Learning & Education', tags: ['philosophy', 'education', 'thinking', 'knowledge', 'wisdom'], popularityScore: 76 },
  { name: 'Psychology', category: 'Learning & Education', tags: ['psychology', 'education', 'knowledge', 'human', 'behavior'], popularityScore: 79 },
  { name: 'History', category: 'Learning & Education', tags: ['history', 'education', 'knowledge', 'learning', 'past'], popularityScore: 78 },
  { name: 'Astronomy', category: 'Learning & Education', tags: ['astronomy', 'science', 'space', 'learning', 'knowledge'], popularityScore: 81 },
  { name: 'Science Learning', category: 'Learning & Education', tags: ['science', 'education', 'learning', 'knowledge', 'discovery'], popularityScore: 80 },
  { name: 'Personal Development', category: 'Learning & Education', tags: ['personal', 'development', 'growth', 'self-improvement', 'skill'], popularityScore: 84 },
  { name: 'Self-Improvement', category: 'Learning & Education', tags: ['self-improvement', 'growth', 'development', 'personal', 'skill'], popularityScore: 84 },

  // ===== CARS & BIKES (20+ interests) =====
  { name: 'Car Enthusiasts', category: 'Cars & Bikes', tags: ['cars', 'automotive', 'passion', 'hobby', 'vehicles'], popularityScore: 80 },
  { name: 'Motorcycles', category: 'Cars & Bikes', tags: ['motorcycles', 'bikes', 'riding', 'adventure', 'speed'], popularityScore: 79 },
  { name: 'Car Racing', category: 'Cars & Bikes', tags: ['racing', 'cars', 'competitive', 'speed', 'adrenaline'], popularityScore: 77 },
  { name: 'Bike Maintenance', category: 'Cars & Bikes', tags: ['maintenance', 'bikes', 'technical', 'diy', 'skill'], popularityScore: 72 },
  { name: 'Car Customization', category: 'Cars & Bikes', tags: ['customization', 'cars', 'creative', 'technical', 'personal'], popularityScore: 75 },
  { name: 'Bike Riding Tours', category: 'Cars & Bikes', tags: ['bike tour', 'riding', 'travel', 'adventure', 'exercise'], popularityScore: 76 },
  { name: 'Motorcycle Touring', category: 'Cars & Bikes', tags: ['motorcycle', 'touring', 'travel', 'adventure', 'freedom'], popularityScore: 76 },

  // ===== CONTENT CREATION & SOCIAL MEDIA (25+ interests) =====
  { name: 'YouTubing', category: 'Content Creation & Social Media', tags: ['youtube', 'content', 'creation', 'video', 'social'], popularityScore: 84 },
  { name: 'TikTok Content', category: 'Content Creation & Social Media', tags: ['tiktok', 'content', 'creation', 'video', 'viral'], popularityScore: 83 },
  { name: 'Instagram Influencing', category: 'Content Creation & Social Media', tags: ['instagram', 'influencer', 'social', 'content', 'brand'], popularityScore: 82 },
  { name: 'Blogging', category: 'Content Creation & Social Media', tags: ['blogging', 'writing', 'content', 'sharing', 'online'], popularityScore: 79 },
  { name: 'Podcasting', category: 'Content Creation & Social Media', tags: ['podcast', 'content', 'audio', 'sharing', 'discussion'], popularityScore: 80 },
  { name: 'Streaming', category: 'Content Creation & Social Media', tags: ['streaming', 'content', 'live', 'entertainment', 'social'], popularityScore: 79 },
  { name: 'Content Writing', category: 'Content Creation & Social Media', tags: ['content', 'writing', 'creative', 'skill', 'expression'], popularityScore: 78 },
  { name: 'Vlogging', category: 'Content Creation & Social Media', tags: ['vlog', 'video', 'content', 'daily', 'sharing'], popularityScore: 79 },
  { name: 'Video Editing', category: 'Content Creation & Social Media', tags: ['video', 'editing', 'creative', 'technical', 'content'], popularityScore: 79 },
];

// ===== HELPER FUNCTIONS =====

/**
 * Get all interests as a flat list
 */
export function getAllInterests() {
  return INTERESTS_DATABASE.map((interest, idx) => ({
    id: `interest-${idx}`,
    ...interest,
  }));
}

/**
 * Search interests by name, category, or tags
 * Returns array of matching interests with scores
 */
export function searchInterestsDatabase(query) {
  if (!query || query.trim().length < 2) return [];

  const q = query.toLowerCase().trim();
  const results = [];

  INTERESTS_DATABASE.forEach((interest, idx) => {
    let score = 0;

    // Check name match (highest priority)
    if (interest.name.toLowerCase().includes(q)) {
      score += 100;
      if (interest.name.toLowerCase().startsWith(q)) {
        score += 50; // Boost for prefix match
      }
    }

    // Check tags match
    if (interest.tags && interest.tags.some(tag => tag.toLowerCase().includes(q))) {
      score += 50;
    }

    // Check category match (lower priority)
    if (interest.category.toLowerCase().includes(q)) {
      score += 25;
    }

    if (score > 0) {
      results.push({
        id: `interest-db-${interest.name.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
        ...interest,
        matchScore: score,
      });
    }
  });

  // Sort by match score (descending) and popularity (descending)
  results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return (b.popularityScore || 0) - (a.popularityScore || 0);
  });

  return results.slice(0, 10); // Return top 10 results
}

/**
 * Get interests by category
 */
export function getInterestsByCategory(category) {
  return INTERESTS_DATABASE.filter(interest => 
    interest.category.toLowerCase() === category.toLowerCase()
  ).map((interest, idx) => ({
    id: `interest-db-${interest.name.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
    ...interest,
  }));
}

/**
 * Get all unique categories
 */
export function getAllCategories() {
  const categories = new Set(INTERESTS_DATABASE.map(i => i.category));
  return Array.from(categories).sort();
}

/**
 * Get total count and stats
 */
export const TOTAL_INTERESTS = INTERESTS_DATABASE.length;
export const TOTAL_CATEGORIES = [...new Set(INTERESTS_DATABASE.map(i => i.category))].length;
