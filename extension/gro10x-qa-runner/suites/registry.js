/**
 * GRO10X QA Automation Runner - Central Platform & Page Registry
 * ─────────────────────────────────────────────────────────────────────────────
 * Organizes tests in a 3-tier hierarchy:
 * Platform (Tier 1) ➔ Page / Tab (Tier 2) ➔ [🚀 E2E Workflows | 🔍 Health Audit] (Tier 3)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const GRO10X_REGISTRY = {
  admin: {
    id: 'admin',
    name: '🏢 Admin Command Center OS',
    baseUrl: '/app',
    containerSelector: '#app-view',
    description: 'Enterprise agency management system with 22 modular operational tabs.',
    pages: [
      { id: 'dashboard', name: '📊 Executive Overview', hash: '#dashboard', auditSuiteId: 'dashboard', workflows: [] },
      { id: 'engines', name: '🚀 5-Engine Growth Operations', hash: '#engines', auditSuiteId: 'engines', workflows: [] },
      { id: 'platforms', name: '🏗️ Platform Portfolio', hash: '#platforms', auditSuiteId: 'platforms', workflows: ['workflow_platforms_registry_cycle'] },
      { id: 'gigs', name: '⚡ Marketplace Gig Studio', hash: '#gigs', auditSuiteId: 'gigs', workflows: [] },
      { id: 'analytics', name: '📈 Agency Analytics', hash: '#analytics', auditSuiteId: 'analytics', workflows: [] },
      { id: 'leads', name: '🎯 Leads Pipeline', hash: '#leads', auditSuiteId: 'leads', workflows: ['workflow_lead_crm', 'workflow_lead_inbound_audit_verification'] },
      { id: 'proposals', name: '💼 Client Proposals Studio', hash: '#proposals', auditSuiteId: 'proposals', workflows: ['workflow_proposal_acceptance_onboarding'] },
      { id: 'crm', name: '👥 Clients & Retainers CRM', hash: '#crm', auditSuiteId: 'crm', workflows: ['workflow_crm_client_lifecycle'] },
      { id: 'kanban', name: '📋 Project & Sprint Pipeline', hash: '#kanban', auditSuiteId: 'kanban', workflows: ['workflow_task_lifecycle'] },
      { id: 'reviews', name: '🎬 Review Room & Proofing Hub', hash: '#reviews', auditSuiteId: 'reviews', workflows: ['workflow_review_room_cycle'] },
      { id: 'content-os', name: '🏛️ Content OS & Brand Engine', hash: '#content-os', auditSuiteId: 'content-os', workflows: ['workflow_creator_ai'] },
      { id: 'social', name: '📱 Social Planner', hash: '#social', auditSuiteId: 'social', workflows: ['workflow_social_post_schedule'] },
      { id: 'cms', name: '📝 Services & CMS', hash: '#cms', auditSuiteId: 'cms', workflows: [] },
      { id: 'brands', name: '🛍️ Brand Command Center', hash: '#brands', auditSuiteId: 'brands', workflows: ['workflow_brands_store_cycle'] },
      { id: 'digistore', name: '🏪 DigiVault Subs & Commerce', hash: '#digistore', auditSuiteId: 'digistore', workflows: ['workflow_digistore_product_cycle'] },
      { id: 'dbm', name: '👤 DBM Operations', hash: '#dbm', auditSuiteId: 'dbm', workflows: [] },
      { id: 'finance', name: '💰 Financials & Expenses', hash: '#finance', auditSuiteId: 'finance', workflows: ['workflow_finance_billing', 'workflow_expense_approval'] },
      { id: 'hr', name: '👨‍💼 HR & Roster Ops', hash: '#hr', auditSuiteId: 'hr', workflows: ['workflow_hr_onboarding_lifecycle'] },
      { id: 'assets', name: '📷 Hardware Assets', hash: '#assets', auditSuiteId: 'assets', workflows: ['workflow_assets_inventory_cycle'] },
      { id: 'tickets', name: '🎟️ Support Desk', hash: '#tickets', auditSuiteId: 'tickets', workflows: ['workflow_ticket_triage'] },
      { id: 'automation', name: '⚡ Bot & Automation Logs', hash: '#automation', auditSuiteId: 'automation', workflows: [] },
      { id: 'settings', name: '⚙️ Settings', hash: '#settings', auditSuiteId: 'settings', workflows: ['workflow_settings_config_cycle'] }
    ]
  },

  client: {
    id: 'client',
    name: '👤 Client Partner Portal',
    baseUrl: '/client',
    containerSelector: '#client-view',
    description: 'Client-facing collaboration portal with video reviews and warranty tracking.',
    pages: [
      { id: 'home', name: '🏠 Overview & Health', hash: '#home', auditSuiteId: 'client_home', workflows: [] },
      { id: 'retainer', name: '⚡ Retainer Health & Quota', hash: '#retainer', auditSuiteId: 'client_retainer', workflows: [] },
      { id: 'review', name: '🎬 Review Room & Approvals', hash: '#review', auditSuiteId: 'client_review', workflows: ['workflow_client_review_lockin'] },
      { id: 'campaign', name: '📋 Campaign Schedule', hash: '#campaign', auditSuiteId: 'client_campaign', workflows: [] },
      { id: 'brief', name: '📝 Submit Campaign Brief', hash: '#brief', auditSuiteId: 'client_brief', workflows: ['workflow_client_brief'] },
      { id: 'lockin', name: '🔒 Sprint Lock-In & Warranty', hash: '#lockin', auditSuiteId: 'client_lockin', workflows: [] },
      { id: 'invoices', name: '💳 Billing & Invoices', hash: '#invoices', auditSuiteId: 'client_invoices', workflows: [] },
      { id: 'tickets', name: '🎟️ Support & Revisions', hash: '#tickets', auditSuiteId: 'client_tickets', workflows: ['workflow_client_ticket'] },
      { id: 'account', name: '📜 Account & Contracts', hash: '#account', auditSuiteId: 'client_account', workflows: [] }
    ]
  },



  partners: {
    id: 'partners',
    name: '🤝 Enterprise Partner Portal',
    baseUrl: '/partners.html',
    containerSelector: 'main',
    description: 'Frame.io-style deliverable approvals and partner growth cockpit.',
    pages: [
      { id: 'deliverables', name: '🎬 Video Cut Approvals & Notes', section: 'deliverables', auditSuiteId: 'partners_deliverables', workflows: ['workflow_partner_cut_approval'] },
      { id: 'affiliate', name: '🤝 Growth Cockpit & Revenue Share', section: 'affiliate', auditSuiteId: 'partners_affiliate', workflows: ['workflow_partner_payout_attribution'] }
    ]
  },

  public: {
    id: 'public',
    name: '🌐 Public Portals & Micro-Apps',
    baseUrl: '/',
    containerSelector: 'body',
    description: 'Public marketing, capital investor intelligence, and inbound diagnostic tools.',
    pages: [
      { id: 'landing', name: '🌐 Marketing Landing Page', path: '/', auditSuiteId: 'public_landing', workflows: ['workflow_public_lead_capture', 'workflow_public_roi_calculator'] },
      { id: 'investors', name: '📈 Capital Investors Portal', path: '/investors.html', auditSuiteId: 'public_investors', workflows: [] },
      { id: 'aiAudit', name: '🩺 AI Diagnostic Audit Tool', path: '/ai-audit.html', auditSuiteId: 'public_ai_audit', workflows: ['workflow_public_ai_audit_score'] },
      { id: 'contractor', name: '🛡️ Contractor Scoped Gateway', path: '/contractor-view.html', auditSuiteId: 'public_contractor', workflows: ['workflow_contractor_defect_sla'] },
      { id: 'planner', name: '📅 Digital Planner Micro-App', path: '/planner', auditSuiteId: 'public_planner', workflows: [] },
      { id: 'viewer3d', name: '🔮 3D Spatial Product Lab', path: '/3d-viewer', auditSuiteId: 'public_viewer3d', workflows: [] },
      { id: 'proposal', name: '💼 Public Proposal & SOW Rail', path: '/proposal.html?token=nhf-enterprise-ai-2026', auditSuiteId: 'public_proposal', workflows: ['workflow_public_proposal_lifecycle'] },
      { id: 'msa', name: '📜 Master Service Agreement & NDA', path: '/msa-view.html?projectId=PRJ-2026-ENG2', auditSuiteId: 'public_msa', workflows: [] },
      { id: 'myPortal', name: '👑 Members Vault & GroCredits', path: '/my-portal', auditSuiteId: 'public_my_portal', suiteFile: 'my-portal-qa.js', workflows: [] },
      { id: 'dceDashboard', name: '⚡ DCE Command Dashboard', path: '/dce', auditSuiteId: 'dce_dashboard', workflows: [] },
      { id: 'dceOrders', name: '🛒 DCE Omnichannel Orders', path: '/dce/orders', auditSuiteId: 'dce_orders', workflows: ['workflow_dce_order_tracking'] },
      { id: 'dceOperations', name: '🛠️ DCE Operations & Helpdesk', path: '/dce/operations', auditSuiteId: 'dce_operations', workflows: [] },
      { id: 'dceGrowth', name: '📈 DCE Growth & Promotions', path: '/dce/growth', auditSuiteId: 'dce_growth', workflows: [] },
      { id: 'dceDigivault', name: '🏪 DCE DigiVault Ops', path: '/dce/digivault', auditSuiteId: 'dce_digivault', workflows: [] },
      { id: 'dceStore', name: '🛍️ PlannerQueen Storefront', path: '/dce/store', auditSuiteId: 'dce_store', workflows: [] },
      { id: 'dceTrack', name: '🔍 Customer Order Tracking', path: '/dce/track', auditSuiteId: 'dce_track', workflows: ['workflow_dce_order_tracking'] },
      { id: 'dceAffiliate', name: '🤝 Affiliate & Creator Portal', path: '/dce/affiliate', auditSuiteId: 'dce_affiliate', workflows: ['workflow_dce_affiliate_attribution'] },
      { id: 'digivaultStore', name: '📦 DigiVault BD Public Store', path: '/digivault', auditSuiteId: 'public_digivault', workflows: [] },
      { id: 'real3d', name: '🧪 3D Real STEM Lab', path: '/3d-viewer/real3d.html', auditSuiteId: 'public_real3d', workflows: [] },
      { id: 'delivery', name: '📜 Cryptographic Delivery & Certificate', path: '/delivery', auditSuiteId: 'public_delivery', workflows: [] }
    ]
  },

  workspace: {
    id: 'workspace',
    name: '⚡ Unified Multi-Engine Workspace',
    baseUrl: '/workspace',
    containerSelector: '#workspace-view',
    description: 'Single-pane-of-glass operations across all 5 engines and 3 seniority tiers.',
    pages: [
      { id: 'overview', name: '📊 Executive Overview', hash: '#overview', auditSuiteId: 'ws_overview', workflows: [] },
      { id: 'velocity', name: '📈 Velocity & Targets', hash: '#velocity', auditSuiteId: 'ws_velocity', workflows: [] },
      { id: 'pnl', name: '💰 Consolidated P&L', hash: '#pnl', auditSuiteId: 'ws_pnl', workflows: [] },
      { id: 'leads', name: '🎯 Leads Pipeline', hash: '#leads', auditSuiteId: 'ws_leads', workflows: ['workflow_lead_crm'] },
      { id: 'proposals', name: '💼 Proposals Studio', hash: '#proposals', auditSuiteId: 'ws_proposals', workflows: ['workflow_proposal_acceptance_onboarding'] },
      { id: 'crm', name: '👥 Clients & Retainers', hash: '#crm', auditSuiteId: 'ws_crm', workflows: ['workflow_crm_client_lifecycle'] },
      { id: 'invoices', name: '💳 Billing & Invoices', hash: '#invoices', auditSuiteId: 'ws_invoices', workflows: ['workflow_finance_billing'] },
      { id: 'tasks', name: '📋 Tasks Pipeline', hash: '#tasks', auditSuiteId: 'ws_tasks', workflows: ['workflow_task_lifecycle'] },
      { id: 'kanban', name: '🗂️ Kanban Studio', hash: '#kanban', auditSuiteId: 'ws_kanban', workflows: ['workflow_task_lifecycle'] },
      { id: 'deliverables', name: '📦 Deliverables Vault', hash: '#deliverables', auditSuiteId: 'ws_deliverables', workflows: ['workflow_review_room_cycle'] },
      { id: 'tickets', name: '🛡️ 24h Defect SLAs', hash: '#tickets', auditSuiteId: 'ws_tickets', workflows: ['workflow_ticket_triage'] },
      { id: 'team', name: '👨‍💼 Team & Attendance', hash: '#team', auditSuiteId: 'ws_team', workflows: ['workflow_hr_onboarding_lifecycle'] },
      { id: 'leaves', name: '🌴 Leaves Desk', hash: '#leaves', auditSuiteId: 'ws_leaves', workflows: ['workflow_leave_request'] },
      { id: 'claims', name: '💸 Expense Claims', hash: '#claims', auditSuiteId: 'ws_claims', workflows: ['workflow_expense_approval'] },
      { id: 'tech', name: '🩺 Tech Diagnostics', hash: '#tech', auditSuiteId: 'ws_tech', workflows: [] },
      { id: 'settings', name: '⚙️ Workspace Settings', hash: '#settings', auditSuiteId: 'ws_settings', workflows: ['workflow_settings_config_cycle'] }
    ]
  },

  crew: {
    id: 'crew',
    name: '⚡ Crew Specialist Portal',
    baseUrl: '/crew',
    containerSelector: '#crew-view',
    description: 'Specialist operations portal for shifts, deliverables, daily EOD standups, and leaves.',
    pages: [
      { id: 'tasks', name: '⚡ Crew Tasks Hub', hash: '#tasks', auditSuiteId: 'crew_tasks', workflows: ['workflow_crew_clockin_deliverable'] },
      { id: 'deliverables', name: '📦 Deliverables Submission', hash: '#deliverables', auditSuiteId: 'crew_deliverables', workflows: ['workflow_crew_clockin_deliverable'] },
      { id: 'eod', name: '📋 Daily Standup EOD', hash: '#eod', auditSuiteId: 'crew_eod', workflows: ['workflow_eod_submission', 'workflow_crew_eod_standup'] },
      { id: 'leaves', name: '🌴 Leaves Desk', hash: '#leaves', auditSuiteId: 'crew_leaves', workflows: ['workflow_leave_request'] },
      { id: 'attendance', name: '⏱️ Shift Attendance', hash: '#attendance', auditSuiteId: 'crew_attendance', workflows: ['workflow_clock_in_out'] },
      { id: 'expenses', name: '💸 Expense Reimbursements', hash: '#expenses', auditSuiteId: 'crew_expenses', workflows: ['workflow_crew_expense'] }
    ]
  }
};

if (typeof window !== 'undefined') {
  window.GRO10X_REGISTRY = GRO10X_REGISTRY;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GRO10X_REGISTRY };
}
