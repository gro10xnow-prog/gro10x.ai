-- ============================================================
-- PurpleOS v0.6.1 — Customized Labels (Tags) Engine
-- Created: 2026-08-05
-- Adds: labels table, task_labels junction table, seed labels
-- ============================================================

-- 1. Create labels table
CREATE TABLE IF NOT EXISTS public.labels (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#3b82f6',
  project_id TEXT DEFAULT NULL, -- NULL = Global label
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create task_labels junction table
CREATE TABLE IF NOT EXISTS public.task_labels (
  task_id    TEXT NOT NULL,
  label_id   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON public.task_labels(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON public.task_labels(label_id);

-- 3. Seed standard default agency labels
INSERT INTO public.labels (id, name, color, project_id) VALUES
  ('lbl-urgent', 'Urgent', '#ef4444', NULL),
  ('lbl-bug', 'Bug', '#dc2626', NULL),
  ('lbl-design', 'Design', '#ec4899', NULL),
  ('lbl-copywriting', 'Copywriting', '#8b5cf6', NULL),
  ('lbl-client-review', 'Client Review', '#f59e0b', NULL),
  ('lbl-video-edit', 'Video Edit', '#3b82f6', NULL),
  ('lbl-approved', 'Approved', '#10b981', NULL)
ON CONFLICT (id) DO NOTHING;
