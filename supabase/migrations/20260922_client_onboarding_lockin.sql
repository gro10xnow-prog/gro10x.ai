-- =============================================================================
-- ⚡ GRO10X AI GROWTH AGENCY — CLIENT ONBOARDING & PROJECT LOCK-IN SPECS (v3.5)
-- Migration: 20260922_client_onboarding_lockin.sql
-- Description: Enhances public.clients with firmographics and introduces
--              public.project_lockin_specs for zero-miscommunication sprint delivery.
-- =============================================================================

-- 1. ENHANCE CLIENTS TABLE (Non-breaking additive columns)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS legal_name     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS company_size   VARCHAR(50) DEFAULT '1-10 employees',
  ADD COLUMN IF NOT EXISTS country        VARCHAR(100) DEFAULT 'Bangladesh',
  ADD COLUMN IF NOT EXISTS timezone       VARCHAR(100) DEFAULT 'Asia/Dhaka (GMT+6)',
  ADD COLUMN IF NOT EXISTS website_url    VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_info   JSONB DEFAULT '{}'::jsonb;

-- 2. CREATE PROJECT_LOCKIN_SPECS TABLE
CREATE TABLE IF NOT EXISTS public.project_lockin_specs (
    id                          TEXT PRIMARY KEY,
    client_id                   VARCHAR(20) REFERENCES public.clients(id) ON DELETE CASCADE,
    proposal_id                 TEXT REFERENCES public.proposals(id) ON DELETE SET NULL,
    project_id                  TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
    canonical_service_code      VARCHAR(50) NOT NULL,
    service_title               TEXT NOT NULL,
    scope_boundaries            JSONB NOT NULL DEFAULT '{}'::jsonb,
    prerequisites_checklist     JSONB NOT NULL DEFAULT '[]'::jsonb,
    delivery_and_governance     JSONB NOT NULL DEFAULT '{}'::jsonb,
    milestone_schedule          JSONB NOT NULL DEFAULT '{}'::jsonb,
    status                      VARCHAR(50) DEFAULT 'LOCKED', -- DRAFT, LOCKED, PREREQUISITES_RECEIVED, SPRINT_ACTIVE, COMPLETED
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-speed relational access
CREATE INDEX IF NOT EXISTS idx_lockin_client_id ON public.project_lockin_specs(client_id);
CREATE INDEX IF NOT EXISTS idx_lockin_service_code ON public.project_lockin_specs(canonical_service_code);
CREATE INDEX IF NOT EXISTS idx_lockin_status ON public.project_lockin_specs(status);
CREATE INDEX IF NOT EXISTS idx_lockin_created_at ON public.project_lockin_specs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.project_lockin_specs ENABLE ROW LEVEL SECURITY;

-- Service Role Full Access Policy
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Lockin Specs" ON public.project_lockin_specs FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
