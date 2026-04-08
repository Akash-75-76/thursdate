const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      timeout: 5000
    });
    
    console.log('✅ Connected to database\n');
    
    console.log('=== REFERRAL_REQUESTS (Last 3) ===');
    const [requests] = await connection.execute(
      'SELECT id, newUserId, newUserName, referrerUserId, referrerName, referrerPhone, status, createdAt FROM referral_requests ORDER BY id DESC LIMIT 3'
    );
    if (requests.length === 0) {
      console.log('❌ No referral requests found');
    } else {
      requests.forEach(r => {
        console.log(`ID: ${r.id}, NewUser: ${r.newUserName} (${r.newUserId}), Referrer: ${r.referrerName} (${r.referrerUserId}), Status: ${r.status}`);
      });
    }
    
    console.log('\n=== NOTIFICATIONS (Last 3) ===');
    const [notifications] = await connection.execute(
      'SELECT id, userId, referralRequestId, type, message, is_read, createdAt FROM notifications ORDER BY id DESC LIMIT 3'
    );
    if (notifications.length === 0) {
      console.log('❌ No notifications found');
    } else {
      notifications.forEach(n => {
        console.log(`ID: ${n.id}, User: ${n.userId}, Type: ${n.type}, Read: ${n.is_read}, Msg: ${n.message?.substring(0, 40)}...`);
      });
    }
    
    await connection.end();
  } catch(err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
