const pool = require('./config/db');

(async () => {
  try {
    // Update a test user with sample license data
    const testEmail = 'kanadmithawala@gmail.com'; // First user from waitlist
    
    const sampleLicenseData = JSON.stringify({
      front: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      back: 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
    });
    
    await pool.execute(`
      UPDATE users 
      SET license_photos = ?,
          license_status = 'pending'
      WHERE email = ?
    `, [sampleLicenseData, testEmail]);
    
    console.log(`✅ Updated ${testEmail} with sample license data`);
    console.log(`   Status: pending`);
    console.log(`   Photos: Sample Cloudinary images`);
    console.log(`\nNow refresh your admin waitlist page to see:`);
    console.log(`   - "⏳ License Pending" badge (yellow)`);
    console.log(`   - "View License Photos" button`);
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
