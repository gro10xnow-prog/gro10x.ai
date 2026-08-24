-- =============================================================================
-- ⚡ GRO10X MIGRATION v2.9 — 5-ENGINE GROWTH ATTRIBUTION
-- Adds engine_tag column to invoices & expenses for automated ARR tracking
-- =============================================================================

-- 1. Invoices Engine Attribution
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS engine_tag TEXT DEFAULT 'engine2';

-- 2. Expenses Engine Attribution
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS engine_tag TEXT DEFAULT 'overhead';
