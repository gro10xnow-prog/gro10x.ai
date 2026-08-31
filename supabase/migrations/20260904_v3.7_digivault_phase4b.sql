-- ============================================================================
-- Migration: 20260904_v3.7_digivault_phase4b.sql
-- Description: DigiVault Phase 4B — Telegram Bot Persistent Sessions
-- ============================================================================

-- 1. Create digi_bot_sessions table
CREATE TABLE IF NOT EXISTS public.digi_bot_sessions (
  chat_id      TEXT PRIMARY KEY,
  lang         TEXT DEFAULT 'bn',
  step         TEXT DEFAULT 'idle',
  session_data JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_digi_bot_sessions_step ON public.digi_bot_sessions(step);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.digi_bot_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Service role full access policy
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_digi_bot_sessions') THEN
    CREATE POLICY service_role_all_digi_bot_sessions ON public.digi_bot_sessions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
