-- ============================================================================
-- Migration: 20260915_v5.3_dce_fulfillment.sql
-- Description: DCE Phase 3 — Fulfillment Jobs & Digital License Registry
-- Tables: dce_fulfillment_jobs, dce_digital_licenses
-- Dependencies: dce_orders, dce_skus, dce_customers (v5.0, v5.2)
-- ============================================================================

-- 1. FULFILLMENT JOBS (One per order item being fulfilled)
CREATE TABLE IF NOT EXISTS public.dce_fulfillment_jobs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         UUID NOT NULL REFERENCES public.dce_orders(id) ON DELETE CASCADE,
    sku_id           UUID REFERENCES public.dce_skus(id) ON DELETE SET NULL,
    fulfillment_type TEXT NOT NULL DEFAULT 'DIGITAL'
                         CHECK (fulfillment_type IN ('DIGITAL', 'PHYSICAL', 'HYBRID')),
    status           TEXT NOT NULL DEFAULT 'PENDING'
                         CHECK (status IN ('PENDING','IN_PROGRESS','DELIVERED','FAILED','RETRY')),
    delivery_method  TEXT DEFAULT 'EMAIL'
                         CHECK (delivery_method IN ('EMAIL','TELEGRAM','DOWNLOAD_LINK','MANUAL_DISPATCH')),
    delivery_target  TEXT,                    -- customer email or phone
    download_url     TEXT,                    -- pre-signed or external product link
    download_expiry  TIMESTAMPTZ,
    tracking_number  TEXT,                    -- carrier tracking number for physical orders
    carrier          TEXT,                    -- courier name
    delivery_proof   TEXT,                    -- confirmation screenshot or code
    retry_count      INT DEFAULT 0,
    delivered_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dce_fulfillment_order   ON public.dce_fulfillment_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_dce_fulfillment_status  ON public.dce_fulfillment_jobs(status);
CREATE INDEX IF NOT EXISTS idx_dce_fulfillment_sku     ON public.dce_fulfillment_jobs(sku_id);
CREATE INDEX IF NOT EXISTS idx_dce_fulfillment_type    ON public.dce_fulfillment_jobs(fulfillment_type);

-- 2. DIGITAL LICENSE REGISTRY (Per order item, enables subscription renewals)
CREATE TABLE IF NOT EXISTS public.dce_digital_licenses (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         UUID NOT NULL REFERENCES public.dce_orders(id) ON DELETE CASCADE,
    sku_id           UUID NOT NULL REFERENCES public.dce_skus(id) ON DELETE RESTRICT,
    customer_id      UUID NOT NULL REFERENCES public.dce_customers(id) ON DELETE RESTRICT,
    license_key      TEXT UNIQUE NOT NULL,    -- auto-generated 32-char hex key
    access_url       TEXT,                    -- product download / access URL
    expires_at       TIMESTAMPTZ,             -- NULL = lifetime access; date = subscription
    is_active        BOOLEAN DEFAULT TRUE,
    last_accessed_at TIMESTAMPTZ,
    renewal_count    INT DEFAULT 0,
    last_reminder_at TIMESTAMPTZ,             -- 48-hour anti-spam gate for renewal emails
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dce_licenses_customer ON public.dce_digital_licenses(customer_id);
CREATE INDEX IF NOT EXISTS idx_dce_licenses_order    ON public.dce_digital_licenses(order_id);
CREATE INDEX IF NOT EXISTS idx_dce_licenses_expires  ON public.dce_digital_licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_dce_licenses_active   ON public.dce_digital_licenses(is_active);
CREATE INDEX IF NOT EXISTS idx_dce_licenses_key      ON public.dce_digital_licenses(license_key);

-- 3. updated_at triggers
DROP TRIGGER IF EXISTS trg_dce_fulfillment_jobs_updated_at ON public.dce_fulfillment_jobs;
CREATE TRIGGER trg_dce_fulfillment_jobs_updated_at
    BEFORE UPDATE ON public.dce_fulfillment_jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_dce_digital_licenses_updated_at ON public.dce_digital_licenses;
CREATE TRIGGER trg_dce_digital_licenses_updated_at
    BEFORE UPDATE ON public.dce_digital_licenses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. Row Level Security
ALTER TABLE public.dce_fulfillment_jobs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_digital_licenses  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_fulfillment_jobs') THEN
    CREATE POLICY service_role_all_dce_fulfillment_jobs ON public.dce_fulfillment_jobs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_fulfillment_jobs') THEN
    CREATE POLICY public_read_dce_fulfillment_jobs ON public.dce_fulfillment_jobs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_digital_licenses') THEN
    CREATE POLICY service_role_all_dce_digital_licenses ON public.dce_digital_licenses FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_digital_licenses') THEN
    CREATE POLICY public_read_dce_digital_licenses ON public.dce_digital_licenses FOR SELECT USING (true);
  END IF;
END $$;
