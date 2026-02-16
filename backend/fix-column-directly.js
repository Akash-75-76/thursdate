// Direct fix for favourite_travel_destination column
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

async function fixColumn() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('🔧 Fixing favourite_travel_destination column...\n');
        
        // Check current type
        const [beforeRows] = await pool.execute('DESCRIBE users');
        const beforeField = beforeRows.find(row => row.Field === 'favourite_travel_destination');
        console.log('BEFORE: favourite_travel_destination is', beforeField.Type);
        
        // Alter the column
        console.log('\n🔄 Altering column to TEXT...');
        await pool.execute('ALTER TABLE users MODIFY COLUMN favourite_travel_destination TEXT');
        console.log('✅ Column altered successfully');
        
        // Verify change
        const [afterRows] = await pool.execute('DESCRIBE users');
        const afterField = afterRows.find(row => row.Field === 'favourite_travel_destination');
        console.log('\nAFTER: favourite_travel_destination is', afterField.Type);
        
        if (afterField.Type === 'text') {
            console.log('\n✅ SUCCESS! Column is now TEXT and can store large JSON arrays');
        } else {
            console.log('\n❌ FAILED! Column is still', afterField.Type);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

fixColumn().catch(console.error);
