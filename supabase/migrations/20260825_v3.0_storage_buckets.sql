-- =============================================================================
-- ⚡ GRO10X MIGRATION v3.0 — STORAGE BUCKETS PROVISIONING & RLS POLICIES
-- Creates and configures all 5 storage buckets: expenses, avatars, deliverables, payment-proofs, review-assets
-- =============================================================================

-- 1. Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('expenses',       'expenses',       false, 10485760,  ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('avatars',        'avatars',        true,  5242880,   ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('deliverables',   'deliverables',   false, 524288000, ARRAY['video/mp4','video/quicktime','image/jpeg','image/png','image/webp']),
  ('payment-proofs', 'payment-proofs', false, 10485760,  ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('review-assets',  'review-assets',  false, 524288000, ARRAY['video/mp4','video/quicktime','image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Avatars public read policy
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
CREATE POLICY "Public avatar access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 3. Service role full access on all buckets
DROP POLICY IF EXISTS "Service role storage manager" ON storage.objects;
CREATE POLICY "Service role storage manager" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Authenticated users upload to avatars
DROP POLICY IF EXISTS "Authenticated users upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- 5. Authenticated staff/clients upload payment proofs
DROP POLICY IF EXISTS "Users upload payment proofs" ON storage.objects;
CREATE POLICY "Users upload payment proofs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');
