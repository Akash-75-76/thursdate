// backend/migrations/run-phone-field-migration.js
// Migration runner to add phone_number field with unique constraint

require('dotenv').config();
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Running phone field migration...\n');

    // Read SQL migration file
    const sqlFile = path.join(__dirname, 'add-phone-field-unique.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

    // Split and execute SQL statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        console.log(`📝 Executing: ${statement.substring(0, 60)}...`);
        await pool.execute(statement);
        console.log('✅ Success\n');
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
          console.log('⚠️ Already exists, skipping\n');
        } else if (error.code === 'ER_BAD_TABLE_ERROR') {
          console.log('⚠️ Migration log table not found, skipping\n');
        } else {
          throw error;
        }
      }
    }

    console.log('✅ Phone field migration completed successfully!');
    console.log('\n📋 Changes made:');
    console.log('  ✓ Added phone_number VARCHAR(20) field to users table');
    console.log('  ✓ Created UNIQUE constraint on phone_number');
    console.log('  ✓ Created index on phone_number for fast lookups');
    console.log('  ✓ Added phone_verified boolean field');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
