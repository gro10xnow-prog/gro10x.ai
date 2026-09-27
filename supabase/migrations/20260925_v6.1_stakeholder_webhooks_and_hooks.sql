-- ============================================================================
-- GRO10X OS Database Migration: v6.1 Stakeholder Webhooks & Lifecycle Hooks
-- File: supabase/migrations/20260925_v6.1_stakeholder_webhooks_and_hooks.sql
-- ============================================================================

-- 1. Webhook Subscriptions Table
CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
    id VARCHAR(64) PRIMARY KEY,
    stakeholder_type VARCHAR(32) NOT NULL, -- 'client', 'affiliate', 'contractor', 'partner', 'internal'
    stakeholder_id VARCHAR(64) NOT NULL,
    target_url TEXT NOT NULL,
    secret VARCHAR(128) NOT NULL,
    events JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_stakeholder ON public.webhook_subscriptions(stakeholder_type, stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_active ON public.webhook_subscriptions(is_active);

-- 2. Webhook Deliveries Execution & Audit Log Table
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id VARCHAR(64) PRIMARY KEY,
    subscription_id VARCHAR(64) REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
    event VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    response_status INT,
    response_body TEXT,
    attempts INT DEFAULT 1,
    status VARCHAR(32) DEFAULT 'pending', -- 'success', 'failed', 'pending'
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_sub ON public.webhook_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON public.webhook_deliveries(event);

-- 3. Row Level Security (RLS) Policies
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_subscriptions' AND policyname = 'Service role full access on webhook_subscriptions') THEN
        CREATE POLICY "Service role full access on webhook_subscriptions" ON public.webhook_subscriptions
            FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_deliveries' AND policyname = 'Service role full access on webhook_deliveries') THEN
        CREATE POLICY "Service role full access on webhook_deliveries" ON public.webhook_deliveries
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;
