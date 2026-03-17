// Run SQL migration to add referral-related tables/columns
require('dotenv').config();
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('📝 Starting referral SQL migration...');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'add-referral-codes.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Remove comments first, then split by semicolon
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
        
        const statements = cleanedSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        console.log(`Found ${statements.length} SQL statements to execute`);
        
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            console.log(`[#${i + 1}] Executing:`, stmt.substring(0, 120) + '...');
            try {
                await pool.execute(stmt);
                console.log('✅ Success');
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log('⚠️  Column already exists, skipping');
                } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log('⚠️  Table already exists, skipping');
                } else if (error.code === 'ER_DUP_KEYNAME') {
                    console.log('⚠️  Index already exists, skipping');
                } else {
                    throw error;
                }
            }
        }
        
        console.log('✅ Referral SQL migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Referral migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runMigration();
