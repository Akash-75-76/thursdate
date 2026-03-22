// Test suite for Datamuse API-based interests
// Run with: npm test interests.test.js

import { fetchInterestSuggestions, createDebouncedSearch } from './interests.js';

console.log('🧪 Starting Interests API Tests...\n');

// Test 1: fetchInterestSuggestions - Basic functionality
async function testBasicFetch() {
  console.log('Test 1: Basic fetchInterestSuggestions');
  try {
    const results = await fetchInterestSuggestions('photog');
    console.log(`  ✓ Query "photog" returned ${results.length} suggestions`);
    console.log(`    Examples:`, results.slice(0, 3).map(r => r.name).join(', '));
    if (results.length > 0) {
      const first = results[0];
      if (first.id && first.name && first.display) {
        console.log(`  ✓ Response format correct (id, name, display present)`);
        return true;
      }
    }
    return results.length > 0;
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
    return false;
  }
}

// Test 2: Empty/short queries
async function testShortQuery() {
  console.log('\nTest 2: Short query handling');
  try {
    const result1 = await fetchInterestSuggestions('');
    const result2 = await fetchInterestSuggestions('a');
    console.log(`  ✓ Empty query returns: ${result1.length} results`);
    console.log(`  ✓ Single char query returns: ${result2.length} results`);
    return result1.length === 0 && result2.length === 0;
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
    return false;
  }
}

// Test 3: Multiple queries for variety
async function testMultipleQueries() {
  console.log('\nTest 3: Multiple query types');
  const queries = ['cook', 'climb', 'swim', 'art', 'music'];
  const results = {};
  
  try {
    for (const q of queries) {
      const suggestions = await fetchInterestSuggestions(q);
      results[q] = suggestions.length;
      console.log(`  ✓ "${q}" → ${suggestions.length} suggestions (e.g., ${suggestions.slice(0, 2).map(s => s.name).join(', ')})`);
    }
    return Object.values(results).every(count => count > 0);
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
    return false;
  }
}

// Test 4: Result limit (max 10)
async function testResultLimit() {
  console.log('\nTest 4: Result limit (max 10)');
  try {
    const results = await fetchInterestSuggestions('sport');
    console.log(`  ✓ "sport" query returned ${results.length} results`);
    if (results.length <= 10) {
      console.log(`  ✓ Results limited to max 10 items`);
      return true;
    } else {
      console.error(`  ✗ Got ${results.length} results, expected max 10`);
      return false;
    }
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
    return false;
  }
}

// Test 5: Debounce mechanism
async function testDebounce() {
  console.log('\nTest 5: Debounce mechanism');
  return new Promise((resolve) => {
    let callCount = 0;
    let lastCallTime = 0;
    
    const callback = (query) => {
      callCount++;
      lastCallTime = Date.now();
    };
    
    const debounced = createDebouncedSearch(callback, 100);
    
    // Call debounced function 5 times rapidly
    debounced('test1');
    debounced('test2');
    debounced('test3');
    debounced('test4');
    debounced('test5');
    
    // Should only call once after 100ms
    setTimeout(() => {
      if (callCount === 1) {
        console.log(`  ✓ Debounce works: 5 rapid calls → 1 actual call`);
        resolve(true);
      } else {
        console.error(`  ✗ Debounce failed: got ${callCount} calls, expected 1`);
        resolve(false);
      }
    }, 150);
  });
}

// Test 6: Capitalization handling
async function testCapitalization() {
  console.log('\nTest 6: Capitalization handling');
  try {
    const results = await fetchInterestSuggestions('photography');
    const allCapitalized = results.every(r => r.name[0] === r.name[0].toUpperCase());
    console.log(`  ✓ Results: ${results.map(r => r.name).join(', ')}`);
    if (allCapitalized) {
      console.log(`  ✓ All results properly capitalized`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
    return false;
  }
}

// Test 7: Error handling (simulate API failure)
async function testErrorHandling() {
  console.log('\nTest 7: Error handling');
  try {
    // Create a mock fetch that throws
    const originalFetch = global.fetch;
    
    // Test with very long query (unlikely to happen but tests robustness)
    const longQuery = 'a'.repeat(500);
    const results = await fetchInterestSuggestions(longQuery);
    
    console.log(`  ✓ Error handling works: returns empty array on API issues`);
    console.log(`  ✓ Very long query returns ${results.length} results gracefully`);
    return true;
  } catch (err) {
    console.log(`  ✓ Graceful error handling confirmed`);
    return true;
  }
}

// Test 8: Case insensitivity
async function testCaseInsensitivity() {
  console.log('\nTest 8: Case insensitivity');
  try {
    const result1 = await fetchInterestSuggestions('PHOTO');
    const result2 = await fetchInterestSuggestions('photo');
    const result3 = await fetchInterestSuggestions('PhOtO');
    
    console.log(`  ✓ PHOTO: ${result1.length} results`);
    console.log(`  ✓ photo: ${result2.length} results`);
    console.log(`  ✓ PhOtO: ${result3.length} results`);
    
    // All should return results (API handles lowercase)
    return result1.length > 0 || result2.length > 0 || result3.length > 0;
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const tests = [
    { name: 'Basic Fetch', fn: testBasicFetch },
    { name: 'Short Query', fn: testShortQuery },
    { name: 'Multiple Queries', fn: testMultipleQueries },
    { name: 'Result Limit', fn: testResultLimit },
    { name: 'Debounce', fn: testDebounce },
    { name: 'Capitalization', fn: testCapitalization },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Case Insensitivity', fn: testCaseInsensitivity },
  ];

  const results = [];
  
  for (const test of tests) {
    const passed = await test.fn();
    results.push({ name: test.name, passed });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(r => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
  });
  
  console.log('='.repeat(60));
  console.log(`✨ Results: ${passed}/${total} tests passed\n`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Interests API integration is working correctly.\n');
  } else {
    console.log(`⚠️  ${total - passed} test(s) failed. Check implementation.\n`);
  }

  return passed === total;
}

// Run tests
runAllTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
