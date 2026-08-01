const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');
const { processAutomationEvent } = require('../services/automation');
const { sendTelegramNotification } = require('../services/bot');
const { sendClientOnboardingEmail } = require('../services/resend');

// GET all leads (Internal Team/Admin)
router.get('/', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.leads || []);
});

// POST Public Lead Capture (Chat widget, newsletter, landing page form)
router.post('/', (req, res) => {
  const db = readDB();
  db.leads = db.leads || [];
  const newLead = {
    id: `LED-${String(db.leads.length + 1).padStart(3, '0')}`,
    stage: 'New Inquiry',
    createdAt: new Date().toISOString().split('T')[0],
    ...req.body
  };
  db.leads.push(newLead);
  writeDB(db);
  broadcast('lead_update', db.leads);

  // Telegram alert to agency owner
  try {
    const ownerChatId = db.settings?.ownerTelegramId || process.env.OWNER_TELEGRAM_ID;
    if (ownerChatId) {
      sendTelegramNotification(ownerChatId,
        `🔔 *New Lead from Purple Bot Website!*\n\n` +
        `👤 *${newLead.contactPerson || newLead.clientName}* — ${newLead.clientName || 'Brand'}\n` +
        `📞 Phone: \`${newLead.phone || newLead.whatsapp || 'N/A'}\`\n` +
        `🎯 Interested Service: *${newLead.service || newLead.serviceTitle || 'General'}*\n` +
        `📍 Source: ${newLead.source || 'Website Widget'}`, null, false
      );
    }
  } catch (err) {
    console.warn('Telegram alert failed:', err.message);
  }

  res.json({ success: true, lead: newLead });
});

// PUT Update Lead Stage / Notes
router.put('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.leads || []).findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });

  const updatedLead = { ...db.leads[idx], ...req.body };
  db.leads[idx] = updatedLead;

  if (updatedLead.stage === 'Won / Closed' || updatedLead.stage === 'Won') {
    processAutomationEvent('lead_won', { lead: updatedLead }, db, writeDB, broadcast);
  }

  writeDB(db);
  broadcast('lead_update', db.leads);
  res.json({ success: true, lead: db.leads[idx] });
});

// DELETE Lead (Admin only)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.leads = (db.leads || []).filter(l => l.id !== id);
  writeDB(db);
  broadcast('lead_update', db.leads);
  res.json({ success: true });
});

// POST Magic Link Onboarding & Resend Email Trigger
router.post('/:id/onboard', requireAuth, async (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const lead = (db.leads || []).find(l => l.id === id) || (db.clients || []).find(c => c.id === id);

  const clientName = lead ? (lead.clientName || lead.company || lead.name || 'Client') : 'Client';
  const email = lead ? (lead.contactEmail || lead.email || 'client@agency.com') : 'client@agency.com';
  const token = `TOK-${Date.now()}`;
  const magicLink = `https://purpleos-iota.vercel.app/partners?client=${encodeURIComponent(clientName)}&token=${token}`;

  // Send real email via Resend
  let emailResult = { success: false };
  if (email && email.includes('@') && !email.includes('lead.com')) {
    emailResult = await sendClientOnboardingEmail({ clientName, email, magicLink });
  }

  res.json({
    success: true,
    clientName,
    email,
    magicLink,
    emailSent: emailResult.success
  });
});

// POST Convert Lead to Active Client CRM
router.post('/:id/convert', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const lead = (db.leads || []).find(l => l.id === id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  lead.stage = 'Won / Closed';
  processAutomationEvent('lead_won', { lead }, db, writeDB, broadcast);

  db.clients = db.clients || [];
  const existingClient = db.clients.find(c => c.name.toLowerCase().trim() === (lead.company || lead.contactPerson || '').toLowerCase().trim());
  let clientRecord = existingClient;

  if (!existingClient) {
    clientRecord = {
      id: `CLI-${String(db.clients.length + 1).padStart(4, '0')}`,
      name: lead.company || lead.contactPerson || 'New Client',
      contactPerson: lead.contactPerson || 'Brand Lead',
      email: lead.email || lead.contactEmail || '',
      phone: lead.phone || '',
      whatsapp: lead.whatsapp || lead.phone || '',
      status: 'Active Retainer',
      category: lead.category || 'General',
      totalSpent: '$0',
      activeCampaigns: [lead.service || 'New Campaign']
    };
    db.clients.push(clientRecord);
  }

  writeDB(db);
  broadcast('lead_update', db.leads);
  broadcast('client_update', db.clients);

  res.json({ success: true, client: clientRecord, lead });
});

// POST Public Web Consultation Booking
router.post('/book', (req, res) => {
  const db = readDB();
  db.leads = db.leads || [];
  const count = db.leads.length + 1;
  const newLead = {
    id: `LED-${String(count).padStart(3, '0')}`,
    company: req.body.company || req.body.contactPerson || 'Web Lead',
    contactPerson: req.body.contactPerson || 'Prospective Client',
    email: req.body.email || '',
    phone: req.body.phone || '',
    whatsapp: req.body.whatsapp || req.body.phone || '',
    source: 'Website Booking',
    category: req.body.category || 'General',
    service: req.body.service || 'Agency Services',
    value: req.body.value || '$1,000 - $3,000',
    stage: 'New Inquiry',
    notes: `Timeline: ${req.body.timeline || 'Flexible'}. Notes: ${req.body.notes || 'No extra notes.'}`,
    createdAt: new Date().toISOString().split('T')[0]
  };
  db.leads.push(newLead);
  writeDB(db);
  broadcast('lead_update', db.leads);
  res.json({ success: true, lead: newLead });
});

module.exports = router;
