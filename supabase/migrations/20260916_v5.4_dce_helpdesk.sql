-- ============================================================================
-- Migration: 20260916_v5.4_dce_helpdesk.sql
-- Description: DCE Phase 3 — Post-Sale Support Helpdesk Ticketing System
-- Tables: dce_support_tickets, dce_ticket_messages
-- Dependencies: dce_orders, dce_customers, dce_brands (v5.0, v5.2)
-- ============================================================================

-- 1. SUPPORT TICKETS (Post-sale, linked to orders with SLA tracking)
CREATE TABLE IF NOT EXISTS public.dce_support_tickets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_ref      TEXT UNIQUE NOT NULL,     -- e.g. TKT-2026-09-0001
    order_id        UUID REFERENCES public.dce_orders(id) ON DELETE SET NULL,
    customer_id     UUID REFERENCES public.dce_customers(id) ON DELETE SET NULL,
    brand_id        UUID REFERENCES public.dce_brands(id) ON DELETE SET NULL,
    subject         TEXT NOT NULL,
    description     TEXT NOT NULL,
    category        TEXT NOT NULL DEFAULT 'GENERAL'
                        CHECK (category IN (
                            'GENERAL','ACCESS_ISSUE','REFUND_REQUEST',
                            'WRONG_ITEM','TRACKING','RENEWAL','OTHER'
                        )),
    priority        TEXT NOT NULL DEFAULT 'NORMAL'
                        CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
    status          TEXT NOT NULL DEFAULT 'OPEN'
                        CHECK (status IN (
                            'OPEN','IN_PROGRESS','AWAITING_CUSTOMER','RESOLVED','CLOSED'
                        )),
    assigned_to     TEXT,
    sla_deadline_at TIMESTAMPTZ,              -- computed on creation from priority
    resolved_at     TIMESTAMPTZ,
    resolution_note TEXT,
    source          TEXT DEFAULT 'email'
                        CHECK (source IN ('email','telegram','direct','manual')),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dce_tickets_order    ON public.dce_support_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_dce_tickets_customer ON public.dce_support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_dce_tickets_status   ON public.dce_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_dce_tickets_priority ON public.dce_support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_dce_tickets_brand    ON public.dce_support_tickets(brand_id);
CREATE INDEX IF NOT EXISTS idx_dce_tickets_sla      ON public.dce_support_tickets(sla_deadline_at);

-- 2. TICKET MESSAGES (Reply thread per ticket)
CREATE TABLE IF NOT EXISTS public.dce_ticket_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID NOT NULL REFERENCES public.dce_support_tickets(id) ON DELETE CASCADE,
    author_type TEXT NOT NULL DEFAULT 'CUSTOMER'
                    CHECK (author_type IN ('CUSTOMER','AGENT','SYSTEM','BOT')),
    author_id   TEXT,
    body        TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dce_ticket_messages_ticket ON public.dce_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_dce_ticket_messages_author ON public.dce_ticket_messages(author_type);

-- 3. Sequence for auto-incrementing ticket ref numbers
CREATE SEQUENCE IF NOT EXISTS dce_ticket_ref_seq START 1;

-- 4. Function to generate ticket ref on INSERT
CREATE OR REPLACE FUNCTION generate_dce_ticket_ref()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_ref IS NULL OR NEW.ticket_ref = '' THEN
        NEW.ticket_ref := 'TKT-' || TO_CHAR(now(), 'YYYY-MM') || '-' ||
                          LPAD(NEXTVAL('dce_ticket_ref_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dce_ticket_ref ON public.dce_support_tickets;
CREATE TRIGGER trg_dce_ticket_ref
    BEFORE INSERT ON public.dce_support_tickets
    FOR EACH ROW EXECUTE FUNCTION generate_dce_ticket_ref();

-- 5. Function to auto-compute SLA deadline from priority on INSERT
CREATE OR REPLACE FUNCTION compute_dce_ticket_sla()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sla_deadline_at IS NULL THEN
        NEW.sla_deadline_at := CASE NEW.priority
            WHEN 'URGENT' THEN now() + INTERVAL '1 hour'
            WHEN 'HIGH'   THEN now() + INTERVAL '4 hours'
            WHEN 'NORMAL' THEN now() + INTERVAL '24 hours'
            WHEN 'LOW'    THEN now() + INTERVAL '72 hours'
            ELSE now() + INTERVAL '24 hours'
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dce_ticket_sla ON public.dce_support_tickets;
CREATE TRIGGER trg_dce_ticket_sla
    BEFORE INSERT ON public.dce_support_tickets
    FOR EACH ROW EXECUTE FUNCTION compute_dce_ticket_sla();

-- 6. updated_at trigger for tickets
DROP TRIGGER IF EXISTS trg_dce_support_tickets_updated_at ON public.dce_support_tickets;
CREATE TRIGGER trg_dce_support_tickets_updated_at
    BEFORE UPDATE ON public.dce_support_tickets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. Row Level Security
ALTER TABLE public.dce_support_tickets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_ticket_messages  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_support_tickets') THEN
    CREATE POLICY service_role_all_dce_support_tickets ON public.dce_support_tickets FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_support_tickets') THEN
    CREATE POLICY public_read_dce_support_tickets ON public.dce_support_tickets FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_dce_ticket_messages') THEN
    CREATE POLICY service_role_all_dce_ticket_messages ON public.dce_ticket_messages FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_dce_ticket_messages') THEN
    CREATE POLICY public_read_dce_ticket_messages ON public.dce_ticket_messages FOR SELECT USING (true);
  END IF;
END $$;

-- 8. Seed sample tickets for testing
DO $$
DECLARE
    o1_id UUID;
    c1_id UUID;
    b1_id UUID;
    tk1_id UUID;
BEGIN
    SELECT id INTO o1_id FROM public.dce_orders  LIMIT 1;
    SELECT id INTO c1_id FROM public.dce_customers LIMIT 1;
    SELECT id INTO b1_id FROM public.dce_brands WHERE slug = 'plannerqueen' LIMIT 1;

    IF c1_id IS NOT NULL AND b1_id IS NOT NULL THEN
        INSERT INTO public.dce_support_tickets
            (order_id, customer_id, brand_id, subject, description, category, priority, status, source)
        VALUES
            (o1_id, c1_id, b1_id,
             'Cannot access my downloaded planner template',
             'Hi, I purchased the PlannerQueen PDF planner 2 days ago but the download link in my email shows an error page. Please help.',
             'ACCESS_ISSUE', 'HIGH', 'OPEN', 'email')
        ON CONFLICT DO NOTHING
        RETURNING id INTO tk1_id;

        IF tk1_id IS NOT NULL THEN
            INSERT INTO public.dce_ticket_messages (ticket_id, author_type, body)
            VALUES
                (tk1_id, 'CUSTOMER', 'Hi, I purchased the PlannerQueen PDF planner 2 days ago but the download link in my email shows an error page. Please help.'),
                (tk1_id, 'AGENT', 'Hi Sarah! Thanks for reaching out. I can see your order is confirmed. I''m generating a new download link for you now — please allow 5 minutes.')
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;
