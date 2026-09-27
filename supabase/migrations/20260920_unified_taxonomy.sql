-- ============================================================================
-- Migration: 20260920_unified_taxonomy.sql
-- Description: Gro10x Master Product Taxonomy (Engines 1 through 5)
-- Canonical Model: Company (Gro10x) -> Engine -> Vertical -> Brand/Platform -> Category -> Product -> SKU
-- Additive & Non-Destructive: Does not drop or alter existing tables
-- ============================================================================

-- 1. LEVEL 1: Engines (The 5 Fundamental Growth Engines of Gro10x)
CREATE TABLE IF NOT EXISTS public.catalog_engines (
    id            TEXT PRIMARY KEY, -- 'engine1', 'engine2', 'engine3', 'engine4', 'engine5'
    engine_num    INT NOT NULL UNIQUE,
    code          TEXT NOT NULL UNIQUE, -- 'E1', 'E2', 'E3', 'E4', 'E5'
    name          TEXT NOT NULL,
    tagline       TEXT,
    target_arr    NUMERIC NOT NULL DEFAULT 0,
    target_share  TEXT NOT NULL DEFAULT '0%',
    icon          TEXT DEFAULT '⚡',
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. LEVEL 2: Verticals (Top-level domains scoped under an Engine)
CREATE TABLE IF NOT EXISTS public.catalog_verticals (
    id            TEXT PRIMARY KEY, -- e.g. 'e1-career', 'e2-enterprise', 'e3-digital'
    engine_id     TEXT NOT NULL REFERENCES public.catalog_engines(id) ON DELETE CASCADE,
    code          TEXT NOT NULL, -- 'CAR', 'FIN', 'SME', 'EDU', 'ENT', 'DIG', 'FAS', 'SYS', etc.
    name          TEXT NOT NULL,
    description   TEXT,
    icon          TEXT DEFAULT '📁',
    sort_order    INT DEFAULT 0,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_catalog_verticals_engine_code UNIQUE (engine_id, code)
);

-- 3. LEVEL 3: Brands & Platform Hubs (scoped under a Vertical)
CREATE TABLE IF NOT EXISTS public.catalog_brands (
    id            TEXT PRIMARY KEY, -- e.g. 'group-academy', 'plannerqueengro', 'purpleos'
    vertical_id   TEXT NOT NULL REFERENCES public.catalog_verticals(id) ON DELETE RESTRICT,
    code          TEXT NOT NULL, -- 'GRP', 'PLN', 'WLD', 'SHM', 'PRP', etc.
    name          TEXT NOT NULL,
    type          TEXT NOT NULL DEFAULT 'BRAND', -- 'PLATFORM', 'BRAND', 'PRACTICE', 'OPERATING_SYSTEM', 'MEDIA_NETWORK'
    tagline       TEXT,
    metadata      JSONB DEFAULT '{}'::jsonb, -- palette, fonts, voice, guidelines
    sort_order    INT DEFAULT 0,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_catalog_brands_vertical_code UNIQUE (vertical_id, code)
);

-- 4. LEVEL 4: Categories (standardized groupings under a Brand)
CREATE TABLE IF NOT EXISTS public.catalog_categories (
    id            TEXT PRIMARY KEY, -- e.g. 'pln-planners', 'shm-core-clinic'
    brand_id      TEXT NOT NULL REFERENCES public.catalog_brands(id) ON DELETE CASCADE,
    code          TEXT NOT NULL,
    name          TEXT NOT NULL,
    description   TEXT,
    sort_order    INT DEFAULT 0,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_catalog_categories_brand_code UNIQUE (brand_id, code)
);

-- 5. LEVEL 5: Products & Core Agents (the master product/service entry)
CREATE TABLE IF NOT EXISTS public.catalog_products (
    id             TEXT PRIMARY KEY, -- e.g. 'prod-pla14', 'prod-svc001', 'prod-shams-os'
    brand_id       TEXT NOT NULL REFERENCES public.catalog_brands(id) ON DELETE RESTRICT,
    category_id    TEXT NOT NULL REFERENCES public.catalog_categories(id) ON DELETE RESTRICT,
    product_code   TEXT NOT NULL, -- 'PLA-14', 'SVC-001', 'SPRINT-01', 'SHAMS-CORE'
    name           TEXT NOT NULL,
    description    TEXT,
    delivery_type  TEXT NOT NULL DEFAULT 'DIGITAL', -- 'SOFTWARE', 'SERVICE', 'DIGITAL_DOWNLOAD', 'PHYSICAL_POD', 'RETAINER_SLA', 'MEDIA_BROADCAST'
    pricing_model  TEXT NOT NULL DEFAULT 'ONE_TIME', -- 'ONE_TIME', 'SUBSCRIPTION', 'CREDIT_PACK', 'MONTHLY_RETAINER', 'FREE_MONETIZED'
    metadata       JSONB DEFAULT '{}'::jsonb, -- tech stack, AI models, specs
    sort_order     INT DEFAULT 0,
    is_active      BOOLEAN DEFAULT true,
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_catalog_products_code UNIQUE (product_code)
);

-- 6. LEVEL 6: SKUs (Stock Keeping Units with Channel, Pricing & Delivery identifiers)
CREATE TABLE IF NOT EXISTS public.catalog_skus (
    id                TEXT PRIMARY KEY, -- e.g. 'sku-pla14-etsy', 'sku-shams-core-mth'
    product_id        TEXT NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
    sku_code          TEXT UNIQUE NOT NULL, -- e.g. 'GRO-E3-DIG-PLN-PLA14-ETSY'
    name              TEXT NOT NULL,
    channel           TEXT NOT NULL DEFAULT 'OWN_PORTAL', -- 'OWN_PORTAL', 'ETSY', 'UPWORK', 'FIVERR', 'TIKTOK', 'AMAZON', 'DIRECT_WIRE', 'CHROME_STORE'
    price_usd         NUMERIC NOT NULL DEFAULT 0,
    price_bdt         NUMERIC NOT NULL DEFAULT 0,
    billing_interval  TEXT NOT NULL DEFAULT 'one-time', -- 'one-time', 'monthly', 'quarterly', 'yearly', 'per-credit'
    inventory_type    TEXT NOT NULL DEFAULT 'unlimited_digital', -- 'unlimited_digital', 'made_to_order_pod', 'retainer_capacity', 'service_slot'
    metadata          JSONB DEFAULT '{}'::jsonb,
    is_active         BOOLEAN DEFAULT true,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

-- 7. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_cat_verticals_engine ON public.catalog_verticals(engine_id);
CREATE INDEX IF NOT EXISTS idx_cat_brands_vertical ON public.catalog_brands(vertical_id);
CREATE INDEX IF NOT EXISTS idx_cat_categories_brand ON public.catalog_categories(brand_id);
CREATE INDEX IF NOT EXISTS idx_cat_products_brand ON public.catalog_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_cat_products_cat ON public.catalog_products(category_id);
CREATE INDEX IF NOT EXISTS idx_cat_skus_product ON public.catalog_skus(product_id);
CREATE INDEX IF NOT EXISTS idx_cat_skus_code ON public.catalog_skus(sku_code);
CREATE INDEX IF NOT EXISTS idx_cat_skus_channel ON public.catalog_skus(channel);

-- 8. Row Level Security Policies
ALTER TABLE public.catalog_engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_skus ENABLE ROW LEVEL SECURITY;

-- Public can read all active catalog items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'catalog_engines' AND policyname = 'Public read active engines') THEN
        CREATE POLICY "Public read active engines" ON public.catalog_engines FOR SELECT USING (is_active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'catalog_verticals' AND policyname = 'Public read active verticals') THEN
        CREATE POLICY "Public read active verticals" ON public.catalog_verticals FOR SELECT USING (is_active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'catalog_brands' AND policyname = 'Public read active brands') THEN
        CREATE POLICY "Public read active brands" ON public.catalog_brands FOR SELECT USING (is_active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'catalog_categories' AND policyname = 'Public read active categories') THEN
        CREATE POLICY "Public read active categories" ON public.catalog_categories FOR SELECT USING (is_active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'catalog_products' AND policyname = 'Public read active products') THEN
        CREATE POLICY "Public read active products" ON public.catalog_products FOR SELECT USING (is_active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'catalog_skus' AND policyname = 'Public read active skus') THEN
        CREATE POLICY "Public read active skus" ON public.catalog_skus FOR SELECT USING (is_active = true);
    END IF;
END $$;
