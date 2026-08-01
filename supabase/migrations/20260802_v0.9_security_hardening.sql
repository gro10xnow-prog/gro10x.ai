-- ====================================================================
-- PurpleOS v0.9 Security Hardening Migration
-- Run this AFTER the v0.6 schema migration.
-- ====================================================================

-- ────────────────────────────────────────────────────────────────────
-- PART 1: Tighten Row Level Security (RLS)
-- Remove the permissive anon write policies from v0.6 init.
-- All server-side mutations now use SUPABASE_SERVICE_ROLE_KEY which
-- bypasses RLS entirely — these policies are no longer needed and
-- were a security risk (anyone with the anon key could mutate data).
-- ────────────────────────────────────────────────────────────────────

-- Drop the overly permissive anon write policies
DROP POLICY IF EXISTS "Allow anon insert/update/delete on profiles"       ON public.profiles;
DROP POLICY IF EXISTS "Allow anon insert/update/delete on clients"        ON public.clients;
DROP POLICY IF EXISTS "Allow anon insert/update/delete on services"       ON public.services;
DROP POLICY IF EXISTS "Allow anon insert/update/delete on tasks"          ON public.tasks;
DROP POLICY IF EXISTS "Allow anon insert/update/delete on reviews"        ON public.reviews;
DROP POLICY IF EXISTS "Allow anon insert/update/delete on review_comments" ON public.review_comments;
DROP POLICY IF EXISTS "Allow anon insert/update/delete on invoices"       ON public.invoices;
DROP POLICY IF EXISTS "Allow anon insert/update/delete on expenses"       ON public.expenses;
DROP POLICY IF EXISTS "Allow anon insert/update/delete on assets"         ON public.assets;
DROP POLICY IF EXISTS "Allow anon insert/update/delete on attendance"     ON public.attendance;

-- Drop the overly permissive anon SELECT policies (we'll replace with tighter ones)
DROP POLICY IF EXISTS "Allow public read access on profiles"              ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access on clients"               ON public.clients;
DROP POLICY IF EXISTS "Allow public read access on services"              ON public.services;
DROP POLICY IF EXISTS "Allow public read access on tasks"                 ON public.tasks;
DROP POLICY IF EXISTS "Allow public read access on reviews"               ON public.reviews;
DROP POLICY IF EXISTS "Allow public read access on review_comments"       ON public.review_comments;
DROP POLICY IF EXISTS "Allow public read access on invoices"              ON public.invoices;
DROP POLICY IF EXISTS "Allow public read access on expenses"              ON public.expenses;
DROP POLICY IF EXISTS "Allow public read access on assets"                ON public.assets;
DROP POLICY IF EXISTS "Allow public read access on attendance"            ON public.attendance;

-- ────────────────────────────────────────────────────────────────────
-- Replacement: Tight, purpose-scoped RLS policies
-- NOTE: Service role key bypasses ALL RLS — so server-side APIs are
-- unaffected. These policies control direct anon/dashboard access only.
-- ────────────────────────────────────────────────────────────────────

-- Services: public catalog — safe for anon read
CREATE POLICY "Public can read services catalog"
  ON public.services FOR SELECT USING (is_public = true);

-- Profiles: no anon access — only authenticated users via service role
-- (Server enforces auth before querying profiles)
-- No policy needed; no policy = blocked for anon

-- Clients: no anon access
-- Tasks: no anon access
-- Reviews: no anon access
-- Invoices: no anon access
-- Expenses: no anon access
-- Assets: no anon access
-- Attendance: no anon access

-- ────────────────────────────────────────────────────────────────────
-- PART 2: Add auth_pins Table for Supabase Persistence
-- Replaces the ephemeral /tmp/db.json PIN storage on Vercel.
-- PINs now survive cold starts and cross-region deployments.
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.auth_pins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(30) NOT NULL,
    norm_phone      VARCHAR(20) NOT NULL UNIQUE,  -- normalized last-10-digits for fast lookup
    pin             VARCHAR(10) NOT NULL,
    is_temp         BOOLEAN DEFAULT true,
    linked_id       VARCHAR(30),                  -- emp_code or client id
    linked_type     VARCHAR(10) DEFAULT 'team',   -- 'team' or 'client'
    email           VARCHAR(255) DEFAULT '',
    attempts        INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by normalized phone
CREATE INDEX IF NOT EXISTS idx_auth_pins_norm_phone ON public.auth_pins (norm_phone);

-- Enable RLS on auth_pins
ALTER TABLE public.auth_pins ENABLE ROW LEVEL SECURITY;

-- No anon access to auth_pins — service role only
-- (All pin reads/writes go through server API which uses service_role key)

-- ────────────────────────────────────────────────────────────────────
-- PART 3: Add missing columns to existing tables (v0.6 → v0.9 delta)
-- ────────────────────────────────────────────────────────────────────

-- Add access_level column to profiles if not exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_level VARCHAR(100) DEFAULT 'Specialist / Crew';

-- Add email column to profiles if not exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add permanent_pin_set flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS permanent_pin_set BOOLEAN DEFAULT false;

-- Add onboarding_complete flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- Add telegram_id to clients for automation notifications
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(50);

-- Add qc fields to tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS qc_approved_by VARCHAR(30);
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS qc_approved_at TIMESTAMPTZ;
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS qc_feedback TEXT;
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS qc_rejected_by VARCHAR(30);
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS qc_rejected_at TIMESTAMPTZ;

-- Add paid_date to invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS paid_date DATE;
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ────────────────────────────────────────────────────────────────────
-- PART 4: Leads, Quotes, Posts — new tables not in v0.6 schema
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leads (
    id              VARCHAR(20) PRIMARY KEY,
    company         VARCHAR(255),
    contact_person  VARCHAR(255),
    email           VARCHAR(255),
    phone           VARCHAR(30),
    whatsapp        VARCHAR(30),
    source          VARCHAR(100) DEFAULT 'Website',
    category        VARCHAR(100) DEFAULT 'General',
    service         VARCHAR(255),
    value           VARCHAR(50),
    stage           VARCHAR(50) DEFAULT 'New Inquiry',
    notes           TEXT,
    created_at      DATE DEFAULT CURRENT_DATE
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quotes (
    id              VARCHAR(30) PRIMARY KEY,
    client_name     VARCHAR(255),
    amount          NUMERIC(12,2) DEFAULT 0,
    tax_rate        NUMERIC(5,2) DEFAULT 15,
    discount        NUMERIC(12,2) DEFAULT 0,
    valid_until     DATE,
    status          VARCHAR(30) DEFAULT 'Draft',
    items           JSONB DEFAULT '[]'::jsonb,
    terms           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.social_posts (
    id              VARCHAR(20) PRIMARY KEY,
    client_id       VARCHAR(20) REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name     VARCHAR(255),
    caption         TEXT,
    platform        VARCHAR(50),
    status          VARCHAR(50) DEFAULT 'Draft',
    scheduled_date  DATE,
    media_url       TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────
-- PART 5: Auto-update updated_at trigger
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_auth_pins_updated_at
  BEFORE UPDATE ON public.auth_pins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
