-- =============================================================================
-- ⚡ GRO10X AI GROWTH AGENCY — MASTER DATABASE SCHEMA (v4.0)
-- Copy & Paste this entire file into Supabase SQL Editor -> Run (F5)
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'specialist', 'team', 'client');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Team & Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emp_code TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'specialist',
  department TEXT,
  phone TEXT,
  telegram_id TEXT UNIQUE,
  base_salary NUMERIC DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  pin_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LEADS TABLE (CRM & Strategy Inquiries)
CREATE TABLE IF NOT EXISTS public.leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_interest TEXT,
  source TEXT DEFAULT 'Landing Page',
  status TEXT DEFAULT 'new',
  currency TEXT DEFAULT 'USD',
  budget TEXT,
  value NUMERIC DEFAULT 0,
  score INTEGER DEFAULT 50,
  notes TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  telegram_id TEXT,
  status TEXT DEFAULT 'active',
  retainer_tier TEXT,
  retainer_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  budget NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  start_date DATE,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TASKS TABLE (Kanban & Sprint Execution)
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  assignee_id TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  estimated_hours NUMERIC DEFAULT 0,
  due_date TIMESTAMPTZ,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES public.invoices(id) ON DELETE SET NULL,
  client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  method TEXT DEFAULT 'Bank Transfer',
  status TEXT DEFAULT 'completed',
  reference TEXT,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. EXPENSES TABLE (Lean Cost Cap Tracking)
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  vendor TEXT,
  date DATE DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TICKETS TABLE (Client Support)
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. REVIEW ROOM ASSETS (Creative Video & Art Proofing)
CREATE TABLE IF NOT EXISTS public.review_items (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  asset_type TEXT DEFAULT 'video',
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_review',
  client_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. CUSTOM FIELDS & TASK TEMPLATES
CREATE TABLE IF NOT EXISTS public.custom_fields (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  options JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.task_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AUTOMATION RULES
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. ENABLE ROW LEVEL SECURITY & OPEN SERVICE ROLE ACCESS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- Allow service role full bypass (Standard Supabase Backend Pattern)
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Profiles" ON public.profiles FOR ALL USING (true);
  CREATE POLICY "Service Role Full Access Leads" ON public.leads FOR ALL USING (true);
  CREATE POLICY "Service Role Full Access Clients" ON public.clients FOR ALL USING (true);
  CREATE POLICY "Service Role Full Access Projects" ON public.projects FOR ALL USING (true);
  CREATE POLICY "Service Role Full Access Tasks" ON public.tasks FOR ALL USING (true);
  CREATE POLICY "Service Role Full Access Invoices" ON public.invoices FOR ALL USING (true);
  CREATE POLICY "Service Role Full Access Payments" ON public.payments FOR ALL USING (true);
  CREATE POLICY "Service Role Full Access Expenses" ON public.expenses FOR ALL USING (true);
  CREATE POLICY "Service Role Full Access Tickets" ON public.tickets FOR ALL USING (true);
  CREATE POLICY "Service Role Full Access ReviewItems" ON public.review_items FOR ALL USING (true);
  CREATE POLICY "Service Role Full Access CustomFields" ON public.custom_fields FOR ALL USING (true);
  CREATE POLICY "Service Role Full Access TaskTemplates" ON public.task_templates FOR ALL USING (true);
  CREATE POLICY "Service Role Full Access AutomationRules" ON public.automation_rules FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- 16. INSERT INITIAL ADMIN SEED PROFILE
INSERT INTO public.profiles (emp_code, name, email, role, department, phone, is_verified)
VALUES 
  ('GRO-001', 'Firoz Uddin Ahmed', 'gro10xnow@gmail.com', 'owner', 'Executive Leadership', '+8801708459008', true)
ON CONFLICT (emp_code) DO UPDATE 
SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role, phone = EXCLUDED.phone;
