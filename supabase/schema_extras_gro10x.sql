-- =============================================================================
-- ⚡ GRO10X AI GROWTH AGENCY — SCHEMA EXTRAS & RUNTIME ALIGNMENT
-- Run this in Supabase SQL Editor to ensure 100% schema alignment across all tools
-- =============================================================================

-- 1. PAYMENT LOGS TABLE & VIEW
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id TEXT PRIMARY KEY,
  invoice_id TEXT,
  client_id TEXT,
  client_name TEXT,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'BDT',
  payment_method TEXT DEFAULT 'bKash',
  trx_id TEXT,
  proof_url TEXT,
  verified BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access PaymentLogs" ON public.payment_logs FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- 2. CLIENTS TABLE EXTENDED COLUMNS
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS total_spent TEXT,
  ADD COLUMN IF NOT EXISTS active_campaigns JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pocs JSONB DEFAULT '[]'::jsonb;

-- 3. TASKS TABLE EXTENDED COLUMNS
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'Backlog',
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to TEXT,
  ADD COLUMN IF NOT EXISTS assignee_name TEXT,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS priority_num INTEGER DEFAULT 1;

-- 4. PROJECTS TABLE EXTENDED COLUMNS
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS workflow_type TEXT,
  ADD COLUMN IF NOT EXISTS brand_color TEXT,
  ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]'::jsonb;

-- 5. PROFILES EXTENDED COLUMNS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'Specialist / Crew',
  ADD COLUMN IF NOT EXISTS salary_type TEXT DEFAULT 'Fixed Monthly',
  ADD COLUMN IF NOT EXISTS join_date DATE,
  ADD COLUMN IF NOT EXISTS leaves_balance INTEGER DEFAULT 14;
