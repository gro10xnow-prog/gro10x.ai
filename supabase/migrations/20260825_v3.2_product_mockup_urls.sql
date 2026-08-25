-- ─────────────────────────────────────────────────────────────────────────────
-- GRO10X Operating System: v3.2 Product Mockups & Vault Assets
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS etsy_listings
ADD COLUMN IF NOT EXISTS mockup_urls text[],
ADD COLUMN IF NOT EXISTS vault_storage_path text,
ADD COLUMN IF NOT EXISTS vault_file_name text,
ADD COLUMN IF NOT EXISTS video_url text;
