-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260824_v2.6_leads_missing_columns.sql
-- Description: Add missing columns to public.leads table to support web form
--              UTM attribution, lead scoring, and CRM client conversion.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS utm_source    VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS utm_medium    VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS utm_campaign  VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS score         INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS client_id     VARCHAR(20) REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();

-- Create index on score for priority lead filtering
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(score DESC);

-- Create index on client_id for CRM relational lookups
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON public.leads(client_id);
