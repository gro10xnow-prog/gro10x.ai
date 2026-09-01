-- ─────────────────────────────────────────────────────────────────────────────
-- DigiVault Phase 6B: Database Integrity, Triggers & Check Constraints
-- Migration: 20260909_v4.2_database_integrity_and_triggers.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Reusable Trigger Function for Automatic updated_at Synchronization
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Triggers for Automatic updated_at Maintenance
DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.digi_orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON public.digi_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.digi_products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON public.digi_products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_vendors_updated_at ON public.digi_vendors;
CREATE TRIGGER trigger_vendors_updated_at
  BEFORE UPDATE ON public.digi_vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_bot_sessions_updated_at ON public.digi_bot_sessions;
CREATE TRIGGER trigger_bot_sessions_updated_at
  BEFORE UPDATE ON public.digi_bot_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 3. Check Constraints for Lifecycle Enums & Stage Validation
DO $$ 
BEGIN
  -- Payment Status Constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_digi_orders_payment_status') THEN
    ALTER TABLE public.digi_orders
    ADD CONSTRAINT chk_digi_orders_payment_status
    CHECK (payment_status IN ('pending', 'verified', 'rejected'));
  END IF;

  -- Delivery Status Constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_digi_orders_delivery_status') THEN
    ALTER TABLE public.digi_orders
    ADD CONSTRAINT chk_digi_orders_delivery_status
    CHECK (delivery_status IN ('pending', 'delivered'));
  END IF;

  -- Order Stage Constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_digi_orders_order_stage') THEN
    ALTER TABLE public.digi_orders
    ADD CONSTRAINT chk_digi_orders_order_stage
    CHECK (order_stage IN (
      'pending_payment',
      'payment_submitted',
      'payment_verified',
      'procuring',
      'delivered',
      'confirmed_closed',
      'admin_closed',
      'payment_rejected',
      'rejected'
    ));
  END IF;

  -- Product Stock Status Constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_digi_products_stock_status') THEN
    ALTER TABLE public.digi_products
    ADD CONSTRAINT chk_digi_products_stock_status
    CHECK (stock_status IN ('available', 'limited', 'out_of_stock'));
  END IF;
END $$;

-- 4. Foreign Key Safety & Performance Indexes
CREATE INDEX IF NOT EXISTS idx_digi_orders_parent_order_id ON public.digi_orders(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_digi_bot_sessions_updated_at ON public.digi_bot_sessions(updated_at);
