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

        // Read the SQL migration file
        const sqlPath = path.join(__dirname, 'migrations', 'update-location-preference-default.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        console.log('🔄 Running migration to update location preference default...');
        
        // Execute the migration
        const [results] = await connection.query(sql);
        
        console.log('✅ Migration completed successfully');
        console.log('📊 Results:', results);

        // Show count of updated users
        const [countResult] = await connection.query(
            "SELECT COUNT(*) as count FROM users WHERE location_preference = 'anywhere'"
        );
        console.log(`📍 Total users with 'anywhere' preference: ${countResult[0].count}`);

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
