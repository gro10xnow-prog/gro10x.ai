-- ============================================================
-- PurpleOS v2.5 — Automation Rules Event Name Alignment
-- Created: 2026-08-23
-- Resolves: Event name mismatch between seed rules ('post_approved')
--           and code triggers ('social_post_approved').
-- ============================================================

UPDATE public.automations
SET trigger_on = 'social_post_approved'
WHERE trigger_on = 'post_approved';
