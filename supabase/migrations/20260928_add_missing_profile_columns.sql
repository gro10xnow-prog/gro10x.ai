-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase Schema Migration: Add Extended Profile & HR Columns to profiles table
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10),
  ADD COLUMN IF NOT EXISTS personal_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100),
  ADD COLUMN IF NOT EXISTS emergency_relation VARCHAR(50),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS permanent_address TEXT,
  ADD COLUMN IF NOT EXISTS nid_no VARCHAR(50),
  ADD COLUMN IF NOT EXISTS primary_skill VARCHAR(100),
  ADD COLUMN IF NOT EXISTS secondary_skill TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS tshirt_size VARCHAR(10),
  ADD COLUMN IF NOT EXISTS dietary_pref VARCHAR(50),
  ADD COLUMN IF NOT EXISTS laptop_serial VARCHAR(100),
  ADD COLUMN IF NOT EXISTS studio_gear TEXT,
  ADD COLUMN IF NOT EXISTS tin_no VARCHAR(50),
  ADD COLUMN IF NOT EXISTS driving_license VARCHAR(50),
  ADD COLUMN IF NOT EXISTS education_degree VARCHAR(100),
  ADD COLUMN IF NOT EXISTS institution VARCHAR(150),
  ADD COLUMN IF NOT EXISTS passing_year VARCHAR(10),
  ADD COLUMN IF NOT EXISTS marital_status VARCHAR(30),
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS joining_date DATE,
  ADD COLUMN IF NOT EXISTS reports_to VARCHAR(50),
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_emp_code ON public.profiles(emp_code);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Ensure auth_pins norm_phone has unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_pins_norm_phone_unique ON public.auth_pins(norm_phone);
