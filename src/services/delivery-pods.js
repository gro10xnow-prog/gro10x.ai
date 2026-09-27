/**
 * src/services/delivery-pods.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 2: Delivery Pods, Resource Capacity & Project-Level COGS Ledger
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibilities:
 * 1. Delivery Pod definitions & project pod assignment
 * 2. Team capacity & billable utilization tracking (target 75-85%)
 * 3. Project COGS attribution (AI API tokens, GPU compute, third-party licenses)
 * 4. True Gross Margin & Unit Economics calculation per project
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase, isSupabaseConfigured } = require('./supabase');
const { readDB, writeDB } = require('./db');
const { broadcast } = require('./sse');

const USD_TO_BDT_RATE = 120;

const POD_TYPES = {
  MVP_BUILD_POD: {
    id: 'MVP_BUILD_POD',
    type: 'MVP_BUILD_POD',
    podType: 'MVP_BUILD_POD',
    name: 'MVP Rapid Delivery Pod',
    icon: '⚡',
    focus: 'Full-stack AI SaaS MVPs, web apps, and bespoke client pilots',
    rolesRequired: ['Lead Architect', 'AI/LLM Engineer', 'QA Specialist'],
    targetVelocityDays: 14
  },
  ENTERPRISE_AUTOMATION_POD: {
    id: 'ENTERPRISE_AUTOMATION_POD',
    type: 'ENTERPRISE_AUTOMATION_POD',
    podType: 'ENTERPRISE_AUTOMATION_POD',
    name: 'Enterprise Automation & Integration Pod',
    icon: '🏢',
    focus: 'Internal workflows, RPA, webhook orchestrations, and CRM integrations',
    rolesRequired: ['Solutions Architect', 'RPA/Automation Specialist', 'DevOps Lead'],
    targetVelocityDays: 21
  },
  CREATIVE_AI_POD: {
    id: 'CREATIVE_AI_POD',
    type: 'CREATIVE_AI_POD',
    podType: 'CREATIVE_AI_POD',
    name: 'Programmatic AI Creative Pod',
    icon: '🎨',
    focus: 'Dynamic video generation, marketing AI pipelines, and multimodal creative assets',
    rolesRequired: ['Creative Director', 'Video/Audio AI Specialist', 'Prompt Designer'],
    targetVelocityDays: 7
  }
};

// In-memory fallback stores
const memoryProjectPods = new Map();
const memoryProjectCOGS = new Map();

/**
 * 1. Retrieve all defined delivery pods
 */
function getDeliveryPods() {
  return Object.values(POD_TYPES);
}

/**
 * 2. Assign Delivery Pod to Project
 */
async function assignPodToProject(projectId, podAssignment = {}) {
  const { podType, leadEngineer, assignedMembers = [], notes } = podAssignment;
  const podDef = POD_TYPES[podType] || POD_TYPES.MVP_BUILD_POD;

  const record = {
    projectId,
    podId: podDef.id,
    type: podDef.id,
    podType: podDef.id,
    podName: podDef.name,
    icon: podDef.icon,
    leadEngineer: leadEngineer || 'Lead Developer',
    assignedMembers: Array.isArray(assignedMembers) ? assignedMembers : [assignedMembers].filter(Boolean),
    targetVelocityDays: podDef.targetVelocityDays,
    notes: notes || '',
    assignedAt: new Date().toISOString()
  };


  memoryProjectPods.set(projectId, record);

  // Persist to project in Supabase or memory if possible
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('projects').update({
        delivery_pod: record,
        updated_at: new Date().toISOString()
      }).eq('id', projectId);
    } catch (_) {}
  }

  broadcast('pod_assigned', record);
  return record;
}

/**
 * 3. Retrieve assigned Pod for a Project
 */
async function getProjectPod(projectId) {
  if (memoryProjectPods.has(projectId)) {
    return memoryProjectPods.get(projectId);
  }

  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('projects').select('delivery_pod').eq('id', projectId).maybeSingle();
      if (data && data.delivery_pod) {
        memoryProjectPods.set(projectId, data.delivery_pod);
        return data.delivery_pod;
      }
    } catch (_) {}
  }

  // Default fallback pod
  return {
    projectId,
    podId: 'MVP_BUILD_POD',
    podName: 'MVP Rapid Delivery Pod',
    icon: '⚡',
    leadEngineer: 'Fahim Rahman (Lead Dev)',
    assignedMembers: ['Fahim Rahman', 'Anika Nower'],
    targetVelocityDays: 14,
    notes: 'Default agency sprint delivery pod',
    assignedAt: new Date().toISOString()
  };
}

/**
 * 4. Compute Crew Capacity & Billable Utilization
 */
async function calculateTeamCapacity() {
  let team = [];
  let tasks = [];

  if (isSupabaseConfigured()) {
    try {
      const [tRes, kRes] = await Promise.all([
        supabase.from('profiles').select('id, emp_code, name, role, department, base_salary, status'),
        supabase.from('tasks').select('id, assignee_id, assignee, stage, priority, due_date')
      ]);
      team = tRes.data || [];
      tasks = kRes.data || [];
    } catch (_) {}
  }

  if (team.length === 0) {
    const db = await readDB().catch(() => ({ team: [], tasks: [] }));
    team = db.team || [];
    tasks = db.tasks || [];
  }

  const activeStaff = team.filter(m => m.status !== 'Terminated');
  const totalWeeklyCapacityHours = activeStaff.length * 40;

  // Compute active task workload (approx 8h per in-progress/review task)
  const openTasks = tasks.filter(t => !['Approved', 'Published', 'Completed'].includes(t.stage));
  
  let totalCommittedHours = 0;
  const staffCapacity = activeStaff.map(member => {
    const memberCode = member.emp_code || member.id;
    const memberName = member.name || '';
    const memberTasks = openTasks.filter(t => 
      t.assignee_id === memberCode || 
      t.assignee === memberCode || 
      t.assignee === memberName
    );

    const committedHours = Math.min(60, memberTasks.length * 8); // Estimated 8h per active task
    totalCommittedHours += committedHours;

    const utilizationPercent = Math.round((committedHours / 40) * 100);
    const status = utilizationPercent > 100 ? 'OVERLOADED' : (utilizationPercent >= 70 ? 'OPTIMAL' : 'AVAILABLE');

    return {
      id: memberCode,
      name: memberName,
      role: member.role || 'Specialist',
      department: member.department || 'Production',
      capacityHours: 40,
      committedHours,
      availableHours: Math.max(0, 40 - committedHours),
      utilizationPercent,
      activeTasksCount: memberTasks.length,
      status
    };
  });

  const overallUtilizationPercent = totalWeeklyCapacityHours > 0 
    ? Math.round((totalCommittedHours / totalWeeklyCapacityHours) * 100)
    : 0;

  return {
    totalStaff: activeStaff.length,
    totalMembers: activeStaff.length,
    totalWeeklyCapacityHours,
    totalCommittedHours,
    billableHoursAvailable: totalWeeklyCapacityHours,
    benchAvailableHours: Math.max(0, totalWeeklyCapacityHours - totalCommittedHours),
    overallUtilizationPercent,
    utilizationRate: `${overallUtilizationPercent}%`,
    targetUtilizationRange: '75% - 85%',
    utilizationBenchmark: '75% - 85%',
    staffCapacity
  };
}

/**
 * 5. Log Direct Project COGS (AI API Tokens, GPU Compute, Third-Party Tools)
 */
async function logProjectCOGS(projectId, cogsPayload = {}) {
  const amountVal = cogsPayload.amount !== undefined ? cogsPayload.amount : (cogsPayload.costUsd !== undefined ? cogsPayload.costUsd : cogsPayload.costBdt);
  const { itemType, vendor, units, description, loggedBy } = cogsPayload;

  if (amountVal === undefined || isNaN(Number(amountVal)) || Number(amountVal) <= 0) {
    throw new Error('Valid numeric amount is required for project COGS.');
  }

  const currency = cogsPayload.currency || (cogsPayload.costUsd !== undefined ? 'USD' : 'BDT');
  const cogsId = `COGS-${Date.now().toString().slice(-6)}`;
  const numAmount = Number(amountVal);
  const amountBDT = currency === 'USD' ? Math.round(numAmount * USD_TO_BDT_RATE) : numAmount;
  const amountUSD = currency === 'BDT' ? Number((numAmount / USD_TO_BDT_RATE).toFixed(2)) : numAmount;

  const record = {
    id: cogsId,
    projectId,
    itemType: itemType || 'AI_API_TOKENS', // AI_API_TOKENS, GPU_CLOUD_COMPUTE, SUB_CONTRACTOR_LABOR, THIRD_PARTY_LICENSE
    vendor: vendor || 'OpenAI / Claude / Gemini API',
    amount: numAmount,
    currency,
    amountBDT,
    amountUSD,
    costBdt: amountBDT,
    costUsd: amountUSD,
    units: units || 'API Tokens / Cloud Compute',
    description: description || 'Direct sprint computation cost',
    loggedBy: loggedBy || 'Delivery Engineer',
    createdAt: new Date().toISOString()
  };

  const existing = memoryProjectCOGS.get(projectId) || [];
  existing.unshift(record);
  memoryProjectCOGS.set(projectId, existing);

  // Sync with main expenses ledger
  try {
    const expensePayload = {
      id: `EXP-${cogsId}`,
      category: 'Project COGS & AI Tokens',
      engine_tag: 'engine2',
      project_id: projectId,
      amount: amountBDT,
      currency: 'BDT',
      status: 'Paid',
      notes: `[Engine 2 COGS] ${record.vendor} (${record.units}) for ${projectId}: ${record.description}`,
      created_at: record.createdAt
    };

    if (isSupabaseConfigured()) {
      await supabase.from('expenses').insert([expensePayload]).then(null, () => {});
    }
  } catch (_) {}

  broadcast('cogs_logged', { projectId, cogs: record });
  return record;
}

/**
 * 6. Retrieve Project COGS & Compute True Gross Margin
 */
async function getProjectCOGS(projectId) {
  const { findProject } = require('./post-delivery');
  const project = await findProject(projectId);

  const memoryCogs = memoryProjectCOGS.get(projectId) || [];
  const projectCogs = (project?.cogsItems && Array.isArray(project.cogsItems)) ? project.cogsItems : [];
  const cogsList = memoryCogs.length > 0 ? memoryCogs : projectCogs;
  
  let totalCogsBDT = cogsList.reduce((acc, c) => acc + (c.amountBDT || c.amount || 0), 0);
  if (totalCogsBDT === 0 && project && (project.totalCOGS || project.cogs)) {
    totalCogsBDT = Number(project.totalCOGS || project.cogs || 0);
  }
  const totalCogsUSD = Number((totalCogsBDT / USD_TO_BDT_RATE).toFixed(2));

  // Retrieve project revenue
  let projectRevenueBDT = 0;
  let projectName = 'AI Project Delivery';

  if (project) {
    projectRevenueBDT = Number(project.budget || project.price || project.retainerValue || 0);
    projectName = project.name || projectName;
  }

  const grossProfitBDT = Math.max(0, projectRevenueBDT - totalCogsBDT);
  const grossMarginPercent = projectRevenueBDT > 0 
    ? Math.round((grossProfitBDT / projectRevenueBDT) * 100) 
    : 0;

  return {
    projectId,
    projectName,
    currency: 'BDT',
    projectRevenue: projectRevenueBDT,
    totalCOGS: totalCogsBDT,
    totalCogsBdt: totalCogsBDT,
    totalCogsUSD,
    totalCogsUsd: totalCogsUSD,
    grossProfit: grossProfitBDT,
    grossMarginPercent,
    targetMargin: '70%+',
    status: grossMarginPercent >= 70 ? 'HEALTHY_MARGIN' : (grossMarginPercent >= 50 ? 'MODERATE_MARGIN' : 'LOW_MARGIN'),
    itemCount: cogsList.length,
    cogsItems: cogsList
  };
}

module.exports = {
  POD_TYPES,
  getDeliveryPods,
  assignPodToProject,
  getProjectPod,
  calculateTeamCapacity,
  logProjectCOGS,
  getProjectCOGS,
  memoryProjectPods,
  memoryProjectCOGS
};

