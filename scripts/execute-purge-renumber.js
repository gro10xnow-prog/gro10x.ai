const { supabase } = require('../src/services/supabase');
const fs = require('fs');
const path = require('path');

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');

// Canonical records identified and approved by CEO
const CANONICAL_MAP = [
  { originalId: 'INV-2026-004', newId: 'INV-2026-001', client: 'Purplebot Digital Limited', desc: 'Month 1 Retainer', amount: 26250 },
  { originalId: 'INV-2026-022', newId: 'INV-2026-002', client: 'HyperScale Retail Ltd', desc: 'Multi-Agent Support Co-Pilot', amount: 105000 },
  { originalId: 'INV-2026-068', newId: 'INV-2026-003', client: 'United Commercial Bank PLC', desc: '24/7 AI-Powered Social Media Automation', amount: 50400 },
  { originalId: 'INV-2026-5795', newId: 'INV-2026-004', client: 'Purplebot Digital', desc: 'Milestone 2 Deliverable Acceptance', amount: 75000 },
  { originalId: 'INV-2026-5805', newId: 'INV-2026-005', client: 'Summit Power AI', desc: 'Enterprise AI Operations Hub Deposit', amount: 105000 },
  { originalId: 'INV-2026-5818', newId: 'INV-2026-006', client: 'Apex Footwear Limited', desc: 'Monthly AI Retainer Service (Phase 5 Cut)', amount: 86250 },
  { originalId: 'INV-2026-5820', newId: 'INV-2026-007', client: 'Apex Footwear Limited', desc: 'E2E Creative Master Cut v3 Milestone', amount: 25000 },
  { originalId: 'INV-2026-5860', newId: 'INV-2026-008', client: 'National Housing Finance and Investments Limited', desc: 'Dedicated Enterprise AI OS & Mortgage Sales', amount: 336000 },
  { originalId: 'INV-2026-5878', newId: 'INV-2026-009', client: 'Apex Mesh Corp', desc: 'Real-Time Notification Pipeline', amount: 12600 },
  { originalId: 'INV-2026-5889', newId: 'INV-2026-010', client: 'National Housing Finance PLC', desc: 'AI Growth Proposal Retainer', amount: 52500 },
  { originalId: 'INV-2026-5918', newId: 'INV-2026-011', client: 'Apex BioTech Labs', desc: 'Full-Stack SaaS MVP Sprint for Clinical Trials', amount: 2625 },
  { originalId: 'INV-2026-5954', newId: 'INV-2026-012', client: 'Purplebot Digital Limited', desc: 'Monthly Retainer (Month 2)', amount: 21000 }
];

async function executeSanitization() {
  console.log('🚀 EXECUTING COMMERCIAL LEDGER PURGE & SEQUENTIAL RENUMBERING (Option B)');

  // 1. Fetch all current invoices from Supabase
  const { data: allInvoices, error: fetchErr } = await supabase.from('invoices').select('*').order('created_at', { ascending: true });
  if (fetchErr) {
    throw new Error('Supabase fetch failed: ' + fetchErr.message);
  }
  console.log(`Fetched ${allInvoices.length} invoices from Supabase.`);

  // 2. Extract and renumber the 12 canonical invoices
  const sanitizedInvoices = [];
  let totalRevenue = 0;

  for (const mapping of CANONICAL_MAP) {
    const orig = allInvoices.find(i => i.id === mapping.originalId);
    if (!orig) {
      throw new Error(`CRITICAL: Original invoice ${mapping.originalId} not found in Supabase!`);
    }

    // Clean notes if old ID is embedded
    let cleanNotes = (orig.notes || '').replace(new RegExp(mapping.originalId, 'g'), mapping.newId);

    const renumberedRecord = {
      ...orig,
      id: mapping.newId,
      notes: cleanNotes,
      updated_at: new Date().toISOString()
    };

    totalRevenue += Number(renumberedRecord.amount || 0);
    sanitizedInvoices.push(renumberedRecord);
  }

  console.log(`Prepared ${sanitizedInvoices.length} canonical renumbered invoices.`);
  console.log(`Verified Total Ledger Revenue: ৳${totalRevenue.toLocaleString()} BDT`);

  // 3. Purge Supabase Invoices Table
  console.log('Purging all records from Supabase invoices table...');
  const { error: delErr } = await supabase.from('invoices').delete().neq('id', 'PLACEHOLDER_NEVER_MATCH');
  if (delErr) {
    throw new Error('Supabase delete failed: ' + delErr.message);
  }
  console.log('✅ Supabase invoices table cleared.');

  // 4. Insert Sanitized Renumbered Records into Supabase
  console.log('Inserting 12 canonical records into Supabase...');
  const { data: inserted, error: insErr } = await supabase.from('invoices').insert(sanitizedInvoices).select();
  if (insErr) {
    throw new Error('Supabase insert failed: ' + insErr.message);
  }
  console.log(`✅ Successfully inserted ${inserted.length} canonical records into Supabase.`);

  // 5. Synchronize local data/db.json
  console.log('Synchronizing local data/db.json...');
  if (fs.existsSync(DB_JSON_PATH)) {
    const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    dbContent.invoices = sanitizedInvoices;
    fs.writeFileSync(DB_JSON_PATH, JSON.stringify(dbContent, null, 2), 'utf8');
    console.log(`✅ local data/db.json updated with ${dbContent.invoices.length} canonical records.`);
  }

  // 6. Verification
  const { data: finalVerify } = await supabase.from('invoices').select('id, client_name, amount, status').order('id', { ascending: true });
  console.log('\n--- VERIFIED CLEAN SUPABASE INVOICES ---');
  finalVerify.forEach(i => console.log(`  ${i.id} | ${i.client_name} | ৳${i.amount.toLocaleString()} BDT | ${i.status}`));

  return sanitizedInvoices;
}

executeSanitization().then(() => {
  console.log('\n🎉 Commercial ledger purge and renumbering successfully completed!');
  process.exit(0);
}).catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
