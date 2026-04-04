#!/usr/bin/env node
/**
 * Check fitness_level data coverage
 */

require('dotenv').config();
const db = require('./config/db');

async function checkCoverage() {
  try {
    console.log('📊 Checking fitness_level data coverage...\n');
    
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) total_users,
        SUM(CASE WHEN fitness_level IS NOT NULL AND fitness_level != '' THEN 1 ELSE 0 END) with_fitness_level,
        SUM(CASE WHEN fitness_level IS NULL OR fitness_level = '' THEN 1 ELSE 0 END) without_fitness_level
      FROM users
      WHERE approval = true AND onboarding_complete = true
    `);
    
    const stat = stats[0];
    const percentage = stat.total_users > 0 ? Math.round((stat.with_fitness_level / stat.total_users) * 100) : 0;
    
    console.log(`Total approved users: ${stat.total_users}`);
    console.log(`With fitness_level: ${stat.with_fitness_level} (${percentage}%)`);
    console.log(`Missing fitness_level: ${stat.without_fitness_level}\n`);
    
    // Sample users without fitness_level
    if (stat.without_fitness_level > 0) {
      console.log('Sample users missing fitness_level:');
      const [samples] = await db.execute(`
        SELECT id, first_name, created_at, onboarding_complete
        FROM users
        WHERE (fitness_level IS NULL OR fitness_level = '')
        AND approval = true
        LIMIT 5
      `);
      
      samples.forEach(user => {
        console.log(`  • User ${user.id} (${user.first_name}): created ${user.created_at}`);
      });
    }
    
    // Sample users with fitness_level
    const [withFitness] = await db.execute(`
      SELECT id, first_name, fitness_level
      FROM users
      WHERE fitness_level IS NOT NULL AND fitness_level != ''
      AND approval = true
      LIMIT 5
    `);
    
    console.log('\nSample users WITH fitness_level:');
    withFitness.forEach(user => {
      console.log(`  • User ${user.id} (${user.first_name}): ${user.fitness_level}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCoverage();
