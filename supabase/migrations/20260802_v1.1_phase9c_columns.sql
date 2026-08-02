-- ═══════════════════════════════════════════════════════════════════════════
-- PURPLEOS MIGRATION: Phase 9C Schema Additions & RLS Security Alignment
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Expenses Table Columns
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Tier 1 Pending',
  ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS submitted_by_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS tier1_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tier1_approved_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tier1_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tier2_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tier2_approved_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tier2_approved_at TIMESTAMPTZ;

-- 2. Tasks Table Columns
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS qc_approved_by VARCHAR(50),
  ADD COLUMN IF NOT EXISTS qc_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qc_feedback TEXT,
  ADD COLUMN IF NOT EXISTS qc_rejected_by VARCHAR(50),
  ADD COLUMN IF NOT EXISTS qc_rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reassigned_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reassign_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Social Posts Table Columns
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS assigned_publisher VARCHAR(255),
  ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS target_url TEXT,
  ADD COLUMN IF NOT EXISTS client_feedback TEXT,
  ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Quotes Table Columns
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 15,
  ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valid_until DATE,
  ADD COLUMN IF NOT EXISTS terms TEXT;

-- 5. Assets Table Columns
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 6. Invoices Table Columns
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS paid_date DATE,
  ADD COLUMN IF NOT EXISTS project_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS project_ref VARCHAR(50),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 7. RLS Policies: Disable RLS for server-side API direct operations
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves DISABLE ROW LEVEL SECURITY;
