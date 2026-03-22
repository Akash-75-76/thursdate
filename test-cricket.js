// Test cricket query directly
fetch('https://api.datamuse.com/words?ml=cricket&max=10')
  .then(r => r.json())
  .then(data => {
    console.log('Datamuse Results for "cricket":');
    console.log('================================');
    if (data.length === 0) {
      console.log('❌ NO RESULTS RETURNED');
    } else {
      data.forEach((item, i) => {
        console.log(`${i+1}. ${item.word} (score: ${item.score})`);
      });
    }
    console.log('\nExpected: cricket-related words like ball, wicket, bat, sport');
  })
  .catch(err => console.error('Error:', err.message));
