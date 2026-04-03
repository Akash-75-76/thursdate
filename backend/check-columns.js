require('dotenv').config();
const pool = require('./config/db');

(async () => {
  try {
    const [columns] = await pool.execute("DESCRIBE users");
    const linkedinCol = columns.find(c => c.Field === 'linkedin' || c.Field === 'linkedin_id');
    const allFields = columns.map(c => c.Field);
    
    if (linkedinCol) {
      console.log('✅ Found column:', linkedinCol.Field);
    } else {
      console.log('❌ No linkedin or linkedin_id column found');
      console.log('Columns related to social:', allFields.filter(f => f.includes('linkedin') || f.includes('instagram')));
    }
    
    console.log('\nAll columns in users table:');
    allFields.forEach(f => console.log('  -', f));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
