-- ============================================================
-- PurpleOS v0.6.4 — Custom Fields Engine Schema
-- Created: 2026-08-05
-- Adds: custom_fields table, task_custom_field_values table
-- ============================================================

-- 1. Create custom_fields table
CREATE TABLE IF NOT EXISTS public.custom_fields (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'number', 'dropdown', 'date'
  options    JSONB DEFAULT '[]'::jsonb,   -- dropdown options e.g. ["1080p", "4K"]
  project_id TEXT DEFAULT NULL,          -- NULL = Global field
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create task_custom_field_values table
CREATE TABLE IF NOT EXISTS public.task_custom_field_values (
  task_id    TEXT NOT NULL,
  field_id   TEXT NOT NULL,
  value      TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, field_id)
);

CREATE INDEX IF NOT EXISTS idx_task_cfv_task_id ON public.task_custom_field_values(task_id);

-- 3. Seed standard default custom fields
INSERT INTO public.custom_fields (id, name, field_type, options, project_id) VALUES
  ('cf-deliverable-url', 'Deliverable Link', 'text', '[]'::jsonb, NULL),
  ('cf-resolution', 'Video Resolution', 'dropdown', '["1080p Full HD", "4K UHD", "Vertical 9:16 Reel"]'::jsonb, NULL),
  ('cf-revision-round', 'Revision Round', 'number', '[]'::jsonb, NULL)
ON CONFLICT (id) DO NOTHING;
