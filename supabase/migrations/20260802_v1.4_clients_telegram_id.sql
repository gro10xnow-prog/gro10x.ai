-- Phase 5 SQL Migration — Add telegram_id to clients table for Client Bot authentication & routing
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS telegram_id TEXT;
CREATE INDEX IF NOT EXISTS idx_clients_telegram_id ON public.clients (telegram_id);
