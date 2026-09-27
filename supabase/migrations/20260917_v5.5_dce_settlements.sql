-- ============================================================================
-- Migration: 20260917_v5.5_dce_settlements.sql
-- Description: DCE Phase 3 — Vendor & Creator Settlement Ledger
-- Tables: dce_settlement_batches, dce_settlement_items
-- Dependencies: dce_brands, dce_orders (v5.0, v5.2)
-- ============================================================================

-- 1. SETTLEMENT BATCHES (Per-cycle payout run, e.g. monthly)
CREATE TABLE IF NOT EXISTS public.dce_settlement_batches (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_ref    TEXT UNIQUE NOT NULL,         -- e.g. SETTLE-SEP-2026
    period_start TIMESTAMPTZ NOT NULL,
    period_end   TIMESTAMPTZ NOT NULL,
    status       TEXT NOT NULL DEFAULT 'DRAFT'
                     CHECK (status IN ('DRAFT','CALCULATED','APPROVED','DISBURSED')),
    total_gross  NUMERIC(14,2) DEFAULT 0.00,
    total_fees   NUMERIC(14,2) DEFAULT 0.00,
    total_net    NUMERIC(14,2) DEFAULT 0.00,
    total_payable NUMERIC(14,2) DEFAULT 0.00,  -- sum of all creator/vendor net_payable
    disbursed_at TIMESTAMPTZ,
    approved_by  TEXT,
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT now(),
    updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dce_batches_status ON public.dce_settlement_batches(status);
CREATE INDEX IF NOT EXISTS idx_dce_batches_period ON public.dce_settlement_batches(period_start, period_end);

-- 2. SETTLEMENT LINE ITEMS (Per vendor / creator payable within a batch)
CREATE TABLE IF NOT EXISTS public.dce_settlement_items (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id       UUID NOT NULL REFERENCES public.dce_settlement_batches(id) ON DELETE CASCADE,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('CREATOR','VENDOR','BRAND')),
    recipient_id   TEXT NOT NULL,              -- team member ID, vendor ID, or brand slug
    recipient_name TEXT NOT NULL,
    brand_id       UUID REFERENCES public.dce_brands(id) ON DELETE SET NULL,
    order_count    INT DEFAULT 0,
    gross_revenue  NUMERIC(12,2) DEFAULT 0.00,
    channel_fees   NUMERIC(12,2) DEFAULT 0.00,
    cogs_deduction NUMERIC(12,2) DEFAULT 0.00, -- cost of goods (physical inventory)
    royalty_rate   NUMERIC(5,4) DEFAULT 0.0000,-- e.g. 0.3000 = 30% to creator
    royalty_amount NUMERIC(12,2) DEFAULT 0.00, -- net_of_fees × royalty_rate
    net_payable    NUMERIC(12,2) DEFAULT 0.00, -- amount to transfer to recipient
    gro10x_margin  NUMERIC(12,2) DEFAULT 0.00, -- GRO10X retained after payout
    currency       VARCHAR(3) DEFAULT 'USD',
    status         TEXT DEFAULT 'PENDING'
                       CHECK (status IN ('PENDING','APPROVED','PAID','DISPUTED')),
    payment_ref    TEXT,                       -- bKash TrxID, bank ref, etc.
    payment_note   TEXT,
    paid_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dce_settlement_items_batch     ON public.dce_settlement_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_dce_settlement_items_recipient ON public.dce_settlement_items(recipient_id);
CREATE INDEX IF NOT EXISTS idx_dce_settlement_items_brand     ON public.dce_settlement_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_dce_settlement_items_status    ON public.dce_settlement_items(status);

-- 3. updated_at triggers
DROP TRIGGER IF EXISTS trg_dce_settlement_batches_updated_at ON public.dce_settlement_batches;
CREATE TRIGGER trg_dce_settlement_batches_updated_at
    BEFORE UPDATE ON public.dce_settlement_batches
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_dce_settlement_items_updated_at ON public.dce_settlement_items;
CREATE TRIGGER trg_dce_settlement_items_updated_at
    BEFORE UPDATE ON public.dce_settlement_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. Row Level Security
ALTER TABLE public.dce_settlement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_settlement_items   ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_settlement_batches') THEN
    CREATE POLICY service_role_all_dce_settlement_batches ON public.dce_settlement_batches FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_settlement_batches') THEN
    CREATE POLICY public_read_dce_settlement_batches ON public.dce_settlement_batches FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_settlement_items') THEN
    CREATE POLICY service_role_all_dce_settlement_items ON public.dce_settlement_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_settlement_items') THEN
    CREATE POLICY public_read_dce_settlement_items ON public.dce_settlement_items FOR SELECT USING (true);
  END IF;
END $$;

-- 5. Seed initial settlement batch for testing
DO $$
DECLARE
    b1_id UUID;
    batch_id UUID;
BEGIN
    SELECT id INTO b1_id FROM public.dce_brands WHERE slug = 'plannerqueen' LIMIT 1;

    INSERT INTO public.dce_settlement_batches
        (batch_ref, period_start, period_end, status,
         total_gross, total_fees, total_net, total_payable, notes)
    VALUES
        ('SETTLE-SEP-2026',
         '2026-09-01 00:00:00+00', '2026-09-30 23:59:59+00',
         'CALCULATED',
         32.97, 4.70, 28.27, 8.48,
         'September 2026 PlannerQueen settlement — 3 confirmed orders across Etsy, Gumroad, Amazon')
    ON CONFLICT (batch_ref) DO NOTHING
    RETURNING id INTO batch_id;

    IF batch_id IS NOT NULL AND b1_id IS NOT NULL THEN
        INSERT INTO public.dce_settlement_items
            (batch_id, recipient_type, recipient_id, recipient_name, brand_id,
             order_count, gross_revenue, channel_fees, royalty_rate,
             royalty_amount, net_payable, gro10x_margin, currency, status)
        VALUES
            (batch_id, 'CREATOR', 'creator-pq-001', 'PlannerQueen Creator', b1_id,
             3, 32.97, 4.70, 0.3000,
             8.48, 8.48, 19.79, 'USD', 'PENDING')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
