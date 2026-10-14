const { supabase } = require('../src/services/supabase');
const fs = require('fs');
const path = require('path');

async function detailedAudit() {
  const localDb = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/db.json'), 'utf8'));
  const localInvoices = localDb.invoices || [];

  let sbInvoices = [];
  if (supabase) {
    const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: true });
    if (error) console.error('Supabase query error:', error);
    else sbInvoices = data || [];
  }

  // Real clients from clients table
  let realClients = [];
  if (supabase) {
    const { data } = await supabase.from('clients').select('id, name, company, email, status');
    realClients = data || [];
  }
  const realClientIds = new Set(realClients.map(c => c.id));
  const realClientNames = new Set(realClients.map(c => (c.name || '').toLowerCase()));

  console.log('REAL CLIENTS IN CRM (Total: ' + realClients.length + '):');
  realClients.forEach(c => console.log(`  - [${c.id}] ${c.name} (${c.email}) [${c.status}]`));

  console.log('\n--- AUDITING ALL 232 INVOICES IN SUPABASE ---');

  // Classification logic:
  // What makes an invoice REAL vs DUMMY/TEST?
  // 1. Missing client: client_id is null AND client_name is missing or 'General Client' or 'Global Enterprise AI Client' or 'Approved Corp' (mock names).
  // 2. Test change orders: Project name contains "Scope Change Order (CO-2026-...)".
  // 3. Automated test loops / duplicates:
  //    e.g. 27 identical invoices for National Housing created within seconds or repeated test runs.
  //    e.g. 26 identical invoices for Nexus AI.
  //    e.g. 22 identical invoices for HyperScale Retail.
  //    e.g. 16 identical invoices for Apex Mesh Corp.
  //    e.g. 21 identical invoices for SkyNet Global.
  //    e.g. 21 identical invoices for Apex BioTech Labs with null client_id.
  //    e.g. 17 identical invoices for Apex Footwear.
  //    e.g. 12 identical invoices for Summit Power AI (all 105,000 BDT).
  //    e.g. 13 identical invoices for Purplebot Month 1 (all 26,250 BDT, created across multiple test runs).

  const clusters = {};
  for (const inv of sbInvoices) {
    const key = `${inv.client_name} | ${inv.project_name} | ${inv.amount}`;
    if (!clusters[key]) clusters[key] = [];
    clusters[key].push(inv);
  }

  console.log('\nSUMMARY OF INVOICE CLUSTERS:');
  for (const [key, items] of Object.entries(clusters)) {
    const clientId = items[0].client_id;
    const isRealClient = (clientId && realClientIds.has(clientId)) || realClientNames.has((items[0].client_name || '').toLowerCase());
    console.log(`Cluster: "${key}"`);
    console.log(`  Records: ${items.length} | ClientID: ${clientId} | RealClientInCRM: ${isRealClient}`);
    console.log(`  IDs: ${items.map(i => i.id).slice(0, 3).join(', ')}${items.length > 3 ? ' ... ' + items[items.length - 1].id : ''}`);
    console.log(`  Statuses: ${Array.from(new Set(items.map(i => i.status))).join(', ')}`);
  }
}

detailedAudit().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
