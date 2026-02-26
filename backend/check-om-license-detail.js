const pool = require('./config/db');

(async () => {
  try {
    const [users] = await pool.execute(`
      SELECT id, email, first_name, last_name, license_photos, license_status
      FROM users 
      WHERE email = 'akash_deshmukh_it@moderncoe.edu.in'
    `);
    
    if (users.length === 0) {
      console.log('User not found');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('\n=== Om Gaikwad License Data ===');
    console.log(`User: ${user.first_name} ${user.last_name}`);
    console.log(`Email: ${user.email}`);
    console.log(`License Status: ${user.license_status || 'none'}`);
    console.log(`\nRaw license_photos field:`);
    console.log(user.license_photos);
    console.log(`\nType: ${typeof user.license_photos}`);
    
    if (user.license_photos) {
      try {
        let parsed;
        if (typeof user.license_photos === 'string') {
          parsed = JSON.parse(user.license_photos);
        } else {
          parsed = user.license_photos;
        }
        console.log(`\nParsed data:`);
        console.log(parsed);
        console.log(`\nIs Array: ${Array.isArray(parsed)}`);
        console.log(`Is Object: ${typeof parsed === 'object' && !Array.isArray(parsed)}`);
        
        if (Array.isArray(parsed)) {
          console.log(`\nArray format detected (OLD endpoint):`);
          parsed.forEach((url, i) => console.log(`  [${i}]: ${url}`));
        } else if (parsed.front || parsed.back) {
          console.log(`\nObject format detected (NEW endpoint):`);
          console.log(`  Front: ${parsed.front}`);
          console.log(`  Back: ${parsed.back}`);
        }
      } catch(e) {
        console.log(`\nFailed to parse: ${e.message}`);
      }
    } else {
      console.log('\nNo license photos found (null)');
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
