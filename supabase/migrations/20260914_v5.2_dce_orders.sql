-- ============================================================================
-- Migration: 20260914_v5.2_dce_orders.sql
-- Description: Digital Commerce Engine (DCE) — Omnichannel Orders & Customer Hub
-- Tables: dce_customers, dce_orders, dce_order_items, dce_order_events
-- Dependencies: Requires dce_brands and dce_skus (from v5.0 migration)
-- ============================================================================

-- 1. LEVEL A: Customers (Cross-channel identity resolution)
CREATE TABLE IF NOT EXISTS public.dce_customers (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email              TEXT,
    phone              TEXT,
    full_name          TEXT,
    country_code       VARCHAR(3),
    channel_identities JSONB DEFAULT '{}'::jsonb,
    -- e.g. {"etsy": "buyer_123", "gumroad": "buyer@example.com", "amazon": "amz-cust-99"}
    total_orders_count INT DEFAULT 0,
    total_spend_usd    NUMERIC(12, 2) DEFAULT 0.00,
    first_seen_at      TIMESTAMPTZ DEFAULT now(),
    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dce_customers_email ON public.dce_customers(email);
CREATE INDEX IF NOT EXISTS idx_dce_customers_phone ON public.dce_customers(phone);

-- 2. LEVEL B: Unified Orders (Canonical order entity per channel transaction)
CREATE TABLE IF NOT EXISTS public.dce_orders (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_code      TEXT NOT NULL
                          CHECK (channel_code IN ('ETSY', 'AMAZON', 'GUMROAD', 'DARAZ', 'DIRECT', 'OTHER')),
    external_order_id TEXT NOT NULL,
    customer_id       UUID REFERENCES public.dce_customers(id) ON DELETE SET NULL,
    brand_id          UUID NOT NULL REFERENCES public.dce_brands(id) ON DELETE RESTRICT,
    total_amount      NUMERIC(12, 2) NOT NULL,
    currency          VARCHAR(3) NOT NULL DEFAULT 'USD',
    channel_fee       NUMERIC(12, 2) DEFAULT 0.00,
    net_amount        NUMERIC(12, 2) NOT NULL,
    status            TEXT NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED')),
    fulfillment_type  TEXT NOT NULL DEFAULT 'DIGITAL'
                          CHECK (fulfillment_type IN ('DIGITAL', 'PHYSICAL', 'HYBRID')),
    tracking_number   TEXT,
    shipping_carrier  TEXT,
    raw_payload       JSONB DEFAULT '{}'::jsonb,
    utm_data          JSONB DEFAULT '{}'::jsonb,
    placed_at         TIMESTAMPTZ NOT NULL,
    synced_at         TIMESTAMPTZ DEFAULT now(),
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_dce_orders_channel_external UNIQUE (channel_code, external_order_id)
);

CREATE INDEX IF NOT EXISTS idx_dce_orders_channel    ON public.dce_orders(channel_code);
CREATE INDEX IF NOT EXISTS idx_dce_orders_brand      ON public.dce_orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_dce_orders_customer   ON public.dce_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_dce_orders_status     ON public.dce_orders(status);
CREATE INDEX IF NOT EXISTS idx_dce_orders_placed_at  ON public.dce_orders(placed_at DESC);

-- 3. LEVEL C: Order Line Items (Linked to canonical DCE SKUs)
CREATE TABLE IF NOT EXISTS public.dce_order_items (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         UUID NOT NULL REFERENCES public.dce_orders(id) ON DELETE CASCADE,
    sku_id           UUID REFERENCES public.dce_skus(id) ON DELETE SET NULL,
    external_sku_ref TEXT,
    title            TEXT NOT NULL,
    quantity         INT NOT NULL DEFAULT 1,
    unit_price       NUMERIC(12, 2) NOT NULL,
    line_total       NUMERIC(12, 2) NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dce_order_items_order ON public.dce_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_dce_order_items_sku   ON public.dce_order_items(sku_id);

-- 4. LEVEL D: Order Events (Immutable chronological audit log)
CREATE TABLE IF NOT EXISTS public.dce_order_events (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   UUID NOT NULL REFERENCES public.dce_orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    source     TEXT DEFAULT 'system', -- 'webhook', 'poll', 'manual', 'bot'
    payload    JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dce_order_events_order ON public.dce_order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_dce_order_events_type  ON public.dce_order_events(event_type);

-- 5. Triggers for updated_at
DROP TRIGGER IF EXISTS trg_dce_customers_updated_at ON public.dce_customers;
CREATE TRIGGER trg_dce_customers_updated_at
    BEFORE UPDATE ON public.dce_customers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_dce_orders_updated_at ON public.dce_orders;
CREATE TRIGGER trg_dce_orders_updated_at
    BEFORE UPDATE ON public.dce_orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6. Row Level Security
ALTER TABLE public.dce_customers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_order_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Customers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_customers') THEN
    CREATE POLICY service_role_all_dce_customers ON public.dce_customers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_customers') THEN
    CREATE POLICY public_read_dce_customers ON public.dce_customers FOR SELECT USING (true);
  END IF;

  -- Orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_orders') THEN
    CREATE POLICY service_role_all_dce_orders ON public.dce_orders FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_orders') THEN
    CREATE POLICY public_read_dce_orders ON public.dce_orders FOR SELECT USING (true);
  END IF;

  -- Order Items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_order_items') THEN
    CREATE POLICY service_role_all_dce_order_items ON public.dce_order_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_order_items') THEN
    CREATE POLICY public_read_dce_order_items ON public.dce_order_items FOR SELECT USING (true);
  END IF;

  -- Order Events
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_order_events') THEN
    CREATE POLICY service_role_all_dce_order_events ON public.dce_order_events FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_order_events') THEN
    CREATE POLICY public_read_dce_order_events ON public.dce_order_events FOR SELECT USING (true);
  END IF;
END $$;

-- 7. Seed Initial Sample Orders Across Channels (Etsy, Gumroad, Amazon, Direct)
DO $$
DECLARE
    b_pq_id UUID;
    c_sarah_id UUID;
    c_alex_id UUID;
    s_etsy_id UUID;
    s_gumroad_id UUID;
    s_amazon_id UUID;
    s_direct_id UUID;
    o1_id UUID;
    o2_id UUID;
    o3_id UUID;
BEGIN
    -- Lookup Brand & SKUs
    SELECT id INTO b_pq_id FROM public.dce_brands WHERE slug = 'plannerqueen' LIMIT 1;
    SELECT id INTO s_etsy_id FROM public.dce_skus WHERE sku = 'PLNRQN-PDF-ETSY-USD9.99' LIMIT 1;
    SELECT id INTO s_gumroad_id FROM public.dce_skus WHERE sku = 'PLNRQN-PDF-GUMROAD-USD7.99' LIMIT 1;
    SELECT id INTO s_amazon_id FROM public.dce_skus WHERE sku = 'PLNRQN-PRINT-AMAZON-USD14.99' LIMIT 1;
    SELECT id INTO s_direct_id FROM public.dce_skus WHERE sku = 'PLNRQN-BUNDLE-DIRECT-USD19.99' LIMIT 1;

    IF b_pq_id IS NOT NULL THEN
        -- Customers
        INSERT INTO public.dce_customers (email, full_name, channel_identities, total_orders_count, total_spend_usd)
        VALUES 
            ('sarah.miller@example.com', 'Sarah Miller', '{"etsy": "smiller_etsy", "gumroad": "sarah.miller@example.com"}'::jsonb, 2, 17.98),
            ('alex.reed@example.com', 'Alex Reed', '{"amazon": "amz-buyer-alex", "direct": "alex.reed@example.com"}'::jsonb, 2, 34.98)
        ON CONFLICT DO NOTHING;

        SELECT id INTO c_sarah_id FROM public.dce_customers WHERE email = 'sarah.miller@example.com';
        SELECT id INTO c_alex_id FROM public.dce_customers WHERE email = 'alex.reed@example.com';

        -- Order 1: Etsy Sale
        INSERT INTO public.dce_orders (
            channel_code, external_order_id, customer_id, brand_id,
            total_amount, currency, channel_fee, net_amount, status,
            fulfillment_type, raw_payload, placed_at
        ) VALUES (
            'ETSY', 'ETSY-REC-902184', c_sarah_id, b_pq_id,
            9.99, 'USD', 1.15, 8.84, 'COMPLETED',
            'DIGITAL', '{"receipt_id": 902184, "payment_method": "cc"}'::jsonb, now() - INTERVAL '2 days'
        ) ON CONFLICT (channel_code, external_order_id) DO UPDATE SET total_amount = EXCLUDED.total_amount
        RETURNING id INTO o1_id;

        -- Order 2: Gumroad Sale
        INSERT INTO public.dce_orders (
            channel_code, external_order_id, customer_id, brand_id,
            total_amount, currency, channel_fee, net_amount, status,
            fulfillment_type, raw_payload, placed_at
        ) VALUES (
            'GUMROAD', 'GUM-SALE-783921', c_sarah_id, b_pq_id,
            7.99, 'USD', 1.30, 6.69, 'COMPLETED',
            'DIGITAL', '{"sale_id": "783921", "ip_country": "US"}'::jsonb, now() - INTERVAL '1 day'
        ) ON CONFLICT (channel_code, external_order_id) DO UPDATE SET total_amount = EXCLUDED.total_amount
        RETURNING id INTO o2_id;

        -- Order 3: Amazon Physical Sale
        INSERT INTO public.dce_orders (
            channel_code, external_order_id, customer_id, brand_id,
            total_amount, currency, channel_fee, net_amount, status,
            fulfillment_type, tracking_number, shipping_carrier, raw_payload, placed_at
        ) VALUES (
            'AMAZON', '114-8392019-3829104', c_alex_id, b_pq_id,
            14.99, 'USD', 2.25, 12.74, 'DISPATCHED',
            'PHYSICAL', 'TBA9382019482', 'Amazon Logistics', '{"amazon_order_id": "114-8392019-3829104"}'::jsonb, now() - INTERVAL '4 hours'
        ) ON CONFLICT (channel_code, external_order_id) DO UPDATE SET total_amount = EXCLUDED.total_amount
        RETURNING id INTO o3_id;

        -- Order Items
        IF o1_id IS NOT NULL AND s_etsy_id IS NOT NULL THEN
            INSERT INTO public.dce_order_items (order_id, sku_id, external_sku_ref, title, quantity, unit_price, line_total)
            VALUES (o1_id, s_etsy_id, 'ETSY-11829', 'Daily & Weekly Planner GoodNotes Aesthetic Digital Template 2026', 1, 9.99, 9.99)
            ON CONFLICT DO NOTHING;

            INSERT INTO public.dce_order_events (order_id, event_type, new_status, source, payload)
            VALUES (o1_id, 'ORDER_SYNCED', 'COMPLETED', 'poll', '{"note": "Ingested via Etsy Open API v3 receipt poller"}'::jsonb)
            ON CONFLICT DO NOTHING;
        END IF;

        IF o2_id IS NOT NULL AND s_gumroad_id IS NOT NULL THEN
            INSERT INTO public.dce_order_items (order_id, sku_id, external_sku_ref, title, quantity, unit_price, line_total)
            VALUES (o2_id, s_gumroad_id, 'GUM-pqdaily', 'PlannerQueen Digital Daily & Weekly System (PDF Download)', 1, 7.99, 7.99)
            ON CONFLICT DO NOTHING;

            INSERT INTO public.dce_order_events (order_id, event_type, new_status, source, payload)
            VALUES (o2_id, 'WEBHOOK_RECEIVED', 'COMPLETED', 'webhook', '{"note": "Instant Gumroad Ping webhook delivery verified"}'::jsonb)
            ON CONFLICT DO NOTHING;
        END IF;

        IF o3_id IS NOT NULL AND s_amazon_id IS NOT NULL THEN
            INSERT INTO public.dce_order_items (order_id, sku_id, external_sku_ref, title, quantity, unit_price, line_total)
            VALUES (o3_id, s_amazon_id, 'B09XYZABC', 'PlannerQueen Hardcover Daily & Weekly Undated Productivity Journal', 1, 14.99, 14.99)
            ON CONFLICT DO NOTHING;

            INSERT INTO public.dce_order_events (order_id, event_type, old_status, new_status, source, payload)
            VALUES (o3_id, 'STATUS_CHANGE', 'PROCESSING', 'DISPATCHED', 'poll', '{"carrier": "Amazon Logistics", "tracking": "TBA9382019482"}'::jsonb)
            ON CONFLICT DO NOTHING;
        END IF;

    END IF;
END $$;
