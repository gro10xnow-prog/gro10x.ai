-- ============================================================================
-- Migration: 20260903_v3.6_digivault_phase3.sql
-- Description: DigiVault Phase 3 — Smart Delivery Engine, Vendor Proof & Timeline Audit
-- ============================================================================

-- 1. Extend digi_orders with WhatsApp, Vendor Proof, Activation Link, Closure Proof & Stage
ALTER TABLE public.digi_orders
  ADD COLUMN IF NOT EXISTS customer_whatsapp              TEXT,
  ADD COLUMN IF NOT EXISTS vendor_payment_proof_url        TEXT,
  ADD COLUMN IF NOT EXISTS vendor_payment_amount           NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS vendor_payment_sent_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activation_link                TEXT,
  ADD COLUMN IF NOT EXISTS activation_link_entered_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_guide_sent            BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS customer_confirmed_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_confirmation_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS admin_closure_proof_url         TEXT,
  ADD COLUMN IF NOT EXISTS order_closed_at                TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS order_stage                    TEXT DEFAULT 'pending_payment';

CREATE INDEX IF NOT EXISTS idx_digi_orders_stage ON public.digi_orders(order_stage);
CREATE INDEX IF NOT EXISTS idx_digi_orders_whatsapp ON public.digi_orders(customer_whatsapp);

-- 2. Create digi_order_timeline audit log table
CREATE TABLE IF NOT EXISTS public.digi_order_timeline (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.digi_orders(id) ON DELETE CASCADE,
  stage       TEXT NOT NULL,
  actor       TEXT DEFAULT 'system', -- 'customer', 'admin', 'system', 'bot'
  note        TEXT,
  proof_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_digi_timeline_order ON public.digi_order_timeline(order_id);
CREATE INDEX IF NOT EXISTS idx_digi_timeline_stage ON public.digi_order_timeline(stage);

-- 3. Enable RLS
ALTER TABLE public.digi_order_timeline ENABLE ROW LEVEL SECURITY;

-- 4. Service role full access policy
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_digi_timeline') THEN
    CREATE POLICY service_role_all_digi_timeline ON public.digi_order_timeline FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
