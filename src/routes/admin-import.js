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

  if (imported.length > 0) broadcast('clients_update', imported);

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
      assignee: resolvedAssigneeName,
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
    const { data, error } = await supabase
      .from('tasks')
      .upsert(validPayloads, { onConflict: 'id', ignoreDuplicates: false })
      .select();

    if (error) {
      console.warn('[Tasks Import DB error]:', error.message);
      return fail(res, 500, `Database import error: ${error.message}`, 'DB_ERROR');
    }
    imported = data || validPayloads;
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

module.exports = router;
