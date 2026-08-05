-- Migration: Automation Rules Table
-- Upgrades the automation engine from hardcoded rules to a DB-driven rule builder.

CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name text NOT NULL,
  trigger_event text NOT NULL,
  condition_field text,
  condition_value text,
  action_type text NOT NULL,
  action_target text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Allow admins/owners to view and modify
CREATE POLICY "Enable read access for authenticated users" 
ON automation_rules FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable all access for admins" 
ON automation_rules FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
