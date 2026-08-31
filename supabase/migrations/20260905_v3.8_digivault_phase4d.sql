-- ==============================================================================
-- DigiVault Phase 4D Database Migration
-- 20260905_v3.8_digivault_phase4d.sql
--
-- Adds renewal reminder telemetry columns to digi_orders:
-- 1. last_renewal_reminder_at: Timestamp of the last dispatched automated reminder
-- 2. renewal_reminder_count: Number of reminders sent for this subscription
-- 3. idx_digi_orders_renewal_telemetry: Index for sub-millisecond cron queries
-- ==============================================================================

-- 1. Add renewal telemetry columns
ALTER TABLE public.digi_orders
ADD COLUMN IF NOT EXISTS last_renewal_reminder_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS renewal_reminder_count INT DEFAULT 0;

-- 2. Create index for fast renewal cron lookups
CREATE INDEX IF NOT EXISTS idx_digi_orders_renewal_telemetry
ON public.digi_orders (delivery_status, expiry_date, is_renewed);

-- 3. Grant full access on modified columns to authenticated and service roles
GRANT ALL ON public.digi_orders TO authenticated;
GRANT ALL ON public.digi_orders TO service_role;
