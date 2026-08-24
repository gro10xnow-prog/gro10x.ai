-- =============================================================================
-- ⚡ GRO10X MIGRATION v2.7 — APP SETTINGS TABLE
-- Ensures resilient key-value configuration storage for spaces, workflows, and registries
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow Service Role and authenticated backend full access
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access AppSettings" ON public.app_settings FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- Seed default project spaces if not already present
INSERT INTO public.app_settings (key, value, updated_at)
VALUES (
  'project_spaces',
  '[
    {"id": "space-internal", "name": "Internal Agency", "type": "department", "icon": "🏢", "color": "#00df89"},
    {"id": "space-clients", "name": "Client Retainers", "type": "client", "icon": "⚡", "color": "#06b6d4"}
  ]'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;
