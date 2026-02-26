const pool = require('./config/db');

/**
 * Migrate license photos from array format to object format
 * OLD: ["url1", "url2"]
 * NEW: { "front": "url1", "back": "url2", "uploadedAt": "..." }
 */

(async () => {
  try {
    console.log('\n=== License Photos Migration ===\n');
    
    // Find all users with license photos
    const [users] = await pool.execute(`
      SELECT id, email, first_name, last_name, license_photos, license_status
      FROM users 
      WHERE license_photos IS NOT NULL
    `);
    
    console.log(`Found ${users.length} users with license photos\n`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        let photos = user.license_photos;
        
        // Parse if string
        if (typeof photos === 'string') {
          photos = JSON.parse(photos);
        }
        
        // Check if it's in array format (old endpoint)
        if (Array.isArray(photos)) {
          console.log(`✓ Migrating User ${user.id} (${user.email}):`);
          console.log(`  OLD: Array with ${photos.length} URLs`);
          
          const newFormat = {
            front: photos[0] || null,
            back: photos[1] || null,
            uploadedAt: new Date().toISOString(),
            migrated: true
          };
          
          await pool.execute(
            'UPDATE users SET license_photos = ? WHERE id = ?',
            [JSON.stringify(newFormat), user.id]
          );
          
          console.log(`  NEW: { front: ..., back: ... }`);
          console.log(`  Status: ${user.license_status}\n`);
          migratedCount++;
        } else if (photos.front || photos.back) {
          console.log(`⊘ Skipping User ${user.id} (${user.email}) - already in correct format\n`);
          skippedCount++;
        } else {
          console.log(`? Unknown format for User ${user.id} (${user.email}):`, photos, '\n');
          errorCount++;
        }
        
      } catch (e) {
        console.error(`✗ Error processing User ${user.id}:`, e.message, '\n');
        errorCount++;
      }
    }
    
    console.log('=== Migration Complete ===');
    console.log(`Migrated: ${migratedCount}`);
    console.log(`Skipped (already correct): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total: ${users.length}\n`);
    
    process.exit(0);
  } catch(e) {
    console.error('Fatal error:', e);
    process.exit(1);
  }
})();
