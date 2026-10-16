/**
 * scripts/purge_dummy_data.js
 * Purges synthetic/mock test fixtures from Supabase and db.json,
 * retaining only authentic enterprise clients and qualified pipeline leads.
 */

const fs = require('fs');
const { supabase } = require('../src/services/supabase');

const DUMMY_CLIENT_IDS = [
  'CLI-MUSG3NC9-111A',   // Apex BioTech Labs
  'CLI-MULEN4X0-BA05',   // Apex Mesh Corp
  'CLI-MU4FXM7E-1366',   // HyperScale Retail Ltd
  'CLI-MU4Q02BV-0EE6',   // Summit Power AI
  'CLI-MUAB69VK-DAE736', // Apex Footwear Limited
  'CLI-MU1TLEQ1-DE57'    // United Commercial Bank PLC
];

const DUMMY_INVOICE_IDS = [
  'INV-2026-013', // Apex BioTech
  'INV-2026-015', // HyperScale
  'INV-2026-018', // Summit Power
  'INV-2026-021', // Apex Mesh
  'INV-2026-022'  // UCB
];

const DUMMY_LEAD_IDS = [
  'LED-APEX-BIO',
  'LED-APEX-MESH',
  'LED-HYPERSCALE',
  'LED-SUMMIT-POWER',
  'LED-APEX-FOOT',
  'LED-UCB-BANK',
  'LED-CITYBANK-CAP'
];

async function purge() {
  console.log('🚀 Initiating Dummy Data Purge...');

  // 1. Backup db.json
  const dbPath = './data/db.json';
  const backupPath = './data/db.backup-pre-dummy-purge.json';
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ db.json backed up to ${backupPath}`);

  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // 2. Purge Supabase Invoices
  console.log('--- Purging Supabase Invoices ---');
  for (const invId of DUMMY_INVOICE_IDS) {
    const { error } = await supabase.from('invoices').delete().eq('id', invId);
    if (error) console.error(`Error deleting invoice ${invId}:`, error.message);
    else console.log(`Deleted invoice: ${invId}`);
  }

  // 3. Purge Supabase Clients
  console.log('--- Purging Supabase Clients ---');
  for (const cid of DUMMY_CLIENT_IDS) {
    const { error } = await supabase.from('clients').delete().eq('id', cid);
    if (error) console.error(`Error deleting client ${cid}:`, error.message);
    else console.log(`Deleted client: ${cid}`);
  }

  // 4. Purge Supabase Leads
  console.log('--- Purging Supabase Leads ---');
  for (const lid of DUMMY_LEAD_IDS) {
    const { error } = await supabase.from('leads').delete().eq('id', lid);
    if (error) console.error(`Error deleting lead ${lid}:`, error.message);
    else console.log(`Deleted lead: ${lid}`);
  }

  // 5. Purge db.json
  console.log('--- Purging db.json ---');
  if (db.clients) {
    db.clients = db.clients.filter(c => !DUMMY_CLIENT_IDS.includes(c.id));
  }
  if (db.leads) {
    db.leads = db.leads.filter(l => !DUMMY_LEAD_IDS.includes(l.id));
  }
  if (db.invoices) {
    db.invoices = db.invoices.filter(i => !DUMMY_INVOICE_IDS.includes(i.id));
  }
  if (db.quotes) {
    // Also remove any mock UCB quotes
    db.quotes = db.quotes.filter(q => !q.id.startsWith('QTE-2026-'));
  }

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log('✅ db.json updated cleanly');

  // 6. Verify Remaining Supabase State
  const { data: remClients } = await supabase.from('clients').select('id, name');
  const { data: remLeads } = await supabase.from('leads').select('id, company');
  console.log('\n=== REMAINING VERIFIED CLIENTS ===');
  remClients.forEach(c => console.log(`- ${c.id}: ${c.name}`));

  console.log('\n=== REMAINING VERIFIED LEADS ===');
  remLeads.forEach(l => console.log(`- ${l.id}: ${l.company}`));

  console.log('\n✅ Dummy Data Purge Complete!');
}

purge().catch(err => {
  console.error('Purge failed:', err);
  process.exit(1);
});
