-- ============================================================================
-- Migration: 20260913_v5.1_dce_rbac.sql
-- Description: Digital Commerce Engine (DCE) — Granular Scoped RBAC & Team Assignments
-- Tables: dce_roles, dce_team_members, dce_brand_assignments
-- Functions: dce_get_user_role(), dce_user_can_access_brand()
-- ============================================================================

-- 1. Roles Registry
CREATE TABLE IF NOT EXISTS public.dce_roles (
    role_code   TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Seed standard roles
INSERT INTO public.dce_roles (role_code, name, description)
VALUES
    ('SUPER_ADMIN', 'Super Administrator', 'Unrestricted administrative access to all verticals, brands, channels, and finances'),
    ('BRAND_MANAGER', 'Brand Manager', 'Scoped operational access to assigned brands (products, SKUs, inventory, marketing)'),
    ('SUPPORT_AGENT', 'Customer Support Agent', 'Access to Customer 360, orders, and post-sale support ticketing'),
    ('FINANCE_OFFICER', 'Finance Officer', 'Access to transaction reconciliation, marketplace deductions, and vendor disbursements'),
    ('VENDOR_PARTNER', 'Vendor / Creator Partner', 'Restricted portal access to designated catalog items and settlement statements')
ON CONFLICT (role_code) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 2. Team Member Assignments
CREATE TABLE IF NOT EXISTS public.dce_team_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID, -- Links to auth.users if Supabase Auth is active
    email       TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    role_code   TEXT NOT NULL REFERENCES public.dce_roles(role_code) ON DELETE RESTRICT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. Brand Assignments (Many-to-Many: Brand Managers → Brands)
CREATE TABLE IF NOT EXISTS public.dce_brand_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id  UUID NOT NULL REFERENCES public.dce_team_members(id) ON DELETE CASCADE,
    brand_id        UUID NOT NULL REFERENCES public.dce_brands(id) ON DELETE CASCADE,
    assigned_at     TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_dce_member_brand UNIQUE (team_member_id, brand_id)
);

CREATE INDEX IF NOT EXISTS idx_dce_brand_assignments_member ON public.dce_brand_assignments(team_member_id);
CREATE INDEX IF NOT EXISTS idx_dce_brand_assignments_brand  ON public.dce_brand_assignments(brand_id);

-- 4. Helper Function: Get User Role
CREATE OR REPLACE FUNCTION public.dce_get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role_code INTO v_role
    FROM public.dce_team_members
    WHERE user_id = p_user_id AND is_active = true
    LIMIT 1;

    RETURN COALESCE(v_role, 'GUEST');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Helper Function: Check Brand Access
CREATE OR REPLACE FUNCTION public.dce_user_can_access_brand(p_user_id UUID, p_brand_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
    v_assigned BOOLEAN;
BEGIN
    -- Super Admin has access to all brands
    SELECT role_code INTO v_role
    FROM public.dce_team_members
    WHERE user_id = p_user_id AND is_active = true
    LIMIT 1;

    IF v_role = 'SUPER_ADMIN' THEN
        RETURN true;
    END IF;

    -- Brand Manager checks assignments table
    IF v_role = 'BRAND_MANAGER' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.dce_brand_assignments ba
            JOIN public.dce_team_members tm ON ba.team_member_id = tm.id
            WHERE tm.user_id = p_user_id AND ba.brand_id = p_brand_id AND tm.is_active = true
        ) INTO v_assigned;
        RETURN v_assigned;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enable RLS
ALTER TABLE public.dce_roles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_team_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_brand_assignments  ENABLE ROW LEVEL SECURITY;

-- 7. Service Role & Authenticated Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_roles') THEN
    CREATE POLICY service_role_all_dce_roles ON public.dce_roles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_team_members') THEN
    CREATE POLICY service_role_all_dce_team_members ON public.dce_team_members FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_brand_assignments') THEN
    CREATE POLICY service_role_all_dce_brand_assignments ON public.dce_brand_assignments FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_roles') THEN
    CREATE POLICY public_read_dce_roles ON public.dce_roles FOR SELECT USING (true);
  END IF;
END $$;
