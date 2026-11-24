/*
# Create Root Cause Analysis (RCA) Investigation Schema

## Overview
This migration creates the database schema for an AI-powered Root Cause Analysis (RCA) module
used by a pharmaceutical API manufacturer. It supports the full quality workflow:
Deviation Identification -> Root Cause Analysis (RCA) -> Corrective and Preventive Actions (CAPA).

## New Tables
1. investigations — top-level RCA investigation record (deviation info, source, status)
2. five_whys — 5 Whys analysis steps linked to an investigation
3. fishbone_categories — Fishbone (Ishikawa) analysis branches with causes
4. root_causes — identified root causes with confidence and confirmation
5. evidence_gaps — missing evidence / information gaps
6. capas — corrective and preventive actions

## Security
- Single-tenant application (no sign-in). RLS enabled on all tables.
- CRUD policies granted to anon, authenticated. USING(true) acceptable as data is intentionally shared.
*/

CREATE TABLE IF NOT EXISTS investigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  deviation_number text UNIQUE,
  product_name text DEFAULT '',
  batch_number text DEFAULT '',
  deviation_date date,
  deviation_description text DEFAULT '',
  deviation_category text DEFAULT '',
  severity text DEFAULT 'Minor',
  process_step text DEFAULT '',
  equipment_involved text DEFAULT '',
  material_impact text DEFAULT '',
  initial_risk_assessment text DEFAULT '',
  investigation_method text DEFAULT '5 Whys',
  status text NOT NULL DEFAULT 'draft',
  source_type text DEFAULT 'text',
  source_content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON investigations TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_investigations" ON investigations;
CREATE POLICY "anon_select_investigations" ON investigations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_investigations" ON investigations;
CREATE POLICY "anon_insert_investigations" ON investigations FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_investigations" ON investigations;
CREATE POLICY "anon_update_investigations" ON investigations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_investigations" ON investigations;
CREATE POLICY "anon_delete_investigations" ON investigations FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS five_whys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  step_number int NOT NULL,
  question text DEFAULT '',
  answer text DEFAULT '',
  is_root_cause boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE five_whys ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON five_whys TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_five_whys" ON five_whys;
CREATE POLICY "anon_select_five_whys" ON five_whys FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_five_whys" ON five_whys;
CREATE POLICY "anon_insert_five_whys" ON five_whys FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_five_whys" ON five_whys;
CREATE POLICY "anon_update_five_whys" ON five_whys FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_five_whys" ON five_whys;
CREATE POLICY "anon_delete_five_whys" ON five_whys FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS fishbone_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  category text NOT NULL,
  causes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fishbone_categories ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON fishbone_categories TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_fishbone" ON fishbone_categories;
CREATE POLICY "anon_select_fishbone" ON fishbone_categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_fishbone" ON fishbone_categories;
CREATE POLICY "anon_insert_fishbone" ON fishbone_categories FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_fishbone" ON fishbone_categories;
CREATE POLICY "anon_update_fishbone" ON fishbone_categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_fishbone" ON fishbone_categories;
CREATE POLICY "anon_delete_fishbone" ON fishbone_categories FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS root_causes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  category text DEFAULT '',
  contributing_factors jsonb DEFAULT '[]'::jsonb,
  confidence text DEFAULT 'Medium',
  evidence_summary text DEFAULT '',
  confirmed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE root_causes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON root_causes TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_root_causes" ON root_causes;
CREATE POLICY "anon_select_root_causes" ON root_causes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_root_causes" ON root_causes;
CREATE POLICY "anon_insert_root_causes" ON root_causes FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_root_causes" ON root_causes;
CREATE POLICY "anon_update_root_causes" ON root_causes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_root_causes" ON root_causes;
CREATE POLICY "anon_delete_root_causes" ON root_causes FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS evidence_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  significance text DEFAULT 'Medium',
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE evidence_gaps ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_gaps TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_evidence_gaps" ON evidence_gaps;
CREATE POLICY "anon_select_evidence_gaps" ON evidence_gaps FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_evidence_gaps" ON evidence_gaps;
CREATE POLICY "anon_insert_evidence_gaps" ON evidence_gaps FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_evidence_gaps" ON evidence_gaps;
CREATE POLICY "anon_update_evidence_gaps" ON evidence_gaps FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_evidence_gaps" ON evidence_gaps;
CREATE POLICY "anon_delete_evidence_gaps" ON evidence_gaps FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS capas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'corrective',
  description text NOT NULL DEFAULT '',
  rationale text DEFAULT '',
  owner text DEFAULT '',
  target_date date,
  status text DEFAULT 'proposed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE capas ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON capas TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_capas" ON capas;
CREATE POLICY "anon_select_capas" ON capas FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_capas" ON capas;
CREATE POLICY "anon_insert_capas" ON capas FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_capas" ON capas;
CREATE POLICY "anon_update_capas" ON capas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_capas" ON capas;
CREATE POLICY "anon_delete_capas" ON capas FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status);
CREATE INDEX IF NOT EXISTS idx_investigations_created_at ON investigations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_five_whys_investigation ON five_whys(investigation_id);
CREATE INDEX IF NOT EXISTS idx_fishbone_investigation ON fishbone_categories(investigation_id);
CREATE INDEX IF NOT EXISTS idx_root_causes_investigation ON root_causes(investigation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_gaps_investigation ON evidence_gaps(investigation_id);
CREATE INDEX IF NOT EXISTS idx_capas_investigation ON capas(investigation_id);
