/*
# Support unidentified persons + CCTV image uploads

1. Modified Tables
- `violations`:
  - `citizen_id` changed to nullable (was NOT NULL) so fines can be issued to unidentified persons
  - Added `suspect_name` (text, nullable) — optional name for unidentified suspects
  - Added `suspect_face_descriptor` (jsonb, nullable) — face embedding captured at time of violation for unknown persons
  - Added `suspect_photo_url` (text, nullable) — photo of the unidentified suspect
  - Added `source` (text, not null, default 'camera') — 'camera' or 'cctv' to indicate where the image came from
  - `citizen_id` foreign key changed to SET NULL on delete (so deleting a citizen doesn't cascade-delete violation history)

2. Security
- No RLS policy changes needed — existing anon+authenticated CRUD policies already cover all columns.
- No new tables created.

3. Important Notes
- citizen_id is now nullable: violations can exist for unidentified persons.
- When a person is later registered, the system can match suspect_face_descriptor against new citizen registrations and link the violations.
- source column distinguishes between live camera captures and CCTV image uploads.
*/

-- Make citizen_id nullable so we can issue fines to unidentified persons
ALTER TABLE violations ALTER COLUMN citizen_id DROP NOT NULL;

-- Change FK to SET NULL so violation history survives citizen deletion
ALTER TABLE violations DROP CONSTRAINT IF EXISTS violations_citizen_id_fkey;
ALTER TABLE violations ADD CONSTRAINT violations_citizen_id_fkey
  FOREIGN KEY (citizen_id) REFERENCES citizens(id) ON DELETE SET NULL;

-- Add columns for unidentified suspect data
ALTER TABLE violations ADD COLUMN IF NOT EXISTS suspect_name text;
ALTER TABLE violations ADD COLUMN IF NOT EXISTS suspect_face_descriptor jsonb;
ALTER TABLE violations ADD COLUMN IF NOT EXISTS suspect_photo_url text;
ALTER TABLE violations ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'camera'
  CHECK (source IN ('camera', 'cctv'));

-- Index for finding unlinked violations when a new citizen registers
CREATE INDEX IF NOT EXISTS idx_violations_unlinked ON violations (citizen_id)
  WHERE citizen_id IS NULL;