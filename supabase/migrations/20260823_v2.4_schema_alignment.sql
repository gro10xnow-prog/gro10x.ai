-- ============================================================
-- PurpleOS v2.4 — Schema Alignment & Foreign Key Integrity
-- Created: 2026-08-23
-- Resolves: Missing reviews client_id/revisions, expenses lifecycle fields,
--           invoices project_ref, client_meetings FK, tasks.assignee_id TEXT.
-- ============================================================

-- 1. REVIEWS TABLE: Add missing client linking & formal revision columns
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS task_id TEXT,
  ADD COLUMN IF NOT EXISTS revision_requested_by TEXT,
  ADD COLUMN IF NOT EXISTS revision_notes TEXT,
  ADD COLUMN IF NOT EXISTS revision_requested_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON public.reviews(client_id);

-- 2. EXPENSES TABLE: Add missing lifecycle tracking & verification columns
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS submitted_via VARCHAR(50) DEFAULT 'web_portal',
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'BDT',
  ADD COLUMN IF NOT EXISTS finance_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS finance_verified_by TEXT,
  ADD COLUMN IF NOT EXISTS finance_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disbursed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS disbursed_by TEXT,
  ADD COLUMN IF NOT EXISTS disbursed_at TIMESTAMPTZ;

-- 3. INVOICES TABLE: Add missing project_ref column
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS project_ref VARCHAR(50);

-- 4. CLIENT_MEETINGS TABLE: Add FK constraint to clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_client_meetings_client' AND table_name = 'client_meetings'
  ) THEN
    ALTER TABLE public.client_meetings
      ADD CONSTRAINT fk_client_meetings_client
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. TASKS TABLE: Widen assignee_id to TEXT for emp_code compatibility ('PBD-001' etc.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assignee_id' AND data_type != 'text'
  ) THEN
    ALTER TABLE public.tasks ALTER COLUMN assignee_id TYPE TEXT USING assignee_id::TEXT;
  END IF;
END $$;
