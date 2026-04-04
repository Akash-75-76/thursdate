#!/usr/bin/env node
/**
 * Run fitness level migration
 * Adds the fitness_level column to the users table
 */

require('dotenv').config();
const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('📝 Checking if fitness_level column exists...');
    
    // Check if column exists
    const [columns] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'fitness_level'`
    );
    
    if (columns && columns.length > 0) {
      console.log('✅ fitness_level column already exists!');
      process.exit(0);
    }
    
    console.log('⏳ Adding fitness_level column to users table...');
    
    // Read and execute migration SQL
    const sqlPath = path.join(__dirname, 'migrations/add-fitness-level.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await db.query(sql);
    
    console.log('✅ Fitness level migration completed successfully!');
    console.log('ℹ️  The fitness_level column is now available in the users table.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runMigration();
