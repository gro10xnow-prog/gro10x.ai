-- ============================================================
-- PurpleOS v2.2 — Social Media Planner & Approval Flow Schema
-- Created: 2026-08-03
-- Alters: posts table (approval_stage, client_approved, feedback)
-- ============================================================

ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS approval_stage TEXT DEFAULT 'Draft',
  ADD COLUMN IF NOT EXISTS client_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_feedback TEXT,
  ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'Facebook';
