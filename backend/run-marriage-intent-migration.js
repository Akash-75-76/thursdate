const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('✅ Connected to database');

        // Check how many users have "Marriage" purpose before migration
        const [beforeCount] = await connection.query(
            "SELECT COUNT(*) as count FROM users WHERE JSON_EXTRACT(intent, '$.purpose') = 'Marriage'"
        );
        console.log(`📊 Users with "Marriage" purpose: ${beforeCount[0].count}`);

        // Read the SQL migration file
        const sqlPath = path.join(__dirname, 'migrations', 'consolidate-marriage-intent.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        console.log('🔄 Running migration to consolidate Marriage intent...');
        
        // Execute the migration
        await connection.query(sql);
        
        console.log('✅ Migration completed successfully');

        // Verify the update
        const [afterCount] = await connection.query(
            "SELECT COUNT(*) as count FROM users WHERE JSON_EXTRACT(intent, '$.purpose') = 'Marriage'"
        );
        console.log(`📊 Users with "Marriage" purpose after migration: ${afterCount[0].count}`);

        const [seriouslyDateCount] = await connection.query(
            "SELECT COUNT(*) as count FROM users WHERE JSON_EXTRACT(intent, '$.purpose') = 'Seriously Date'"
        );
        console.log(`📊 Users with "Seriously Date" purpose: ${seriouslyDateCount[0].count}`);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the migration
runMigration();
