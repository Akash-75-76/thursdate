-- Migration: Add height field to users table
-- Date: 2026-03-29
-- Purpose: Store user's height in cm for matching

ALTER TABLE users 
ADD COLUMN height INT COMMENT 'User height in cm for matching';
