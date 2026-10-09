/*
# Municipal Enforcement Database Schema

1. New Tables
- `citizens` — registry of persons identified during enforcement
  - `id` (uuid, primary key)
  - `full_name` (text, not null) — person's full legal name
  - `aadhaar_number` (text, unique, nullable) — national ID (optional)
  - `phone` (text, nullable) — contact number
  - `address` (text, nullable) — residential address
  - `face_descriptor` (jsonb, not null) — 128-dim face embedding from face-api.js
  - `photo_url` (text, nullable) — stored photo data URL or storage path
  - `date_registered` (timestamptz, default now())
  - `created_at` (timestamptz, default now())

- `violations` — individual violation incidents
  - `id` (uuid, primary key)
  - `citizen_id` (uuid, foreign key to citizens, ON DELETE CASCADE)
  - `violation_type` (text, not null) — one of: 'garbage', 'spitting', 'littering'
  - `location` (text, nullable) — where the violation occurred
  - `description` (text, nullable) — officer notes
  - `fine_amount` (numeric, not null) — fine in rupees
  - `status` (text, not null, default 'pending') — 'pending', 'paid', 'disputed', 'waived'
  - `photo_url` (text, nullable) — evidence photo
  - `incident_date` (timestamptz, not null, default now())
  - `created_at` (timestamptz, default now())

2. Security
- RLS enabled on both tables.
- Single-tenant (no auth): policies allow anon + authenticated CRUD on both tables.
- This is a shared municipal enforcement tool, not per-user data.

3. Indexes
- Index on citizens.full_name for name searches.
- Index on violations.citizen_id for join performance.
- Index on violations.status for filtering.
- Index on violations.violation_type for filtering.
*/

CREATE TABLE IF NOT EXISTS citizens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  aadhaar_number text UNIQUE,
  phone text,
  address text,
  face_descriptor jsonb NOT NULL,
  photo_url text,
  date_registered timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id uuid NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  violation_type text NOT NULL CHECK (violation_type IN ('garbage', 'spitting', 'littering')),
  location text,
  description text,
  fine_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'disputed', 'waived')),
  photo_url text,
  incident_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

-- Citizens policies (single-tenant: anon + authenticated)
DROP POLICY IF EXISTS "anon_select_citizens" ON citizens;
CREATE POLICY "anon_select_citizens" ON citizens FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_citizens" ON citizens;
CREATE POLICY "anon_insert_citizens" ON citizens FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_citizens" ON citizens;
CREATE POLICY "anon_update_citizens" ON citizens FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_citizens" ON citizens;
CREATE POLICY "anon_delete_citizens" ON citizens FOR DELETE
  TO anon, authenticated USING (true);

-- Violations policies (single-tenant: anon + authenticated)
DROP POLICY IF EXISTS "anon_select_violations" ON violations;
CREATE POLICY "anon_select_violations" ON violations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_violations" ON violations;
CREATE POLICY "anon_insert_violations" ON violations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_violations" ON violations;
CREATE POLICY "anon_update_violations" ON violations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_violations" ON violations;
CREATE POLICY "anon_delete_violations" ON violations FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_citizens_full_name ON citizens (full_name);
CREATE INDEX IF NOT EXISTS idx_violations_citizen_id ON violations (citizen_id);
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations (status);
CREATE INDEX IF NOT EXISTS idx_violations_type ON violations (violation_type);