/**
 * GRO10X QA Suite Loader & Platform-Tab Registry
 * ─────────────────────────────────────────────────────────────────────────────
 * Synchronized with GRO10X_REGISTRY (Central Platform & Page Registry)
 * Maps all 5 operational platforms and their modular pages/tabs to their respective
 * automated test suites and health audits.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PLATFORM_TAB_MAP = {
  admin: {
    id: 'admin',
    name: '🏢 Admin Command Center OS',
    baseRoute: '/app/',
    tabs: [
      { id: 'dashboard', name: '📊 Executive Overview', hash: '#dashboard', suiteFile: 'dashboard-qa.js', active: true },
      { id: 'engines', name: '🚀 5-Engine Growth Operations', hash: '#engines', suiteFile: 'engines-qa.js', active: true },
      { id: 'platforms', name: '🏗️ Platform Portfolio Registry', hash: '#platforms', suiteFile: 'platforms-qa.js', active: true },
      { id: 'gigs', name: '⚡ Marketplace Gig Studio', hash: '#gigs', suiteFile: 'gigs-qa.js', active: true },
      { id: 'analytics', name: '📈 Agency Analytics & Intelligence', hash: '#analytics', suiteFile: 'analytics-qa.js', active: true },
      { id: 'leads', name: '🎯 CRM Leads Pipeline', hash: '#leads', suiteFile: 'leads-qa.js', active: true },
      { id: 'proposals', name: '💼 Client Proposals & Quotations Studio', hash: '#proposals', suiteFile: 'proposals-qa.js', active: true },
      { id: 'crm', name: '👥 Clients & Retainers CRM', hash: '#crm', suiteFile: 'crm-qa.js', active: true },
      { id: 'kanban', name: '📋 Production Pipeline Hub', hash: '#kanban', suiteFile: 'kanban-qa.js', active: true },
      { id: 'reviews', name: '🎬 Client Review Room & Proofing Hub', hash: '#reviews', suiteFile: 'reviews-qa.js', active: true },
      { id: 'content-os', name: '🏛️ Content OS & Brand Engine', hash: '#content-os', suiteFile: 'content-os-qa.js', active: true },
      { id: 'social', name: '📱 Social Planner', hash: '#social', suiteFile: 'social-qa.js', active: true },
      { id: 'cms', name: '📝 Services & CMS', hash: '#cms', suiteFile: 'cms-qa.js', active: true },
      { id: 'brands', name: '🛍️ Brand Command Center', hash: '#brands', suiteFile: 'brands-qa.js', active: true },
      { id: 'digistore', name: '🏪 DigiVault Subs & Commerce', hash: '#digistore', suiteFile: 'digistore-qa.js', active: true },
      { id: 'dbm', name: '👤 DBM Operations & Team Command', hash: '#dbm', suiteFile: 'dbm-qa.js', active: true },
      { id: 'finance', name: '💰 Financial Intelligence', hash: '#finance', suiteFile: 'finance-qa.js', active: true },
      { id: 'hr', name: '👨‍💼 HR & Roster Ops', hash: '#hr', suiteFile: 'hr-qa.js', active: true },
      { id: 'assets', name: '📷 Hardware Assets', hash: '#assets', suiteFile: 'assets-qa.js', active: true },
      { id: 'tickets', name: '🎟️ Support Desk & Triage', hash: '#tickets', suiteFile: 'tickets-qa.js', active: true },
      { id: 'automation', name: '⚡ Bot Engine & Logs', hash: '#automation', suiteFile: 'automation-qa.js', active: true },
      { id: 'settings', name: '⚙️ Workspace Settings', hash: '#settings', suiteFile: 'settings-qa.js', active: true }
    ]
  },
  client: {
    id: 'client',
    name: '👤 Client Partner Portal',
    baseRoute: '/client/',
    tabs: [
      { id: 'home', name: '🏠 Overview & Health', hash: '#home', auditSuiteId: 'client_home', active: true },
      { id: 'retainer', name: '⚡ Retainer Health & Quota', hash: '#retainer', auditSuiteId: 'client_retainer', active: true },
      { id: 'review', name: '🎬 Review Room & Approvals', hash: '#review', auditSuiteId: 'client_review', active: true },
      { id: 'campaign', name: '📋 Campaign Schedule', hash: '#campaign', auditSuiteId: 'client_campaign', active: true },
      { id: 'brief', name: '📝 Submit Campaign Brief', hash: '#brief', auditSuiteId: 'client_brief', active: true },
      { id: 'lockin', name: '🔒 Sprint Lock-In & Warranty', hash: '#lockin', auditSuiteId: 'client_lockin', active: true },
      { id: 'invoices', name: '💳 Billing & Invoices', hash: '#invoices', auditSuiteId: 'client_invoices', active: true },
      { id: 'tickets', name: '🎟️ Support & Revisions', hash: '#tickets', auditSuiteId: 'client_tickets', active: true },
      { id: 'account', name: '📜 Account & Contracts', hash: '#account', auditSuiteId: 'client_account', active: true }
    ]
  },
  crew: {
    id: 'crew',
    name: '⚡ Crew Specialist Portal',
    baseRoute: '/crew/',
    tabs: [
      { id: 'crew-tasks', name: '⚡ Crew Tasks Hub', hash: '#tasks', suiteFile: 'crew-tasks-qa.js', active: true }
    ]
  },
  partners: {
    id: 'partners',
    name: '🤝 Enterprise Partner Portal',
    baseRoute: '/partners.html',
    tabs: [
      { id: 'deliverables', name: '🎬 Video Cut Approvals', section: 'deliverables', auditSuiteId: 'partners_deliverables', active: true },
      { id: 'affiliate', name: '🤝 Growth Cockpit & Revenue Share', section: 'affiliate', auditSuiteId: 'partners_affiliate', suiteFile: 'partners-qa.js', active: true }
    ]
  },
  public: {
    id: 'public',
    name: '🌐 Public Portals & Micro-Apps',
    baseRoute: '/',
    tabs: [
      { id: 'landing', name: '🌐 Marketing Landing Page', path: '/', auditSuiteId: 'public_landing', active: true },
      { id: 'investors', name: '📈 Capital Investors Portal', path: '/investors.html', auditSuiteId: 'public_investors', active: true },
      { id: 'aiAudit', name: '🩺 AI Diagnostic Audit Tool', path: '/ai-audit.html', auditSuiteId: 'public_ai_audit', active: true },
      { id: 'contractor', name: '🛡️ Contractor Scoped Gateway', path: '/contractor-view.html', auditSuiteId: 'public_contractor', active: true },
      { id: 'planner', name: '📅 Digital Planner Micro-App', path: '/planner', auditSuiteId: 'public_planner', active: true },
      { id: 'viewer3d', name: '🔮 3D Spatial Product Lab', path: '/3d-viewer', auditSuiteId: 'public_viewer3d', active: true },
      { id: 'proposal', name: '💼 Public Proposal & SOW Rail', path: '/proposal.html?token=nhf-enterprise-ai-2026', auditSuiteId: 'public_proposal', active: true },
      { id: 'myPortal', name: '👑 Members Vault & GroCredits', path: '/my-portal', auditSuiteId: 'public_my_portal', suiteFile: 'my-portal-qa.js', active: true }
    ]
  },
  workspace: {
    id: 'workspace',
    name: '⚡ Unified Multi-Engine Workspace',
    baseRoute: '/workspace',
    tabs: [
      { id: 'overview', name: '📊 Executive Overview', hash: '#overview', suiteFile: 'workspace-qa.js', active: true },
      { id: 'velocity', name: '📈 Velocity & Targets', hash: '#velocity', suiteFile: 'workspace-qa.js', active: true },
      { id: 'pnl', name: '💰 Consolidated P&L', hash: '#pnl', suiteFile: 'workspace-qa.js', active: true },
      { id: 'leads', name: '🎯 Leads Pipeline', hash: '#leads', suiteFile: 'workspace-qa.js', active: true },
      { id: 'proposals', name: '💼 Proposals Studio', hash: '#proposals', suiteFile: 'workspace-qa.js', active: true },
      { id: 'crm', name: '👥 Clients & Retainers', hash: '#crm', suiteFile: 'workspace-qa.js', active: true },
      { id: 'invoices', name: '💳 Billing & Invoices', hash: '#invoices', suiteFile: 'workspace-qa.js', active: true },
      { id: 'tasks', name: '📋 Tasks Pipeline', hash: '#tasks', suiteFile: 'workspace-qa.js', active: true },
      { id: 'kanban', name: '🗂️ Kanban Studio', hash: '#kanban', suiteFile: 'workspace-qa.js', active: true },
      { id: 'deliverables', name: '📦 Deliverables Vault', hash: '#deliverables', suiteFile: 'workspace-qa.js', active: true },
      { id: 'tickets', name: '🛡️ 24h Defect SLAs', hash: '#tickets', suiteFile: 'workspace-qa.js', active: true },
      { id: 'team', name: '👨‍💼 Team & Attendance', hash: '#team', suiteFile: 'workspace-qa.js', active: true },
      { id: 'leaves', name: '🌴 Leaves Desk', hash: '#leaves', suiteFile: 'workspace-qa.js', active: true },
      { id: 'claims', name: '💸 Expense Claims', hash: '#claims', suiteFile: 'workspace-qa.js', active: true },
      { id: 'tech', name: '🩺 Tech Diagnostics', hash: '#tech', suiteFile: 'workspace-qa.js', active: true },
      { id: 'settings', name: '⚙️ Workspace Settings', hash: '#settings', suiteFile: 'workspace-qa.js', active: true }
    ]
  }
};

if (typeof window !== 'undefined') {
  window.PLATFORM_TAB_MAP = PLATFORM_TAB_MAP;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PLATFORM_TAB_MAP };
}
