-- ============================================================
-- PurpleOS v1.5 — Missing Tables Migration
-- Created: 2026-08-02
-- Adds: page_events, tickets, payment_logs, automations
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. page_events — Frontend analytics tracking
--    (replaces db.json analyticsEvents array)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.page_events (
  id          BIGSERIAL PRIMARY KEY,
  event       VARCHAR(50)  NOT NULL DEFAULT 'page_view',
  label       TEXT         NOT NULL DEFAULT '',
  referrer    TEXT         NOT NULL DEFAULT '',
  utm         TEXT         NOT NULL DEFAULT '',
  ip          VARCHAR(100) NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_events_event     ON public.page_events (event);
CREATE INDEX IF NOT EXISTS idx_page_events_created   ON public.page_events (created_at DESC);

-- ─────────────────────────────────────────────
-- 2. tickets — Support / task tickets
--    (referenced in app.js but table was missing)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tickets (
  id            VARCHAR(30)  PRIMARY KEY,
  title         TEXT         NOT NULL,
  description   TEXT         NOT NULL DEFAULT '',
  submitted_by  TEXT         NOT NULL DEFAULT '',
  assigned_to   TEXT,
  priority      VARCHAR(20)  NOT NULL DEFAULT 'Medium',
  status        VARCHAR(30)  NOT NULL DEFAULT 'Open',
  category      VARCHAR(50)  NOT NULL DEFAULT 'General',
  client_id     VARCHAR(20)  REFERENCES public.clients(id) ON DELETE SET NULL,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status     ON public.tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_submitted  ON public.tickets (submitted_by);
CREATE INDEX IF NOT EXISTS idx_tickets_created    ON public.tickets (created_at DESC);

-- ─────────────────────────────────────────────
-- 3. payment_logs — bKash / manual payment proofs
--    (referenced in db.json paymentLogs key)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id              VARCHAR(50)  PRIMARY KEY,
  invoice_id      VARCHAR(30)  REFERENCES public.invoices(id) ON DELETE SET NULL,
  client_id       VARCHAR(20)  REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name     TEXT         NOT NULL DEFAULT '',
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency        VARCHAR(10)  NOT NULL DEFAULT 'BDT',
  payment_method  VARCHAR(30)  NOT NULL DEFAULT 'bKash',
  trx_id          VARCHAR(50),
  proof_url       TEXT,
  verified        BOOLEAN      NOT NULL DEFAULT FALSE,
  verified_by     TEXT,
  verified_at     TIMESTAMPTZ,
  notes           TEXT         NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_invoice   ON public.payment_logs (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_client    ON public.payment_logs (client_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created   ON public.payment_logs (created_at DESC);

-- ─────────────────────────────────────────────
-- 4. automations — Automation rule definitions
--    (db.json had 'automations' array; only logs
--     table existed in Supabase previously)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automations (
  id          VARCHAR(20)  PRIMARY KEY,
  name        TEXT         NOT NULL,
  trigger_on  VARCHAR(50)  NOT NULL,
  action      VARCHAR(50)  NOT NULL,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  config      JSONB        NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed default automation rules
INSERT INTO public.automations (id, name, trigger_on, action, active) VALUES
  ('AUT-001', 'Task Stage Editing → Telegram Alert to Editor',            'task_stage_change', 'telegram_notify',   TRUE),
  ('AUT-003', 'Lead Won → Auto Create Client CRM Account',                'lead_won',           'create_client',     TRUE),
  ('AUT-004', 'Task Stage Client Review → Telegram Push & Review Room',   'task_stage_change', 'telegram_notify',   TRUE),
  ('AUT-005', 'Invoice Paid → Payment Verification Telegram Push',        'invoice_paid',       'telegram_notify',   TRUE),
  ('AUT-006', 'Social Post Approved by Client → Publisher Notification',  'post_approved',      'telegram_notify',   TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- Disable RLS (consistent with v1.1/v1.2 policy)
-- ─────────────────────────────────────────────
ALTER TABLE public.page_events   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations   DISABLE ROW LEVEL SECURITY;
