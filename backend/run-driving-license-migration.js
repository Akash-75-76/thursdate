/**
 * Run Driving License Verification Migration
 * 
 * This script creates the database tables and columns required for
 * the driving license verification feature.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    console.log('🚀 Starting Driving License Verification Migration...\n');

    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      multipleStatements: true,
      charset: "utf8mb4",
      timezone: '+00:00'
    });

    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add-driving-license-verification.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');

    // Execute migration
    const [results] = await connection.query(migrationSQL);

    console.log('\n✅ Migration executed successfully!');
    console.log('\nCreated:');
    console.log('  ✓ driving_license_verifications table');
    console.log('  ✓ verification_audit_logs table');
    console.log('  ✓ driving_license_verified column in users table');
    console.log('  ✓ Indexes for optimization');

    // Verify tables were created
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('driving_license_verifications', 'verification_audit_logs')
    `, [process.env.DB_NAME]);

    console.log('\n📊 Verification:');
    tables.forEach(table => {
      console.log(`  ✓ Table exists: ${table.TABLE_NAME}`);
    });

    // Verify column was added to users table
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'driving_license_verified'
    `, [process.env.DB_NAME]);

    if (columns.length > 0) {
      console.log(`  ✓ Column added: users.driving_license_verified (${columns[0].DATA_TYPE})`);
    }

    console.log('\n✨ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
runMigration();
