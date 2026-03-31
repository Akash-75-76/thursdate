require('dotenv').config();
const pool = require('./config/db');

(async () => {
  try {
    const [columns] = await pool.execute(`
      SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);
    
    let currentTable = '';
    let tableCount = 0;
    columns.forEach(col => {
      if (col.TABLE_NAME !== currentTable) {
        currentTable = col.TABLE_NAME;
        tableCount++;
        console.log(`\n\n════ ${col.TABLE_NAME} ════`);
      }
      const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      const key = col.COLUMN_KEY ? `[${col.COLUMN_KEY}]` : '';
      const extra = col.EXTRA ? `(${col.EXTRA})` : '';
      console.log(`  • ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${nullable} ${key} ${extra}`.trim());
    });
    
    console.log(`\n\n✅ Total Tables: ${tableCount}`);
    
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
})();
