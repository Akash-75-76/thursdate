require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function checkAndCreateGameTables() {
  let connection;
  try {
    const fs = require('fs');
    const connectionConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    };

    // Add SSL if CA file exists
    if (process.env.DB_SSL_CA && fs.existsSync(process.env.DB_SSL_CA)) {
      connectionConfig.ssl = {
        ca: fs.readFileSync(process.env.DB_SSL_CA),
      };
    }

    connection = await mysql.createConnection(connectionConfig);

    console.log('✅ Connected to database');

    // Check if tables exist
    const tablesNeeded = ['daily_games', 'user_game_responses', 'daily_game_stats'];
    const [existingTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN (?, ?, ?)
    `, [process.env.DB_NAME, ...tablesNeeded]);

    const existingTableNames = existingTables.map(t => t.TABLE_NAME);
    const missingTables = tablesNeeded.filter(t => !existingTableNames.includes(t));

    console.log('\n📊 Table Status:');
    console.log('─'.repeat(50));
    
    tablesNeeded.forEach(table => {
      if (existingTableNames.includes(table)) {
        console.log(`✅ ${table} - EXISTS`);
      } else {
        console.log(`❌ ${table} - MISSING`);
      }
    });

    if (missingTables.length === 0) {
      console.log('\n🎉 All game tables already exist! No migration needed.');
      return;
    }

    console.log(`\n⚠️  Found ${missingTables.length} missing table(s). Running migration...`);
    console.log('─'.repeat(50));

    // Read and execute migration
    const migrationPath = path.join(__dirname, 'migrations', 'create-daily-games.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await connection.execute(statement);
    }

    console.log(`✅ Migration completed successfully!`);
    console.log(`✅ Created ${missingTables.length} tables: ${missingTables.join(', ')}`);

    // Verify tables were created
    const [verifyTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN (?, ?, ?)
    `, [process.env.DB_NAME, ...tablesNeeded]);

    console.log('\n📊 Final Table Status:');
    console.log('─'.repeat(50));
    verifyTables.forEach(table => {
      console.log(`✅ ${table.TABLE_NAME} - CREATED`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAndCreateGameTables();
