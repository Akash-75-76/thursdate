// Check the current schema for favourite_travel_destination
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

async function checkSchema() {
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
        console.log('📊 Checking users table schema for favourite_travel_destination...\n');
        
        const [rows] = await pool.execute('DESCRIBE users');
        
        const travelDestField = rows.find(row => row.Field === 'favourite_travel_destination');
        
        if (travelDestField) {
            console.log('✅ Found favourite_travel_destination column:');
            console.log('   Type:', travelDestField.Type);
            console.log('   Null:', travelDestField.Null);
            console.log('   Key:', travelDestField.Key);
            console.log('   Default:', travelDestField.Default);
            console.log('   Extra:', travelDestField.Extra);
            
            if (travelDestField.Type === 'text') {
                console.log('\n✅ Column is TEXT - migration successful!');
            } else if (travelDestField.Type.includes('varchar')) {
                console.log('\n❌ Column is still VARCHAR - migration may have failed!');
            }
        } else {
            console.log('❌ Column favourite_travel_destination not found!');
        }
        
        console.log('\n📋 All columns:');
        rows.forEach(row => {
            console.log(`   ${row.Field}: ${row.Type}`);
        });
        
    } catch (error) {
        console.error('❌ Error checking schema:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

checkSchema().catch(console.error);
