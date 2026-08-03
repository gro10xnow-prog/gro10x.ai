-- ============================================================
-- PurpleOS v2.0 — ClickUp-style Task Hierarchy & Workflows
-- Created: 2026-08-02
-- Adds: projects, subtasks, project_workflows tables
-- Alters: tasks (project_id, parent_task_id, custom_status, status_category, estimated_hours, logged_hours)
-- ============================================================

-- 1. projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id    TEXT,
  client_name  TEXT        NOT NULL DEFAULT 'Agency',
  name         TEXT        NOT NULL,
  description  TEXT        DEFAULT '',
  department   TEXT        NOT NULL DEFAULT 'Production',
  workflow_type TEXT       NOT NULL DEFAULT 'video_production',
  status       TEXT        NOT NULL DEFAULT 'Active',
  start_date   DATE,
  due_date     DATE,
  budget       NUMERIC(12,2) DEFAULT 0.00,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. subtasks table
CREATE TABLE IF NOT EXISTS public.subtasks (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id      TEXT        NOT NULL,
  title        TEXT        NOT NULL,
  assignee     TEXT,
  completed    BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks (task_id);

-- 3. project_workflows table
CREATE TABLE IF NOT EXISTS public.project_workflows (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workflow_name TEXT        NOT NULL,
  department    TEXT        NOT NULL,
  stages        JSONB       NOT NULL DEFAULT '[
    {"name": "To Do", "category": "open", "color": "#94a3b8"},
    {"name": "In Progress", "category": "in_progress", "color": "#3b82f6"},
    {"name": "Internal Review", "category": "review", "color": "#a855f7"},
    {"name": "Client Review", "category": "review", "color": "#f59e0b"},
    {"name": "Approved", "category": "completed", "color": "#10b981"}
  ]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Alter tasks table for hierarchy & flexible status
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS project_id TEXT,
  ADD COLUMN IF NOT EXISTS parent_task_id TEXT,
  ADD COLUMN IF NOT EXISTS custom_status TEXT DEFAULT 'To Do',
  ADD COLUMN IF NOT EXISTS status_category TEXT DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(6,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS logged_hours NUMERIC(6,2) DEFAULT 0.00;
