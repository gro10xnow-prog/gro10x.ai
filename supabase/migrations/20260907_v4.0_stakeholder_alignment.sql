-- ============================================================================
-- GRO10X Database Schema Alignment & Indexing Migration v4.0
-- Target: Supabase PostgreSQL
-- Focus: Stakeholder query performance (Admin, DBM, DigiVault Customer)
-- ============================================================================

-- 1. High-Performance Indexes for DigiVault Orders & Tracking Lookups
CREATE INDEX IF NOT EXISTS idx_digi_orders_order_number ON public.digi_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_digi_orders_phone ON public.digi_orders(phone);
CREATE INDEX IF NOT EXISTS idx_digi_orders_order_stage ON public.digi_orders(order_stage);
CREATE INDEX IF NOT EXISTS idx_digi_orders_created_at ON public.digi_orders(created_at DESC);

-- 2. DigiVault Order Timeline Lookup Index
CREATE INDEX IF NOT EXISTS idx_digi_order_timeline_order_id ON public.digi_order_timeline(order_id);

-- 3. Review Room Comments & Drawings Indexes
CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON public.review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_resolved ON public.review_comments(resolved);

-- 4. Canonical Auth PINs Table Optimization
CREATE INDEX IF NOT EXISTS idx_auth_pins_norm_phone ON public.auth_pins(norm_phone);
CREATE INDEX IF NOT EXISTS idx_auth_pins_linked_id ON public.auth_pins(linked_id);

-- 5. App Settings Key-Value Quick Access Index
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);
CREATE INDEX IF NOT EXISTS idx_app_settings_updated_at ON public.app_settings(updated_at DESC);

-- 6. Ensure default RLS security policies allowing authenticated operations
ALTER TABLE public.digi_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digi_order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'digi_orders' AND policyname = 'Public tracking read access on digi_orders'
  ) THEN
    CREATE POLICY "Public tracking read access on digi_orders" ON public.digi_orders FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'digi_orders' AND policyname = 'Service role update on digi_orders'
  ) THEN
    CREATE POLICY "Service role update on digi_orders" ON public.digi_orders FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'Allow service role all on app_settings'
  ) THEN
    CREATE POLICY "Allow service role all on app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'auth_pins' AND policyname = 'Allow service role all on auth_pins'
  ) THEN
    CREATE POLICY "Allow service role all on auth_pins" ON public.auth_pins FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
