const pool = require('./config/db');

(async () => {
  try {
    // Search for user om gaikwad
    const [users] = await pool.execute(`
      SELECT id, email, first_name, last_name, license_photos, license_status, approval
      FROM users 
      WHERE first_name LIKE '%om%' OR last_name LIKE '%gaikwad%' OR email LIKE '%om%' OR email LIKE '%gaikwad%'
    `);
    
    console.log('\n=== Search Results for "om gaikwad" ===');
    console.log(`Found ${users.length} matching user(s)\n`);
    
    if (users.length === 0) {
      console.log('No users found matching "om gaikwad"');
      console.log('\nShowing all users instead:');
      const [allUsers] = await pool.execute(`
        SELECT id, email, first_name, last_name, license_photos, license_status, approval
        FROM users 
        ORDER BY created_at DESC
        LIMIT 10
      `);
      allUsers.forEach(u => {
        console.log(`\nUser ID: ${u.id}`);
        console.log(`  Name: ${u.first_name} ${u.last_name}`);
        console.log(`  Email: ${u.email}`);
        console.log(`  In Waitlist: ${!u.approval ? 'YES' : 'NO (approved)'}`);
        console.log(`  License Status: ${u.license_status || 'none'}`);
        console.log(`  License Photos: ${u.license_photos ? 'YES - ' + u.license_photos.substring(0, 100) + '...' : 'NO'}`);
      });
    } else {
      users.forEach(u => {
        console.log(`User ID: ${u.id}`);
        console.log(`  Name: ${u.first_name} ${u.last_name}`);
        console.log(`  Email: ${u.email}`);
        console.log(`  In Waitlist: ${!u.approval ? 'YES' : 'NO (approved)'}`);
        console.log(`  License Status: ${u.license_status || 'none'}`);
        if (u.license_photos) {
          console.log(`  License Photos: YES`);
          try {
            const parsed = JSON.parse(u.license_photos);
            console.log(`    Front: ${parsed.front || 'missing'}`);
            console.log(`    Back: ${parsed.back || 'missing'}`);
          } catch(e) {
            console.log(`    Raw data: ${u.license_photos}`);
          }
        } else {
          console.log(`  License Photos: NO`);
        }
        console.log('');
      });
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
