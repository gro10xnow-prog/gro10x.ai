-- Migration: Seed Automation Rules
-- Seeds the initial 6 rules extracted from automation.js

INSERT INTO automation_rules (rule_name, trigger_event, condition_field, condition_value, action_type, action_target, active)
VALUES 
('AUT-001 (Editing Telegram Alert)', 'task_stage_change', 'stage', 'Editing', 'notify_telegram', 'editor', true),
('AUT-003 (Won Lead Client Conversion)', 'lead_won', null, null, 'create_client', null, true),
('AUT-004 (Client Review Portal Push)', 'task_stage_change', 'stage', 'Client Review', 'notify_telegram', 'client', true),
('AUT-005 (Payment Receipt Alert)', 'invoice_paid', null, null, 'notify_telegram', 'client', true),
('AUT-006 (Post Approved Alert)', 'social_post_approved', null, null, 'notify_telegram', 'publisher', true),
('AUT-007 (1-Click Dispatch Alert)', 'social_post_dispatch_alert', null, null, 'notify_telegram', 'publisher_or_owner', true)
ON CONFLICT DO NOTHING;
