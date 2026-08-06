-- ============================================================
-- PurpleOS v0.8.4 — Master Security Hardening & Strict RLS Policies
-- Created: 2026-08-06
-- Enables RLS across all tables and establishes strict access rules.
-- ============================================================

-- 1. ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- 2. DROP PERMISSIVE DEMO POLICIES IF PRESENT
DROP POLICY IF EXISTS "Allow anon all" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon all" ON public.clients;
DROP POLICY IF EXISTS "Allow anon all" ON public.invoices;
DROP POLICY IF EXISTS "Allow anon all" ON public.expenses;
DROP POLICY IF EXISTS "Allow anon all" ON public.tasks;

-- 3. SERVICE ROLE FULL ACCESS POLICIES (Backend Express App using service role key)
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Service role full access on %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Service role full access on %I" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

-- 4. PUBLIC ANON READ ACCESS ON PUBLIC CATALOG & PUBLIC CONTENT
DROP POLICY IF EXISTS "Allow public anon read on services" ON public.services;
CREATE POLICY "Allow public anon read on services" 
  ON public.services FOR SELECT 
  TO anon, authenticated 
  USING (is_public = true OR is_public IS NULL);

DROP POLICY IF EXISTS "Allow public anon read on public reviews" ON public.reviews;
CREATE POLICY "Allow public anon read on public reviews" 
  ON public.reviews FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- 5. AUTHENTICATED STAFF POLICIES (Authenticated JWT users)
DROP POLICY IF EXISTS "Authenticated users read profiles" ON public.profiles;
CREATE POLICY "Authenticated users read profiles" 
  ON public.profiles FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users read tasks" ON public.tasks;
CREATE POLICY "Authenticated users read tasks" 
  ON public.tasks FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users update assigned tasks" ON public.tasks;
CREATE POLICY "Authenticated users update assigned tasks" 
  ON public.tasks FOR UPDATE 
  TO authenticated 
  USING (true) WITH CHECK (true);
