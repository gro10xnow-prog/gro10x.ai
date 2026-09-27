-- =============================================================================
-- ⚡ GRO10X MIGRATION v4.4 — CHROME EXTENSIONS & PRODUCT SCOUT PIPELINE
-- Creates:
-- 1. chrome_extensions: Registry of internal & public Chrome extensions
-- 2. product_suggestions: Scraped e-commerce products & inspiration queue
-- 3. product-screenshots storage bucket & RLS policies
-- =============================================================================

-- 1. Chrome Extensions Registry Table
CREATE TABLE IF NOT EXISTS chrome_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'internal', -- 'internal' | 'public'
  status TEXT DEFAULT 'in_dev', -- 'in_dev' | 'active' | 'store_ready' | 'published'
  version TEXT DEFAULT '1.0.0',
  target_users TEXT DEFAULT 'All DBMs',
  notes TEXT,
  icon TEXT DEFAULT '🧩',
  folder_path TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Product Suggestions (Inspiration & Scraper Queue) Table
CREATE TABLE IF NOT EXISTS product_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  domain TEXT,
  product_title TEXT,
  price TEXT,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  image_urls JSONB DEFAULT '[]'::jsonb,
  reviews_count INTEGER DEFAULT 0,
  star_rating NUMERIC(3,1) DEFAULT 0.0,
  tags JSONB DEFAULT '[]'::jsonb,
  seller_name TEXT,
  product_type TEXT DEFAULT 'unknown', -- 'digital' | 'physical' | 'service' | 'unknown'
  screenshot_url TEXT,
  raw_data JSONB DEFAULT '{}'::jsonb,
  ai_summary TEXT,
  ai_status TEXT DEFAULT 'pending', -- 'pending' | 'analysed' | 'failed'
  brand_id INTEGER, -- NULL until assigned to one of the 13 brands
  captured_by TEXT, -- Email or Name of the team member
  status TEXT DEFAULT 'suggestion', -- 'suggestion' | 'approved' | 'in_progress' | 'rejected'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE chrome_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_suggestions ENABLE ROW LEVEL SECURITY;

-- Read policies: Authenticated users and anon can view extensions registry
DROP POLICY IF EXISTS "Allow read chrome_extensions" ON chrome_extensions;
CREATE POLICY "Allow read chrome_extensions" ON chrome_extensions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated on chrome_extensions" ON chrome_extensions;
CREATE POLICY "Allow all for authenticated on chrome_extensions" ON chrome_extensions
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Product Suggestions policies
DROP POLICY IF EXISTS "Allow read product_suggestions" ON product_suggestions;
CREATE POLICY "Allow read product_suggestions" ON product_suggestions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert product_suggestions" ON product_suggestions;
CREATE POLICY "Allow insert product_suggestions" ON product_suggestions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update product_suggestions" ON product_suggestions;
CREATE POLICY "Allow update product_suggestions" ON product_suggestions
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow delete product_suggestions" ON product_suggestions;
CREATE POLICY "Allow delete product_suggestions" ON product_suggestions
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 4. Storage Bucket Setup for Screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-screenshots',
  'product-screenshots',
  true,
  15728640, -- 15MB
  ARRAY['image/png','image/jpeg','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp'];

DROP POLICY IF EXISTS "Public read product screenshots" ON storage.objects;
CREATE POLICY "Public read product screenshots" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-screenshots');

DROP POLICY IF EXISTS "Anyone can upload product screenshots" ON storage.objects;
CREATE POLICY "Anyone can upload product screenshots" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-screenshots');

-- 5. Seed Initial 3 Extensions
INSERT INTO chrome_extensions (name, slug, description, type, status, version, target_users, notes, icon, folder_path, features)
VALUES
  (
    'GRO10X DBM Copilot',
    'gro10x-dbm-copilot',
    'Side-panel AI assistant for Digital Brand Managers. Automates prompt generation, catalog tracking, and team workflow.',
    'internal',
    'in_dev',
    '0.2.0',
    'All DBMs',
    'Architecture under rebuild for tighter integration with Supabase and new studio flow.',
    '🤖',
    'extension/gro10x-dbm-copilot',
    '["Batch AI prompting", "Etsy listing assistant", "WhatsApp outreach automation", "Social media publisher"]'::jsonb
  ),
  (
    'GRO10X QA Runner',
    'gro10x-qa-runner',
    'Automated testing extension for running comprehensive browser QA suites across all GRO10X micro-apps and portals.',
    'internal',
    'active',
    '1.0.0',
    'QA & Engineering',
    'Active test runner for end-to-end regression testing.',
    '🧪',
    'extension/gro10x-qa-runner',
    '["Test suite runner", "Regression report generator", "Live error harvester", "Portal health checks"]'::jsonb
  ),
  (
    'GRO10X Product Scout',
    'gro10x-product-scout',
    'Universal e-commerce product inspiration scraper. Captures full-page scrolling screenshots and extracts product metadata into Supabase suggestions.',
    'internal',
    'in_dev',
    '1.0.0',
    'All DBMs & Founders',
    'Brand-agnostic inspiration collector. Saves directly to Product Suggestions queue for batch AI analysis.',
    '📸',
    'extension/gro10x-product-scout',
    '["Full-page scroll screenshot", "Auto metadata extractor (Title, Price, Tags, Reviews)", "Multi-platform support (Etsy, Amazon, Shopify, etc.)", "Direct Supabase sync"]'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  version = EXCLUDED.version,
  target_users = EXCLUDED.target_users,
  notes = EXCLUDED.notes,
  icon = EXCLUDED.icon,
  folder_path = EXCLUDED.folder_path,
  features = EXCLUDED.features,
  updated_at = now();
