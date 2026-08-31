-- ==============================================================================
-- DigiVault Phase 4E Database Migration
-- 20260906_v3.9_digivault_phase4e.sql
--
-- Capabilities:
-- 1. Ensure stock_status column on public.digi_products ('available', 'limited', 'out_of_stock')
-- 2. Add customer_contact index on public.digi_orders for rapid CRM customer aggregation
-- 3. Add stock_status index on public.digi_products
-- ==============================================================================

-- 1. Ensure stock_status on digi_products
ALTER TABLE public.digi_products
ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'available';

-- 2. Create index on customer_contact for rapid CRM aggregation
CREATE INDEX IF NOT EXISTS idx_digi_orders_customer_contact
ON public.digi_orders (customer_contact);

-- 3. Create index on stock_status for catalog queries
CREATE INDEX IF NOT EXISTS idx_digi_products_stock_status
ON public.digi_products (stock_status, is_active);

-- 4. Permissions
GRANT ALL ON public.digi_products TO authenticated;
GRANT ALL ON public.digi_products TO service_role;
GRANT ALL ON public.digi_orders TO authenticated;
GRANT ALL ON public.digi_orders TO service_role;
