const pool = require('./config/db');

(async () => {
  try {
    const [users] = await pool.execute(`
      SELECT id, email, license_photos, license_status 
      FROM users 
      WHERE approval = false 
      LIMIT 5
    `);
    
    console.log('\n=== Waitlist Users License Data ===');
    console.log(`Total waitlist users: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('No users in waitlist');
    } else {
      users.forEach(u => {
        console.log(`User: ${u.email}`);
        console.log(`  License Status: ${u.license_status || 'none'}`);
        console.log(`  License Photos: ${u.license_photos || 'null'}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
