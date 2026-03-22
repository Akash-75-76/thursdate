// Test different sports terms
const sports = ['cricket', 'football', 'baseball', 'tennis', 'hockey'];

async function testSports() {
  console.log('Testing Datamuse API with sports terms\n');
  
  for (const sport of sports) {
    const response = await fetch(`https://api.datamuse.com/words?ml=${sport}&max=5`);
    const data = await response.json();
    
    console.log(`"${sport}":`);
    if (data.length === 0) {
      console.log('  ❌ NO RESULTS');
    } else {
      data.slice(0, 3).forEach(item => {
        console.log(`  - ${item.word}`);
      });
    }
    console.log();
  }
}

testSports();
