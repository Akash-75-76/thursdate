const pool = require('./config/db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const runMigration = async () => {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migrations/add-favorite-places.sql'), 'utf8');
        const statements = sql.split(';').filter(s => s.trim());

        console.log('⏳ Starting favorite places migration...');
        console.log(`Found ${statements.length} SQL statements to execute\n`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                console.log(`[${i + 1}/${statements.length}] Executing: ${statement.slice(0, 80).replace(/\n/g, ' ')}...`);
                try {
                    await pool.execute(statement);
                    console.log('✅ Success');
                } catch (err) {
                    if (err.code === 'ER_DUP_FIELDNAME') {
                        console.log('⚠️  Column already exists, skipping...');
                    } else {
                        throw err;
                    }
                }
            }
        }

        console.log('\n✅ Migration completed successfully - favorite_places column added!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

runMigration();
