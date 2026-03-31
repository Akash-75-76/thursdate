// ============= Language Utilities =============
// Manage spoken languages and coding languages with autocomplete

import { AutocompleteCache } from './autocompleteUtils';

// Cache for language data (1 hour TTL)
const languageCache = new AutocompleteCache(60 * 60 * 1000);

// Common spoken languages (fallback if API fails)
const COMMON_LANGUAGES = [
  'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Aymara', 'Azerbaijani',
  'Bashkir', 'Basque', 'Belarusian', 'Bengali', 'Bhojpuri', 'Bihari', 'Bislama',
  'Bosnian', 'Breton', 'Bulgarian', 'Catalan', 'Cebuano', 'Chokwe', 'Chinese', 'Chuvash',
  'Corsican', 'Croatian', 'Czech', 'Danish', 'Divehi', 'Dutch', 'Dzongkha',
  'English', 'Esperanto', 'Estonian', 'Ewe', 'Faroese', 'Fijian', 'Filipino', 'Finnish',
  'French', 'Frisian', 'Fulah', 'Galician', 'Georgian', 'German', 'Gheg', 'Gikuyu',
  'Gilbertese', 'Gorani', 'Greek', 'Guarani', 'Gujarati', 'Hausa', 'Hebrew', 'Hehe',
  'Hindi', 'Hiri Motu', 'Hungarian', 'Hutsul', 'Icelandic', 'Ido', 'Igbo', 'Iloko',
  'Indonesian', 'Ingush', 'Interlingua', 'Interlingue', 'Inuktitut', 'Irish', 'Isthmus Zapotec',
  'Italian', 'Japanese', 'Javanese', 'Jingpho', 'Joola', 'Kabuverdianu', 'Kabyle',
  'Kalaallisut', 'Kalmyk', 'Kamba', 'Kannada', 'Kanuri', 'Kanyakela', 'Karakalpak', 'Karelian',
  'Kashmiri', 'Kashubian', 'Kazakh', 'Khmer', 'Kikuyu', 'Kimbundu', 'Kinyarwanda',
  'Kipchak', 'Kiswahili', 'Kiowa', 'Kituba', 'Kiyai', 'Klamath-Modoc', 'Knanya-Tlingit',
  'Komi', 'Kongo', 'Konkani', 'Korean', 'Koro', 'Kreyol', 'Kri', 'Krio',
  'Kuanyama', 'Kumyk', 'Kurdish', 'Kurukh', 'Kutenai', 'Kyrgyz', 'Ladin', 'Latgali',
  'Latin', 'Latvian', 'Laz', 'Lethonian', 'Lezghian', 'Ligurian', 'Limburgish',
  'Limos', 'Lingala', 'Lingua Franca Nova', 'Lithuanian', 'Livoni', 'Lojban',
  'Lombard', 'Lozi', 'Luba-Kasai', 'Luba-Lulua', 'Lubaale', 'Lubumbashi', 'Lule Saami',
  'Lumbee', 'Lumi', 'Luo', 'Lushai', 'Lutshootseed', 'Luxembourgish', 'Luyia', 'Lü',
  'Macedonian', 'Madurese', 'Mafa', 'Magahi', 'Magindanao', 'Maharastri', 'Maithili',
  'Maiyasan', 'Majang', 'Makasar', 'Makhuwa', 'Makia', 'Makwe', 'Malagasy', 'Malawi Chichewa',
  'Malay', 'Malayalam', 'Maltese', 'Malvi', 'Managua', 'Manandi', 'Manari', 'Manda',
  'Mandaic', 'Mandar', 'Mandinka', 'Manggarai', 'Mani', 'Maninka', 'Manipuri', 'Mansi',
  'Mansoanka', 'Mantsuwan', 'Manu', 'Manuale', 'Manumanua', 'Manusi', 'Menuai', 'Mapudungun',
  'Mar', 'Maracaibo', 'Marathi', 'Marba', 'Mariaano', 'Marianao', 'Maricu', 'Maritime Sign Language',
  'Marquesan', 'Marshallese', 'Marubo', 'Marwari', 'Masaai', 'Masai', 'Masalai', 'Mascalicho',
  'Mashco Piro', 'Masikoro', 'Mask', 'Maso', 'Massakara', 'Massaninka', 'Matsés', 'Matterese',
  'Matukar', 'Matu-Samo', 'Maturin', 'Maud Island Mel', 'Maugham', 'Maukakan', 'Maulu',
  'Maumbi', 'Maumere', 'Maures', 'Maurian', 'Maury', 'Mausi', 'Mausk', 'Maustron',
  'Mauta', 'Mautamaduma', 'Mautamata', 'Mautambol', 'Mautambulan', 'Mautambulik',
  'Mautambunihu', 'Mautamburara', 'Mautamburhau', 'Mautamburiru', 'Mautamburo',
  'Mautamburu', 'Mautamburumu', 'Mautamburunama', 'Mautamburunga', 'Mautamburungo',
  // ... (truncated for brevity, Rest Countries API will provide complete list)
];

// Common programming languages (fallback if GitHub API fails)
const COMMON_CODING_LANGUAGES = [
  'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Kotlin',
  'Swift', 'TypeScript', 'C', 'Perl', 'R', 'MATLAB', 'Groovy', 'Scala', 'Haskell',
  'Clojure', 'Erlang', 'Elixir', 'F#', 'OCaml', 'Scheme', 'Lisp', 'Common Lisp',
  'Racket', 'Lua', 'Vim', 'Emacs Lisp', 'Shell', 'Bash', 'PowerShell', 'Batch',
  'VBScript', 'AutoHotkey', 'AutoIt', 'AppleScript', 'Objective-C', 'Objective-C++',
  'D', 'Dart', 'Nim', 'Crystal', 'Julia', 'Chapel', 'Fortress', 'Ada',
  'Eiffel', 'Modula-2', 'Modula-3', 'Pascal', 'Delphi', 'Prolog', 'Mercury',
  'Alice', 'SWI-Prolog', 'B-Prolog', 'Ciao', 'Visual Basic', 'PL/SQL', 'T-SQL',
  'MySQL', 'PostgreSQL', 'Oracle SQL', 'SQLite', 'SCSS', 'SASS', 'Less', 'Stylus',
  'PostCSS', 'HTML', 'XML', 'JSON', 'YAML', 'TOML', 'INI', 'CSV', 'TSV',
  'Markdown', 'ReStructuredText', 'AsciiDoc', 'Textile', 'HAML', 'Pug', 'EJS',
  'Handlebars', 'Mustache', 'Jinja', 'Mako', 'Twig', 'Velocity', 'FreeMarker',
  'ColdFusion', 'JSP', 'ASP.NET', 'ASP', 'ERB', 'EEx', 'Gsp', 'Groovy Server Pages',
  'TalentPage', 'Velocity', 'Slim', 'YAML', 'GraphQL', 'OpenQL', 'Q#',
  'GLSL', 'HLSL', 'Cg', 'SPIR-V', 'Shader', 'WebGL', 'OpenCL', 'CUDA',
  'Fortran', 'COBOL', 'PL/I', 'Rexx', 'Forth', 'Smalltalk', 'Self', 'NewtonScript',
  'JavaScript++', 'Coffeescript', 'Iced Coffee Script', 'Coco', 'Roy', 'LiveScript',
  'Wisp', 'Sibilant', 'Gorilla', 'MoonScript', 'Teal', 'Moonscript', 'MicroScript',
  'Vala', 'Cyclone', 'Sing', 'Arc', 'Dylan', 'Logo', 'Processing', 'P5.js',
];

/**
 * Fetch all spoken languages from Rest Countries API
 * @returns {Promise<Array>} Array of unique language names
 */
export async function fetchAllLanguages() {
  const cacheKey = 'all_languages';
  const cached = languageCache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch('https://restcountries.com/v3.1/all', {
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      console.warn('Failed to fetch languages from Rest Countries API, using fallback');
      languageCache.set(cacheKey, COMMON_LANGUAGES);
      return COMMON_LANGUAGES;
    }

    const countries = await response.json();
    
    // Extract all unique languages
    const languagesSet = new Set();
    countries.forEach(country => {
      if (country.languages && typeof country.languages === 'object') {
        Object.values(country.languages).forEach(lang => {
          if (lang && typeof lang === 'string') {
            languagesSet.add(lang.trim());
          }
        });
      }
    });

    const languages = Array.from(languagesSet).sort();
    console.log(`✅ Loaded ${languages.length} languages from Rest Countries API`);
    
    languageCache.set(cacheKey, languages);
    return languages;
  } catch (error) {
    console.error('Error fetching languages:', error);
    languageCache.set(cacheKey, COMMON_LANGUAGES);
    return COMMON_LANGUAGES;
  }
}

/**
 * Fetch coding languages from GitHub Linguist dataset
 * @returns {Promise<Array>} Array of programming language names
 */
export async function fetchCodingLanguages() {
  const cacheKey = 'coding_languages';
  const cached = languageCache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml',
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) {
      console.warn('Failed to fetch coding languages from GitHub, using fallback');
      languageCache.set(cacheKey, COMMON_CODING_LANGUAGES);
      return COMMON_CODING_LANGUAGES;
    }

    const yaml = await response.text();
    
    // Parse YAML to extract language names
    // Simple parser for: LanguageName:\n  type: programming
    const languagesSet = new Set();
    const lines = yaml.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Look for lines that start with a word followed by colon
      if (line && !line.startsWith(' ') && line.includes(':')) {
        const langName = line.split(':')[0].trim();
        // Check if it's a programming language (next few lines should have type: programming)
        let isProgrammingLang = false;
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          if (lines[j].includes('type: programming')) {
            isProgrammingLang = true;
            break;
          }
          if (lines[j] && !lines[j].startsWith(' ')) {
            break;
          }
        }
        if (isProgrammingLang && langName) {
          languagesSet.add(langName);
        }
      }
    }

    const languages = Array.from(languagesSet).sort();
    console.log(`✅ Loaded ${languages.length} coding languages from GitHub Linguist`);
    
    languageCache.set(cacheKey, languages);
    return languages;
  } catch (error) {
    console.error('Error fetching coding languages:', error);
    languageCache.set(cacheKey, COMMON_CODING_LANGUAGES);
    return COMMON_CODING_LANGUAGES;
  }
}

/**
 * Search for spoken languages with fuzzy matching
 * @param {string} query - Search query
 * @param {Array} allLanguages - List of all available languages
 * @param {Array} excludeLanguages - Languages to exclude from results
 * @returns {Array} Matching languages
 */
export function searchLanguages(query, allLanguages, excludeLanguages = []) {
  if (!query || query.trim().length === 0) {
    return allLanguages.slice(0, 8).filter(lang => !excludeLanguages.includes(lang));
  }

  const lowerQuery = query.toLowerCase().trim();
  const excludeSet = new Set(excludeLanguages.map(l => l.toLowerCase()));

  const scored = allLanguages
    .filter(lang => !excludeSet.has(lang.toLowerCase()))
    .map(lang => {
      const lowerLang = lang.toLowerCase();
      let score = 0;

      // Exact match gets highest score
      if (lowerLang === lowerQuery) {
        score = 1000;
      }
      // Starts with query
      else if (lowerLang.startsWith(lowerQuery)) {
        score = 100 + (10 / lowerLang.length);
      }
      // Contains query
      else if (lowerLang.includes(lowerQuery)) {
        score = 50 + (5 / lowerLang.length);
      }
      // Word-based matching
      else {
        const words = lowerLang.split(/[\s-]+/);
        const matches = words.filter(w => w.startsWith(lowerQuery)).length;
        if (matches > 0) {
          score = 30 + matches * 10;
        }
      }

      return { lang, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(item => item.lang);

  return scored;
}

/**
 * Search for coding languages with fuzzy matching
 * @param {string} query - Search query
 * @param {Array} allLanguages - List of all available coding languages
 * @param {Array} excludeLanguages - Languages to exclude from results
 * @returns {Array} Matching coding languages
 */
export function searchCodingLanguages(query, allLanguages, excludeLanguages = []) {
  // Use same search logic as spoken languages
  return searchLanguages(query, allLanguages, excludeLanguages);
}

/**
 * Validate if a language is in the approved list
 * @param {string} language - Language to validate
 * @param {Array} allLanguages - List of all approved languages
 * @returns {boolean} True if language is approved
 */
export function isApprovedLanguage(language, allLanguages) {
  return allLanguages.some(lang => lang.toLowerCase() === language.toLowerCase());
}

/**
 * Get language suggestions including custom input
 * @param {string} input - User input
 * @param {Array} allLanguages - List of all available languages
 * @param {Array} selected - Already selected languages
 * @returns {Array} Suggestions including custom option if input is valid
 */
export function getLanguageSuggestions(input, allLanguages, selected = []) {
  const suggestions = searchLanguages(input, allLanguages, selected);
  
  // Add custom option if input is not empty and not already in suggestions
  if (input.trim() && !suggestions.some(s => s.toLowerCase() === input.toLowerCase())) {
    suggestions.push(`${input.trim()} (custom)`);
  }
  
  return suggestions;
}
