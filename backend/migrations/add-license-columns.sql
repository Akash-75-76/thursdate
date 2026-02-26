-- Migration: add-license-columns.sql
-- Adds license_photos (JSON) and license_status (VARCHAR) to users table

ALTER TABLE users
  ADD COLUMN license_photos JSON NULL,
  ADD COLUMN license_status VARCHAR(32) DEFAULT 'none';
