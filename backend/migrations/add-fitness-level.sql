-- Migration: Add fitness level field to users table
-- Date: 2026-03-29
-- Purpose: Store user's fitness level from onboarding Step 10

-- Add fitness level column for fitness matching
ALTER TABLE users 
ADD COLUMN fitness_level VARCHAR(50) COMMENT 'User fitness level: Easygoing, Lightly active, Active lifestyle, Very active, Fitness focused';
