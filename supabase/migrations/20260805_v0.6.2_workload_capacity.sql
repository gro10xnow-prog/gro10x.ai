-- ============================================================
-- PurpleOS v0.6.2 — Team Workload & Capacity Schema
-- Created: 2026-08-05
-- Adds: weekly_capacity_hours column to profiles table
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_capacity_hours NUMERIC(5,2) DEFAULT 40.00;
