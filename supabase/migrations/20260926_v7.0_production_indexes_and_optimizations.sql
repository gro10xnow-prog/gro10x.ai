-- ============================================================================
-- Migration: 20260926_v7.0_production_indexes_and_optimizations.sql
-- Description: Production Database Indexing, Query Optimization, and Timestamps
-- Engine: GRO10X Multi-Engine Platform & Supabase PostgreSQL
-- ============================================================================

-- 1. Optimized B-Tree & Composite Indexes for High-Velocity Queries

-- Tasks Query Optimization (Kanban, Client Portal, Team MiniApp)
CREATE INDEX IF NOT EXISTS idx_tasks_client_stage ON tasks(client_id, stage);
CREATE INDEX IF NOT EXISTS idx_tasks_priority_due ON tasks(priority, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at_desc ON tasks(created_at DESC);

-- Commercial Invoices Optimization (Finance Ledger, BRAC Bank Reconciliation)
CREATE INDEX IF NOT EXISTS idx_invoices_client_status ON invoices(client_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at_desc ON invoices(created_at DESC);

-- Social Posts Optimization (Content OS, Partner Approvals, Dispatch Queue)
CREATE INDEX IF NOT EXISTS idx_social_posts_client_status ON social_posts(client_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_channel ON social_posts(channel);
CREATE INDEX IF NOT EXISTS idx_social_posts_sched_date ON social_posts(scheduled_date);

-- Support Desk & Defect Tickets (SLA Triage, Priority Escalations)
CREATE INDEX IF NOT EXISTS idx_tickets_client_status ON tickets(client_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at_desc ON tickets(created_at DESC);

-- CRM Leads Pipeline (Scoring, Follow-up Cron, Conversion Analytics)
CREATE INDEX IF NOT EXISTS idx_leads_stage_score ON leads(stage, score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at_desc ON leads(created_at DESC);

-- HR & Operations Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_status_date ON expenses(status, date);
CREATE INDEX IF NOT EXISTS idx_expenses_submitted_by ON expenses(submitted_by);

-- DCE Digital Commerce Empire Orders
CREATE INDEX IF NOT EXISTS idx_dce_orders_brand_status ON dce_orders(brand_slug, status);
CREATE INDEX IF NOT EXISTS idx_dce_orders_created_at_desc ON dce_orders(created_at DESC);

-- Staff Profiles (JWT Role Hydration, Auth Scoping)
CREATE INDEX IF NOT EXISTS idx_profiles_emp_code ON profiles(emp_code);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 2. Automated Universal Updated-At Trigger Function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers Safely to Tables With updated_at
DO $$
DECLARE
  t text;
  tables_to_update text[] := ARRAY['tasks', 'invoices', 'social_posts', 'tickets', 'leads', 'expenses', 'dce_orders'];
BEGIN
  FOREACH t IN ARRAY tables_to_update LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = t 
      AND column_name = 'updated_at'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS set_timestamp_%I ON %I;', t, t);
      EXECUTE format('CREATE TRIGGER set_timestamp_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();', t, t);
    END IF;
  END LOOP;
END $$;
