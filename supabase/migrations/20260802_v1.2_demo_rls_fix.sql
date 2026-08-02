-- ═══════════════════════════════════════════════════════════════════════════
-- PurpleOS Migration: v1.2 Demo Fix — RLS Disable + Profile Columns
-- Run this in Supabase SQL Editor → https://app.supabase.com
-- ═══════════════════════════════════════════════════════════════════════════

-- STEP 1: Disable RLS on all tables so the server-side anon key can write.
-- The server manages access control at the API layer, not at DB level.
ALTER TABLE public.profiles       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_pins      DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop any residual blocking policies
DROP POLICY IF EXISTS "Public can read services catalog" ON public.services;

-- STEP 3: Add missing columns to profiles needed by the bot and mini app
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_level       VARCHAR(100) DEFAULT 'Specialist / Crew',
  ADD COLUMN IF NOT EXISTS badge              VARCHAR(100) DEFAULT '🌱 Recruit',
  ADD COLUMN IF NOT EXISTS xp                INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reports_to        VARCHAR(20);

-- STEP 4: Add a fast index on telegram_id for mini app auth
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_telegram_id
  ON public.profiles(telegram_id)
  WHERE telegram_id IS NOT NULL;

-- STEP 5: Add a fast index on phone for bot verification
CREATE INDEX IF NOT EXISTS idx_profiles_phone
  ON public.profiles(phone);

-- STEP 6: Also add bot_sessions table for multi-step wizard state persistence
CREATE TABLE IF NOT EXISTS public.bot_sessions (
    chat_id    TEXT PRIMARY KEY,
    state      JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Done. Run node scripts/demo-seed-supabase.js after applying this migration.
