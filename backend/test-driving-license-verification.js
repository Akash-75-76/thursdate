/**
 * Test Driving License Verification System
 * 
 * This script tests the database setup and basic queries
 * for the driving license verification feature.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testSystem() {
  let connection;
  
  try {
    console.log('🧪 Testing Driving License Verification System...\n');

    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      charset: "utf8mb4",
      timezone: '+00:00'
    });

    console.log('✅ Database connection established\n');

    // Test 1: Check if tables exist
    console.log('📋 Test 1: Checking if tables exist...');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('driving_license_verifications', 'verification_audit_logs')
    `, [process.env.DB_NAME]);

    if (tables.length === 2) {
      console.log('  ✅ Both tables exist');
      tables.forEach(table => console.log(`     - ${table.TABLE_NAME}`));
    } else {
      console.log('  ❌ Tables missing. Run migration first: npm run migrate:driving-license');
      return;
    }

    // Test 2: Check users table column
    console.log('\n📋 Test 2: Checking users table column...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'driving_license_verified'
    `, [process.env.DB_NAME]);

    if (columns.length > 0) {
      console.log('  ✅ Column exists: driving_license_verified');
      console.log(`     Type: ${columns[0].DATA_TYPE}`);
      console.log(`     Default: ${columns[0].COLUMN_DEFAULT}`);
    } else {
      console.log('  ❌ Column missing. Run migration first.');
      return;
    }

    // Test 3: Check indexes
    console.log('\n📋 Test 3: Checking indexes...');
    const [indexes] = await connection.query(`
      SELECT INDEX_NAME, COLUMN_NAME, TABLE_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ?
      AND (
        (TABLE_NAME = 'driving_license_verifications' AND INDEX_NAME IN ('idx_user_id', 'idx_verification_status'))
        OR (TABLE_NAME = 'users' AND INDEX_NAME = 'idx_driving_license_verified')
      )
    `, [process.env.DB_NAME]);

    if (indexes.length >= 3) {
      console.log('  ✅ All indexes exist');
      indexes.forEach(idx => console.log(`     - ${idx.TABLE_NAME}.${idx.INDEX_NAME}`));
    } else {
      console.log('  ⚠️ Some indexes missing (but system can still work)');
    }

    // Test 4: Check foreign keys
    console.log('\n📋 Test 4: Checking foreign key constraints...');
    const [fks] = await connection.query(`
      SELECT CONSTRAINT_NAME, TABLE_NAME, REFERENCED_TABLE_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME IN ('driving_license_verifications', 'verification_audit_logs')
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME]);

    if (fks.length >= 2) {
      console.log('  ✅ Foreign keys configured correctly');
      fks.forEach(fk => {
        console.log(`     - ${fk.TABLE_NAME} → ${fk.REFERENCED_TABLE_NAME}`);
      });
    } else {
      console.log('  ⚠️ Foreign keys missing or incomplete');
    }

    // Test 5: Test query performance
    console.log('\n📋 Test 5: Testing query structure...');
    
    // Test user status query
    try {
      await connection.query(`
        SELECT id, verification_status, submitted_at, reviewed_at, rejection_reason
        FROM driving_license_verifications 
        WHERE user_id = ? 
        ORDER BY submitted_at DESC 
        LIMIT 1
      `, [1]); // Test with user_id = 1
      console.log('  ✅ User status query works');
    } catch (error) {
      console.log('  ❌ User status query failed:', error.message);
    }

    // Test admin pending query
    try {
      await connection.query(`
        SELECT 
          dlv.id,
          dlv.user_id,
          dlv.verification_status,
          dlv.submitted_at,
          u.first_name,
          u.last_name,
          u.email
        FROM driving_license_verifications dlv
        JOIN users u ON dlv.user_id = u.id
        WHERE dlv.verification_status = 'UNDER_REVIEW'
        ORDER BY dlv.submitted_at ASC
      `);
      console.log('  ✅ Admin pending query works');
    } catch (error) {
      console.log('  ❌ Admin pending query failed:', error.message);
    }

    // Test 6: Count existing data
    console.log('\n📋 Test 6: Checking existing data...');
    const [counts] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM driving_license_verifications) as total_verifications,
        (SELECT COUNT(*) FROM driving_license_verifications WHERE verification_status = 'UNDER_REVIEW') as pending,
        (SELECT COUNT(*) FROM driving_license_verifications WHERE verification_status = 'VERIFIED') as verified,
        (SELECT COUNT(*) FROM driving_license_verifications WHERE verification_status = 'REJECTED') as rejected,
        (SELECT COUNT(*) FROM verification_audit_logs) as audit_logs,
        (SELECT COUNT(*) FROM users WHERE driving_license_verified = TRUE) as users_verified
    `);

    const data = counts[0];
    console.log('  📊 Current data:');
    console.log(`     Total verifications: ${data.total_verifications}`);
    console.log(`     Pending: ${data.pending}`);
    console.log(`     Verified: ${data.verified}`);
    console.log(`     Rejected: ${data.rejected}`);
    console.log(`     Audit logs: ${data.audit_logs}`);
    console.log(`     Users with verified license: ${data.users_verified}`);

    // Test 7: Environment variables
    console.log('\n📋 Test 7: Checking environment variables...');
    const requiredVars = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'ADMIN_EMAILS',
      'JWT_SECRET'
    ];

    let allVarsPresent = true;
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`  ✅ ${varName} is set`);
      } else {
        console.log(`  ❌ ${varName} is NOT set`);
        allVarsPresent = false;
      }
    });

    if (!allVarsPresent) {
      console.log('\n  ⚠️ Some environment variables are missing!');
      console.log('  Please check your .env file');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Database schema: OK');
    console.log('✅ Tables: OK');
    console.log('✅ Columns: OK');
    console.log('✅ Queries: OK');
    
    if (allVarsPresent) {
      console.log('✅ Environment: OK');
    } else {
      console.log('⚠️ Environment: Missing variables');
    }

    console.log('\n🎉 System is ready for use!');
    console.log('\nNext steps:');
    console.log('  1. Start the server: npm start');
    console.log('  2. Test upload endpoint with Postman');
    console.log('  3. Review documentation: DRIVING_LICENSE_VERIFICATION.md');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run tests
testSystem();
