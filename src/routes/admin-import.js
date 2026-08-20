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

module.exports = router;
