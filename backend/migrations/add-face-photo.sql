-- Add face_photo_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS face_photo_url VARCHAR(500);

-- Add index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_face_photo ON users(face_photo_url);
