-- ============================================================
-- PurpleOS v0.8.0 — Master Database Architecture Fixes & Alignment
-- Created: 2026-08-06
-- Resolves: Code-to-Schema mismatches, missing FK constraints,
--           missing columns, missing indexes, and PostgREST joins.
-- ============================================================

-- 1. ADD MISSING COLUMNS
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS pocs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS budget NUMERIC(12,2) DEFAULT 0.00;

ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.leaves 
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

-- 2. FIX TASK_LABELS FOREIGN KEYS (Enables PostgREST relational joins task_labels -> labels)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_task_labels_label' AND table_name = 'task_labels'
    ) THEN
        ALTER TABLE public.task_labels 
          ADD CONSTRAINT fk_task_labels_label 
          FOREIGN KEY (label_id) REFERENCES public.labels(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_task_labels_task' AND table_name = 'task_labels'
    ) THEN
        ALTER TABLE public.task_labels 
          ADD CONSTRAINT fk_task_labels_task 
          FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. ADD MISSING FOREIGN KEYS & CASCADE DELETE RULES
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_subtasks_task' AND table_name = 'subtasks'
    ) THEN
        ALTER TABLE public.subtasks 
          ADD CONSTRAINT fk_subtasks_task 
          FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_task_cfv_task' AND table_name = 'task_custom_field_values'
    ) THEN
        ALTER TABLE public.task_custom_field_values 
          ADD CONSTRAINT fk_task_cfv_task 
          FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_task_cfv_field' AND table_name = 'task_custom_field_values'
    ) THEN
        ALTER TABLE public.task_custom_field_values 
          ADD CONSTRAINT fk_task_cfv_field 
          FOREIGN KEY (field_id) REFERENCES public.custom_fields(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. B-TREE INDEXES FOR FREQUENTLY FILTERED COLUMNS
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_stage ON public.tasks(stage);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

CREATE INDEX IF NOT EXISTS idx_expenses_submitted_by ON public.expenses(submitted_by_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);

CREATE INDEX IF NOT EXISTS idx_leaves_employee_id ON public.leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON public.leaves(status);

CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON public.review_comments(review_id);
