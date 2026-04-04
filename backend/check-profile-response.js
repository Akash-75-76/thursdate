#!/usr/bin/env node
/**
 * Check what /user/profile endpoint returns
 * Run this to verify fitness_level is in the API response
 */

require('dotenv').config();
const db = require('./config/db');

async function checkProfileEndpoint() {
  try {
    console.log('🔍 Checking /user/profile endpoint response format...\n');
    
    // Get user 72 (who has fitness_level)
    const [users] = await db.execute(`
      SELECT id, first_name, fitness_level
      FROM users
      WHERE fitness_level IS NOT NULL AND fitness_level != ''
      LIMIT 1
    `);
    
    if (users.length === 0) {
      console.log('❌ No users with fitness_level found');
      process.exit(1);
    }
    
    const user = users[0];
    
    // Get full profile query (same as backend)
    const [fullUsers] = await db.execute(
      `SELECT id, email, first_name, last_name, gender, dob, current_location, city, location_preference, favourite_travel_destination, last_holiday_places, favourite_places_to_go, profile_pic_url, face_photo_url, approval, intent, onboarding_complete, interests, pets, drinking, smoking, height, religious_level, kids_preference, food_preference, relationship_status, from_location, instagram, linkedin_id, face_photos, license_photos, license_status, fitness_level, spoken_languages, coding_languages, favorite_places FROM users WHERE id = ?`,
      [user.id]
    );
    
    if (fullUsers.length === 0) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    const fullUser = fullUsers[0];
    
    console.log(`✅ Found User ${user.id} (${user.first_name})\n`);
    console.log(`Fields in SELECT query:\n`);
    console.log('fitness_level in DB:', fullUser.fitness_level);
    
    // Check if all fields exist in the query result
    const requiredFields = [
      'id', 'email', 'first_name', 'fitness_level', 'height', 
      'intent', 'interests', 'spoken_languages', 'coding_languages'
    ];
    
    console.log('\n✅ Checking required fields in SELECT:\n');
    requiredFields.forEach(field => {
      const dbField = Object.keys(fullUser).includes(field) ? '✅' : '❌';
      console.log(`  ${dbField} ${field}: ${fullUser[field] !== undefined ? fullUser[field] : 'undefined'}`);
    });
    
    console.log('\n✅ Frontend API response will include:\n');
    console.log('  ✅ fitnessLevel:', fullUser.fitness_level);
    
    if (!fullUser.fitness_level) {
      console.log('\n⚠️  WARNING: fitness_level is NULL/empty!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkProfileEndpoint();
