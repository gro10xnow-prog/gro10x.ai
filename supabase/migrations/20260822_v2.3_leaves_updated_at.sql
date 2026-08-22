-- ─────────────────────────────────────────────────────────────────────────────
-- 20260822_v2.3_leaves_updated_at.sql
-- Adds updated_at column to leaves table for HR audit compliance & tracking.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaves' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE leaves ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Enable moddatetime extension if not already enabled
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- Create or replace trigger to auto-update updated_at on change
DROP TRIGGER IF EXISTS set_leaves_updated_at ON leaves;
CREATE TRIGGER set_leaves_updated_at
  BEFORE UPDATE ON leaves
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime('updated_at');
