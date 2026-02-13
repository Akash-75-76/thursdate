// Run location matching migration
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runLocationMatchingMigration() {
  try {
    console.log('Running location matching migration...');
    const sqlPath = path.join(__dirname, 'add-location-matching.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Remove comments and split by semicolon
    const lines = sql.split('\n');
    const cleanedLines = lines
      .map(line => {
        const commentIndex = line.indexOf('--');
        if (commentIndex !== -1) {
          return line.substring(0, commentIndex);
        }
        return line;
      })
      .filter(line => line.trim().length > 0);
    
    const cleanedSql = cleanedLines.join('\n');
    
    // Split by semicolon and filter empty statements
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      await db.query(stmt);
      console.log(`✅ Statement ${i + 1} completed`);
    }
    
    console.log('\n✅ Location matching migration completed successfully');
  } catch (error) {
    console.error('❌ Location matching migration failed:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runLocationMatchingMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runLocationMatchingMigration;
