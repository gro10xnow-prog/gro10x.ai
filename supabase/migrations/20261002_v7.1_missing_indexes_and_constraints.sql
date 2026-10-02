-- ============================================================================
-- Migration: 20261002_v7.1_missing_indexes_and_constraints.sql
-- Description: Tier 1 & Tier 2 index additions and uniqueness constraints
--              identified in the System Architecture Audit (October 2, 2026).
-- Safe: All statements use IF NOT EXISTS / ON CONFLICT DO NOTHING.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROJECTS: Ensure columns exist & create partial indexes
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS warranty_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'IN_PROGRESS';

CREATE INDEX IF NOT EXISTS idx_projects_warranty_active
  ON public.projects(warranty_until)
  WHERE warranty_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_delivery_status
  ON public.projects(delivery_status)
  WHERE delivery_status NOT IN ('WARRANTY_CLOSED', 'ARCHIVED');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TICKETS: Composite index for SLA defect escalation cron
-- ─────────────────────────────────────────────────────────────────────────────
-- defect-escalation-cron.js queries open tickets older than 24h:
--   WHERE status NOT IN ('resolved','closed') AND created_at < (NOW() - INTERVAL '24h')
-- Composite (status, created_at) allows the planner to index-scan only open tickets.
CREATE INDEX IF NOT EXISTS idx_tickets_status_created
  ON public.tickets(status, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SLA_HOLDBACKS: Status index for escrow governor queries
-- ─────────────────────────────────────────────────────────────────────────────
-- escrow-sla-governor filters holdbacks by (project_id, status).
-- project_id is already indexed (idx_sla_holdbacks_ticket).
-- Adding status index accelerates the release filter across all projects.
CREATE INDEX IF NOT EXISTS idx_sla_holdbacks_status
  ON public.sla_holdbacks(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. AFFILIATE_CONVERSIONS: Composite index for affiliate dashboard queries
-- ─────────────────────────────────────────────────────────────────────────────
-- GET /api/affiliates/:id queries conversions by affiliate_id filtered by status
-- (Accrued, Paid, Pending). The existing (affiliate_id) index is single-column;
-- the composite avoids a filter-after-index-scan for status.
CREATE INDEX IF NOT EXISTS idx_aff_conversions_aff_status
  ON public.affiliate_conversions(affiliate_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SLA_HOLDBACKS: Uniqueness constraint to prevent duplicate holdbacks
-- ─────────────────────────────────────────────────────────────────────────────
-- FIX-004: Concurrent calls to POST /api/tickets/:id/sla-holdback (e.g., cron +
-- manual trigger) can insert duplicate holdback rows for the same ticket.
-- UNIQUE(ticket_id) with ON CONFLICT DO NOTHING prevents double-counting.
-- Using DO $$ block so we can check existence before adding constraint (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'sla_holdbacks'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'uq_sla_holdbacks_ticket_id'
  ) THEN
    ALTER TABLE public.sla_holdbacks
      ADD CONSTRAINT uq_sla_holdbacks_ticket_id UNIQUE (ticket_id);
    RAISE NOTICE 'Added UNIQUE constraint uq_sla_holdbacks_ticket_id on sla_holdbacks(ticket_id)';
  ELSE
    RAISE NOTICE 'Constraint uq_sla_holdbacks_ticket_id already exists — skipped.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. AFFILIATE_PAYOUTS: Idempotency key to prevent double-disbursement
-- ─────────────────────────────────────────────────────────────────────────────
-- FIX-003: POST /api/affiliates/:id/payout with a duplicate network request
-- creates two payout rows. A disbursement_ref (client-generated UUID per request)
-- combined with UNIQUE constraint enforces exactly-once disbursement.
ALTER TABLE public.affiliate_payouts
  ADD COLUMN IF NOT EXISTS disbursement_ref TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'affiliate_payouts'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'uq_affiliate_payouts_disbursement_ref'
  ) THEN
    -- Only constrain non-null disbursement_ref values (legacy rows have NULL — allow them)
    CREATE UNIQUE INDEX IF NOT EXISTS uq_affiliate_payouts_disbursement_ref
      ON public.affiliate_payouts(disbursement_ref)
      WHERE disbursement_ref IS NOT NULL;
    RAISE NOTICE 'Added partial UNIQUE index uq_affiliate_payouts_disbursement_ref';
  ELSE
    RAISE NOTICE 'disbursement_ref unique index already exists — skipped.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. PROJECTS: Additional index for capacity & engines dashboard queries
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_client_status
  ON public.projects(client_id, delivery_status)
  WHERE client_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Apply updated_at trigger to new tables from v6.0 that were missed in v7.0
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  t text;
  tables_to_update text[] := ARRAY[
    'change_orders', 'retainer_banks', 'affiliates', 'affiliate_conversions', 'affiliate_payouts'
  ];
BEGIN
  FOREACH t IN ARRAY tables_to_update LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = t
        AND column_name = 'updated_at'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS set_timestamp_%I ON public.%I;', t, t);
      EXECUTE format(
        'CREATE TRIGGER set_timestamp_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();',
        t, t
      );
    END IF;
  END LOOP;
END $$;
