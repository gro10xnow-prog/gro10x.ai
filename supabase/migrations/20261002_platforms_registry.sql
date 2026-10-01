-- ============================================================================
-- 20261002_platforms_registry.sql
-- Sub-Phase 5.4: Platforms Module Live DB Registry
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platforms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  badge TEXT NOT NULL,
  engine_id INTEGER DEFAULT 1,
  tagline TEXT,
  stage TEXT DEFAULT 'MVP',
  stage_type TEXT DEFAULT 'mvp',
  readiness INTEGER DEFAULT 50,
  stack TEXT,
  db_schema TEXT,
  ai_stack TEXT,
  auth_payments TEXT,
  infrastructure TEXT,
  target_market TEXT,
  revenue_model TEXT,
  live_url TEXT,
  repo TEXT,
  next_action TEXT,
  icon TEXT DEFAULT '🚀',
  is_owned BOOLEAN DEFAULT true,
  key_modules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row-Level Security
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read platforms"
  ON public.platforms
  FOR SELECT
  TO public
  USING (true);

-- Authenticated Admin/Manager write access
CREATE POLICY "Admin manage platforms"
  ON public.platforms
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
