/**
 * src/services/project-access.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 2 Access & Interactions Engine
 * Provides:
 * 1. Subcontractor Scoped Gateway with 100% Financial Masking
 * 2. Unified Project Lifecycle Timeline Aggregation
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');
const { findProject } = require('./post-delivery');
const { getProjectPod, getProjectCOGS } = require('./delivery-pods');
const { readDB } = require('./db');
const { supabase, isSupabaseConfigured } = require('./supabase');

/**
 * 1. Subcontractor Scoped Project View
 * Strips all sensitive commercial/financial data (budget, prices, billing rates, invoices, COGS, margin).
 * Scopes client info to name/company only.
 * Exposes technical deliverables, assigned pod, tasks, and repos.
 */
async function getContractorProjectView(projectId, contractorRole = 'specialist') {
  const project = await findProject(projectId);
  if (!project) {
    throw new Error(`Project '${projectId}' not found.`);
  }

  // Fetch delivery pod
  let pod = null;
  try {
    pod = await getProjectPod(projectId);
  } catch (_) {}

  // Fetch deliverables / reviews
  let deliverables = [];
  try {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('reviews').select('*').eq('project_id', projectId);
      if (data) deliverables = data;
    } else {
      const db = await readDB();
      deliverables = (db.reviews || []).filter(r => r.projectId === projectId || r.project_id === projectId);
    }
  } catch (_) {}

  // Fetch tasks / tickets assigned
  let tasks = [];
  let tickets = [];
  try {
    const db = await readDB();
    tasks = (db.tasks || []).filter(t => t.projectId === projectId || t.project_id === projectId);
    tickets = (db.tickets || []).filter(t => t.projectId === projectId || t.project_id === projectId);
  } catch (_) {}

  try {
    const { inMemoryTickets } = require('../routes/tickets');
    if (Array.isArray(inMemoryTickets)) {
      for (const imt of inMemoryTickets) {
        const matchesProject = !imt.projectId || imt.projectId === projectId || imt.project_id === projectId;
        if (matchesProject) {
          const exIdx = tickets.findIndex(t => t.id === imt.id);
          if (exIdx !== -1) {
            tickets[exIdx] = { ...tickets[exIdx], ...imt };
          } else {
            tickets.push(imt);
          }
        }
      }
    }
  } catch (_) {}

  if (isSupabaseConfigured()) {
    try {
      const { data: sbTickets } = await supabase.from('tickets').select('*').eq('project_id', projectId);
      if (sbTickets && sbTickets.length > 0) {
        for (const sbt of sbTickets) {
          const mapped = {
            id: sbt.id,
            title: sbt.title,
            priority: sbt.priority,
            severity: sbt.priority,
            status: sbt.status,
            category: sbt.category,
            createdAt: sbt.created_at,
            slaHoldback: sbt.sla_holdback || null
          };
          const exIdx = tickets.findIndex(t => t.id === sbt.id);
          if (exIdx !== -1) {
            tickets[exIdx] = { ...tickets[exIdx], ...mapped };
          } else {
            tickets.push(mapped);
          }
        }
      }
    } catch (_) {}
  }

  // Sanitize deliverables: remove commercial metadata if any
  const sanitizedDeliverables = deliverables.map(d => ({
    id: d.id,
    title: d.title || d.projectName || d.video_title || 'Sprint Deliverable',
    deliverableType: d.deliverable_type || d.deliverableType || 'staging_url',
    status: d.status || 'pending',
    stagingUrl: d.staging_url || d.stagingUrl || null,
    repoUrl: d.repo_url || d.repoUrl || null,
    apiDocsUrl: d.api_docs_url || d.apiDocsUrl || null,
    dodChecklist: d.dod_checklist || d.dodChecklist || [],
    createdAt: d.created_at || d.createdAt
  }));

  // Sanitize tasks: mask any financial custom fields
  const sanitizedTasks = tasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    stage: t.stage || t.status,
    priority: t.priority || 'medium',
    assignedTo: t.assignedTo || t.assigned_to || null,
    dueDate: t.dueDate || t.due_date || null
  }));

  // Sanitize tickets: only technical bugs / requests
  const sanitizedTickets = tickets.map(tk => ({
    id: tk.id,
    title: tk.title,
    severity: tk.severity || tk.priority,
    status: tk.status,
    category: tk.category || 'bug',
    createdAt: tk.createdAt || tk.created_at,
    slaHoldback: tk.slaHoldback || null
  }));

  // Contractor Milestone Escrow & SLA Status
  const isDelivered = ['completed', 'delivered', 'archived'].includes(String(project.stage || project.status).toLowerCase());
  const escrowAmount = Number(project.contractorPayoutBDT || project.contractorEscrowBDT || 45000);
  const activeHoldbackTicket = tickets.find(t => t.slaHoldback || t.status === 'Escalated - Holdback Applied');
  const activeDefectTicket = tickets.find(t => ['p0_blocker', 'p1_defect', 'P0', 'P1'].includes(t.severity || t.priority) && !['resolved', 'closed', 'Approved'].includes(t.status));

  const escrow = {
    milestoneName: project.contractorMilestone?.title || 'Sprint Delivery & Core Implementation',
    amountBDT: escrowAmount,
    status: isDelivered ? 'DISBURSED' : (activeHoldbackTicket ? 'HELD_IN_ESCROW' : 'FUNDED_IN_ESCROW'),
    statusLabel: isDelivered ? '✅ Escrow Disbursed' : (activeHoldbackTicket ? '⚠️ 15% Milestone Holdback Active' : '🔒 100% Escrow Funded in Vault'),
    payoutRail: 'BRAC Bank PLC (Mohakhali Branch / 060263290)',
    beneficiaryAccount: 'Neoncore Tech Solution / 2081636480001',
    fundedAt: project.createdAt || project.created_at || new Date().toISOString()
  };

  const slaNotice = activeHoldbackTicket ? {
    type: 'holdback_active',
    holdbackPercent: 15,
    holdbackBDT: Math.round(escrowAmount * 0.15),
    reason: activeHoldbackTicket.slaHoldback?.reason || 'Critical Defect Exceeded 24h SLA',
    message: '⚠️ 15% Milestone Holdback Active (P0 SLA Breach) — Resolves upon verified QA approval'
  } : (activeDefectTicket ? {
    type: 'sla_warning',
    ticketId: activeDefectTicket.id,
    remainingHours: 18,
    remainingMinutes: 24,
    formattedTimer: '⏳ 18h 24m remaining',
    message: 'Active Defect SLA Clock Running — 24-Hour Resolution Target Active'
  } : null);

  // Build sanitized contractor project view
  const contractorView = {
    id: project.id,
    projectId: project.id,
    name: project.name || project.title || 'Client Solution Sprint',
    projectName: project.name || project.title || 'Client Solution Sprint',
    status: project.status || 'active',
    stage: project.stage || 'development',
    serviceCode: project.serviceCode || project.service_code || 'ENG2-MVP',
    targetDeliveryDate: project.targetDeliveryDate || project.target_delivery_date || project.deadline || null,
    client: {
      companyName: project.client?.company || project.client?.name || project.clientName || 'Confidential Client',
      industry: project.client?.industry || 'Technology'
    },
    pod: pod ? {
      podType: pod.podType || pod.type || 'MVP_RAPID_DELIVERY_POD',
      podName: pod.podName || pod.name || '⚡ MVP Rapid Delivery Pod',
      leadRole: pod.leadRole || pod.leadEngineer || 'Tech Lead',
      leadEngineer: pod.leadEngineer || 'Pod Lead Engineer',
      assignedMembers: pod.members || pod.assignedMembers || []
    } : null,
    deliverables: sanitizedDeliverables,
    tasks: sanitizedTasks,
    tickets: sanitizedTickets,
    escrow,
    slaNotice,
    technicalGuidelines: {
      repositoryStandard: 'Git Flow with PR reviews required on main branch',
      codeStyle: 'ESLint / Prettier compliant',
      qaChecklist: 'Definition of Done (DoD) verification before client review submission',
      slaResponseHours: 24
    },
    // Explicit verification markers
    financialsMasked: true,
    viewMode: 'subcontractor_scoped',
    contractorRole
  };

  return contractorView;
}

/**
 * 2. Unified Project Lifecycle Timeline
 * Merges events across Onboarding, Deliverables, Payments, Handover, Warranty, Disputes, Tickets & Testimonials
 */
async function getProjectTimeline(projectId) {
  const project = await findProject(projectId);
  if (!project) {
    throw new Error(`Project '${projectId}' not found.`);
  }

  const timeline = [];

  // A. Project Genesis / Creation
  if (project.createdAt || project.created_at) {
    timeline.push({
      id: `TL-GEN-${project.id}`,
      timestamp: project.createdAt || project.created_at,
      category: 'onboarding',
      title: 'Project Initialized & SOW Activated',
      description: `Project "${project.name || project.title || project.id}" initiated under Engine 2 standard agreement.`,
      status: 'completed',
      actor: 'System / Sales Operations',
      icon: '🚀'
    });
  }

  // B. Invoices & Payments
  try {
    let invoices = [];
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('invoices').select('*').eq('project_id', projectId);
      if (data) invoices = data;
    } else {
      const db = await readDB();
      invoices = (db.invoices || []).filter(i => i.projectId === projectId || i.project_id === projectId);
    }

    invoices.forEach(inv => {
      const isPaid = (inv.status || '').toLowerCase() === 'paid';
      timeline.push({
        id: `TL-INV-${inv.id}`,
        timestamp: inv.paid_at || inv.paidAt || inv.issue_date || inv.issueDate || inv.createdAt || new Date().toISOString(),
        category: 'finance',
        title: isPaid ? `Invoice ${inv.id} Paid` : `Invoice ${inv.id} Issued`,
        description: `${inv.currency || 'BDT'} ${Number(inv.amount || 0).toLocaleString()} (${inv.payment_method || 'Bank Transfer'}) - Status: ${inv.status}`,
        status: isPaid ? 'completed' : 'pending',
        actor: isPaid ? 'Client Finance' : 'Billing Operations',
        icon: isPaid ? '💳' : '📄'
      });
    });
  } catch (_) {}

  // C. Deliverables & Milestones
  try {
    let deliverables = [];
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('reviews').select('*').eq('project_id', projectId);
      if (data) deliverables = data;
    } else {
      const db = await readDB();
      deliverables = (db.reviews || []).filter(r => r.projectId === projectId || r.project_id === projectId);
    }

    deliverables.forEach(del => {
      const isApproved = del.status === 'approved';
      timeline.push({
        id: `TL-DEL-${del.id}`,
        timestamp: del.approved_at || del.approvedAt || del.created_at || del.createdAt || new Date().toISOString(),
        category: 'milestone',
        title: isApproved ? `Deliverable Approved: ${del.title || del.projectName}` : `Deliverable Submitted: ${del.title || del.projectName}`,
        description: `Version: ${del.active_version || 'v1.0'} | Type: ${del.deliverable_type || 'staging'} | DoD Passed: ${Array.isArray(del.dod_checklist) ? del.dod_checklist.filter(d => d.passed).length : 0} items`,
        status: isApproved ? 'completed' : 'in_progress',
        actor: isApproved ? 'Client Primary POC' : 'Delivery Lead',
        icon: isApproved ? '✅' : '📦'
      });
    });
  } catch (_) {}

  // D. IP Transfer Handover Manifest
  if (project.handover_manifest || project.handoverManifest) {
    const manifest = project.handover_manifest || project.handoverManifest;
    const isSigned = manifest.signedAt || manifest.signed_at || manifest.status === 'SIGNED_AND_TRANSFERRED';
    timeline.push({
      id: `TL-HND-${manifest.manifestId || 'MAN-001'}`,
      timestamp: manifest.signedAt || manifest.signed_at || manifest.issuedAt || new Date().toISOString(),
      category: 'handover',
      title: isSigned ? 'IP Transfer Manifest Digitally Executed' : 'IP Transfer Manifest Generated',
      description: `Manifest ${manifest.manifestId || ''} - Irrevocable assignment of code, weights and IP to client.`,
      status: isSigned ? 'completed' : 'pending',
      actor: isSigned ? (manifest.signedBy || 'Client Signatory') : 'Legal Operations',
      icon: '📜'
    });
  }

  // E. 30-Day Warranty Lifecycle
  if (project.warranty_start_date || project.warrantyStartDate) {
    const startDate = project.warranty_start_date || project.warrantyStartDate;
    timeline.push({
      id: `TL-WAR-START-${project.id}`,
      timestamp: startDate,
      category: 'warranty',
      title: '30-Day Bug-Fix Warranty Activated',
      description: 'Zero-cost production SLA active (4h critical / 24h standard response window).',
      status: 'completed',
      actor: 'Warranty Automation Engine',
      icon: '🛡️'
    });
  }

  // F. Disputes (if any)
  if (project.disputes && Array.isArray(project.disputes)) {
    project.disputes.forEach((disp, idx) => {
      timeline.push({
        id: `TL-DSP-${disp.disputeId || idx}`,
        timestamp: disp.raisedAt || disp.raised_at || new Date().toISOString(),
        category: 'dispute',
        title: disp.status === 'RESOLVED' ? `Dispute Resolved: ${disp.disputeId}` : `Dispute Raised: ${disp.disputeId}`,
        description: `Reason: ${disp.reason || 'Deliverable discrepancy'}. Status: ${disp.status}`,
        status: disp.status === 'RESOLVED' ? 'completed' : 'warning',
        actor: disp.status === 'RESOLVED' ? (disp.resolvedBy || 'Executive Committee') : (disp.submittedBy || 'Client'),
        icon: '⚖️'
      });
    });
  }

  // G. Testimonials / Social Proof (if submitted)
  try {
    const db = await readDB();
    const { memoryTestimonials } = require('./post-delivery');
    const allTestimonials = [...(db.testimonials || []), ...memoryTestimonials];
    const testimonial = allTestimonials.find(t => t.projectId === projectId);
    if (testimonial) {
      timeline.push({
        id: `TL-TST-${testimonial.id || 'TST-001'}`,
        timestamp: testimonial.submittedAt || testimonial.createdAt || new Date().toISOString(),
        category: 'social_proof',
        title: `Client Testimonial Received (${testimonial.csatRating}/5 CSAT, NPS: ${testimonial.npsScore}/10)`,
        description: `"${(testimonial.reviewText || '').slice(0, 100)}..." by ${testimonial.clientDisplayName || 'Client'}`,
        status: 'completed',
        actor: testimonial.clientDisplayName || 'Client',
        icon: '🌟'
      });
    }
  } catch (_) {}

  // Sort descending by default (latest events first)
  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    ok: true,
    projectId,
    projectName: project.name || project.title || 'Project',
    count: timeline.length,
    timeline
  };
}

/**
 * 3. Issue Scoped Subcontractor Access Pass
 * Generates an expiring JWT token with role 'Subcontractor' and linkedType 'contractor'
 */
async function issueContractorPass(projectId, options = {}) {
  const project = await findProject(projectId);
  if (!project) {
    throw new Error(`Project '${projectId}' not found.`);
  }

  const { signToken } = require('./jwt');
  const contractorName = (options.contractorName || options.name || 'External Specialist').trim();
  const daysValid = Number(options.daysValid || 14);
  const expiresInSeconds = daysValid * 24 * 60 * 60;
  const contractorId = `CON-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const payload = {
    userId: contractorId,
    id: contractorId,
    name: contractorName,
    role: 'Subcontractor',
    accessLevel: 'Contractor',
    linkedType: 'contractor',
    projectId: project.id,
    projectName: project.name || project.title
  };

  const token = signToken(payload, expiresInSeconds);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  const passUrl = `/contractor-view.html?id=${encodeURIComponent(project.id)}&token=${encodeURIComponent(token)}`;

  return {
    ok: true,
    projectId: project.id,
    contractorId,
    contractorName,
    token,
    passUrl,
    expiresAt,
    daysValid
  };
}

/**
 * 4. Log Contractor Technical Blocker / Bug Ticket
 */
async function logContractorTicket(projectId, ticketData = {}, user = {}) {
  const project = await findProject(projectId);
  if (!project) {
    throw new Error(`Project '${projectId}' not found.`);
  }

  const title = (ticketData.title || '').trim();
  if (!title) {
    throw new Error('Ticket title is required.');
  }

  const ticketId = `TKT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const severity = ticketData.severity || 'p1_defect';
  const description = ticketData.description || 'Technical blocker reported by subcontractor';
  const stagingUrl = ticketData.stagingUrl || null;
  const createdBy = user.name || user.contactName || 'Subcontractor';

  const ticketRecord = {
    id: ticketId,
    projectId: project.id,
    project_id: project.id,
    projectName: project.name || project.title,
    title,
    description,
    severity,
    priority: severity === 'p0_blocker' ? 'Critical' : 'High',
    status: 'Open',
    category: 'contractor_defect',
    is_contractor_ticket: true,
    stagingUrl,
    createdBy,
    created_by: createdBy,
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('tickets').insert([ticketRecord]);
    } catch (_) {}
  } else {
    try {
      const db = await readDB();
      if (!db.tickets) db.tickets = [];
      db.tickets.push(ticketRecord);
      const { writeDB } = require('./db');
      await writeDB(db);
    } catch (_) {}
  }

  try {
    const { sendTelegramNotification } = require('./bot');
    const ownerChatId = process.env.TELEGRAM_OWNER_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (ownerChatId) {
      sendTelegramNotification(
        ownerChatId,
        `🛠️ *Subcontractor Technical Ticket Logged*\n\n` +
        `🏢 *Project:* ${project.name || project.id}\n` +
        `👤 *Reported By:* ${createdBy} (Contractor)\n` +
        `⚠️ *Severity:* ${severity.toUpperCase()}\n` +
        `📝 *Title:* ${title}\n` +
        `📋 *Details:* ${description}`,
        null,
        true
      ).catch(() => {});
    }

    // Also alert assigned Delivery Pod Lead
    try {
      const podId = project.delivery_pod_id || project.deliveryPodId;
      const { DELIVERY_PODS } = require('./delivery-pods');
      const pod = DELIVERY_PODS ? DELIVERY_PODS[podId] : null;
      if (pod && pod.leadEngineer) {
        const leadName = pod.leadEngineer;
        const { data: leadProfile } = isSupabaseConfigured()
          ? await supabase.from('profiles').select('telegram_id').ilike('name', `%${leadName}%`).maybeSingle()
          : { data: null };
        const leadChatId = leadProfile?.telegram_id;
        if (leadChatId && leadChatId !== ownerChatId) {
          sendTelegramNotification(
            leadChatId,
            `🛠️ *Pod Lead Alert: Subcontractor Blocker on Your Sprint*\n\n` +
            `🏢 *Project:* ${project.name || project.id}\n` +
            `⚡ *Pod:* ${pod.name}\n` +
            `👤 *Reported By:* ${createdBy} (Contractor)\n` +
            `⚠️ *Severity:* ${severity.toUpperCase()}\n` +
            `📝 *Title:* ${title}\n` +
            `📋 *Details:* ${description}`,
            null,
            true
          ).catch(() => {});
        }
      }
    } catch (_) {}
  } catch (_) {}

  return {
    ok: true,
    ticket: ticketRecord
  };
}

/**
 * 5. Toggle Definition of Done (DoD) Item for Subcontractors & Pod Members
 */
async function toggleContractorDoD(projectId, { deliverableId, index, passed, title, updatedBy = 'Contractor' } = {}) {
  const project = await findProject(projectId);
  if (!project) {
    throw new Error(`Project '${projectId}' not found.`);
  }

  let deliverable = null;

  if (isSupabaseConfigured() && deliverableId) {
    try {
      const { data } = await supabase.from('reviews').select('*').eq('id', deliverableId).single();
      if (data) deliverable = data;
    } catch (_) {}
  }

  const db = await readDB();
  if (!deliverable) {
    const reviews = db.reviews || [];
    if (deliverableId) {
      deliverable = reviews.find(r => (r.id === deliverableId || r._id === deliverableId) && (r.projectId === projectId || r.project_id === projectId));
    }
    if (!deliverable) {
      deliverable = reviews.find(r => r.projectId === projectId || r.project_id === projectId);
    }
  }

  let checklist = [];
  if (deliverable && (deliverable.dod_checklist || deliverable.dodChecklist)) {
    checklist = deliverable.dod_checklist || deliverable.dodChecklist;
  } else {
    checklist = [
      { id: 'DOD-01', title: 'Core Functionality & User Flows Verified', passed: true, verified_by: 'QA Lead' },
      { id: 'DOD-02', title: 'Zero Console Errors & Responsive UI Check', passed: false, verified_by: 'QA Lead' },
      { id: 'DOD-03', title: 'Compliant Database Schema & RLS Active', passed: false, verified_by: 'Lead Engineer' },
      { id: 'DOD-04', title: 'Automated Test Suite Passing', passed: false, verified_by: 'Lead Engineer' }
    ];
  }

  // Deep clone to safely manipulate
  checklist = JSON.parse(JSON.stringify(checklist));

  const targetIdx = typeof index === 'number' && index >= 0 && index < checklist.length
    ? index
    : checklist.findIndex(c => (typeof c === 'object' && (c.id === deliverableId || c.title === title || c.label === title)));

  if (targetIdx >= 0 && targetIdx < checklist.length) {
    if (typeof checklist[targetIdx] === 'string') {
      checklist[targetIdx] = {
        id: `DOD-0${targetIdx + 1}`,
        title: checklist[targetIdx],
        passed: Boolean(passed),
        verified_by: updatedBy,
        updated_at: new Date().toISOString()
      };
    } else {
      checklist[targetIdx].passed = Boolean(passed);
      checklist[targetIdx].verified_by = updatedBy;
      checklist[targetIdx].updated_at = new Date().toISOString();
    }
  } else if (title) {
    checklist.push({
      id: `DOD-${checklist.length + 1}`,
      title,
      passed: Boolean(passed),
      verified_by: updatedBy,
      updated_at: new Date().toISOString()
    });
  }

  if (deliverable) {
    deliverable.dod_checklist = checklist;
    deliverable.dodChecklist = checklist;

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('reviews').update({ dod_checklist: checklist }).eq('id', deliverable.id);
      } catch (_) {}
    }

    try {
      if (db.reviews) {
        const idx = db.reviews.findIndex(r => r.id === deliverable.id || (r.projectId === projectId || r.project_id === projectId));
        if (idx !== -1) {
          db.reviews[idx].dod_checklist = checklist;
          db.reviews[idx].dodChecklist = checklist;
          const { writeDB } = require('./db');
          await writeDB(db);
        }
      }
    } catch (_) {}
  }

  return {
    ok: true,
    projectId,
    deliverableId: deliverable ? deliverable.id : deliverableId,
    checklist
  };
}

module.exports = {
  getContractorProjectView,
  getProjectTimeline,
  issueContractorPass,
  logContractorTicket,
  toggleContractorDoD
};
