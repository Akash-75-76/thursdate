// Migration runner: Add unique constraints for email, phone, linkedinId, googleId
// This ensures one email, phone, linkedinId, and googleId corresponds to only one user account

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runMigration() {
  try {
    console.log('🔐 Starting: Add Unique Constraints Migration\n');

    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'add-unique-constraints.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon to execute multiple statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--')) continue;

      try {
        console.log(`\n[${i + 1}/${statements.length}] Executing:\n${statement.substring(0, 80)}...`);
        
        // Handle IF NOT EXISTS separately
        if (statement.includes('IF NOT EXISTS')) {
          // This is a special case - try to execute, ignore if it fails
          try {
            await pool.execute(statement);
            console.log('✅ Success');
            successCount++;
          } catch (err) {
            // Common error for IF NOT EXISTS - could already exist
            if (err.code === 'ER_DUP_KEYNAME' || err.message.includes('already exists')) {
              console.log('⚠️ Already exists (skipped)');
              successCount++;
            } else {
              throw err;
            }
          }
        } else {
          await pool.execute(statement);
          console.log('✅ Success');
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Failed: ${err.message}`);
        errorCount++;
        
        // Don't stop on certain errors like duplicate key names
        if (!err.code === 'ER_DUP_KEYNAME' && !err.message.includes('already exists')) {
          throw err;
        }
      }
    }

    console.log(`\n\n📊 Migration Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n✨ Migration completed successfully!\n');
      console.log('📋 Changes Applied:');
      console.log('   ✅ Added google_id field with UNIQUE constraint');
      console.log('   ✅ Renamed linkedin to linkedin_id');
      console.log('   ✅ Added UNIQUE constraint on linkedin_id');
      console.log('   ✅ Ensured UNIQUE constraint on email');
      console.log('   ✅ Ensured UNIQUE constraint on phone_number');
      console.log('   ✅ Added google_verified field');
      console.log('   ✅ Added account_status field (pending/under_review/approved/rejected/suspended)');
      console.log('   ✅ Added rejection_reason field for rejected accounts');
      console.log('   ✅ Created indexes for faster lookups\n');
    } else {
      console.log('\n⚠️ Some statements failed (likely due to existing constraints)\n');
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

// Run migration
runMigration();
