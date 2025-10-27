// backend/set-password.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./config/db');

async function setPassword() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('\nUsage: node set-password.js <email> <new-password>\n');
    console.log('Example: node set-password.js arjundeshmukh26@gmail.com mynewpassword\n');
    process.exit(1);
  }
  
  const email = args[0];
  const newPassword = args[1];
  
  console.log(`\n🔐 Setting password for: ${email}\n`);
  
  try {
    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      console.log(`❌ User ${email} not found in database`);
      console.log('Creating new admin user...');
      
      // Create new user with admin privileges
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const [result] = await pool.execute(
        'INSERT INTO users (email, password, approval, onboarding_complete) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, true, true]
      );
      
      console.log(`✅ Created new admin user with ID: ${result.insertId}`);
      console.log('📧 Make sure this email is in ADMIN_EMAILS in .env file\n');
      
    } else {
      // Update existing user's password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.execute(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, email]
      );
      
      console.log(`✅ Password updated successfully for ${email}`);
    }
    
    // Check admin status
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
    if (adminEmails.includes(email.trim())) {
      console.log('✅ This user has admin privileges\n');
    } else {
      console.log(`⚠️  Warning: ${email} is NOT in ADMIN_EMAILS list`);
      console.log('Add it to your .env file:');
      console.log(`ADMIN_EMAILS=${email}\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

setPassword();

