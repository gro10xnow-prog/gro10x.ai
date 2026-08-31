-- ─────────────────────────────────────────────────────────────────────────────
-- DigiVault Phase 5D: Customer Ratings & Feedback Schema Migration
-- Migration: 20260908_v4.1_digivault_ratings.sql
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE digi_orders
ADD COLUMN IF NOT EXISTS customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
ADD COLUMN IF NOT EXISTS customer_feedback TEXT;

CREATE INDEX IF NOT EXISTS idx_digi_orders_customer_rating ON digi_orders(customer_rating);
