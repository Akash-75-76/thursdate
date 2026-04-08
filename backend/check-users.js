const db = require('./config/db');

(async () => {
  try {
    // Check users table schema
    const [schema] = await db.execute('DESCRIBE users');
    console.log('=== USERS TABLE SCHEMA ===');
    schema.forEach(col => {
      console.log(`${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}) Key: ${col.Key || 'NONE'}`);
    });
    
    // Check for duplicate phone numbers
    console.log('\n=== CHECKING FOR DUPLICATE PHONE NUMBERS ===');
    const [dups] = await db.execute(
      'SELECT phone_number, COUNT(*) as count FROM users WHERE phone_number IS NOT NULL GROUP BY phone_number HAVING count > 1'
    );
    if (dups.length > 0) {
      console.log('Found duplicates:', dups);
    } else {
      console.log('No duplicate phone numbers');
    }
    
    // Check for duplicate emails
    console.log('\n=== CHECKING FOR DUPLICATE EMAILS ===');
    const [emailDups] = await db.execute(
      'SELECT email, COUNT(*) as count FROM users GROUP BY email HAVING count > 1'
    );
    if (emailDups.length > 0) {
      console.log('Found duplicates:', emailDups);
    } else {
      console.log('No duplicate emails');
    }
    
    // Show user records with phone/email
    console.log('\n=== ALL USERS (id, email, phone_number) ===');
    const [users] = await db.execute(
      'SELECT id, email, phone_number FROM users ORDER BY id DESC'
    );
    users.forEach(u => {
      console.log(`ID: ${u.id}, Email: ${u.email}, Phone: ${u.phone_number}`);
    });
    
    process.exit(0);
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
