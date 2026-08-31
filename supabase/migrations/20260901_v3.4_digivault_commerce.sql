-- ============================================================================
-- Migration: 20260901_v3.4_digivault_commerce.sql
-- Description: DigiVault Digital Subscription & Product Commerce Engine
-- ============================================================================

-- 1. digi_vendors
CREATE TABLE IF NOT EXISTS public.digi_vendors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  contact_type      TEXT DEFAULT 'whatsapp',
  contact_handle    TEXT,
  phone             TEXT,
  payment_method    TEXT DEFAULT 'bkash',
  avg_delivery_min  INT DEFAULT 30,
  reliability_score NUMERIC(3,1) DEFAULT 9.0,
  notes             TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 2. digi_products
CREATE TABLE IF NOT EXISTS public.digi_products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL,
  duration          TEXT NOT NULL DEFAULT '1 Month',
  vendor_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  profit_margin     NUMERIC(10,2) DEFAULT 0,
  delivery_type     TEXT NOT NULL DEFAULT 'id_pass',
  delivery_notes    TEXT,
  vendor_id         UUID REFERENCES public.digi_vendors(id) ON DELETE SET NULL,
  stock_status      TEXT DEFAULT 'available',
  is_hero           BOOLEAN DEFAULT FALSE,
  is_active         BOOLEAN DEFAULT TRUE,
  channels          TEXT[] DEFAULT '{web,telegram,facebook}',
  tags              TEXT[],
  sort_order        INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_digi_products_cat ON public.digi_products(category);
CREATE INDEX IF NOT EXISTS idx_digi_products_slug ON public.digi_products(slug);
CREATE INDEX IF NOT EXISTS idx_digi_products_vendor ON public.digi_products(vendor_id);

-- 3. digi_orders
CREATE TABLE IF NOT EXISTS public.digi_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          TEXT UNIQUE NOT NULL,
  customer_name         TEXT NOT NULL,
  customer_contact      TEXT NOT NULL,
  contact_channel       TEXT DEFAULT 'facebook',
  product_id            UUID REFERENCES public.digi_products(id) ON DELETE SET NULL,
  product_name          TEXT NOT NULL,
  duration              TEXT NOT NULL DEFAULT '1 Month',
  vendor_price          NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price            NUMERIC(10,2) NOT NULL DEFAULT 0,
  profit                NUMERIC(10,2) DEFAULT 0,
  vendor_id             UUID REFERENCES public.digi_vendors(id) ON DELETE SET NULL,
  payment_status        TEXT DEFAULT 'pending',
  payment_method        TEXT DEFAULT 'bkash',
  payment_ref           TEXT,
  payment_proof_url     TEXT,
  payment_verified_by   TEXT,
  payment_verified_at   TIMESTAMPTZ,
  delivery_status       TEXT DEFAULT 'pending',
  delivered_by          TEXT,
  delivered_at          TIMESTAMPTZ,
  activation_date       DATE,
  expiry_date           DATE,
  renewal_reminder_sent BOOLEAN DEFAULT FALSE,
  is_renewed            BOOLEAN DEFAULT FALSE,
  parent_order_id       UUID REFERENCES public.digi_orders(id) ON DELETE SET NULL,
  source_channel        TEXT DEFAULT 'facebook',
  procurement_sent      BOOLEAN DEFAULT FALSE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_digi_orders_expiry ON public.digi_orders(expiry_date);
CREATE INDEX IF NOT EXISTS idx_digi_orders_status ON public.digi_orders(payment_status, delivery_status);
CREATE INDEX IF NOT EXISTS idx_digi_orders_num ON public.digi_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_digi_orders_cust ON public.digi_orders(customer_contact);

-- 4. digi_deliveries (Encrypted/Secure Credential Vault)
CREATE TABLE IF NOT EXISTS public.digi_deliveries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID REFERENCES public.digi_orders(id) ON DELETE CASCADE,
  delivery_type     TEXT NOT NULL,
  credential_data   JSONB NOT NULL DEFAULT '{}',
  entered_by        TEXT NOT NULL,
  entered_at        TIMESTAMPTZ DEFAULT NOW(),
  sent_at           TIMESTAMPTZ,
  sent_via          TEXT DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS idx_digi_deliveries_order ON public.digi_deliveries(order_id);

-- Enable RLS
ALTER TABLE public.digi_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digi_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digi_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digi_deliveries ENABLE ROW LEVEL SECURITY;

-- Service role full access policy for server-side operations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_digi_vendors') THEN
    CREATE POLICY service_role_all_digi_vendors ON public.digi_vendors FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_digi_products') THEN
    CREATE POLICY service_role_all_digi_products ON public.digi_products FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_digi_orders') THEN
    CREATE POLICY service_role_all_digi_orders ON public.digi_orders FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_digi_deliveries') THEN
    CREATE POLICY service_role_all_digi_deliveries ON public.digi_deliveries FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
