/*
# Add fine deadlines + escalation tracking

1. Modified Tables
- `violations`:
  - Added `due_date` (timestamptz, nullable) — deadline for payment, set when fine is issued
  - Added `escalation_level` (int, not null, default 0) — 0=pending within deadline, 1=first reminder, 2=formal notice, 3=legal action
  - Added `escalated_at` (timestamptz, nullable) — when the last escalation was applied
  - Added `cctv_camera_name` (text, nullable) — name/label of the CCTV camera if source is cctv

2. Security
- No RLS policy changes — existing anon+authenticated CRUD policies cover all columns.

3. Important Notes
- due_date is nullable so existing violations without deadlines are unaffected.
- escalation_level starts at 0 and increases as overdue fines are escalated.
- The app calculates overdue status by comparing due_date to current time.
*/

ALTER TABLE violations ADD COLUMN IF NOT EXISTS due_date timestamptz;
ALTER TABLE violations ADD COLUMN IF NOT EXISTS escalation_level int NOT NULL DEFAULT 0
  CHECK (escalation_level BETWEEN 0 AND 3);
ALTER TABLE violations ADD COLUMN IF NOT EXISTS escalated_at timestamptz;
ALTER TABLE violations ADD COLUMN IF NOT EXISTS cctv_camera_name text;

CREATE INDEX IF NOT EXISTS idx_violations_due_date ON violations (due_date)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_violations_escalation ON violations (escalation_level)
  WHERE escalation_level > 0;