-- ═══════════════════════════════════════════════════════════════════════════
-- PurpleOS Migration: v1.3 — Bot State Columns + Missing Tables
-- Run this in Supabase SQL Editor → https://app.supabase.com
-- This is Phase 1 of the db.json → Supabase architecture migration.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- PART 1: Extend `profiles` table with all bot + survey state columns
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  -- Onboarding survey state
  ADD COLUMN IF NOT EXISTS survey_complete        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS survey_part1_done      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS survey_part2_done      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS survey_part3_done      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS survey_part4_done      BOOLEAN DEFAULT FALSE,

  -- Employment agreement
  ADD COLUMN IF NOT EXISTS agreement_stage        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employee_signature     TEXT,
  ADD COLUMN IF NOT EXISTS agreement_signed_at    TIMESTAMPTZ,

  -- Personal details (filled in survey Part 1)
  ADD COLUMN IF NOT EXISTS personal_email         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS emergency_contact      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS emergency_relation     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS address                TEXT,
  ADD COLUMN IF NOT EXISTS blood_group            VARCHAR(10),
  ADD COLUMN IF NOT EXISTS date_of_birth          DATE,
  ADD COLUMN IF NOT EXISTS joining_date           DATE,

  -- Verification docs (survey Part 2)
  ADD COLUMN IF NOT EXISTS nid_no                 VARCHAR(50),
  ADD COLUMN IF NOT EXISTS permanent_address      TEXT,
  ADD COLUMN IF NOT EXISTS ein_tin                VARCHAR(50),
  ADD COLUMN IF NOT EXISTS nid_url                TEXT,
  ADD COLUMN IF NOT EXISTS education_cert_url     TEXT,

  -- Financial / payroll (survey Part 3)
  ADD COLUMN IF NOT EXISTS bank_info              JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS bank_statement_url     TEXT,

  -- Skills & equipment (survey Part 4)
  ADD COLUMN IF NOT EXISTS primary_skill          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS secondary_skills       TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url          TEXT,
  ADD COLUMN IF NOT EXISTS equipment_info         TEXT,
  ADD COLUMN IF NOT EXISTS tshirt_size            VARCHAR(5),

  -- Runtime bot state (replaces db.json reads)
  ADD COLUMN IF NOT EXISTS last_seen_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reports_to             VARCHAR(20);

-- Fast index: bot lookups employee by phone number
CREATE INDEX IF NOT EXISTS idx_profiles_phone
  ON public.profiles(phone);

-- Fast index: bot + mini app look up by telegram_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_telegram_id
  ON public.profiles(telegram_id)
  WHERE telegram_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- PART 2: Extend `attendance` table with clock-out and duration
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS clock_out_time         VARCHAR(20),
  ADD COLUMN IF NOT EXISTS work_hours             NUMERIC(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes                  TEXT;

-- Unique constraint: one attendance record per employee per day
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'attendance_employee_date_unique'
  ) THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_employee_date_unique
      UNIQUE (employee_id, date);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- PART 3: Create `eod_reports` table (bot EOD wizard submissions)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.eod_reports (
  id              VARCHAR(30) PRIMARY KEY,
  employee_id     VARCHAR(20) NOT NULL,
  employee_name   VARCHAR(255) NOT NULL,
  report_date     DATE DEFAULT CURRENT_DATE,

  -- Wizard answers
  tasks_done      TEXT,           -- What tasks did you complete today?
  tasks_tomorrow  TEXT,           -- What will you do tomorrow?
  blockers        TEXT,           -- Any blockers or issues?
  mood            VARCHAR(20),    -- emoji mood: 😊 Energized | 😐 Neutral | 😓 Tired | 🔥 Hustling
  hours_worked    NUMERIC(4,2) DEFAULT 0,
  overtime        BOOLEAN DEFAULT FALSE,

  -- Metadata
  submitted_via   VARCHAR(20) DEFAULT 'telegram_bot',
  reviewed        BOOLEAN DEFAULT FALSE,
  reviewed_by     VARCHAR(255),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- One EOD per employee per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_eod_employee_date
  ON public.eod_reports(employee_id, report_date);

-- Fast lookup for manager dashboard
CREATE INDEX IF NOT EXISTS idx_eod_date
  ON public.eod_reports(report_date DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- PART 4: Create `bot_sessions` table (multi-step wizard state)
-- Replaces in-memory `userState` which is lost on Vercel cold start
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.bot_sessions (
  chat_id         TEXT PRIMARY KEY,
  state           JSONB DEFAULT '{}'::jsonb,   -- current wizard step + answers
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-clean sessions older than 24h (prevents table bloat)
-- Note: run this once to set up; Supabase cron can call it periodically
CREATE OR REPLACE FUNCTION public.cleanup_old_bot_sessions()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM public.bot_sessions
  WHERE updated_at < NOW() - INTERVAL '24 hours';
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- PART 5: Extend `leaves` table with missing fields the bot sends
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.leaves
  ADD COLUMN IF NOT EXISTS total_days     INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS submitted_via  VARCHAR(20) DEFAULT 'telegram_bot',
  ADD COLUMN IF NOT EXISTS reviewed_at    TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────
-- PART 6: Extend `expenses` table with bot submission fields
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS submitted_via  VARCHAR(20) DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS currency       VARCHAR(5) DEFAULT 'BDT';

-- ─────────────────────────────────────────────────────────────────────────
-- PART 7: Seed profiles with access_level from db.json mapping
-- Maps emp_code → access_level for the 33 existing profiles
-- ─────────────────────────────────────────────────────────────────────────

UPDATE public.profiles SET access_level = 'Owner / Admin'             WHERE emp_code IN ('PBD-000', 'PBD-001', 'PBD-002');
UPDATE public.profiles SET access_level = 'Director / Manager'        WHERE emp_code IN ('PBD-003', 'PBD-004', 'PBD-005', 'PBD-016');
UPDATE public.profiles SET access_level = 'Art Director'              WHERE emp_code IN ('PBD-006');
UPDATE public.profiles SET access_level = 'Specialist / Crew'         WHERE emp_code NOT IN ('PBD-000','PBD-001','PBD-002','PBD-003','PBD-004','PBD-005','PBD-006','PBD-016');

-- Set Firoz as onboarding complete (presenter / tech admin)
UPDATE public.profiles SET onboarding_complete = TRUE WHERE emp_code = 'PBD-000';

-- ─────────────────────────────────────────────────────────────────────────
-- DONE — Phase 1 complete.
-- Next step: Run node scripts/seed-v1.3.js to backfill phone numbers & XP.
-- ─────────────────────────────────────────────────────────────────────────
