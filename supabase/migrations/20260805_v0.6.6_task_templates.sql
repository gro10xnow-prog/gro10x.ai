-- ============================================================
-- PurpleOS v0.6.6 — Task Templates & Workflow Automations Schema
-- Created: 2026-08-05
-- Adds: task_templates table and default agency blueprints
-- ============================================================

-- 1. Create task_templates table
CREATE TABLE IF NOT EXISTS public.task_templates (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name            TEXT NOT NULL,
  department      TEXT NOT NULL DEFAULT 'Production',
  description     TEXT DEFAULT '',
  subtasks        JSONB DEFAULT '[]'::jsonb, -- Array of subtask titles e.g. ["Scripting", "Shoot", "Editing"]
  estimated_hours NUMERIC(5,2) DEFAULT 8.00,
  priority        TEXT DEFAULT 'Medium',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Seed standard agency workflow blueprints
INSERT INTO public.task_templates (id, name, department, description, subtasks, estimated_hours, priority) VALUES
  ('tmpl-reels', 'Social Media Reel Campaign', 'Production', 'Standard 10-Reels package workflow from concept to delivery', '["Creative Briefing & Scripting", "Studio / Field Shoot", "Rough Cut Edit", "Motion Graphics & Subtitles", "Color Grading & Master Cut", "Client Review Handoff"]'::jsonb, 12.00, 'High'),
  ('tmpl-branding', '360 Branding & Identity System', 'Design', 'Corporate branding identity assets & guidelines book', '["Brand Questionnaire", "Logo Vector Concepts", "Color Palette & Typography", "Brand Guidelines PDF", "Social Media POSM Assets"]'::jsonb, 20.00, 'Medium'),
  ('tmpl-tvc', 'TVC Commercial Production', 'Production', 'Cinema-grade video TVC production workflow', '["Storyboard & Script Lock", "Talent & Location Scouting", "Cinema 4K Shoot Day", "Audio Voiceover Recording", "VFX & Final Master Cut"]'::jsonb, 40.00, 'High')
ON CONFLICT (id) DO NOTHING;
