-- ============================================================================
-- Migration: 20260902_v3.5_digivault_phase2.sql
-- Description: DigiVault Phase 2 — Multi-Channel Commerce & UTM Tracking
-- ============================================================================

-- 1. Extend digi_orders with UTM telemetry and Telegram chat metadata
ALTER TABLE public.digi_orders
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS utm_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS telegram_message_id TEXT;

-- 2. Create digi_product_links table for UTM deep linking & conversion telemetry
CREATE TABLE IF NOT EXISTS public.digi_product_links (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID REFERENCES public.digi_products(id) ON DELETE CASCADE,
  product_name        TEXT NOT NULL,
  utm_source          TEXT DEFAULT 'direct',
  utm_medium          TEXT DEFAULT 'link',
  utm_campaign        TEXT DEFAULT 'general',
  full_url            TEXT NOT NULL,
  short_code          TEXT UNIQUE,
  click_count         INT DEFAULT 0,
  order_count         INT DEFAULT 0,
  revenue_generated   NUMERIC(10,2) DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_digi_links_prod ON public.digi_product_links(product_id);
CREATE INDEX IF NOT EXISTS idx_digi_links_short ON public.digi_product_links(short_code);

-- Enable RLS
ALTER TABLE public.digi_product_links ENABLE ROW LEVEL SECURITY;

-- Service role full access policy
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_digi_links') THEN
    CREATE POLICY service_role_all_digi_links ON public.digi_product_links FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
