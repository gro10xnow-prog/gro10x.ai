-- =============================================================================
-- ⚡ GRO10X AI GROWTH AGENCY — STAKEHOLDER DATABASE HARMONIZATION (v6.0)
-- Migration: 20260924_v6.0_stakeholder_persistence.sql
-- Description: Comprehensive database persistence for all 5 stakeholder touchpoints:
--              1. Scope Change Orders & Addendums (Clients & Pod Managers)
--              2. Specialist Compute COGS & GPU Claims (Crew Specialists & Finance)
--              3. Retainer Hours Banking & Burn-Down Logs (Clients & Pod Managers)
--              4. Deliverable Disputes & Warranty Freezes (Clients & Leadership)
--              5. Master IP Handover Manifests (Clients & Legal)
--              6. Client CSAT & NPS Showcase Testimonials (Clients & Growth)
--              7. Defect SLA Holdbacks & Escrow Freezes (Crew Contractors & Managers)
--              8. B2B Partner Affiliate Profiles, Conversions & Payouts (Affiliates & Finance)
--              9. AI Sprint Retrospectives & P&L Waterfall Archives (Leadership)
-- =============================================================================

-- 1. EXTEND PROJECTS TABLE
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS cogs_items             JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_cogs             NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dispute_paused_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS handover_signed_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS handover_signed_by     TEXT,
  ADD COLUMN IF NOT EXISTS handover_signatory_role TEXT,
  ADD COLUMN IF NOT EXISTS contractor_payout_bdt  NUMERIC DEFAULT 45000,
  ADD COLUMN IF NOT EXISTS affiliate_id           TEXT,
  ADD COLUMN IF NOT EXISTS ref_code               TEXT;

-- 2. EXTEND TICKETS TABLE
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS sla_holdback           JSONB DEFAULT NULL;

-- 3. EXTEND INVOICES TABLE
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS affiliate_id           TEXT,
  ADD COLUMN IF NOT EXISTS ref_code               TEXT;

-- 4. CREATE CHANGE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.change_orders (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_name    TEXT,
  title           TEXT NOT NULL,
  description     TEXT,
  deliverables    JSONB DEFAULT '[]'::jsonb,
  estimated_days  INTEGER DEFAULT 3,
  fee_bdt         NUMERIC DEFAULT 15000,
  status          VARCHAR(50) DEFAULT 'PENDING_APPROVAL',
  requested_by    TEXT,
  approved_by     TEXT,
  approved_at     TIMESTAMPTZ,
  manager_notes   TEXT,
  invoice_id      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON public.change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON public.change_orders(status);

-- 5. CREATE COMPUTE COGS CLAIMS TABLE
CREATE TABLE IF NOT EXISTS public.cogs_claims (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  item_type       VARCHAR(100) NOT NULL,
  description     TEXT,
  amount_bdt      NUMERIC NOT NULL,
  receipt_url     TEXT,
  claimed_by      TEXT,
  claim_date      DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cogs_claims_project_id ON public.cogs_claims(project_id);
CREATE INDEX IF NOT EXISTS idx_cogs_claims_claim_date ON public.cogs_claims(claim_date);

-- 6. CREATE RETAINER BANKS & HOURS LOGS TABLES
CREATE TABLE IF NOT EXISTS public.retainer_banks (
  project_id            TEXT PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  total_purchased_hours NUMERIC DEFAULT 40,
  rollover_hours        NUMERIC DEFAULT 0,
  hourly_rate_usd       NUMERIC DEFAULT 45,
  billing_cycle_start   TIMESTAMPTZ,
  billing_cycle_end     TIMESTAMPTZ,
  status                VARCHAR(50) DEFAULT 'healthy',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.retainer_hours_logs (
  id               TEXT PRIMARY KEY,
  project_id       TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  hours            NUMERIC NOT NULL,
  task_description TEXT,
  category         VARCHAR(50) DEFAULT 'ai_development',
  deliverable_id   TEXT,
  logged_by        TEXT,
  logged_at        TIMESTAMPTZ DEFAULT NOW(),
  notes            TEXT
);
CREATE INDEX IF NOT EXISTS idx_retainer_hours_project ON public.retainer_hours_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_retainer_hours_logged_at ON public.retainer_hours_logs(logged_at);

-- 7. CREATE HANDOVER MANIFESTS TABLE
CREATE TABLE IF NOT EXISTS public.handover_manifests (
  project_id          TEXT PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  manifest_data       JSONB NOT NULL,
  ip_transfer_status  VARCHAR(50) DEFAULT 'IRREVOCABLY_ASSIGNED',
  signed_at           TIMESTAMPTZ,
  signed_by           TEXT,
  signatory_role      TEXT,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CREATE PROJECT DISPUTES TABLE
CREATE TABLE IF NOT EXISTS public.project_disputes (
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reason                VARCHAR(100),
  description           TEXT,
  submitted_by          TEXT,
  requested_remedy      VARCHAR(50),
  status                VARCHAR(50) DEFAULT 'OPEN',
  dispute_paused_at     TIMESTAMPTZ,
  resolution_type       VARCHAR(50),
  resolution_notes      TEXT,
  extension_days_added  INTEGER DEFAULT 0,
  resolved_by           TEXT,
  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_disputes_project_id ON public.project_disputes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_disputes_status ON public.project_disputes(status);

-- 9. CREATE CLIENT TESTIMONIALS TABLE
CREATE TABLE IF NOT EXISTS public.client_testimonials (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT,
  project_name        TEXT,
  client_display_name TEXT,
  client_role         TEXT,
  client_company      TEXT,
  csat_rating         INTEGER DEFAULT 5,
  nps_score           INTEGER DEFAULT 10,
  review_text         TEXT,
  video_url           TEXT,
  consent_showcase    BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_testimonials_consent ON public.client_testimonials(consent_showcase);

-- 10. CREATE SLA HOLDBACKS TABLE
CREATE TABLE IF NOT EXISTS public.sla_holdbacks (
  holdback_id           TEXT PRIMARY KEY,
  ticket_id             TEXT NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  project_id            TEXT,
  contractor_id         TEXT,
  holdback_percent      NUMERIC DEFAULT 15,
  reason                TEXT,
  status                VARCHAR(50) DEFAULT 'HELD_IN_ESCROW',
  remediation_required  TEXT,
  applied_at            TIMESTAMPTZ DEFAULT NOW(),
  applied_by            TEXT,
  resolved_at           TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sla_holdbacks_ticket ON public.sla_holdbacks(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sla_holdbacks_contractor ON public.sla_holdbacks(contractor_id);

-- 11. CREATE B2B PARTNER AFFILIATES & CONVERSIONS TABLES
CREATE TABLE IF NOT EXISTS public.affiliates (
  id                      TEXT PRIMARY KEY,
  ref_code                TEXT UNIQUE NOT NULL,
  name                    TEXT NOT NULL,
  email                   TEXT,
  phone                   TEXT,
  sprint_rate             NUMERIC DEFAULT 0.10,
  retainer_rate           NUMERIC DEFAULT 0.15,
  clicks                  INTEGER DEFAULT 0,
  leads_qualified         INTEGER DEFAULT 0,
  deals_closed            INTEGER DEFAULT 0,
  total_earned_bdt        NUMERIC DEFAULT 0,
  paid_out_bdt            NUMERIC DEFAULT 0,
  pending_balance_bdt     NUMERIC DEFAULT 0,
  min_payout_threshold_bdt NUMERIC DEFAULT 5000,
  settlement_account      JSONB,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_affiliates_ref_code ON public.affiliates(ref_code);

CREATE TABLE IF NOT EXISTS public.affiliate_conversions (
  id                    TEXT PRIMARY KEY,
  affiliate_id          TEXT NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  invoice_id            TEXT,
  project_id            TEXT,
  deal_type             VARCHAR(50),
  contract_value_bdt    NUMERIC,
  commission_rate       NUMERIC,
  commission_earned_bdt NUMERIC,
  status                VARCHAR(50) DEFAULT 'Accrued',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aff_conversions_aff_id ON public.affiliate_conversions(affiliate_id);

CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id                TEXT PRIMARY KEY,
  affiliate_id      TEXT NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount_bdt        NUMERIC NOT NULL,
  status            VARCHAR(50) DEFAULT 'Disbursed',
  settlement_rail   TEXT DEFAULT 'BRAC Bank Limited',
  transaction_ref   TEXT,
  notes             TEXT,
  requested_at      TIMESTAMPTZ DEFAULT NOW(),
  disbursed_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aff_payouts_aff_id ON public.affiliate_payouts(affiliate_id);

-- 12. CREATE SPRINT RETROSPECTIVES TABLE
CREATE TABLE IF NOT EXISTS public.sprint_retrospectives (
  project_id                    TEXT PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  retrospective_data            JSONB NOT NULL,
  velocity_target_days          INTEGER DEFAULT 14,
  actual_duration_days          INTEGER DEFAULT 12,
  on_time_delivery              BOOLEAN DEFAULT true,
  gross_revenue_bdt             NUMERIC DEFAULT 0,
  total_cogs_bdt                NUMERIC DEFAULT 0,
  realized_gross_margin_percent VARCHAR(20) DEFAULT '80%',
  generated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.change_orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogs_claims           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retainer_banks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retainer_hours_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_manifests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_disputes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_testimonials   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_holdbacks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_retrospectives ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Service-role full access policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_change_orders') THEN
    CREATE POLICY service_role_all_change_orders ON public.change_orders FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_cogs_claims') THEN
    CREATE POLICY service_role_all_cogs_claims ON public.cogs_claims FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_retainer_banks') THEN
    CREATE POLICY service_role_all_retainer_banks ON public.retainer_banks FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_retainer_hours_logs') THEN
    CREATE POLICY service_role_all_retainer_hours_logs ON public.retainer_hours_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_handover_manifests') THEN
    CREATE POLICY service_role_all_handover_manifests ON public.handover_manifests FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_project_disputes') THEN
    CREATE POLICY service_role_all_project_disputes ON public.project_disputes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_client_testimonials') THEN
    CREATE POLICY service_role_all_client_testimonials ON public.client_testimonials FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_sla_holdbacks') THEN
    CREATE POLICY service_role_all_sla_holdbacks ON public.sla_holdbacks FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_affiliates') THEN
    CREATE POLICY service_role_all_affiliates ON public.affiliates FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_affiliate_conversions') THEN
    CREATE POLICY service_role_all_affiliate_conversions ON public.affiliate_conversions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_affiliate_payouts') THEN
    CREATE POLICY service_role_all_affiliate_payouts ON public.affiliate_payouts FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_sprint_retros') THEN
    CREATE POLICY service_role_all_sprint_retros ON public.sprint_retrospectives FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Public read policies for consented testimonials
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_client_testimonials') THEN
    CREATE POLICY public_read_client_testimonials ON public.client_testimonials FOR SELECT USING (consent_showcase = true);
  END IF;
END $$;

-- 14. SEED CANONICAL B2B AFFILIATE IF ABSENT
INSERT INTO public.affiliates (
  id, ref_code, name, email, phone, sprint_rate, retainer_rate, clicks, leads_qualified, deals_closed,
  total_earned_bdt, paid_out_bdt, pending_balance_bdt, min_payout_threshold_bdt, settlement_account
) VALUES (
  'AFF-TANVIR', 'AFF-TANVIR', 'Tanvir Ahmed', 'tanvir@partner.gro10x.ai', '+8801712250049',
  0.10, 0.15, 142, 8, 3, 32500, 15000, 17500, 5000,
  jsonb_build_object(
    'type', 'BRAC Bank Limited',
    'bankName', 'BRAC Bank Limited',
    'accountName', 'Neoncore Tech Solution',
    'accountNumber', '2081636480001',
    'branch', 'Mohakhali Branch, Dhaka',
    'routing', '060263290'
  )
) ON CONFLICT (ref_code) DO NOTHING;
