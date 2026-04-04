#!/usr/bin/env node
/**
 * Check if fitness_level column exists in users table
 */

require('dotenv').config();
const db = require('./config/db');

async function checkColumn() {
  try {
    console.log('🔍 Checking users table columns...\n');
    
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('════ USERS TABLE COLUMNS ════\n');
    
    let fitnessLevelFound = false;
    columns.forEach(col => {
      const nullable = col.IS_NULLABLE === 'YES' ? '(nullable)' : '(required)';
      console.log(`  • ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${nullable}`);
      
      if (col.COLUMN_NAME === 'fitness_level') {
        fitnessLevelFound = true;
      }
    });
    
    console.log('\n════════════════════════════════\n');
    
    if (fitnessLevelFound) {
      console.log('✅ fitness_level column EXISTS!\n');
      
      // Check actual data
      const [sample] = await db.execute(
        'SELECT id, first_name, fitness_level FROM users WHERE fitness_level IS NOT NULL LIMIT 5'
      );
      
      if (sample.length > 0) {
        console.log('Sample data with fitness_level:');
        sample.forEach(row => {
          console.log(`  • User ${row.id} (${row.first_name}): ${row.fitness_level}`);
        });
      } else {
        console.log('⚠️  Column exists but no users have fitness_level set yet.');
        console.log('Users need to complete onboarding to populate this field.');
      }
    } else {
      console.log('❌ fitness_level column DOES NOT EXIST\n');
      console.log('Solution: Run: node run-fitness-level-migration.js');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkColumn();
