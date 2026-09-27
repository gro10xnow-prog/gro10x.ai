/**
 * GRO10X QA Suite Loader & Platform-Tab Registry
 */

const PLATFORM_TAB_MAP = {
  admin: {
    id: 'admin',
    name: 'Admin Command Center',
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
    name: 'Client Portal',
    baseRoute: '/client/',
    tabs: [
      { id: 'client-dashboard', name: '🏢 Client Overview', hash: '#dashboard', suiteFile: 'client-dashboard-qa.js', active: false }
    ]
  },
  crew: {
    id: 'crew',
    name: 'Crew Portal',
    baseRoute: '/crew/',
    tabs: [
      { id: 'crew-tasks', name: '⚡ Crew Tasks Hub', hash: '#tasks', suiteFile: 'crew-tasks-qa.js', active: false }
    ]
  }
};

if (typeof window !== 'undefined') {
  window.PLATFORM_TAB_MAP = PLATFORM_TAB_MAP;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PLATFORM_TAB_MAP };
}
