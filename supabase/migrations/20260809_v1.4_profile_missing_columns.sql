-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase Schema Migration: v1.4 (Sprint D Production Hardening)
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add missing survey fields to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS marital_status VARCHAR(30),
  ADD COLUMN IF NOT EXISTS dependents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 2. Ensure task assignee_id column and index exist
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS assignee_id TEXT;

CREATE INDEX IF NOT EXISTS tasks_assignee_id_idx ON tasks(assignee_id);

-- 3. SQL helper function for atomic XP increments
CREATE OR REPLACE FUNCTION increment_xp(p_emp_code text, xp_amount int)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET xp = COALESCE(xp, 0) + xp_amount
  WHERE emp_code = p_emp_code OR id::text = p_emp_code;
END;
$$ LANGUAGE plpgsql;
