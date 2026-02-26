const pool = require('./config/db');

(async () => {
  try {
    const [users] = await pool.execute(`
      SELECT id, email, first_name, last_name, license_photos, license_status, approval
      FROM users 
      WHERE id = 12
    `);
    
    if (users.length === 0) {
      console.log('User not found');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('\n=== User 12 (Vishesh Bhandare) License Data ===');
    console.log(`User: ${user.first_name} ${user.last_name}`);
    console.log(`Email: ${user.email}`);
    console.log(`License Status: ${user.license_status || 'none'}`);
    console.log(`In Waitlist: ${!user.approval}`);
    console.log(`\nRaw license_photos field (first 200 chars):`);
    console.log(user.license_photos ? user.license_photos.toString().substring(0, 200) : 'null');
    console.log(`\nType: ${typeof user.license_photos}`);
    
    if (user.license_photos) {
      try {
        let parsed;
        if (typeof user.license_photos === 'string') {
          parsed = JSON.parse(user.license_photos);
        } else {
          parsed = user.license_photos;
        }
        console.log(`\nParsed successfully!`);
        console.log(`Is Array: ${Array.isArray(parsed)}`);
        console.log(`Is Object: ${typeof parsed === 'object' && !Array.isArray(parsed)}`);
        
        if (Array.isArray(parsed)) {
          console.log(`\n✓ Array format (OLD endpoint - needs migration):`);
          parsed.forEach((url, i) => console.log(`  [${i}]: ${url.substring(0, 80)}...`));
          
          console.log(`\nNeed to convert to:`);
          console.log(`  { front: "${parsed[0]}", back: "${parsed[1] || 'missing'}" }`);
        } else if (parsed.front || parsed.back) {
          console.log(`\n✓ Object format (NEW endpoint - correct format):`);
          console.log(`  Front: ${parsed.front}`);
          console.log(`  Back: ${parsed.back}`);
        }
      } catch(e) {
        console.log(`\n✗ Failed to parse as JSON: ${e.message}`);
        console.log('This is raw string data, not JSON');
      }
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
