/**
 * src/services/onboarding-spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 2 Client Onboarding & Project Lock-In Specification Engine
 * Provides:
 * 1. Multi-POC Schema Standardization & Decision Role Validation
 * 2. Service-Specific Technical Discovery & Scoping Questionnaires
 * 3. Project Lock-In Specifications (Explicit Inclusions, Exclusions, Definition of Done)
 * 4. Prerequisite Credentials & Brand Asset Tracking (Zero Miscommunication Shield)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');
const { supabase, isSupabaseConfigured } = require('./supabase');
const { getServiceByCode } = require('./taxonomy');

// In-Memory Fallback Cache for Specs
const inMemoryLockinSpecs = [];

const VALID_DECISION_ROLES = [
  'PRIMARY_DECISION_MAKER',
  'TECHNICAL_LEAD',
  'BILLING_FINANCE',
  'DAY_TO_DAY_OPERATOR'
];

/**
 * Normalizes and validates a Point of Contact (POC) entry
 */
function standardizePOC(poc = {}) {
  const name = (poc.name || '').trim();
  const rawRole = (poc.decision_role || poc.decisionRole || '').toUpperCase();
  const decisionRole = VALID_DECISION_ROLES.includes(rawRole) ? rawRole : 'DAY_TO_DAY_OPERATOR';

  const isPrimary = decisionRole === 'PRIMARY_DECISION_MAKER';
  const isTech = decisionRole === 'TECHNICAL_LEAD';
  const isFinance = decisionRole === 'BILLING_FINANCE';

  const defaultAuthority = {
    can_sign_sow: isPrimary,
    can_authorize_payment: isPrimary || isFinance,
    can_approve_deliverables: isPrimary || isTech
  };

  return {
    id: poc.id || `POC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    name: name || 'Contact Person',
    designation: poc.designation || (isPrimary ? 'Managing Director / Founder' : 'Project Representative'),
    decision_role: decisionRole,
    email: poc.email || '',
    phone: poc.phone || '',
    whatsapp: poc.whatsapp || poc.phone || '',
    preferred_channel: (poc.preferred_channel || 'WHATSAPP').toUpperCase(),
    telegram_id: poc.telegram_id || null,
    authority: {
      ...defaultAuthority,
      ...(poc.authority || {})
    }
  };
}

/**
 * Standardizes a Client Organization Profile
 */
function standardizeClientProfile(client = {}) {
  const pocs = Array.isArray(client.pocs)
    ? client.pocs.map(standardizePOC)
    : [];

  // If top-level contactPerson exists but not in pocs, create default primary POC
  if (pocs.length === 0 && (client.contact_person || client.contactPerson || client.name)) {
    pocs.push(standardizePOC({
      name: client.contact_person || client.contactPerson || client.name,
      email: client.email || '',
      phone: client.phone || '',
      whatsapp: client.whatsapp || client.phone || '',
      decision_role: 'PRIMARY_DECISION_MAKER'
    }));
  }

  const primaryPoc = pocs.find(p => p.decision_role === 'PRIMARY_DECISION_MAKER') || pocs[0] || {};

  return {
    id: client.id,
    name: (client.name || '').trim() || 'Valued Client Organization',
    legal_name: client.legal_name || client.name || '',
    industry: client.industry || client.category || 'General Technology',
    company_size: client.company_size || client.companySize || '1-10 employees',
    country: client.country || 'Bangladesh',
    timezone: client.timezone || 'Asia/Dhaka (GMT+6)',
    website_url: client.website_url || client.websiteUrl || '',
    contact_person: primaryPoc.name || client.contact_person || '',
    email: client.email || primaryPoc.email || '',
    phone: client.phone || primaryPoc.phone || '',
    whatsapp: client.whatsapp || primaryPoc.whatsapp || '',
    billing_info: {
      currency: client.billing_info?.currency || client.currency || 'USD',
      payment_method: client.billing_info?.payment_method || 'Direct Wire / Bank Transfer',
      tax_id_bin: client.billing_info?.tax_id_bin || '',
      billing_address: client.billing_info?.billing_address || ''
    },
    pocs,
    status: client.status || 'Active Retainer'
  };
}

/**
 * Generates a tailored Technical Discovery & Scoping Questionnaire for any canonical service
 */
async function generateScopingQuestionnaire(productCode) {
  if (!productCode) throw new Error('productCode is required');
  const cleanCode = productCode.trim().toUpperCase();
  const product = await getServiceByCode(cleanCode);

  if (!product) {
    throw new Error(`Service '${cleanCode}' not found in catalog.`);
  }

  const meta = product.metadata || {};
  const eng = meta.engineering || {};
  const techStack = eng.tech_stack || ['Node.js', 'Supabase PostgreSQL', 'Vercel Edge'];

  return {
    ok: true,
    productCode: cleanCode,
    serviceTitle: product.name,
    turnaroundDays: eng.turnaround_days || 14,
    questions: [
      {
        id: 'Q1_INFRASTRUCTURE',
        category: 'Cloud Infrastructure & Hosting',
        question: `Do you have an existing cloud hosting environment, or would you like GRO10X to provision a clean ${techStack.join(' + ')} production architecture on Vercel and Supabase?`,
        options: [
          'Provision a new dedicated Supabase + Vercel stack for our organization (Recommended)',
          'Deploy directly into our company existing AWS / GCP / Cloud infrastructure',
          'Deploy on a private VPS / on-premise server'
        ],
        required: true
      },
      {
        id: 'Q2_DESIGN_ASSETS',
        category: 'UX/UI Wireframes & Branding',
        question: 'What is the current status of your UX/UI designs and brand assets?',
        options: [
          'We have complete Figma wireframes ready to build',
          'We have reference apps and a brand logo, but need GRO10X to design all UX/UI screens',
          'We only have an idea sketch; GRO10X should create the design system from scratch'
        ],
        required: true
      },
      {
        id: 'Q3_AUTH_SECURITY',
        category: 'Authentication & Access Control',
        question: 'What user authentication mechanisms are required for your end-users?',
        options: [
          'Email & Password + Google OAuth (Standard)',
          'Phone Number SMS OTP Authentication',
          'Role-Based Enterprise Access (Admin, Manager, Customer)',
          'No authentication required (Public utility)'
        ],
        required: true
      },
      {
        id: 'Q4_INTEGRATIONS',
        category: 'Third-Party Gateways & APIs',
        question: 'Which external third-party services or payment gateways must be integrated in this 14-day sprint?',
        options: [
          'Payment Gateway (Stripe or SSLCommerz or bKash)',
          'Communication Gateway (Twilio SMS, Resend Email, or WhatsApp Bot)',
          'AI Model Provider (Google Gemini API / OpenAI)',
          'No external paid API integrations required'
        ],
        required: true
      },
      {
        id: 'Q5_SUCCESS_BENCHMARK',
        category: 'Success KPI & Non-Negotiable Deadline',
        question: 'What is your non-negotiable launch deadline and the primary success KPI for this sprint?',
        placeholder: 'e.g. Must launch before October 15th to onboard our first 50 beta clinic doctors.',
        required: true
      }
    ]
  };
}

/**
 * Creates a Project Lock-In Specification for a client
 */
async function createProjectLockinSpec({
  clientId,
  proposalId = null,
  projectId = null,
  productCode,
  questionnaireAnswers = {},
  customInclusions = [],
  customExclusions = [],
  targetKickoffDate = null
}) {
  if (!clientId || !productCode) {
    throw new Error('clientId and productCode are required to create a lock-in spec.');
  }

  const cleanCode = productCode.trim().toUpperCase();
  const product = await getServiceByCode(cleanCode);

  if (!product) {
    throw new Error(`Service '${cleanCode}' not found in catalog.`);
  }

  const meta = product.metadata || {};
  const eng = meta.engineering || {};
  const baseDeliverables = eng.core_deliverables || [
    'Complete UX/UI Wireframes in Figma',
    'Production Full-Stack Application Codebase',
    'Supabase PostgreSQL Database with Row-Level Security',
    'Automated CI/CD Edge Deployment',
    'Source Code Handover (GitHub Repository)'
  ];

  const coreInclusions = [
    ...baseDeliverables,
    ...customInclusions
  ];

  const explicitExclusions = [
    'Legacy data migration or historical database backfilling (Available as separate Phase 2 SOW)',
    'Third-party external review delays (e.g. Apple App Store review, SMS operator DLT registration)',
    'Unspecified custom third-party proprietary API reverse-engineering',
    ...customExclusions
  ];

  const definitionOfDone = 'Live staging deployment passing end-to-end integration tests, 100% full source code transfer to Client GitHub repository, and recorded 15-min founder walkthrough video.';

  const kickoff = targetKickoffDate || new Date().toISOString().split('T')[0];
  const kickoffTime = new Date(kickoff).getTime();
  const turnaroundDays = eng.turnaround_days || 14;
  const targetHandover = new Date(kickoffTime + turnaroundDays * 86400000).toISOString().split('T')[0];

  const prerequisitesChecklist = [
    {
      id: 'PRE-01',
      category: 'CLOUD_CREDENTIALS',
      name: 'GitHub Organization Access',
      instructions: 'Invite the GRO10X engineering bot to your target GitHub organization or repository with write access.',
      status: 'PENDING',
      received_at: null
    },
    {
      id: 'PRE-02',
      category: 'CLOUD_CREDENTIALS',
      name: 'Supabase / Cloud Hosting Credentials',
      instructions: 'Provide access to your Supabase project or authorize GRO10X to provision a dedicated tenant.',
      status: 'PENDING',
      received_at: null
    },
    {
      id: 'PRE-03',
      category: 'API_KEYS',
      name: 'Third-Party Gateway API Credentials',
      instructions: 'Securely submit test or production API keys for required integrations (e.g. Stripe, Twilio, Gemini).',
      status: 'PENDING',
      received_at: null
    },
    {
      id: 'PRE-04',
      category: 'BRAND_ASSETS',
      name: 'Vector Brand Identity Assets',
      instructions: 'Upload SVG vector logos, primary and secondary brand hex colors, and corporate typography.',
      status: 'PENDING',
      received_at: null
    },
    {
      id: 'PRE-05',
      category: 'SAMPLE_DATA',
      name: 'Sample Seed Data & User Flow Notes',
      instructions: 'Provide sample test CSV/JSON records and any reference competitor workflows.',
      status: 'PENDING',
      received_at: null
    }
  ];

  const priceUsd = meta.price_usd || 2500;

  const specId = `SPEC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  const spec = {
    id: specId,
    client_id: clientId,
    proposal_id: proposalId,
    project_id: projectId,
    canonical_service_code: cleanCode,
    service_title: product.name,
    scope_boundaries: {
      core_inclusions: coreInclusions,
      explicit_exclusions: explicitExclusions,
      definition_of_done: definitionOfDone,
      questionnaire_answers: questionnaireAnswers
    },
    prerequisites_checklist: prerequisitesChecklist,
    delivery_and_governance: {
      kickoff_date: kickoff,
      target_handover_date: targetHandover,
      turnaround_days: turnaroundDays,
      review_window_hours: 48,
      warranty_days: 30,
      communication_protocol: {
        primary_chat: 'Dedicated WhatsApp Group (Gro10x + Client Leadership)',
        sprint_updates: 'Async Loom video every Tuesday and Friday',
        review_room_url: 'https://gro10x-ai.vercel.app/client#review'
      }
    },
    milestone_schedule: {
      milestone_1: {
        name: 'Sprint Kickoff & Architecture Approval',
        percent: 50,
        amount_usd: Math.round(priceUsd * 0.5),
        status: 'PENDING'
      },
      milestone_2: {
        name: 'Final Acceptance, GitHub Transfer & Staging Launch',
        percent: 50,
        amount_usd: Math.round(priceUsd * 0.5),
        status: 'UPON_DELIVERY'
      }
    },
    deliverables: coreInclusions,
    prerequisites: prerequisitesChecklist,
    definition_of_done: definitionOfDone,
    client_signoff_status: 'Pending Lock-In Review',
    status: 'LOCKED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Persist to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('project_lockin_specs').insert([spec]);
    } catch (sbErr) {
      console.warn('[OnboardingSpec] Supabase insert warning:', sbErr.message);
    }
  }

  // Always store in memory cache
  inMemoryLockinSpecs.unshift(spec);

  return spec;
}

/**
 * Updates status of a prerequisite checklist item
 */
async function updatePrerequisiteStatus(specId, itemId, newStatus = 'RECEIVED') {
  const validStatuses = ['PENDING', 'RECEIVED', 'VERIFIED'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid prerequisite status: ${newStatus}. Valid: ${validStatuses.join(', ')}`);
  }

  let spec = inMemoryLockinSpecs.find(s => s.id === specId);

  if (isSupabaseConfigured() && !spec) {
    try {
      const { data } = await supabase.from('project_lockin_specs').select('*').eq('id', specId).maybeSingle();
      if (data) spec = data;
    } catch (_) {}
  }

  if (!spec) {
    throw new Error(`Lock-in spec '${specId}' not found.`);
  }

  const checklist = Array.isArray(spec.prerequisites_checklist) ? spec.prerequisites_checklist : [];
  const targetItem = checklist.find(i => i.id === itemId);

  if (!targetItem) {
    throw new Error(`Prerequisite item '${itemId}' not found in spec checklist.`);
  }

  targetItem.status = newStatus;
  targetItem.received_at = newStatus !== 'PENDING' ? new Date().toISOString() : null;

  // Check if all items are received/verified
  const allReady = checklist.every(i => i.status === 'RECEIVED' || i.status === 'VERIFIED');
  if (allReady && spec.status === 'LOCKED') {
    spec.status = 'PREREQUISITES_RECEIVED';
  }

  spec.updated_at = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('project_lockin_specs').update({
        prerequisites_checklist: checklist,
        status: spec.status,
        updated_at: spec.updated_at
      }).eq('id', specId);
    } catch (_) {}
  }

  return {
    ok: true,
    specId,
    itemId,
    newStatus,
    allPrerequisitesReady: allReady,
    specStatus: spec.status,
    item: targetItem
  };
}

/**
 * Retrieve lock-in specs for a client
 */
async function getClientLockinSpecs(clientId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('project_lockin_specs')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (_) {}
  }

  return inMemoryLockinSpecs.filter(s => s.client_id === clientId);
}

/**
 * Retrieve single lock-in spec by ID
 */
async function getLockinSpecById(specId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('project_lockin_specs')
        .select('*')
        .eq('id', specId)
        .maybeSingle();

      if (!error && data) return data;
    } catch (_) {}
  }

  return inMemoryLockinSpecs.find(s => s.id === specId) || null;
}

module.exports = {
  VALID_DECISION_ROLES,
  standardizePOC,
  standardizeClientProfile,
  generateScopingQuestionnaire,
  createProjectLockinSpec,
  updatePrerequisiteStatus,
  getClientLockinSpecs,
  getLockinSpecById
};
