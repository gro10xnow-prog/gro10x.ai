/**
 * src/routes/admin-import.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PurpleOS Admin Bulk Import Routes v1.0
 * Handles CSV bulk-import of clients and invoices from the Admin Portal.
 * Mounted at: /api/admin/import/*
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');

// ──────── CLIENTS IMPORT ────────

/**
 * POST /api/admin/import/clients
 * Body: { rows: [{ name, contact, phone, budget }] }
 */
router.post('/clients', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'rows array is required and must not be empty' });
  }

  const imported = [];
  const errors = [];

  if (isSupabaseConfigured()) {
    // Upsert into Supabase clients table
    for (const row of rows) {
      const { name, contact, phone, budget } = row;
      if (!name) { errors.push({ row, reason: 'name is required' }); continue; }

      const payload = {
        name: String(name).trim(),
        contact_person: contact ? String(contact).trim() : null,
        phone: phone ? String(phone).trim() : null,
        budget: budget ? Number(String(budget).replace(/[^0-9.]/g, '')) || 0 : 0,
        status: 'Active',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('clients')
        .upsert([payload], { onConflict: 'name', ignoreDuplicates: false })
        .select()
        .maybeSingle();

      if (error) {
        errors.push({ row, reason: error.message });
      } else {
        imported.push(data || payload);
      }
    }
  } else {
    // Fallback: write to db.json
    const db = await readDB();
    db.clients = db.clients || [];
    for (const row of rows) {
      const { name, contact, phone, budget } = row;
      if (!name) { errors.push({ row, reason: 'name is required' }); continue; }
      const existing = db.clients.find(c => c.name.toLowerCase() === String(name).toLowerCase().trim());
      if (!existing) {
        const newClient = {
          id: `CLT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: String(name).trim(),
          contactPerson: contact || '',
          phone: phone || '',
          budget: budget ? Number(String(budget).replace(/[^0-9.]/g, '')) || 0 : 0,
          status: 'Active',
          createdAt: new Date().toISOString()
        };
        db.clients.push(newClient);
        imported.push(newClient);
      }
    }
    await writeDB(db);
  }

  if (imported.length > 0) broadcast('clients_update', imported);

  res.json({
    success: true,
    imported: imported.length,
    errors: errors.length,
    details: errors.length > 0 ? errors : undefined
  });
});


// ──────── INVOICES IMPORT ────────

/**
 * POST /api/admin/import/invoices
 * Body: { rows: [{ id, client, amount, date, status }] }
 */
router.post('/invoices', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'rows array is required and must not be empty' });
  }

  const imported = [];
  const errors = [];

  if (isSupabaseConfigured()) {
    for (const row of rows) {
      const { id, client, amount, date, status } = row;
      if (!client || !amount) { errors.push({ row, reason: 'client and amount are required' }); continue; }

      const payload = {
        id: id ? String(id).trim() : `INV-${Date.now()}`,
        client_name: String(client).trim(),
        amount: Number(String(amount).replace(/[^0-9.]/g, '')) || 0,
        issue_date: date ? String(date).trim() : new Date().toISOString().split('T')[0],
        status: status ? String(status).trim() : 'Pending',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('invoices')
        .upsert([payload], { onConflict: 'id', ignoreDuplicates: false })
        .select()
        .maybeSingle();

      if (error) {
        errors.push({ row, reason: error.message });
      } else {
        imported.push(data || payload);
      }
    }
  } else {
    // Fallback: write to db.json
    const db = await readDB();
    db.invoices = db.invoices || [];
    for (const row of rows) {
      const { id, client, amount, date, status } = row;
      if (!client || !amount) { errors.push({ row, reason: 'client and amount are required' }); continue; }

      const invId = id ? String(id).trim() : `INV-${Date.now()}`;
      const existing = db.invoices.find(i => i.id === invId);
      if (!existing) {
        const newInvoice = {
          id: invId,
          clientName: String(client).trim(),
          amount: Number(String(amount).replace(/[^0-9.]/g, '')) || 0,
          issueDate: date ? String(date).trim() : new Date().toISOString().split('T')[0],
          status: status ? String(status).trim() : 'Pending',
          createdAt: new Date().toISOString()
        };
        db.invoices.push(newInvoice);
        imported.push(newInvoice);
      }
    }
    await writeDB(db);
  }

  if (imported.length > 0) broadcast('invoice_update', imported);

  res.json({
    success: true,
    imported: imported.length,
    errors: errors.length,
    details: errors.length > 0 ? errors : undefined
  });
});

module.exports = router;
