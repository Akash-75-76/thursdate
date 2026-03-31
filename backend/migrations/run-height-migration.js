// Run SQL migration to add height field
require('dotenv').config();
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('📝 Starting height migration...');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'add-height.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Remove comments first, then split by semicolon
        const lines = sql.split('\n');
        const cleanedLines = lines
            .map(line => {
                // Remove inline comments
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
            console.log(`[${i + 1}/${statements.length}] Executing:`, stmt.substring(0, 100) + '...');
            
            try {
                await pool.execute(stmt);
                console.log('✅ Success\n');
            } catch (error) {
                // Check if error is "column already exists"
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log('⚠️  Column already exists, skipping...\n');
                } else if (error.code === 'ER_DUP_KEYNAME') {
                    console.log('⚠️  Index already exists, skipping...\n');
                } else {
                    throw error;
                }
            }
        }
        
        console.log('✅ Height migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
