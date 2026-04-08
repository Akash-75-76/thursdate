#!/usr/bin/env node
// Run referral confirmation system migration
require('dotenv').config();
const pool = require('../config/db');

async function runMigration() {
    try {
        console.log('📝 Starting Referral Confirmation System Migration...\n');
        
        // Step 1: Add columns to users table with individual error handling
        console.log('Step 1: Adding columns to users table...\n');
        
        const columnsToAdd = [
            { name: 'referredBy', def: 'referredBy INT' },
            { name: 'referralCount', def: 'referralCount INT DEFAULT 0' },
            { name: 'waitlistPriority', def: 'waitlistPriority INT DEFAULT 50' }
        ];
        
        for (const col of columnsToAdd) {
            try {
                console.log(`  Adding column: ${col.name}...`);
                await pool.execute(`ALTER TABLE users ADD COLUMN ${col.def}`);
                console.log(`  ✅ Column ${col.name} added\n`);
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`  ⚠️  Column ${col.name} already exists, skipping.\n`);
                } else {
                    console.error(`  ❌ Error adding column ${col.name}:`, error.message);
                    throw error;
                }
            }
        }
        
        // Step 2: Add indexes to users table
        console.log('Step 2: Adding indexes to users table...\n');
        
        const indexesToAdd = [
            { name: 'idx_referred_by', sql: 'CREATE INDEX idx_referred_by ON users(referredBy)' },
            { name: 'idx_waitlist_priority', sql: 'CREATE INDEX idx_waitlist_priority ON users(waitlistPriority DESC)' }
        ];
        
        for (const idx of indexesToAdd) {
            try {
                console.log(`  Creating index: ${idx.name}...`);
                await pool.execute(idx.sql);
                console.log(`  ✅ Index ${idx.name} created\n`);
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    console.log(`  ⚠️  Index ${idx.name} already exists, skipping.\n`);
                } else {
                    console.error(`  ❌ Error creating index ${idx.name}:`, error.message);
                    throw error;
                }
            }
        }
        
        // Step 3: Create referral_requests table
        console.log('Step 3: Creating referral_requests table...\n');
        
        try {
            await pool.execute(`
                CREATE TABLE IF NOT EXISTS referral_requests (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  newUserId INT NOT NULL,
                  newUserName VARCHAR(200) NOT NULL,
                  referrerUserId INT,
                  referrerPhone VARCHAR(20),
                  referrerName VARCHAR(200),
                  status ENUM('pending', 'accepted', 'rejected_known', 'rejected_unknown') DEFAULT 'pending',
                  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  confirmedAt TIMESTAMP NULL,
                  FOREIGN KEY (newUserId) REFERENCES users(id) ON DELETE CASCADE,
                  FOREIGN KEY (referrerUserId) REFERENCES users(id) ON DELETE SET NULL,
                  INDEX idx_new_user (newUserId),
                  INDEX idx_referrer (referrerUserId),
                  INDEX idx_status (status),
                  UNIQUE KEY unique_referral (newUserId)
                )
            `);
            console.log('  ✅ referral_requests table created\n');
        } catch (error) {
            if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                console.log('  ⚠️  referral_requests table already exists, skipping.\n');
            } else {
                console.error('  ❌ Error creating referral_requests table:', error.message);
                throw error;
            }
        }
        
        // Step 4: Create notifications table
        console.log('Step 4: Creating notifications table...\n');
        
        try {
            await pool.execute(`
                CREATE TABLE IF NOT EXISTS notifications (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  userId INT NOT NULL,
                  referralRequestId INT,
                  type VARCHAR(50) NOT NULL,
                  message TEXT NOT NULL,
                  is_read TINYINT DEFAULT 0,
                  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
                  FOREIGN KEY (referralRequestId) REFERENCES referral_requests(id) ON DELETE CASCADE,
                  INDEX idx_user_id (userId),
                  INDEX idx_is_read (is_read)
                )
            `);
            console.log('  ✅ notifications table created\n');
        } catch (error) {
            if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                console.log('  ⚠️  notifications table already exists, skipping.\n');
            } else {
                console.error('  ❌ Error creating notifications table:', error.message);
                throw error;
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ Referral Confirmation System Migration Completed!');
        console.log('='.repeat(50));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        pool.end();
    }
}

runMigration();
