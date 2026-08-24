-- =============================================================================
-- ⚡ GRO10X AI GROWTH AGENCY — SCHEMA EXTRAS & RUNTIME ALIGNMENT (v4.1)
-- Run this in Supabase SQL Editor to ensure 100% schema alignment across all tools
-- =============================================================================

-- 1. PAYMENT LOGS TABLE
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
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access PaymentLogs" ON public.payment_logs FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- 2. APP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access AppSettings" ON public.app_settings FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- 3. CLIENTS TABLE EXTENDED COLUMNS
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS total_spent TEXT,
  ADD COLUMN IF NOT EXISTS active_campaigns JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pocs JSONB DEFAULT '[]'::jsonb;

-- 4. TASKS TABLE EXTENDED COLUMNS
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'Backlog',
  ADD COLUMN IF NOT EXISTS client TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to TEXT,
  ADD COLUMN IF NOT EXISTS assignee_name TEXT,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS priority_num INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS revisions_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocked_by TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT;

-- 5. PROJECTS TABLE EXTENDED COLUMNS
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS workflow_type TEXT,
  ADD COLUMN IF NOT EXISTS brand_color TEXT,
  ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]'::jsonb;

-- 6. LEADS EXTENDED COLUMNS
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'new';

-- 7. EXPENSES EXTENDED COLUMNS
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS engine_tag TEXT DEFAULT 'overhead',
  ADD COLUMN IF NOT EXISTS employee_id TEXT,
  ADD COLUMN IF NOT EXISTS submitted_by_id TEXT,
  ADD COLUMN IF NOT EXISTS submitted_by TEXT,
  ADD COLUMN IF NOT EXISTS logged_by TEXT,
  ADD COLUMN IF NOT EXISTS tier1_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tier1_approved_by TEXT,
  ADD COLUMN IF NOT EXISTS tier1_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tier2_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tier2_approved_by TEXT,
  ADD COLUMN IF NOT EXISTS tier2_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finance_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS finance_verified_by TEXT,
  ADD COLUMN IF NOT EXISTS finance_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disbursed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS disbursed_by TEXT,
  ADD COLUMN IF NOT EXISTS disbursed_at TIMESTAMPTZ;

-- 8. INVOICES EXTENDED COLUMNS
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS engine_tag TEXT DEFAULT 'engine2',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_date DATE,
  ADD COLUMN IF NOT EXISTS project_name TEXT,
  ADD COLUMN IF NOT EXISTS project_ref TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;

-- 9. PROFILES EXTENDED COLUMNS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'Specialist / Crew',
  ADD COLUMN IF NOT EXISTS salary_type TEXT DEFAULT 'Fixed Monthly',
  ADD COLUMN IF NOT EXISTS join_date DATE,
  ADD COLUMN IF NOT EXISTS leaves_balance INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS casual_leaves_allowed INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS casual_leaves_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sick_leaves_allowed INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS sick_leaves_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weekly_capacity_hours NUMERIC DEFAULT 40,
  ADD COLUMN IF NOT EXISTS agreement_stage TEXT,
  ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS employee_signature TEXT,
  ADD COLUMN IF NOT EXISTS survey_complete BOOLEAN DEFAULT false;
