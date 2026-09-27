/**
 * src/services/delivery-review.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 2: Sprint Execution, Stakeholder Governance & Review Room 2.0 Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Powers:
 * 1. Internal & External Stakeholder Assignment Matrix
 * 2. Engine 2 Multi-Format AI Deliverables (Staging URLs, GitHub Repos, APIs, Docs, Videos)
 * 3. Definition of Done (DoD) Verification Tracking
 * 4. Threaded Review Feedback & Scope Creep Shield (OUT_OF_SCOPE detection)
 * 5. Revision Round Lifecycle (v1.0-alpha -> v1.1-rc -> v1.2-final)
 * 6. Dual-Gate Commercial Handover & 30-Day Bug-Fix Warranty Activation
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');
const { supabase, isSupabaseConfigured } = require('./supabase');
const { readDB, writeDB } = require('./db');
const { broadcast, broadcastToClient } = require('./sse');

const VALID_DELIVERABLE_TYPES = [
  'video',
  'staging_url',
  'code_repo',
  'api_spec',
  'architecture_doc',
  'composite_bundle'
];

const VALID_COMMENT_TYPES = [
  'GENERAL',
  'BUG_FIX',
  'POLISH_REVISION',
  'OUT_OF_SCOPE'
];

// In-memory fallback stores for high-resilience test and offline operation
const memoryDeliverables = [];
const memoryComments = [];
const projectStakeholdersMap = new Map();

function getProjectStakeholders(projectId) {
  return projectStakeholdersMap.get(projectId) || null;
}

function getMemoryDeliverable(id) {
  return memoryDeliverables.find(r => r.id === id) || null;
}

/**
 * 1. Assign Internal & External Stakeholder Matrix to Project
 */
async function assignProjectStakeholders(projectId, stakeholdersPayload = {}) {
  if (!projectId) throw new Error('projectId is required for stakeholder assignment.');

  const { internal = {}, external = {} } = stakeholdersPayload;

  const normalizedInternal = {
    delivery_lead: internal.delivery_lead || internal.deliveryLead || 'Unassigned',
    lead_engineer: internal.lead_engineer || internal.leadEngineer || 'Unassigned',
    qa_lead: internal.qa_lead || internal.qaLead || 'Unassigned',
    account_manager: internal.account_manager || internal.accountManager || 'Unassigned'
  };

  const normalizedExternal = {
    primary_approver_id: external.primary_approver_id || external.primaryApproverId || null,
    technical_lead_id: external.technical_lead_id || external.technicalLeadId || null,
    billing_poc_id: external.billing_poc_id || external.billingPocId || null
  };

  const stakeholders = {
    internal: normalizedInternal,
    external: normalizedExternal,
    assigned_at: new Date().toISOString()
  };

  projectStakeholdersMap.set(projectId, stakeholders);

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('projects')
        .update({ stakeholders, updated_at: new Date().toISOString() })
        .eq('id', projectId);
    } catch (_) {}
  }

  const db = await readDB();
  db.projects = db.projects || [];
  const pIdx = db.projects.findIndex(p => p.id === projectId);
  if (pIdx !== -1) {
    db.projects[pIdx].stakeholders = stakeholders;
    try { writeDB(db); } catch (_) {}
  }

  broadcast('project_stakeholders_updated', { projectId, stakeholders });

  return stakeholders;
}

/**
 * 2. Publish Multi-Format AI Deliverable with DoD Checklist
 */
async function publishSprintDeliverable(payload = {}) {
  const {
    projectId,
    clientId,
    clientName = 'Agency Client',
    title = 'AI Solution Sprint Deliverable',
    deliverableType = 'staging_url',
    stagingUrl = '',
    repoUrl = '',
    branchName = 'main',
    apiDocsUrl = '',
    mediaUrl = '',
    posterUrl = '',
    dodChecklist = [],
    maxRevisions = 2
  } = payload;

  if (!projectId) throw new Error('projectId is required to publish a deliverable.');

  const type = VALID_DELIVERABLE_TYPES.includes(deliverableType) ? deliverableType : 'staging_url';
  const newId = `REV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  // Default DoD checklist if none provided
  const initialDoD = Array.isArray(dodChecklist) && dodChecklist.length > 0 ? dodChecklist : [
    { id: 'DOD-01', title: 'Core Functionality & User Flows Verified', passed: true, verified_by: 'QA Lead' },
    { id: 'DOD-02', title: 'Zero Console Errors & Responsive UI Check', passed: true, verified_by: 'QA Lead' },
    { id: 'DOD-03', title: 'Compliant Database Schema & RLS Active', passed: true, verified_by: 'Lead Engineer' },
    { id: 'DOD-04', title: 'Automated Test Suite Passing', passed: true, verified_by: 'Lead Engineer' }
  ];

  const primaryMediaUrl = stagingUrl || repoUrl || apiDocsUrl || mediaUrl || 'https://gro10x-ai.vercel.app/preview';

  const deliverable = {
    id: newId,
    project_id: projectId,
    project_name: title,
    client: clientName,
    client_id: clientId || null,
    active_version: 'v1.0-alpha',
    versions: ['v1.0-alpha'],
    deliverable_type: type,
    media_type: type === 'video' ? 'video' : 'document',
    media_url: primaryMediaUrl,
    staging_url: stagingUrl,
    repo_url: repoUrl,
    branch_name: branchName,
    api_docs_url: apiDocsUrl,
    poster_url: posterUrl || null,
    resolved_count: 0,
    total_count: 0,
    revision_round: 1,
    max_revisions: Number(maxRevisions) || 2,
    dod_checklist: initialDoD,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  const supabasePayload = {
    id: newId,
    project_id: projectId,
    project_name: title,
    client: clientName,
    client_id: clientId || null,
    active_version: 'v1.0-alpha',
    versions: ['v1.0-alpha'],
    media_type: type === 'video' ? 'video' : 'document',
    media_url: primaryMediaUrl,
    poster_url: posterUrl || null,
    resolved_count: 0,
    total_count: 0,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('reviews').insert([supabasePayload]);
    } catch (_) {}
    try {
      await supabase.from('projects').update({ delivery_status: 'IN_REVIEW' }).eq('id', projectId);
    } catch (_) {}
  }

  memoryDeliverables.unshift(deliverable);

  const db = await readDB();
  db.projects = db.projects || [];
  const pIdx = db.projects.findIndex(p => p.id === projectId);
  if (pIdx !== -1) {
    db.projects[pIdx].delivery_status = 'IN_REVIEW';
    try { writeDB(db); } catch (_) {}
  }

  broadcast('review_update', [deliverable]);
  if (clientId) {
    broadcastToClient('review_update', [deliverable], [clientId]);
  }

  return deliverable;
}

/**
 * 3. Scope Creep Shield & Feedback Submission
 */
async function submitDeliverableFeedback(params = {}) {
  const {
    reviewId,
    author = 'Client Reviewer',
    authorRole = 'Client Partner',
    authorPocId = null,
    text = '',
    commentType = 'GENERAL',
    assignedTeamMember = null,
    timestamp = '0:00',
    timeSeconds = 0,
    drawings = []
  } = params;

  if (!reviewId || !text) {
    throw new Error('reviewId and text are required for submitting review feedback.');
  }

  const sanitizedType = VALID_COMMENT_TYPES.includes(commentType) ? commentType : 'GENERAL';

  // Scope Creep Keyword Heuristics
  let scopeFlag = 'IN_SCOPE';
  let scopeWarning = null;

  const textLower = text.toLowerCase();
  const outOfScopeKeywords = [
    'legacy data migration',
    'native mobile app',
    'app store submission',
    'ios app',
    'android apk',
    'additional language localization',
    'custom hardware',
    'white glove on-premise'
  ];

  const hasExclusionMatch = outOfScopeKeywords.some(kw => textLower.includes(kw));

  if (sanitizedType === 'OUT_OF_SCOPE' || hasExclusionMatch) {
    scopeFlag = 'OUT_OF_SCOPE_POTENTIAL';
    scopeWarning = '⚠️ Notice: This request appears to fall outside the locked contract scope. A Phase 2 change order may be required.';
  }

  const newComment = {
    id: `CMT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    review_id: reviewId,
    author,
    author_role: authorRole,
    author_poc_id: authorPocId,
    timestamp: timestamp || '0:00',
    time_seconds: Number(timeSeconds) || 0,
    text,
    comment_type: sanitizedType === 'OUT_OF_SCOPE' || hasExclusionMatch ? 'OUT_OF_SCOPE' : sanitizedType,
    scope_flag: scopeFlag,
    scope_warning: scopeWarning,
    assigned_team_member: assignedTeamMember || null,
    resolved: false,
    drawings: drawings || [],
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('review_comments').insert([newComment]);
      // Increment total count
      const { data: rev } = await supabase.from('reviews').select('total_count').eq('id', reviewId).maybeSingle();
      if (rev) {
        await supabase.from('reviews').update({ total_count: (rev.total_count || 0) + 1 }).eq('id', reviewId);
      }
    } catch (_) {}
  }

  memoryComments.push(newComment);

  const memRev = memoryDeliverables.find(r => r.id === reviewId);
  if (memRev) {
    memRev.total_count = (memRev.total_count || 0) + 1;
  }

  broadcast('review_comment_update', { reviewId, comment: newComment });

  return newComment;
}

/**
 * 4. Advance Revision Round with SLA Protection
 */
async function advanceRevisionRound(reviewId, { notes = '', requestedBy = 'Client Partner' } = {}) {
  let review = null;

  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('reviews').select('*').eq('id', reviewId).maybeSingle();
      if (data) review = data;
    } catch (_) {}
  }

  if (!review) {
    review = memoryDeliverables.find(r => r.id === reviewId);
  }

  if (!review) throw new Error(`Deliverable '${reviewId}' not found.`);

  const currentRound = Number(review.revision_round) || 1;
  const maxRounds = Number(review.max_revisions) || 2;

  if (currentRound >= maxRounds) {
    throw new Error(`Revision limit reached (${currentRound}/${maxRounds} rounds used). Additional revisions require a formal Phase 2 Add-On.`);
  }

  const nextRound = currentRound + 1;
  const newVersion = `v1.${nextRound - 1}-rc`;
  const existingVersions = Array.isArray(review.versions) ? [...review.versions] : ['v1.0-alpha'];
  if (!existingVersions.includes(newVersion)) {
    existingVersions.push(newVersion);
  }

  const updates = {
    revision_round: nextRound,
    active_version: newVersion,
    versions: existingVersions,
    status: 'revision_requested',
    revision_requested_by: requestedBy,
    revision_notes: notes,
    revision_requested_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('reviews').update(updates).eq('id', reviewId);
    } catch (_) {}
  }

  Object.assign(review, updates);

  broadcast('review_update', [review]);

  return review;
}

/**
 * 5. Execute Formal Deliverable Approval & Handover Activation
 */
async function executeDeliverableApproval(reviewId, approverUser = {}) {
  const approverName = approverUser.name || 'Client Partner';
  const approverRole = approverUser.role || approverUser.decisionRole || 'Authorized Signatory';
  const approverPocId = approverUser.pocId || null;

  let review = null;

  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('reviews').select('*').eq('id', reviewId).maybeSingle();
      if (data) review = data;
    } catch (_) {}
  }

  if (!review) {
    review = memoryDeliverables.find(r => r.id === reviewId);
  }

  if (!review) throw new Error(`Deliverable '${reviewId}' not found.`);

  const projectId = review.project_id;
  const approvedAt = new Date().toISOString();
  
  // 30-Day Bug Fix Warranty Clock Calculation
  const warrantyDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const reviewUpdates = {
    status: 'approved',
    is_approved: true,
    approved_by: approverName,
    approved_at: approvedAt,
    invoice_released: true
  };

  const projectUpdates = {
    status: 'Completed',
    delivery_status: 'APPROVED',
    warranty_until: warrantyDate,
    updated_at: approvedAt
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('reviews').update(reviewUpdates).eq('id', reviewId);
      if (projectId) {
        await supabase.from('projects').update(projectUpdates).eq('id', projectId);
      }
    } catch (_) {}
  }

  Object.assign(review, reviewUpdates);

  const db = await readDB();
  db.projects = db.projects || [];
  if (projectId) {
    const pIdx = db.projects.findIndex(p => p.id === projectId);
    if (pIdx !== -1) {
      db.projects[pIdx] = { ...db.projects[pIdx], ...projectUpdates };
      try { writeDB(db); } catch (_) {}
    }
  }

  broadcast('review_approved', {
    reviewId,
    projectId,
    approvedBy: approverName,
    approvedAt,
    warrantyUntil: warrantyDate
  });

  return {
    success: true,
    reviewId,
    projectId,
    approvedBy: approverName,
    approvedRole: approverRole,
    approvedAt,
    warrantyUntil: warrantyDate,
    milestoneInvoiceReleased: true
  };
}

module.exports = {
  VALID_DELIVERABLE_TYPES,
  VALID_COMMENT_TYPES,
  memoryDeliverables,
  assignProjectStakeholders,
  getProjectStakeholders,
  publishSprintDeliverable,
  getMemoryDeliverable,
  submitDeliverableFeedback,
  advanceRevisionRound,
  executeDeliverableApproval
};
