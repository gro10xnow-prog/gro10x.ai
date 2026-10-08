/**
 * src/services/knowledge-base.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Engine 1 (AI Agent Ecosystems & Platforms)
 * Vector Knowledge Base, Document Ingestion, and 5 Verticals Studio Runtime.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// In-memory knowledge store (persisted in session / synced to Supabase)
const knowledgeStore = new Map();

// The 5 In-House Handnotes Verticals Specs & System Prompts
const ASSISTANTS = {
  'group-academy': {
    id: 'group-academy',
    name: 'GroUp Academy',
    vertical: '#Career',
    icon: '🎓',
    primaryModel: 'gemini-3.5-flash-lite',
    reasoningModel: 'claude-3.5-sonnet',
    systemPrompt: `You are GroUp Academy AI, the career co-pilot for tech graduates and students in Bangladesh.
Your mandate is to review resumes, provide mock technical interview feedback, suggest GitHub project improvements, and guide job track placements.
Tone: Encouraging, rigorous, pragmatic, industry-grounded.`,
    temperature: 0.4,
    tags: ['education', 'recruiting', 'cv-review'],
    channelEmbed: '<script src="https://gro10x-ai.vercel.app/js/chat-widget.js" data-agent="group-academy"></script>'
  },
  'grocash-finledger': {
    id: 'grocash-finledger',
    name: 'GroCash FinLedger',
    vertical: '#Finance',
    icon: '🏆',
    primaryModel: 'gemini-3.5-flash-lite',
    reasoningModel: 'gpt-4o',
    systemPrompt: `You are GroCash FinLedger AI, the autonomous treasury and accounts reconciliation assistant for GRO10X.
Your mandate is to query milestone invoice statuses, calculate 5% statutory VAT and AIT withholdings, provide verified BRAC Bank PLC wire instructions, and reconcile client settlements.
Tone: Corporate, audit-grade, secure, zero tolerance for mathematical ambiguity.`,
    temperature: 0.1,
    tags: ['finance', 'invoicing', 'reconciliation'],
    channelEmbed: '<script src="https://gro10x-ai.vercel.app/js/chat-widget.js" data-agent="grocash-finledger"></script>'
  },
  'soloops-hub': {
    id: 'soloops-hub',
    name: 'SoloOps Hub',
    vertical: '#SME',
    icon: '🔧',
    primaryModel: 'gemini-3.5-flash-lite',
    reasoningModel: 'gpt-4o',
    systemPrompt: `You are SoloOps Hub AI, the operations co-pilot for freelancers, micro-agencies, and SME founders.
Your mandate is to inspect client Statements of Work (SOW), assess scope creep, generate formal Change Order Addenda, and track sprint burndown velocity.
Tone: Executive, tactical, clear, protective of billable hours and scope limits.`,
    temperature: 0.3,
    tags: ['sme', 'operations', 'scope-control'],
    channelEmbed: '<script src="https://gro10x-ai.vercel.app/js/chat-widget.js" data-agent="soloops-hub"></script>'
  },
  'edagent-labs': {
    id: 'edagent-labs',
    name: 'EdAgent Labs',
    vertical: '#Education',
    icon: '🧪',
    primaryModel: 'gemini-3.5-flash-lite',
    reasoningModel: 'claude-3.5-sonnet',
    systemPrompt: `You are EdAgent Labs AI, an interactive curriculum and step-by-step tutoring agent.
Your mandate is to generate structured diagnostic quizzes, explain complex computer science and AI concepts simply, and verify student code submissions.
Tone: Pedagogical, patient, engaging, Socratic method.`,
    temperature: 0.5,
    tags: ['edtech', 'curriculum', 'tutoring'],
    channelEmbed: '<script src="https://gro10x-ai.vercel.app/js/chat-widget.js" data-agent="edagent-labs"></script>'
  },
  'tasksync-founder': {
    id: 'tasksync-founder',
    name: 'TaskSync',
    vertical: '#Personal',
    icon: '⚡',
    primaryModel: 'gemini-3.5-flash-lite',
    reasoningModel: 'gpt-4o',
    systemPrompt: `You are TaskSync AI, the founder's personal executive chief-of-staff.
Your mandate is to synthesize daily sprint priorities, clock in/out operational crew, summarize cross-pod blockers, and draft asynchronous briefings.
Tone: High-velocity, ultra-concise, action-oriented.`,
    temperature: 0.2,
    tags: ['productivity', 'executive', 'sync'],
    channelEmbed: '<script src="https://gro10x-ai.vercel.app/js/chat-widget.js" data-agent="tasksync-founder"></script>'
  }
};

// Seed realistic enterprise knowledge documents
function initSeedKnowledge() {
  if (knowledgeStore.size > 0) return;

  const seeds = [
    {
      id: 'kb_doc_pb_01',
      agentId: 'soloops-hub',
      projectId: 'proj-purplebot-01',
      title: 'PurpleBot Master Service Agreement & SOW v2.4.pdf',
      sourceType: 'pdf',
      tokenCount: 4200,
      chunkCount: 8,
      uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      summary: 'Outlines scope for dual Telegram bot mesh, 14-day SLA sprint, BRAC Bank wire milestones, and 30-day bug warranty.'
    },
    {
      id: 'kb_doc_lm_02',
      agentId: 'grocash-finledger',
      projectId: 'proj-laundry-mama',
      title: 'Laundry Mama Onboarding Spec & bKash Dispatches.pdf',
      sourceType: 'pdf',
      tokenCount: 2850,
      chunkCount: 5,
      uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      summary: 'Details automated SMS pickup alerts, route mapping, and bKash merchant token webhook handling.'
    },
    {
      id: 'kb_doc_gu_03',
      agentId: 'group-academy',
      projectId: 'proj-group-academy',
      title: 'https://group.academy/curriculum/ai-agent-engineering',
      sourceType: 'url',
      tokenCount: 6100,
      chunkCount: 12,
      uploadedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
      summary: 'Public course syllabus covering LangGraph, Supabase pgvector, Vercel deployments, and job placement track.'
    },
    {
      id: 'kb_doc_faq_04',
      agentId: 'grocash-finledger',
      projectId: 'proj-general',
      title: 'Corporate Settlement & Tax FAQs',
      sourceType: 'faq',
      tokenCount: 950,
      chunkCount: 3,
      uploadedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      summary: 'Official BRAC Bank PLC account details, AIT 5% statutory withholding policy, and VAT compliance rules.'
    }
  ];

  seeds.forEach(doc => knowledgeStore.set(doc.id, doc));
}

initSeedKnowledge();

/**
 * List all knowledge documents with optional filtering
 */
function listKnowledge(filter = {}) {
  initSeedKnowledge();
  let list = Array.from(knowledgeStore.values());

  if (filter.agentId && filter.agentId !== 'all') {
    list = list.filter(d => d.agentId === filter.agentId);
  }
  if (filter.projectId && filter.projectId !== 'all') {
    list = list.filter(d => d.projectId === filter.projectId);
  }
  if (filter.sourceType && filter.sourceType !== 'all') {
    list = list.filter(d => d.sourceType === filter.sourceType);
  }

  return list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

/**
 * Ingest a new document / text / PDF
 */
function addDocument({ title, agentId, projectId, content, sourceType = 'manual', summary }) {
  initSeedKnowledge();
  const id = `kb_doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const textLength = (content || '').length;
  const tokenCount = Math.max(120, Math.round(textLength / 4));
  const chunkCount = Math.max(1, Math.ceil(tokenCount / 500));

  const doc = {
    id,
    agentId: agentId || 'soloops-hub',
    projectId: projectId || 'proj-general',
    title: title || 'Untitled Knowledge Document',
    sourceType,
    content: content || '',
    tokenCount,
    chunkCount,
    uploadedAt: new Date().toISOString(),
    summary: summary || `Ingested ${sourceType.toUpperCase()} document containing ${tokenCount} tokens across ${chunkCount} chunks.`
  };

  knowledgeStore.set(id, doc);
  return doc;
}

/**
 * Delete a document from the knowledge base
 */
function removeDocument(id) {
  initSeedKnowledge();
  return knowledgeStore.delete(id);
}

/**
 * Retrieve assistant profiles
 */
function getAssistants() {
  return Object.values(ASSISTANTS);
}

/**
 * Get a specific assistant profile
 */
function getAssistant(id) {
  return ASSISTANTS[id] || null;
}

module.exports = {
  listKnowledge,
  addDocument,
  removeDocument,
  getAssistants,
  getAssistant
};
