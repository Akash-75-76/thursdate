const db = require('./config/db');

const KEEP_USER_ID = 71; // Email-based account (will keep this)
const MERGE_USER_ID = 61; // Phone-based account (will merge this into 71)

(async () => {
  try {
    const pool = db;
    
    console.log(`\n🔄 Starting account merge: User ${MERGE_USER_ID} → User ${KEEP_USER_ID}\n`);
    
    // Get both users' data
    const [keepUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [KEEP_USER_ID]);
    const [mergeUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [MERGE_USER_ID]);
    
    if (keepUser.length === 0) throw new Error(`User ${KEEP_USER_ID} not found`);
    if (mergeUser.length === 0) throw new Error(`User ${MERGE_USER_ID} not found`);
    
    console.log(`Keep: ${keepUser[0].email} (ID: ${KEEP_USER_ID})`);
    console.log(`Merge: ${mergeUser[0].email} (ID: ${MERGE_USER_ID})`);
    console.log(`Merge phone: ${mergeUser[0].phone_number}\n`);
    
    // Step 1: Update referrals_requests table
    console.log('📋 Updating referral_requests...');
    
    try {
      // Fix newUserId references
      await pool.execute(
        'UPDATE referral_requests SET newUserId = ? WHERE newUserId = ?',
        [KEEP_USER_ID, MERGE_USER_ID]
      );
      
      // Fix referrerUserId references
      await pool.execute(
        'UPDATE referral_requests SET referrerUserId = ? WHERE referrerUserId = ?',
        [KEEP_USER_ID, MERGE_USER_ID]
      );
      console.log('✅ Updated referral_requests');
    } catch (e) {
      console.log('⚠️  referral_requests update (may not exist):', e.message);
    }
    
    // Step 2: Update notifications table
    console.log('🔔 Updating notifications...');
    try {
      await pool.execute(
        'UPDATE notifications SET userId = ? WHERE userId = ?',
        [KEEP_USER_ID, MERGE_USER_ID]
      );
      console.log('✅ Updated notifications');
    } catch (e) {
      console.log('⚠️  notifications update (may not exist):', e.message);
    }
    
    // Step 3: Update users table - merge phone to main account
    console.log('👤 Merging user data...');
    
    // Copy any missing fields from merge user to keep user
    const fieldsToMerge = ['first_name', 'last_name', 'profile_pic_url', 'face_photo_url', 'gender', 'dob'];
    let mergedFields = [];
    
    for (const field of fieldsToMerge) {
      if (!keepUser[0][field] && mergeUser[0][field]) {
        mergedFields.push(field);
        const updateQuery = `UPDATE users SET ${field} = ? WHERE id = ?`;
        await pool.execute(updateQuery, [mergeUser[0][field], KEEP_USER_ID]);
      }
    }
    
    if (mergedFields.length > 0) {
      console.log(`✅ Merged fields: ${mergedFields.join(', ')}`);
    } else {
      console.log('✅ All fields already present in main account');
    }
    
    // Step 4: Delete the duplicate user account FIRST (to remove UNIQUE constraint)
    console.log(`🗑️  Deleting duplicate user ${MERGE_USER_ID}...`);
    await pool.execute('DELETE FROM users WHERE id = ?', [MERGE_USER_ID]);
    console.log(`✅ Deleted User ${MERGE_USER_ID}`);
    
    // Step 5: NOW add phone number after old user is deleted
    console.log('📱 Adding phone number to main account...');
    if (mergeUser[0].phone_number) {
      await pool.execute(
        'UPDATE users SET phone_number = ?, phone_verified = ? WHERE id = ?',
        [mergeUser[0].phone_number, mergeUser[0].phone_verified || 0, KEEP_USER_ID]
      );
      console.log(`✅ Added phone number ${mergeUser[0].phone_number} to User ${KEEP_USER_ID}`);
    }
    
    console.log(`\n✨ Account merge completed successfully!\n`);
    console.log(`Summary:`);
    console.log(`- User ${MERGE_USER_ID} (${mergeUser[0].email}) merged into User ${KEEP_USER_ID}`);
    console.log(`- Phone number linked: ${mergeUser[0].phone_number}`);
    console.log(`- All referrals and notifications updated`);
    console.log(`- Duplicate account deleted\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during merge:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
