-- ============================================================================
-- Migration: 20260912_v5.0_dce_catalog_hierarchy.sql
-- Description: Digital Commerce Engine (DCE) — 5-Level Catalog Hierarchy
-- Hierarchy: Verticals → Brands → Categories → Products → SKUs
-- Additive: Does NOT drop or alter existing tables (digi_*, brands, etsy_*, etc.)
-- ============================================================================

-- 1. Helper function for updated_at timestamps if not exists
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. LEVEL 1: Verticals (Top-level market domains)
CREATE TABLE IF NOT EXISTS public.dce_verticals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    icon        TEXT DEFAULT '📦',
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. LEVEL 2: Brands (owned by a Vertical)
CREATE TABLE IF NOT EXISTS public.dce_brands (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vertical_id       UUID NOT NULL REFERENCES public.dce_verticals(id) ON DELETE RESTRICT,
    slug              TEXT UNIQUE NOT NULL,
    name              TEXT NOT NULL,
    logo_url          TEXT,
    brand_guidelines  JSONB DEFAULT '{}'::jsonb,
    is_active         BOOLEAN DEFAULT true,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

-- 4. LEVEL 3: Categories (scoped UNDER a Brand)
CREATE TABLE IF NOT EXISTS public.dce_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id        UUID NOT NULL REFERENCES public.dce_brands(id) ON DELETE CASCADE,
    slug            TEXT NOT NULL,
    name            TEXT NOT NULL,
    metadata_schema JSONB DEFAULT '{}'::jsonb,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_dce_categories_brand_slug UNIQUE (brand_id, slug)
);

-- 5. LEVEL 4: Products (master listing under Brand + Category)
CREATE TABLE IF NOT EXISTS public.dce_products (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id             UUID NOT NULL REFERENCES public.dce_brands(id) ON DELETE RESTRICT,
    category_id          UUID NOT NULL REFERENCES public.dce_categories(id) ON DELETE RESTRICT,
    product_code         TEXT UNIQUE NOT NULL,
    title                TEXT NOT NULL,
    product_type         TEXT NOT NULL DEFAULT 'DIGITAL'
                            CHECK (product_type IN ('DIGITAL', 'PHYSICAL', 'SUBSCRIPTION', 'BUNDLE')),
    description          TEXT,
    media_gallery        JSONB DEFAULT '[]'::jsonb,
    digital_assets       JSONB DEFAULT '{}'::jsonb,
    physical_attributes  JSONB DEFAULT '{}'::jsonb,
    is_active            BOOLEAN DEFAULT true,
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);

-- 6. LEVEL 5: SKUs (Product × Format × Channel × Price)
-- Format: {ProductCode}-{Format}-{Channel}-{Currency}{Price}
-- e.g. PLNRQN-PDF-ETSY-USD9.99
CREATE TABLE IF NOT EXISTS public.dce_skus (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID NOT NULL REFERENCES public.dce_products(id) ON DELETE CASCADE,
    sku                 TEXT UNIQUE NOT NULL,
    format              TEXT NOT NULL,
    channel_code        TEXT NOT NULL
                            CHECK (channel_code IN ('ETSY', 'AMAZON', 'GUMROAD', 'DARAZ', 'DIRECT', 'OTHER')),
    price               NUMERIC(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'USD',
    channel_title       TEXT,
    channel_listing_id  TEXT,
    stock_quantity      INT, -- NULL for unlimited digital goods, integer for physical goods
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_dce_skus_product_format_channel UNIQUE (product_id, format, channel_code)
);

-- 7. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_dce_brands_vertical    ON public.dce_brands(vertical_id);
CREATE INDEX IF NOT EXISTS idx_dce_categories_brand   ON public.dce_categories(brand_id);
CREATE INDEX IF NOT EXISTS idx_dce_products_brand     ON public.dce_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_dce_products_category  ON public.dce_products(category_id);
CREATE INDEX IF NOT EXISTS idx_dce_skus_product       ON public.dce_skus(product_id);
CREATE INDEX IF NOT EXISTS idx_dce_skus_channel       ON public.dce_skus(channel_code);
CREATE INDEX IF NOT EXISTS idx_dce_skus_sku           ON public.dce_skus(sku);

-- 8. Triggers for updated_at
DROP TRIGGER IF EXISTS trg_dce_verticals_updated_at ON public.dce_verticals;
CREATE TRIGGER trg_dce_verticals_updated_at
    BEFORE UPDATE ON public.dce_verticals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_dce_brands_updated_at ON public.dce_brands;
CREATE TRIGGER trg_dce_brands_updated_at
    BEFORE UPDATE ON public.dce_brands
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_dce_categories_updated_at ON public.dce_categories;
CREATE TRIGGER trg_dce_categories_updated_at
    BEFORE UPDATE ON public.dce_categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_dce_products_updated_at ON public.dce_products;
CREATE TRIGGER trg_dce_products_updated_at
    BEFORE UPDATE ON public.dce_products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_dce_skus_updated_at ON public.dce_skus;
CREATE TRIGGER trg_dce_skus_updated_at
    BEFORE UPDATE ON public.dce_skus
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 9. Row Level Security (RLS) Enablement
ALTER TABLE public.dce_verticals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_brands      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_skus        ENABLE ROW LEVEL SECURITY;

-- 10. Default Read & Service Role Policies
DO $$ BEGIN
  -- Verticals
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_verticals') THEN
    CREATE POLICY service_role_all_dce_verticals ON public.dce_verticals FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_verticals') THEN
    CREATE POLICY public_read_dce_verticals ON public.dce_verticals FOR SELECT USING (is_active = true);
  END IF;

  -- Brands
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_brands') THEN
    CREATE POLICY service_role_all_dce_brands ON public.dce_brands FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_brands') THEN
    CREATE POLICY public_read_dce_brands ON public.dce_brands FOR SELECT USING (is_active = true);
  END IF;

  -- Categories
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_categories') THEN
    CREATE POLICY service_role_all_dce_categories ON public.dce_categories FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_categories') THEN
    CREATE POLICY public_read_dce_categories ON public.dce_categories FOR SELECT USING (is_active = true);
  END IF;

  -- Products
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_products') THEN
    CREATE POLICY service_role_all_dce_products ON public.dce_products FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_products') THEN
    CREATE POLICY public_read_dce_products ON public.dce_products FOR SELECT USING (is_active = true);
  END IF;

  -- SKUs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_skus') THEN
    CREATE POLICY service_role_all_dce_skus ON public.dce_skus FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_skus') THEN
    CREATE POLICY public_read_dce_skus ON public.dce_skus FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- 11. Initial Seed Data (Production sample: Productivity & F&B)
DO $$
DECLARE
    v_prod_id UUID;
    v_fnb_id UUID;
    b_pq_id UUID;
    b_oro_id UUID;
    c_dw_id UUID;
    c_goal_id UUID;
    p_dw1_id UUID;
BEGIN
    -- Verticals
    INSERT INTO public.dce_verticals (slug, name, description, icon)
    VALUES 
        ('productivity', 'Productivity', 'Digital & physical organization, planning tools, and workflows', '⚡'),
        ('fnb', 'Food & Beverage', 'Specialty coffee roasters, culinary retail, and consumables', '☕')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_prod_id;

    SELECT id INTO v_prod_id FROM public.dce_verticals WHERE slug = 'productivity';
    SELECT id INTO v_fnb_id FROM public.dce_verticals WHERE slug = 'fnb';

    -- Brands
    INSERT INTO public.dce_brands (vertical_id, slug, name, logo_url, brand_guidelines)
    VALUES 
        (v_prod_id, 'plannerqueen', 'PlannerQueen', 'https://gro10x.ai/images/plannerqueen-logo.png', '{"primaryColor": "#FF6B81", "tone": "Empowering & Aesthetic"}'::jsonb),
        (v_fnb_id, 'oro-roasters', 'ORO Roasters', 'https://gro10x.ai/images/oro-logo.png', '{"primaryColor": "#D4A373", "tone": "Artisanal & Premium"}'::jsonb)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

    SELECT id INTO b_pq_id FROM public.dce_brands WHERE slug = 'plannerqueen';

    -- Categories under PlannerQueen
    INSERT INTO public.dce_categories (brand_id, slug, name, metadata_schema)
    VALUES 
        (b_pq_id, 'daily-weekly-planner', 'Daily & Weekly Planner', '{"supportsDigital": true, "supportsPrint": true}'::jsonb),
        (b_pq_id, 'goal-setting-journals', 'Goal Setting Journals', '{"supportsDigital": true, "supportsPrint": true}'::jsonb)
    ON CONFLICT (brand_id, slug) DO UPDATE SET name = EXCLUDED.name;

    SELECT id INTO c_dw_id FROM public.dce_categories WHERE brand_id = b_pq_id AND slug = 'daily-weekly-planner';

    -- Master Product
    INSERT INTO public.dce_products (
        brand_id, category_id, product_code, title, product_type, description, media_gallery, digital_assets
    )
    VALUES (
        b_pq_id,
        c_dw_id,
        'PLNRQN-01',
        'Daily & Weekly Planners #1 — PlannerQueenGro Style',
        'DIGITAL',
        'The flagship productivity system engineered by PlannerQueen for high-achievers. Includes daily time-blocking, weekly review spreads, and digital GoodNotes/Notability templates.',
        '["https://gro10x.ai/images/samples/planner-mockup-1.jpg", "https://gro10x.ai/images/samples/planner-mockup-2.jpg"]'::jsonb,
        '{"downloadUrl": "https://vault.gro10x.ai/digital/plannerqueen-v1.pdf", "format": "PDF"}'::jsonb
    )
    ON CONFLICT (product_code) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO p_dw1_id;

    SELECT id INTO p_dw1_id FROM public.dce_products WHERE product_code = 'PLNRQN-01';

    -- Channel SKUs for PLNRQN-01
    INSERT INTO public.dce_skus (
        product_id, sku, format, channel_code, price, currency, channel_title, stock_quantity
    )
    VALUES 
        (p_dw1_id, 'PLNRQN-PDF-ETSY-USD9.99', 'PDF', 'ETSY', 9.99, 'USD', 'Daily & Weekly Planner GoodNotes Aesthetic Digital Template 2026', NULL),
        (p_dw1_id, 'PLNRQN-PDF-GUMROAD-USD7.99', 'PDF', 'GUMROAD', 7.99, 'USD', 'PlannerQueen Digital Daily & Weekly System (PDF Download)', NULL),
        (p_dw1_id, 'PLNRQN-PRINT-AMAZON-USD14.99', 'PRINT', 'AMAZON', 14.99, 'USD', 'PlannerQueen Hardcover Daily & Weekly Undated Productivity Journal', 250),
        (p_dw1_id, 'PLNRQN-BUNDLE-DIRECT-USD19.99', 'BUNDLE', 'DIRECT', 19.99, 'USD', 'All-In-One PlannerQueen Suite: Hardcover Print + Digital GoodNotes PDF', 100)
    ON CONFLICT (product_id, format, channel_code) DO UPDATE 
    SET price = EXCLUDED.price, sku = EXCLUDED.sku;

END $$;
