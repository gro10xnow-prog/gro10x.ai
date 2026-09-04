-- =============================================================================
-- ⚡ GRO10X CONSOLIDATED MASTER DATABASE SCHEMA (v4.4 Production Upgrade)
-- Execute this entire script in your Supabase SQL Editor (https://supabase.com/dashboard/project/rlgsckzqieikjercfwan/sql/new)
-- 100% Idempotent: Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout.
-- Non-destructive: Existing rows in tasks, clients, profiles, leads, etc. are 100% preserved.
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 2. SERVICES & CATALOG
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  price TEXT DEFAULT '$0',
  description TEXT,
  included_features JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. REVIEWS & PROOFING ENGINE (Review Room 2.0)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  project_name TEXT NOT NULL,
  client TEXT NOT NULL,
  client_id TEXT,
  task_id TEXT,
  active_version TEXT DEFAULT 'v1',
  versions JSONB DEFAULT '["v1"]'::jsonb,
  media_type TEXT DEFAULT 'video',
  media_url TEXT NOT NULL,
  poster_url TEXT,
  resolved_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  revision_requested_by TEXT,
  revision_notes TEXT,
  revision_requested_at TIMESTAMPTZ,
  invoice_released BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON public.reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_project_id ON public.reviews(project_id);

CREATE TABLE IF NOT EXISTS public.review_comments (
  id TEXT PRIMARY KEY,
  review_id TEXT REFERENCES public.reviews(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  author_role TEXT DEFAULT 'Client',
  timestamp TEXT DEFAULT '00:00',
  time_seconds NUMERIC(10,2) DEFAULT 0,
  text TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  drawings JSONB DEFAULT '[]'::jsonb,
  replies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON public.review_comments(review_id);

CREATE TABLE IF NOT EXISTS public.review_drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id TEXT NOT NULL,
  timestamp_sec NUMERIC NOT NULL,
  drawing_data JSONB NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_review_drawings_lookup ON public.review_drawings(review_id, timestamp_sec);

-- =============================================================================
-- 4. HR, LEAVES & ATTENDANCE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.leaves (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  leave_type TEXT NOT NULL DEFAULT 'Casual Leave',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC DEFAULT 1,
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  submitted_via TEXT DEFAULT 'web_portal',
  manager_reviewed_by TEXT,
  reviewed_by TEXT,
  owner_approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leaves_employee_id ON public.leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON public.leaves(status);

CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT,
  name TEXT,
  date DATE DEFAULT CURRENT_DATE,
  clock_in TIMESTAMPTZ DEFAULT NOW(),
  clock_in_time TEXT,
  clock_out TIMESTAMPTZ,
  clock_out_time TEXT,
  status TEXT DEFAULT 'In Studio',
  location TEXT DEFAULT 'Niketon Studio',
  total_hours NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON public.attendance(employee_id, date);

CREATE TABLE IF NOT EXISTS public.eod_reports (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  date DATE DEFAULT CURRENT_DATE,
  tasks_done TEXT,
  completed_tasks TEXT,
  tasks_tomorrow TEXT,
  tomorrow_plan TEXT,
  blockers TEXT DEFAULT 'None',
  mood TEXT DEFAULT '😊 Energized',
  hours_worked NUMERIC DEFAULT 8,
  submitted_via TEXT DEFAULT 'web_portal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eod_emp_date ON public.eod_reports(employee_id, date);

-- =============================================================================
-- 5. HARDWARE & EQUIPMENT ASSETS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  serial_number TEXT,
  category TEXT DEFAULT 'Hardware',
  status TEXT DEFAULT 'Available',
  assigned_to TEXT,
  assigned_employee_code TEXT,
  purchase_date DATE,
  purchase_price NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);

-- =============================================================================
-- 6. AUTH PINS (Phone & Multi-Portal Authentication)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.auth_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  norm_phone TEXT NOT NULL,
  pin TEXT NOT NULL,
  is_temp BOOLEAN DEFAULT true,
  linked_id TEXT,
  linked_type TEXT DEFAULT 'team',
  email TEXT,
  attempts INTEGER DEFAULT 0,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_pins_norm_phone ON public.auth_pins(norm_phone);

-- =============================================================================
-- 7. CONTENT OS & SOCIAL ENGINE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.social_posts (
  id TEXT PRIMARY KEY,
  brand_slug TEXT,
  channel TEXT DEFAULT 'Client Account',
  platform TEXT DEFAULT 'Facebook',
  content_category TEXT DEFAULT 'General',
  content_type TEXT DEFAULT 'Short-form Video',
  target_duration TEXT DEFAULT '30s',
  title TEXT NOT NULL,
  caption TEXT DEFAULT '',
  hashtags TEXT DEFAULT '',
  media_urls JSONB DEFAULT '[]'::jsonb,
  scheduled_date DATE,
  scheduled_time TEXT DEFAULT '18:00',
  assigned_publisher TEXT DEFAULT 'Content Team',
  status TEXT DEFAULT 'Draft',
  veo_prompts JSONB,
  pdf_outline JSONB,
  carousel_slides JSONB,
  spoken_script TEXT,
  hook TEXT,
  cta_text TEXT,
  first_comment TEXT,
  client_id TEXT,
  client_name TEXT,
  client_feedback TEXT,
  revision_history JSONB DEFAULT '[]'::jsonb,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_social_posts_brand ON public.social_posts(brand_slug);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON public.social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_client ON public.social_posts(client_id);

CREATE TABLE IF NOT EXISTS public.social_brands (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  primary_language TEXT DEFAULT 'Bangla + English (Banglish / Spoken)',
  tagline TEXT,
  niche TEXT,
  palette JSONB DEFAULT '["#10b981", "#059669"]'::jsonb,
  fonts TEXT DEFAULT 'Inter',
  tone TEXT,
  mission TEXT,
  standard_hashtags TEXT,
  standard_cta TEXT,
  logo_url TEXT,
  assets JSONB DEFAULT '[]'::jsonb,
  visual_framework JSONB DEFAULT '{}'::jsonb,
  channels JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_social_brands_slug ON public.social_brands(slug);

-- =============================================================================
-- 8. QUOTES & PROPOSALS STUDIO
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.quotes (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  scope TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'Draft',
  valid_until DATE,
  line_items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON public.quotes(client_id);

-- =============================================================================
-- 9. TASK HIERARCHY, LABELS & CUSTOM FIELDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);

CREATE TABLE IF NOT EXISTS public.project_workflows (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  workflow_type TEXT DEFAULT 'video',
  stages JSONB DEFAULT '["Scripting", "Shooting", "Editing", "Client Review", "Approved"]'::jsonb,
  current_stage TEXT DEFAULT 'Scripting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.labels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.task_labels (
  task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  label_id TEXT REFERENCES public.labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

CREATE TABLE IF NOT EXISTS public.task_custom_fields (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  field_type TEXT DEFAULT 'text',
  options JSONB DEFAULT '[]'::jsonb,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.task_custom_field_values (
  task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  field_id TEXT REFERENCES public.task_custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  PRIMARY KEY (task_id, field_id)
);

CREATE TABLE IF NOT EXISTS public.task_templates (
  id TEXT PRIMARY KEY,
  name TEXT,
  title TEXT,
  category TEXT DEFAULT 'video',
  department TEXT DEFAULT 'Production',
  estimated_hours NUMERIC DEFAULT 8,
  tasks JSONB DEFAULT '[]'::jsonb,
  subtasks JSONB DEFAULT '[]'::jsonb,
  labels JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 10. TELEGRAM DIGIVAULT SESSIONS, PAYMENT LOGS & APP SETTINGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.digi_bot_sessions (
  chat_id TEXT PRIMARY KEY,
  lang TEXT DEFAULT 'bn',
  step TEXT DEFAULT 'idle',
  session_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 11. COLUMN ALIGNMENT FOR EXISTING PRODUCTION TABLES
-- =============================================================================

-- 11.1 TASKS TABLE ALIGNMENT
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS client TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS workflow_type TEXT DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS assigned_to TEXT,
  ADD COLUMN IF NOT EXISTS assignee_name TEXT,
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 8,
  ADD COLUMN IF NOT EXISTS logged_hours NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'Backlog',
  ADD COLUMN IF NOT EXISTS priority_num INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS revisions_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocked_by TEXT,
  ADD COLUMN IF NOT EXISTS qc_approved_by TEXT,
  ADD COLUMN IF NOT EXISTS qc_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qc_feedback TEXT,
  ADD COLUMN IF NOT EXISTS qc_rejected_by TEXT,
  ADD COLUMN IF NOT EXISTS qc_rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reassigned_by TEXT,
  ADD COLUMN IF NOT EXISTS reassign_reason TEXT,
  ADD COLUMN IF NOT EXISTS created_by TEXT;

CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_stage ON public.tasks(stage);
CREATE INDEX IF NOT EXISTS idx_tasks_dept ON public.tasks(department);

-- 11.2 EXPENSES TABLE ALIGNMENT
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Tier 1 Pending',
  ADD COLUMN IF NOT EXISTS logged_by TEXT,
  ADD COLUMN IF NOT EXISTS submitted_by TEXT,
  ADD COLUMN IF NOT EXISTS submitted_by_id TEXT,
  ADD COLUMN IF NOT EXISTS submitted_via TEXT DEFAULT 'web_portal',
  ADD COLUMN IF NOT EXISTS engine_tag TEXT DEFAULT 'overhead',
  ADD COLUMN IF NOT EXISTS employee_id TEXT,
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

-- Backfill title & status if null
UPDATE public.expenses SET title = description WHERE title IS NULL AND description IS NOT NULL;
UPDATE public.expenses SET status = 'Tier 1 Pending' WHERE status IS NULL;

-- 11.3 INVOICES TABLE ALIGNMENT
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS project_name TEXT,
  ADD COLUMN IF NOT EXISTS project_ref TEXT,
  ADD COLUMN IF NOT EXISTS issued_date DATE,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_date DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engine_tag TEXT DEFAULT 'engine2';

-- Backfill issued_date from issue_date if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'issue_date') THEN
    UPDATE public.invoices SET issued_date = issue_date::date WHERE issued_date IS NULL AND issue_date IS NOT NULL;
  END IF;
END $$;

-- 11.4 TICKETS TABLE ALIGNMENT
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS ticket_number TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS submitted_by TEXT,
  ADD COLUMN IF NOT EXISTS submitted_by_id TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by TEXT,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Backfill title from subject if title is null
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'subject') THEN
    UPDATE public.tickets SET title = subject WHERE title IS NULL AND subject IS NOT NULL;
  END IF;
END $$;

-- 11.5 PROFILES TABLE ALIGNMENT
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT '🌱 Recruit',
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS bank_info JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS survey_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS survey_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS agreement_stage TEXT,
  ADD COLUMN IF NOT EXISTS agreement_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS employee_signature TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Offline',
  ADD COLUMN IF NOT EXISTS casual_leaves_allowed INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS casual_leaves_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sick_leaves_allowed INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS sick_leaves_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weekly_capacity_hours NUMERIC DEFAULT 40;

-- 11.6 TASK TEMPLATES ALIGNMENT
ALTER TABLE public.task_templates
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Production',
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 8,
  ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_templates' AND column_name = 'name') THEN
    UPDATE public.task_templates SET title = name WHERE title IS NULL AND name IS NOT NULL;
  END IF;
END $$;

-- 11.7 CLIENTS TABLE EXTENSIONS
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS total_spent TEXT,
  ADD COLUMN IF NOT EXISTS active_campaigns JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pocs JSONB DEFAULT '[]'::jsonb;

-- 11.8 PROJECTS TABLE EXTENSIONS
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS workflow_type TEXT,
  ADD COLUMN IF NOT EXISTS brand_color TEXT,
  ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]'::jsonb;

-- 11.9 LEADS TABLE EXTENSIONS
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'new';

-- =============================================================================
-- 12. ROW-LEVEL SECURITY (RLS) & SERVICE-ROLE POLICIES
-- =============================================================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eod_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digi_bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Grant full access to service_role across all public tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Service role full access on %I" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Service role full access on %I" ON public.%I FOR ALL USING (auth.role() = ''service_role'');', tbl, tbl);
  END LOOP;
END $$;

-- Public read access on public services & social brands catalog
DROP POLICY IF EXISTS "Public read services" ON public.services;
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Public read brands" ON public.social_brands;
CREATE POLICY "Public read brands" ON public.social_brands FOR SELECT USING (true);
