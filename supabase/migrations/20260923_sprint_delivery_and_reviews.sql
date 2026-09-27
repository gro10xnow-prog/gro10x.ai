-- =============================================================================
-- ⚡ GRO10X AI GROWTH AGENCY — SPRINT DELIVERY & REVIEW ROOM 2.0 (v4.5)
-- Migration: 20260923_sprint_delivery_and_reviews.sql
-- Description: Non-breaking schema extensions for projects, reviews, and comments
--              enabling Engine 2 multi-format deliverables, stakeholder matrix,
--              scope creep shield, and 30-day warranty tracking.
-- =============================================================================

-- 1. EXTEND PROJECTS TABLE
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS stakeholders       JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS lockin_spec_id     TEXT,
  ADD COLUMN IF NOT EXISTS warranty_until     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_status    VARCHAR(50) DEFAULT 'IN_PROGRESS';

-- 2. EXTEND REVIEWS TABLE (Multi-Format AI Deliverables & DoD)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS deliverable_type   VARCHAR(50) DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS staging_url        TEXT,
  ADD COLUMN IF NOT EXISTS repo_url           TEXT,
  ADD COLUMN IF NOT EXISTS branch_name        TEXT,
  ADD COLUMN IF NOT EXISTS api_docs_url       TEXT,
  ADD COLUMN IF NOT EXISTS revision_round     INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_revisions      INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS dod_checklist      JSONB DEFAULT '[]'::jsonb;

-- 3. EXTEND REVIEW_COMMENTS TABLE (Threaded Scope Classification)
ALTER TABLE public.review_comments
  ADD COLUMN IF NOT EXISTS comment_type       VARCHAR(50) DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS scope_flag         VARCHAR(50) DEFAULT 'IN_SCOPE',
  ADD COLUMN IF NOT EXISTS author_poc_id      TEXT,
  ADD COLUMN IF NOT EXISTS assigned_team_member TEXT;

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_projects_lockin_spec ON public.projects(lockin_spec_id);
CREATE INDEX IF NOT EXISTS idx_reviews_deliverable_type ON public.reviews(deliverable_type);
CREATE INDEX IF NOT EXISTS idx_review_comments_scope ON public.review_comments(scope_flag);
