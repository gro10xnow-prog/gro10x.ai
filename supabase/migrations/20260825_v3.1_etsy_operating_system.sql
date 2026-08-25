-- ─────────────────────────────────────────────────────────────────────────────
-- GRO10X Operating System: v3.1 Etsy Multi-Store & Catalog Operating Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create table for per-brand OAuth connections
CREATE TABLE IF NOT EXISTS etsy_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id text NOT NULL UNIQUE,
  shop_id bigint,
  shop_name text,
  shop_url text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text,
  connected_by text DEFAULT 'GRO-000',
  connected_at timestamptz DEFAULT now(),
  last_refreshed_at timestamptz,
  status text DEFAULT 'active'
);

-- 2. Create table for individual Etsy listing state & AI pre-listing diagnostics
CREATE TABLE IF NOT EXISTS etsy_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id text NOT NULL,
  product_code text NOT NULL,
  etsy_listing_id bigint UNIQUE,
  etsy_state text DEFAULT 'draft',
  etsy_url text,
  etsy_section_id bigint,
  price_usd numeric(10,2),
  images_uploaded int DEFAULT 0,
  file_attached boolean DEFAULT false,
  listed_at timestamptz,
  last_synced_at timestamptz,
  health_check_passed boolean DEFAULT false,
  health_check_report jsonb,
  UNIQUE(brand_id, product_code)
);

-- 3. Indexes for rapid lookups
CREATE INDEX IF NOT EXISTS idx_etsy_connections_brand_id ON etsy_connections(brand_id);
CREATE INDEX IF NOT EXISTS idx_etsy_listings_brand_product ON etsy_listings(brand_id, product_code);
