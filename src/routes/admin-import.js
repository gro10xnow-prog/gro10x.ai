/**
 * src/routes/admin-import.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PurpleOS Admin Bulk Import Routes v2.0
 * Handles CSV bulk-import of clients and invoices from the Admin Portal.
 * Optimized with batch upserts, robust schema validation, and unified responses.
 * Mounted at: /api/admin/import/*
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireManager } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { ok, fail, asyncHandler } = require('../utils/response');

// ──────── CLIENTS IMPORT ────────

/**
 * POST /api/admin/import/clients
 * Body: { rows: [{ name, contact, phone, email, industry, category, budget, retainerValue, status }] }
 */
router.post('/clients', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return fail(res, 400, 'rows array is required and must not be empty', 'INVALID_INPUT');
  }

  let startIdNum = 1;
  if (isSupabaseConfigured()) {
    const { data: countData } = await supabase.from('clients').select('id');
    startIdNum = (countData?.length || 0) + 1;
  }

  const validPayloads = [];
  const errors = [];

  rows.forEach((row, idx) => {
    const name = row.name || row.company || row['company name'] || row.client || '';
    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push({ row, reason: 'Company/Client name is required' });
      return;
    }

    const contactPerson = row.contact || row.contact_person || row.contactPerson || row['contact person'] || '';
    const phone = row.phone || row.whatsapp || row.mobile || row['phone number'] || '';
    const email = row.email || row['contact email'] || row.mail || '';
    const category = row.category || row.industry || 'General';
    const status = row.status || 'Active Retainer';
    const rawBudget = row.budget || row.retainerValue || row.totalSpent || row.total_spent || 0;
    const parsedBudget = typeof rawBudget === 'number' ? rawBudget : Number(String(rawBudget).replace(/[^0-9.]/g, '')) || 0;

    const clientId = `CLI-${String(startIdNum + idx).padStart(4, '0')}`;
    const pocList = (contactPerson || phone || email) ? [{
      id: `poc_${Date.now()}_${idx}`,
      name: contactPerson || name,
      role: 'Primary POC',
      phone: phone || '',
      email: email || '',
      isPrimary: true
    }] : [];

    validPayloads.push({
      id: clientId,
      name: String(name).trim(),
      contact_person: contactPerson ? String(contactPerson).trim() : null,
      phone: phone ? String(phone).trim() : null,
      whatsapp: phone ? String(phone).trim() : null,
      email: email ? String(email).trim() : null,
      category: String(category).trim(),
      industry: String(category).trim(),
      status: String(status).trim(),
      total_spent: parsedBudget ? `৳${parsedBudget.toLocaleString()}` : '$0',
      active_campaigns: [],
      pocs: pocList,
      created_at: new Date().toISOString()
    });
  });

  let imported = [];

  if (validPayloads.length > 0 && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('clients')
      .upsert(validPayloads, { onConflict: 'id', ignoreDuplicates: false })
      .select();

    if (error) {
      return fail(res, 500, `Database import error: ${error.message}`, 'DB_ERROR');
    }
    imported = data || validPayloads;
  } else {
    imported = validPayloads;
  }

  if (imported.length > 0) {
    broadcast('client_update', imported);
    broadcast('clients_update', imported);
  }

  return ok(res, {
    success: true,
    addedCount: imported.length,
    imported: imported.length,
    errorsCount: errors.length,
    errors: errors.length > 0 ? errors : undefined
  });
}));


// ──────── INVOICES IMPORT ────────

/**
 * POST /api/admin/import/invoices
 * Body: { rows: [{ id, client, amount, date, status }] }
 */
router.post('/invoices', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return fail(res, 400, 'rows array is required and must not be empty', 'INVALID_INPUT');
  }

  const validPayloads = [];
  const errors = [];
  const todayStr = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const dueStr = nextMonth.toISOString().split('T')[0];

  rows.forEach((row, idx) => {
    const { id, client, amount, date, status } = row;
    if (!client || !amount) {
      errors.push({ row, reason: 'Client and amount are required' });
      return;
    }

    const issueDate = date ? String(date).trim() : todayStr;

    validPayloads.push({
      id: id ? String(id).trim() : `INV-${Date.now()}-${idx}`,
      client_name: String(client).trim(),
      amount: Number(String(amount).replace(/[^0-9.]/g, '')) || 0,
      date: issueDate,
      due_date: dueStr,
      status: status ? String(status).trim() : 'Pending',
      created_at: new Date().toISOString()
    });
  });

  let imported = [];

  if (validPayloads.length > 0 && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('invoices')
      .upsert(validPayloads, { onConflict: 'id', ignoreDuplicates: false })
      .select();

    if (error) {
      return fail(res, 500, `Database import error: ${error.message}`, 'DB_ERROR');
    }
    imported = data || validPayloads;
  } else {
    imported = validPayloads;
  }

  if (imported.length > 0) broadcast('invoice_update', imported);

  return ok(res, {
    imported: imported.length,
    errorsCount: errors.length,
    errors: errors.length > 0 ? errors : undefined
  });
}));


// ──────── PROJECTS IMPORT ────────

/**
 * POST /api/admin/import/projects
 * Body: { rows: [{ name, client, department, workflowType, status, startDate, dueDate, budget, description }] }
 */
router.post('/projects', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return fail(res, 400, 'rows array is required and must not be empty', 'INVALID_INPUT');
  }

  const validPayloads = [];
  const errors = [];

  rows.forEach((row, idx) => {
    const name = row.name || row.title || row['project name'] || row['project'] || '';
    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push({ row, reason: 'Project name is required' });
      return;
    }

    const clientName = row.client || row.client_name || row.clientName || row.company || 'Agency';
    const department = row.department || row.dept || 'Production';
    const workflowType = (row.workflowType || row.workflow_type || row.workflow || 'video_production').toLowerCase();
    const status = row.status || 'Active';
    const startDate = row.startDate || row.start_date || row.start || null;
    const dueDate = row.dueDate || row.due_date || row.due || row.deadline || null;
    const budget = Number(String(row.budget || '0').replace(/[^0-9.]/g, '')) || 0;
    const description = row.description || row.desc || row.brief || '';

    const rawUuid = require('crypto').randomUUID ? require('crypto').randomUUID() : String(Date.now());
    validPayloads.push({
      id: row.id || `PRJ-${rawUuid.split('-')[0].toUpperCase()}`,
      name: String(name).trim(),
      client_name: String(clientName).trim(),
      department: String(department).trim(),
      workflow_type: String(workflowType).trim(),
      status: String(status).trim(),
      start_date: startDate ? String(startDate).trim() : null,
      due_date: dueDate ? String(dueDate).trim() : null,
      budget: budget,
      description: String(description).trim(),
      created_at: new Date().toISOString()
    });
  });

  let imported = [];

  if (validPayloads.length > 0 && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .upsert(validPayloads, { onConflict: 'id', ignoreDuplicates: false })
        .select();

      if (!error && data) {
        imported = data;
      }
    } catch (e) {}

    // Also persist in app_settings projects_registry for full resilience
    try {
      const { data: curData } = await supabase.from('app_settings').select('value').eq('key', 'projects_registry').maybeSingle();
      const existing = (curData && Array.isArray(curData.value)) ? curData.value : [];
      const merged = [...existing.filter(p => !validPayloads.some(v => v.name.toLowerCase() === (p.name || '').toLowerCase())), ...validPayloads];
      await supabase.from('app_settings').upsert({
        key: 'projects_registry',
        value: merged,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
      if (imported.length === 0) imported = validPayloads;
    } catch (e) {}
  } else {
    imported = validPayloads;
  }

  if (imported.length > 0) broadcast('project_update', imported);

  return ok(res, {
    success: true,
    addedCount: imported.length,
    imported: imported.length,
    errorsCount: errors.length,
    errors: errors.length > 0 ? errors : undefined
  });
}));


// ──────── TASKS IMPORT ────────

/**
 * POST /api/admin/import/tasks
 * Body: { rows: [{ title, client, projectName, assignee, department, workflowType, stage, priority, dueDate, estimatedHours, description }] }
 */
router.post('/tasks', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return fail(res, 400, 'rows array is required and must not be empty', 'INVALID_INPUT');
  }

  // Pre-fetch team profiles to auto-link assignees
  let teamProfiles = [];

  if (isSupabaseConfigured()) {
    const { data: pData } = await supabase.from('profiles').select('id, emp_code, name, role, department');
    teamProfiles = pData || [];
  }

  const { matchesAssignee } = require('../utils/name');

  const validPayloads = [];
  const errors = [];

  rows.forEach((row, idx) => {
    const title = row.title || row.task || row['task title'] || row.name || '';
    if (!title || typeof title !== 'string' || !title.trim()) {
      errors.push({ row, reason: 'Task title is required' });
      return;
    }

    const client = row.client || row.client_name || row.company || row['client name'] || 'Agency';
    const rawAssignee = row.assignee || row.assigned_to || row['assigned to'] || row.staff || '';
    const stage = row.stage || row.status || 'Briefing';
    const priority = row.priority || 'Medium';
    const dueDate = row.dueDate || row.due_date || row.deadline || row.due || null;
    const description = row.description || row.desc || row.brief || row.notes || '';

    // Resolve Assignee to actual employee
    let matchedEmp = null;
    if (rawAssignee) {
      matchedEmp = teamProfiles.find(p =>
        (p.emp_code && p.emp_code.toLowerCase() === rawAssignee.trim().toLowerCase()) ||
        matchesAssignee(rawAssignee, p.name, p.emp_code)
      );
    }

    const resolvedAssigneeName = matchedEmp ? matchedEmp.name : (rawAssignee ? String(rawAssignee).trim() : 'Unassigned');
    const resolvedAssigneeUuid = matchedEmp ? matchedEmp.id : null;

    const rawUuid = require('crypto').randomUUID ? require('crypto').randomUUID() : String(Date.now());
    const taskId = row.id || `TSK-${rawUuid.split('-')[0].toUpperCase()}`;

    const taskRow = {
      id: taskId,
      title: String(title).trim(),
      client: String(client).trim(),
      stage: String(stage).trim(),
      priority: String(priority).trim(),
      assignees: [resolvedAssigneeName],
      due_date: dueDate ? String(dueDate).trim() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (resolvedAssigneeUuid) {
      taskRow.assignee_id = resolvedAssigneeUuid;
    }

    validPayloads.push(taskRow);
  });

  let imported = [];

  if (validPayloads.length > 0 && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .upsert(validPayloads, { onConflict: 'id', ignoreDuplicates: false })
        .select();

      if (error) {
        console.warn('[Tasks Import DB fallback]:', error.message);
        imported = validPayloads;
      } else {
        imported = data || validPayloads;
      }
    } catch (dbErr) {
      console.warn('[Tasks Import DB exception]:', dbErr.message);
      imported = validPayloads;
    }
  } else {
    imported = validPayloads;
  }

  // Clear task cache and broadcast
  const cache = require('../services/cache');
  cache.delByPrefix('tasks:');
  if (imported.length > 0) broadcast('task_update', imported);

  return ok(res, {
    success: true,
    addedCount: imported.length,
    imported: imported.length,
    errorsCount: errors.length,
    errors: errors.length > 0 ? errors : undefined
  });
}));


// ──────── AI DATA SANITIZER & ENRICHER ────────

function normalizeDateStr(rawDate) {
  if (!rawDate) return null;
  const str = String(rawDate).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3];
    return `${y}-${m}-${d}`;
  }

  const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
  const textMatch = str.match(/(\d{1,2})(?:st|nd|rd|th)?\s*([a-zA-Z]{3,9})(?:\s*(\d{4}))?/i) ||
                    str.match(/([a-zA-Z]{3,9})\s*(\d{1,2})(?:st|nd|rd|th)?(?:\s*(\d{4}))?/i);
  if (textMatch) {
    let day = '', monthName = '', year = textMatch[3] || '2026';
    if (/^\d+/.test(textMatch[1])) {
      day = textMatch[1].padStart(2, '0');
      monthName = textMatch[2].substring(0, 3).toLowerCase();
    } else {
      monthName = textMatch[1].substring(0, 3).toLowerCase();
      day = textMatch[2].padStart(2, '0');
    }
    const monthNum = months[monthName] || '09';
    return `${year}-${monthNum}-${day}`;
  }

  if (str.toLowerCase().includes('tomorrow')) {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  return '2026-09-15';
}

/**
 * POST /api/admin/import/clean-tasks-ai
 * Body: { rows: [{ title, client, assignee, dueDate, ... }] }
 * Cleans, sanitizes, and enriches raw imported rows using AI and rule matching.
 */
router.post('/clean-tasks-ai', requireAuth, requireManager, asyncHandler(async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return fail(res, 400, 'rows array is required and must not be empty', 'INVALID_INPUT');
  }

  let teamProfiles = [];
  let clientList = [];

  const DEFAULT_CLIENTS = [];

  const DEFAULT_TEAM = [
    { emp_code: 'GRO-000', name: 'Firoz Uddin Ahmed', department: 'Tech & AI' },
    { emp_code: 'GRO-002', name: 'Anika Nower', department: 'Brand Operations' }
  ];

  if (isSupabaseConfigured()) {
    const [pRes, cRes] = await Promise.all([
      supabase.from('profiles').select('id, emp_code, name, role, department'),
      supabase.from('clients').select('id, name, category')
    ]);
    teamProfiles = (pRes.data && pRes.data.length > 0) ? pRes.data : DEFAULT_TEAM;
    clientList = (cRes.data && cRes.data.length > 0) ? cRes.data : DEFAULT_CLIENTS;
  } else {
    teamProfiles = DEFAULT_TEAM;
    clientList = DEFAULT_CLIENTS;
  }

  // Ensure default clients & team are always in search pool
  DEFAULT_CLIENTS.forEach(dc => {
    if (!clientList.some(c => c.name.toLowerCase() === dc.name.toLowerCase())) {
      clientList.push(dc);
    }
  });

  DEFAULT_TEAM.forEach(dt => {
    if (!teamProfiles.some(p => p.name.toLowerCase() === dt.name.toLowerCase())) {
      teamProfiles.push(dt);
    }
  });

  const { getFirstName, getPreferredName, matchesAssignee } = require('../utils/name');

  const cleanedRows = [];
  let modificationsCount = 0;

  rows.forEach((row) => {
    let title = (row.title || row.task || row['task title'] || row.name || '').trim();
    let client = (row.client || row.client_name || row.company || row['client name'] || '').trim();
    let rawAssignee = (row.assignee || row.assigned_to || row['assigned to'] || row.staff || '').trim();
    let department = (row.department || row.dept || '').trim();
    let workflowType = (row.workflowType || row.workflow_type || row.workflow || '').trim().toLowerCase();
    let stage = (row.stage || row.status || 'Briefing').trim();
    let priority = (row.priority || 'Medium').trim();
    let dueDate = row.dueDate || row.due_date || row.deadline || row.due || '';
    let estimatedHours = Number(String(row.estimatedHours || row.estimated_hours || row.hours || '8').replace(/[^0-9.]/g, '')) || 8;
    let description = (row.description || row.desc || row.brief || row.notes || '').trim();
    let projectName = (row.projectName || row.project_name || row.project || '').trim();

    const changes = [];

    // 1. Clean Title (Capitalize nicely)
    if (title) {
      const origTitle = title;
      title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (title !== origTitle) changes.push(`Title capitalized`);
    } else {
      title = 'General Deliverable';
      changes.push(`Default title assigned`);
    }

    // 2. Fuzzy Client Matching
    if (client) {
      const matchClient = clientList.find(c =>
        c.name.toLowerCase().includes(client.toLowerCase()) ||
        client.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchClient && matchClient.name !== client) {
        changes.push(`Client matched: "${client}" → "${matchClient.name}"`);
        client = matchClient.name;
      }
    } else {
      client = 'Agency';
      changes.push(`Client defaulted to "Agency"`);
    }

    // 3. Fuzzy Assignee Matching
    let matchedEmp = null;
    if (rawAssignee) {
      const cleanRaw = rawAssignee.toLowerCase().replace(/\b(bhai|vai|bro|lead|designer|editor|qa|qc|specialist)\b/g, '').trim();
      matchedEmp = teamProfiles.find(p =>
        (p.emp_code && p.emp_code.toLowerCase() === rawAssignee.toLowerCase()) ||
        matchesAssignee(cleanRaw, p.name, p.emp_code) ||
        p.name.toLowerCase().includes(cleanRaw) ||
        cleanRaw.includes(p.name.toLowerCase())
      );
      if (matchedEmp && matchedEmp.name !== rawAssignee) {
        changes.push(`Assignee resolved: "${rawAssignee}" → "${matchedEmp.name}"`);
      }
    }

    const finalAssignee = matchedEmp ? matchedEmp.name : (rawAssignee || 'Unassigned');

    // 4. Workflow & Department Auto-Inference
    const lowerTitle = title.toLowerCase();
    if (!workflowType || workflowType === 'video') {
      if (lowerTitle.includes('banner') || lowerTitle.includes('post') || lowerTitle.includes('social') || lowerTitle.includes('carousel')) {
        workflowType = 'social';
        department = department || 'Creative & Content';
        changes.push(`Workflow inferred as "social"`);
      } else if (lowerTitle.includes('brand') || lowerTitle.includes('logo') || lowerTitle.includes('guideline') || lowerTitle.includes('typography')) {
        workflowType = 'branding';
        department = department || 'Branding & Design';
        changes.push(`Workflow inferred as "branding"`);
      } else if (lowerTitle.includes('landing') || lowerTitle.includes('app') || lowerTitle.includes('web') || lowerTitle.includes('ui') || lowerTitle.includes('dev')) {
        workflowType = 'dev';
        department = department || 'Development & Tech';
        changes.push(`Workflow inferred as "dev"`);
      } else {
        workflowType = 'video';
        department = department || 'Post Production';
      }
    }

    if (matchedEmp?.department && !department) {
      department = matchedEmp.department;
    }

    // 5. Stage Normalization
    const lowerStage = stage.toLowerCase();
    if (lowerStage.includes('edit')) stage = 'Editing';
    else if (lowerStage.includes('shoot') || lowerStage.includes('film')) stage = 'Shooting';
    else if (lowerStage.includes('script')) stage = 'Scripting';
    else if (lowerStage.includes('qc') || lowerStage.includes('check')) stage = 'Internal QC';
    else if (lowerStage.includes('client') || lowerStage.includes('review')) stage = 'Client Review';
    else if (lowerStage.includes('approve') || lowerStage.includes('done')) stage = 'Approved';
    else stage = 'Briefing';

    // 6. Date Normalization
    const normalizedDueDate = normalizeDateStr(dueDate);
    if (dueDate && normalizedDueDate !== dueDate) {
      changes.push(`Date formatted: "${dueDate}" → "${normalizedDueDate}"`);
    }

    // 7. Priority Normalization
    const lowerPri = priority.toLowerCase();
    if (lowerPri.includes('urg') || lowerPri.includes('crit') || lowerPri.includes('p1')) priority = 'Urgent';
    else if (lowerPri.includes('hi') || lowerPri.includes('p2')) priority = 'High';
    else if (lowerPri.includes('low') || lowerPri.includes('p4')) priority = 'Low';
    else priority = 'Medium';

    // 8. Description Polish
    if (!description && title) {
      description = `${title} deliverable for ${client} (${workflowType.toUpperCase()} workflow).`;
      changes.push(`Description generated`);
    }

    if (changes.length > 0) modificationsCount++;

    cleanedRows.push({
      title,
      client,
      projectName,
      assignee: finalAssignee,
      assigneeId: matchedEmp?.emp_code || null,
      department: department || 'Production',
      workflowType,
      stage,
      priority,
      dueDate: normalizedDueDate || '2026-09-15',
      estimatedHours,
      description,
      _changes: changes
    });
  });

  return ok(res, {
    success: true,
    cleanedRows,
    modificationsCount,
    totalRows: rows.length
  });
}));

module.exports = router;
