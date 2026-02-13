// Seed test users with different locations for testing city-based matching
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./config/db');

const testUsers = [
  // Pune users
  {
    email: 'test.pune1@example.com',
    password: 'Test123!',
    firstName: 'Raj',
    lastName: 'Sharma',
    gender: 'Male',
    dob: '1988-05-15',
    currentLocation: 'Pune, Maharashtra, India',
    city: 'Pune',
    intent: {
      purpose: 'Date',
      relationshipVibe: 'Single',
      interestedGender: 'Women',
      preferredAgeRange: [30, 45]
    }
  },
  {
    email: 'test.pune2@example.com',
    password: 'Test123!',
    firstName: 'Priya',
    lastName: 'Patel',
    gender: 'Female',
    dob: '1990-08-22',
    currentLocation: 'Pune District, Maharashtra, India',
    city: 'Pune', // Should be normalized
    intent: {
      purpose: 'Seriously Date',
      relationshipVibe: 'Single',
      interestedGender: 'Men',
      preferredAgeRange: [32, 50]
    }
  },
  {
    email: 'test.pune3@example.com',
    password: 'Test123!',
    firstName: 'Amit',
    lastName: 'Joshi',
    gender: 'Male',
    dob: '1985-12-10',
    currentLocation: 'Pune, India',
    city: 'Pune',
    intent: {
      purpose: 'Marriage',
      relationshipVibe: 'Divorced',
      interestedGender: 'Women',
      preferredAgeRange: [35, 50]
    }
  },
  
  // Mumbai users
  {
    email: 'test.mumbai1@example.com',
    password: 'Test123!',
    firstName: 'Sanjay',
    lastName: 'Mehta',
    gender: 'Male',
    dob: '1987-03-18',
    currentLocation: 'Mumbai, Maharashtra, India',
    city: 'Mumbai',
    intent: {
      purpose: 'Date',
      relationshipVibe: 'Single',
      interestedGender: 'Women',
      preferredAgeRange: [30, 45]
    }
  },
  {
    email: 'test.mumbai2@example.com',
    password: 'Test123!',
    firstName: 'Sneha',
    lastName: 'Desai',
    gender: 'Female',
    dob: '1992-07-25',
    currentLocation: 'Mumbai City, Maharashtra, India',
    city: 'Mumbai', // Should be normalized
    intent: {
      purpose: 'Companionship',
      relationshipVibe: 'Single',
      interestedGender: 'Men',
      preferredAgeRange: [30, 45]
    }
  },
  
  // Delhi users
  {
    email: 'test.delhi1@example.com',
    password: 'Test123!',
    firstName: 'Vikram',
    lastName: 'Singh',
    gender: 'Male',
    dob: '1989-11-30',
    currentLocation: 'Delhi, India',
    city: 'Delhi',
    intent: {
      purpose: 'Seriously Date',
      relationshipVibe: 'Single',
      interestedGender: 'Women',
      preferredAgeRange: [32, 48]
    }
  },
  {
    email: 'test.delhi2@example.com',
    password: 'Test123!',
    firstName: 'Anjali',
    lastName: 'Kapoor',
    gender: 'Female',
    dob: '1991-04-12',
    currentLocation: 'New Delhi, Delhi, India',
    city: 'New Delhi',
    intent: {
      purpose: 'Date',
      relationshipVibe: 'Single',
      interestedGender: 'Men',
      preferredAgeRange: [33, 50]
    }
  },
  
  // Bangalore users
  {
    email: 'test.bangalore1@example.com',
    password: 'Test123!',
    firstName: 'Karthik',
    lastName: 'Rao',
    gender: 'Male',
    dob: '1986-09-05',
    currentLocation: 'Bangalore, Karnataka, India',
    city: 'Bangalore',
    intent: {
      purpose: 'Marriage',
      relationshipVibe: 'Divorced',
      interestedGender: 'Women',
      preferredAgeRange: [33, 48]
    }
  }
];

async function seedTestUsers() {
  try {
    console.log('🌱 Starting test user seeding...\n');
    
    let created = 0;
    let skipped = 0;
    
    for (const user of testUsers) {
      // Check if user already exists
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [user.email]
      );
      
      if (existing.length > 0) {
        console.log(`⏭️  Skipped: ${user.email} (already exists)`);
        skipped++;
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Insert user
      await pool.execute(
        `INSERT INTO users 
        (email, password, first_name, last_name, gender, dob, 
         current_location, city, location_preference, intent, 
         onboarding_complete, approval) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'same_city', ?, true, true)`,
        [
          user.email,
          hashedPassword,
          user.firstName,
          user.lastName,
          user.gender,
          user.dob,
          user.currentLocation,
          user.city,
          JSON.stringify(user.intent)
        ]
      );
      
      console.log(`✅ Created: ${user.firstName} ${user.lastName} (${user.city}) - ${user.email}`);
      created++;
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${created} users`);
    console.log(`   ⏭️  Skipped: ${skipped} users`);
    console.log(`\n🎉 Test users seeded successfully!`);
    console.log(`\n📝 Test credentials (all passwords: Test123!):`);
    console.log(`   Pune users: test.pune1@example.com, test.pune2@example.com, test.pune3@example.com`);
    console.log(`   Mumbai users: test.mumbai1@example.com, test.mumbai2@example.com`);
    console.log(`   Delhi users: test.delhi1@example.com, test.delhi2@example.com`);
    console.log(`   Bangalore users: test.bangalore1@example.com`);
    
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run seeding
seedTestUsers();
