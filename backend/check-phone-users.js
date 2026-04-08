const pool = require('./config/db');

(async () => {
  try {
    const [users] = await pool.execute(
      "SELECT id, email, phone_number, phone_verified FROM users WHERE email LIKE 'phone_%' ORDER BY id DESC LIMIT 5"
    );
    console.log('Recent phone-based users:');
    console.log(JSON.stringify(users, null, 2));
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
