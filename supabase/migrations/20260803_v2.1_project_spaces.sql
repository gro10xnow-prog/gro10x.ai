-- ============================================================
-- PurpleOS v2.1 — ClickUp Spaces & Task Activity Log Schema
-- Created: 2026-08-03
-- Adds: spaces table
-- Alters: projects (space_id), tasks (activity_log)
-- ============================================================

-- 1. spaces table
CREATE TABLE IF NOT EXISTS public.spaces (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'client', -- 'client' or 'department'
  client_id   TEXT,
  color       TEXT        DEFAULT '#a855f7',
  icon        TEXT        DEFAULT '📁',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add space_id to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS space_id TEXT;

-- 3. Add activity_log to tasks table
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS activity_log JSONB DEFAULT '[]'::jsonb;
