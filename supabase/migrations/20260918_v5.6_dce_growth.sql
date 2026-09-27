-- ============================================================================
-- Migration: 20260918_v5.6_dce_growth.sql
-- Description: DCE Phase 4 — Growth Engine: Campaigns, Coupons, Affiliates & Attribution
-- Tables: dce_campaigns, dce_coupons, dce_affiliates, dce_referral_links, dce_referral_conversions
-- Dependencies: dce_brands, dce_skus, dce_orders (v5.0, v5.2)
-- ============================================================================

-- 1. CAMPAIGNS (Marketing initiatives, seasonal pushes, ad cohorts)
CREATE TABLE IF NOT EXISTS public.dce_campaigns (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id       UUID NOT NULL REFERENCES public.dce_brands(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,                         -- e.g. "Q4 Black Friday 2026"
    slug           TEXT NOT NULL,                         -- e.g. "bf-2026"
    utm_campaign   TEXT NOT NULL,                         -- e.g. "blackfriday"
    channel_focus  TEXT DEFAULT 'ALL',                    -- 'ETSY', 'AMAZON', 'DIRECT', 'ALL'
    budget_usd     NUMERIC(10,2) DEFAULT 0.00,
    status         TEXT NOT NULL DEFAULT 'ACTIVE'
                       CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED')),
    starts_at      TIMESTAMPTZ,
    ends_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_dce_campaigns_brand_slug UNIQUE (brand_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_dce_campaigns_brand       ON public.dce_campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_dce_campaigns_utm_campaign ON public.dce_campaigns(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_dce_campaigns_status      ON public.dce_campaigns(status);

-- 2. COUPONS & PROMOTIONS (Brand-scoped or global promo codes)
CREATE TABLE IF NOT EXISTS public.dce_coupons (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code             TEXT UNIQUE NOT NULL,                  -- uppercase, e.g. "GRO10OFF", "SAVE25"
    brand_id         UUID REFERENCES public.dce_brands(id) ON DELETE CASCADE, -- NULL = global across all brands
    discount_type    TEXT NOT NULL DEFAULT 'PERCENTAGE'
                         CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    discount_value   NUMERIC(10,2) NOT NULL,               -- e.g. 10.00 (% or $)
    min_order_usd    NUMERIC(10,2) DEFAULT 0.00,
    max_discount_usd NUMERIC(10,2),                        -- ceiling for percentage discounts
    max_uses         INT DEFAULT NULL,                      -- NULL = unlimited
    used_count       INT DEFAULT 0,
    applicable_skus  UUID[] DEFAULT NULL,                  -- NULL = all SKUs under brand
    is_active        BOOLEAN DEFAULT TRUE,
    expires_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dce_coupons_code      ON public.dce_coupons(code);
CREATE INDEX IF NOT EXISTS idx_dce_coupons_brand     ON public.dce_coupons(brand_id);
CREATE INDEX IF NOT EXISTS idx_dce_coupons_is_active ON public.dce_coupons(is_active);

-- 3. AFFILIATES & CREATORS (Referral partners earning performance kickbacks)
CREATE TABLE IF NOT EXISTS public.dce_affiliates (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT NOT NULL,
    email          TEXT UNIQUE NOT NULL,
    phone          TEXT,
    payout_channel TEXT DEFAULT 'BKASH'
                       CHECK (payout_channel IN ('BKASH', 'BANK_WIRE', 'PAYPAL', 'STRIPE')),
    payout_details JSONB DEFAULT '{}'::jsonb,
    default_rate   NUMERIC(5,4) NOT NULL DEFAULT 0.1500,  -- 15% default affiliate commission
    status         TEXT NOT NULL DEFAULT 'ACTIVE'
                       CHECK (status IN ('ACTIVE', 'PENDING', 'SUSPENDED')),
    total_earned   NUMERIC(12,2) DEFAULT 0.00,
    total_paid     NUMERIC(12,2) DEFAULT 0.00,
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dce_affiliates_email  ON public.dce_affiliates(email);
CREATE INDEX IF NOT EXISTS idx_dce_affiliates_status ON public.dce_affiliates(status);

-- 4. REFERRAL LINKS & SHORT CODES (Trackable links per SKU / Brand)
CREATE TABLE IF NOT EXISTS public.dce_referral_links (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id     UUID NOT NULL REFERENCES public.dce_affiliates(id) ON DELETE CASCADE,
    brand_id         UUID NOT NULL REFERENCES public.dce_brands(id) ON DELETE CASCADE,
    sku_id           UUID REFERENCES public.dce_skus(id) ON DELETE SET NULL,
    short_code       TEXT UNIQUE NOT NULL,                  -- e.g. "pq-alex"
    destination_url  TEXT NOT NULL,
    commission_rate  NUMERIC(5,4),                         -- overrides affiliate default if set
    click_count      INT DEFAULT 0,
    conversion_count INT DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dce_ref_links_code      ON public.dce_referral_links(short_code);
CREATE INDEX IF NOT EXISTS idx_dce_ref_links_affiliate ON public.dce_referral_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_dce_ref_links_brand     ON public.dce_referral_links(brand_id);

-- 5. REFERRAL CONVERSIONS (Attributed order items & commission records)
CREATE TABLE IF NOT EXISTS public.dce_referral_conversions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id           UUID REFERENCES public.dce_referral_links(id) ON DELETE SET NULL,
    affiliate_id      UUID NOT NULL REFERENCES public.dce_affiliates(id) ON DELETE CASCADE,
    order_id          UUID NOT NULL REFERENCES public.dce_orders(id) ON DELETE CASCADE,
    order_amount      NUMERIC(12,2) NOT NULL,
    commission_rate   NUMERIC(5,4) NOT NULL,
    commission_earned NUMERIC(12,2) NOT NULL,
    payout_status     TEXT NOT NULL DEFAULT 'PENDING'
                          CHECK (payout_status IN ('PENDING', 'APPROVED', 'PAID')),
    created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dce_ref_conv_affiliate ON public.dce_referral_conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_dce_ref_conv_order     ON public.dce_referral_conversions(order_id);
CREATE INDEX IF NOT EXISTS idx_dce_ref_conv_status    ON public.dce_referral_conversions(payout_status);

-- 6. Updated_at Triggers
DROP TRIGGER IF EXISTS trg_dce_campaigns_updated_at ON public.dce_campaigns;
CREATE TRIGGER trg_dce_campaigns_updated_at
    BEFORE UPDATE ON public.dce_campaigns
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_dce_coupons_updated_at ON public.dce_coupons;
CREATE TRIGGER trg_dce_coupons_updated_at
    BEFORE UPDATE ON public.dce_coupons
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_dce_affiliates_updated_at ON public.dce_affiliates;
CREATE TRIGGER trg_dce_affiliates_updated_at
    BEFORE UPDATE ON public.dce_affiliates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_dce_referral_links_updated_at ON public.dce_referral_links;
CREATE TRIGGER trg_dce_referral_links_updated_at
    BEFORE UPDATE ON public.dce_referral_links
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. Row Level Security
ALTER TABLE public.dce_campaigns            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_coupons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_affiliates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_referral_links       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_referral_conversions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_campaigns') THEN
    CREATE POLICY service_role_all_dce_campaigns ON public.dce_campaigns FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_campaigns') THEN
    CREATE POLICY public_read_dce_campaigns ON public.dce_campaigns FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_coupons') THEN
    CREATE POLICY service_role_all_dce_coupons ON public.dce_coupons FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_coupons') THEN
    CREATE POLICY public_read_dce_coupons ON public.dce_coupons FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_affiliates') THEN
    CREATE POLICY service_role_all_dce_affiliates ON public.dce_affiliates FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_affiliates') THEN
    CREATE POLICY public_read_dce_affiliates ON public.dce_affiliates FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_referral_links') THEN
    CREATE POLICY service_role_all_dce_referral_links ON public.dce_referral_links FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_referral_links') THEN
    CREATE POLICY public_read_dce_referral_links ON public.dce_referral_links FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_referral_conversions') THEN
    CREATE POLICY service_role_all_dce_referral_conversions ON public.dce_referral_conversions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_referral_conversions') THEN
    CREATE POLICY public_read_dce_referral_conversions ON public.dce_referral_conversions FOR SELECT USING (true);
  END IF;
END $$;

-- 8. Seed Initial Marketing & Growth Data
DO $$
DECLARE
    b_pq_id UUID;
    s_etsy_id UUID;
    aff_id UUID;
    link_id UUID;
BEGIN
    SELECT id INTO b_pq_id FROM public.dce_brands WHERE slug = 'plannerqueen' LIMIT 1;
    SELECT id INTO s_etsy_id FROM public.dce_skus WHERE sku = 'PLNRQN-PDF-ETSY-USD9.99' LIMIT 1;

    IF b_pq_id IS NOT NULL THEN
        -- Seed Campaign
        INSERT INTO public.dce_campaigns (brand_id, name, slug, utm_campaign, channel_focus, budget_usd, status)
        VALUES (b_pq_id, 'Q4 Productivity Surge 2026', 'q4-productivity', 'q4surge', 'ALL', 250.00, 'ACTIVE')
        ON CONFLICT (brand_id, slug) DO NOTHING;

        -- Seed Coupons
        INSERT INTO public.dce_coupons (code, brand_id, discount_type, discount_value, min_order_usd, max_uses, is_active)
        VALUES 
            ('PQWELCOME10', b_pq_id, 'PERCENTAGE', 10.00, 5.00, 1000, true),
            ('SAVE5NOW', b_pq_id, 'FIXED_AMOUNT', 5.00, 15.00, 500, true),
            ('GROGLOBAL15', NULL, 'PERCENTAGE', 15.00, 10.00, NULL, true)
        ON CONFLICT (code) DO NOTHING;

        -- Seed Affiliate
        INSERT INTO public.dce_affiliates (name, email, phone, payout_channel, default_rate, status, total_earned)
        VALUES ('Alex Creator & Co.', 'alex.creator@example.com', '+8801700000000', 'BKASH', 0.2000, 'ACTIVE', 12.50)
        ON CONFLICT (email) DO NOTHING
        RETURNING id INTO aff_id;

        IF aff_id IS NULL THEN
            SELECT id INTO aff_id FROM public.dce_affiliates WHERE email = 'alex.creator@example.com';
        END IF;

        -- Seed Referral Link
        IF aff_id IS NOT NULL THEN
            INSERT INTO public.dce_referral_links (affiliate_id, brand_id, sku_id, short_code, destination_url, commission_rate, click_count, conversion_count)
            VALUES (aff_id, b_pq_id, s_etsy_id, 'pq-alex', 'https://gro10x.ai/dce', 0.2000, 48, 3)
            ON CONFLICT (short_code) DO NOTHING;
        END IF;
    END IF;
END $$;
