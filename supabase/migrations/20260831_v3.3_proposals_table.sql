-- =============================================================================
-- ⚡ GRO10X AI GROWTH AGENCY — CLIENT PROPOSALS & QUOTATIONS SYSTEM (v3.3)
-- Run this in Supabase SQL Editor to provision the proposals table & policies
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.proposals (
    id                      TEXT PRIMARY KEY,
    share_token             TEXT UNIQUE NOT NULL,
    client_name             TEXT NOT NULL,
    client_company          TEXT,
    client_email            TEXT,
    client_phone            TEXT,
    project_title           TEXT NOT NULL,
    project_summary         TEXT,
    scope_items             JSONB DEFAULT '[]'::jsonb,
    one_time_items          JSONB DEFAULT '[]'::jsonb,
    recurring_items         JSONB DEFAULT '[]'::jsonb,
    one_time_total          NUMERIC(12,2) DEFAULT 0,
    recurring_total         NUMERIC(12,2) DEFAULT 0,
    currency                TEXT DEFAULT 'BDT',
    timeline                TEXT,
    valid_until             DATE,
    terms                   TEXT,
    notes                   TEXT,
    status                  TEXT DEFAULT 'Draft',
    created_by              TEXT DEFAULT 'GRO-001',
    view_count              INTEGER DEFAULT 0,
    viewed_at               TIMESTAMPTZ,
    accepted_at             TIMESTAMPTZ,
    converted_project_id    TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Index for instant token-based public routing
CREATE INDEX IF NOT EXISTS idx_proposals_share_token ON public.proposals(share_token);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals(created_at DESC);

-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Service Role Full Access Policy
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Proposals" ON public.proposals FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
