require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { supabase } = require('../src/services/supabase');

async function reconcileCRM() {
  console.log('🚀 Starting CRM Registry Forensic Reconciliation & Purge...');

  // 1. Purge duplicate mock client from Supabase
  console.log('🗑️ Purging duplicate mock client: CLI-MULLKF7G-A1E5...');
  const { error: delClientErr } = await supabase
    .from('clients')
    .delete()
    .eq('id', 'CLI-MULLKF7G-A1E5');
  if (delClientErr) {
    console.error('❌ Error purging CLI-MULLKF7G-A1E5:', delClientErr.message);
  } else {
    console.log('✅ Purged CLI-MULLKF7G-A1E5 from Supabase clients');
  }

  // 2. Sanitize email fields for Apex BioTech & HyperScale in Supabase
  console.log('🧹 Sanitizing test email timestamps in Supabase clients...');
  await supabase
    .from('clients')
    .update({ email: 'tariqul@apexbio.tech', updated_at: new Date().toISOString() })
    .eq('id', 'CLI-MUSG3NC9-111A');
  await supabase
    .from('clients')
    .update({ email: 'rafiq@hyperscale.com', updated_at: new Date().toISOString() })
    .eq('id', 'CLI-MU4FXM7E-1366');
  console.log('✅ Sanitized Apex BioTech & HyperScale client emails');

  // 3. Upsert Serviq BPO Limited into Supabase
  console.log('📝 Upserting Serviq BPO Limited into Supabase...');
  const serviqPayload = {
    id: 'CLI-SERVIQ-BPO',
    name: 'Serviq BPO Limited',
    company: 'Serviq BPO Limited',
    email: 'Meraj5417@gmail.com',
    phone: '+8801674007700',
    whatsapp: '+8801674007700',
    contact_person: 'Merajul Islam (CEO)',
    category: 'Corporate AI Training & BPO Operations',
    industry: 'Corporate AI Training & BPO Operations',
    status: 'Proposal Sent',
    currency: 'BDT',
    total_spent: '৳0',
    active_campaigns: [],
    pocs: [
      {
        id: 'POC-SERVIQ-01',
        name: 'Merajul Islam',
        title: 'Founder & CEO',
        phone: '+880 1674-007700',
        email: 'Meraj5417@gmail.com',
        decision_role: 'PRIMARY_DECISION_MAKER',
        authority: { can_sign_sow: true, can_authorize_payment: true, can_approve_deliverables: true }
      },
      {
        id: 'POC-SERVIQ-02',
        name: 'Munzurul Islam',
        title: 'Secondary Lead / Co-Founder',
        email: 'moonmunzurul080@gmail.com',
        decision_role: 'SECONDARY_DECISION_MAKER',
        authority: { can_sign_sow: false, can_authorize_payment: false, can_approve_deliverables: true }
      },
      {
        id: 'POC-SERVIQ-03',
        name: 'Ridhiya Islam',
        title: 'Operations Lead',
        phone: '+880 1781-505511',
        email: 'ridhiya.serviq@gmail.com',
        decision_role: 'OPERATIONAL_LEAD',
        authority: { can_sign_sow: false, can_authorize_payment: false, can_approve_deliverables: true }
      }
    ],
    updated_at: new Date().toISOString()
  };

  const { error: serviqErr } = await supabase
    .from('clients')
    .upsert(serviqPayload, { onConflict: 'id' });
  if (serviqErr) console.error('❌ Error upserting Serviq BPO:', serviqErr.message);
  else console.log('✅ Upserted Serviq BPO Limited (CLI-SERVIQ-BPO)');

  // 4. Upsert Bahon Electric Transport into Supabase
  console.log('📝 Upserting Bahon Electric Transport into Supabase...');
  const bahonPayload = {
    id: 'CLI-BAHON-MOBILITY',
    name: 'Bahon Electric Transport',
    company: 'Green Bashundhara Initiative (Bahon Subsidiary)',
    email: 'arif.partner@gro10x.ai',
    phone: '+8801680061704',
    whatsapp: '+8801680061704',
    contact_person: 'Arif Ahmed (Deal Originator & Sponsor)',
    category: 'Electric Mobility & Spatial Fleet Telemetry',
    industry: 'Electric Mobility & Spatial Fleet Telemetry',
    status: 'Prototype In Progress',
    currency: 'BDT',
    total_spent: '৳0',
    active_campaigns: [],
    pocs: [
      {
        id: 'POC-BAHON-01',
        name: 'Arif Ahmed',
        title: 'Strategic Deal Originator & Sponsor',
        employee_code: 'GRO-PARTNER-01',
        phone: '+880 1680-061704',
        email: 'arif.partner@gro10x.ai',
        decision_role: 'PRIMARY_DECISION_MAKER',
        authority: { can_sign_sow: true, can_authorize_payment: true, can_approve_deliverables: true }
      }
    ],
    updated_at: new Date().toISOString()
  };

  const { error: bahonErr } = await supabase
    .from('clients')
    .upsert(bahonPayload, { onConflict: 'id' });
  if (bahonErr) console.error('❌ Error upserting Bahon Electric Transport:', bahonErr.message);
  else console.log('✅ Upserted Bahon Electric Transport (CLI-BAHON-MOBILITY)');

  // 5. Purge mock leads from Supabase
  console.log('🗑️ Identifying and purging mock test leads from Supabase...');
  const { data: allLeads } = await supabase.from('leads').select('*');
  const authenticLeadIds = ['LED-001', 'LED-002', 'LED-003', 'LED-004', 'LED-005', 'LED-006'];
  const testLeadsToDelete = allLeads.filter(l => !authenticLeadIds.includes(l.id));

  console.log(`Found ${testLeadsToDelete.length} test leads to purge out of ${allLeads.length} total.`);

  const idsToPurge = testLeadsToDelete.map(l => l.id);
  // Delete in batches of 50 to avoid request length limits
  for (let i = 0; i < idsToPurge.length; i += 50) {
    const batch = idsToPurge.slice(i, i + 50);
    const { error: delLeadsErr } = await supabase.from('leads').delete().in('id', batch);
    if (delLeadsErr) {
      console.error(`❌ Error deleting batch ${i / 50 + 1}:`, delLeadsErr.message);
    } else {
      console.log(`✅ Purged batch of ${batch.length} test leads`);
    }
  }

  // 6. Register enterprise pipeline leads in Supabase
  console.log('📝 Registering audited enterprise pipeline leads in Supabase...');
  const enterpriseLeads = [
    {
      id: 'LED-SERVIQ-BPO',
      name: 'Merajul Islam',
      contact_person: 'Merajul Islam (CEO)',
      email: 'Meraj5417@gmail.com',
      phone: '+880 1674-007700',
      company: 'Serviq BPO Limited',
      service_interest: 'Corporate AI Training & BPO Operations',
      source: 'Executive Commercial / GRO-003',
      status: 'qualified',
      stage: 'Proposal Sent',
      currency: 'BDT',
      budget: '৳12,000 BDT',
      value: 12000,
      score: 95,
      notes: 'Bound Prototype: https://gro10x-ai.vercel.app/prototypes/serviq-pilot/ | Proposal ID: PROP-2026-SERVIQ | Contract Value: ৳12,000 BDT | Secondary: Munzurul Islam | Ops: Ridhiya Islam',
      assigned_to: 'GRO-003',
      created_at: '2026-10-16T13:46:32.000Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 'LED-BAHON-MOBILITY',
      name: 'Arif Ahmed',
      contact_person: 'Arif Ahmed (GRO-PARTNER-01)',
      email: 'arif.partner@gro10x.ai',
      phone: '+880 1680-061704',
      company: 'Green Bashundhara Initiative (Bahon Subsidiary)',
      service_interest: 'Electric Mobility & Spatial Fleet Telemetry',
      source: 'Strategic Partner / GRO-PARTNER-01',
      status: 'in_progress',
      stage: 'Prototype In Progress',
      currency: 'BDT',
      budget: 'Pilot Fleet Telemetry',
      value: 50000,
      score: 90,
      notes: 'Prototype Route: /prototypes/bahon (Command Center) | Target Delivery: Saturday Oct 17 | Deal Originator: Arif Ahmed (GRO-PARTNER-01)',
      assigned_to: 'GRO-PARTNER-01',
      created_at: '2026-10-16T13:46:33.000Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 'LED-NHF-PLC',
      name: 'MD Zahin Khandaker (NHF)',
      contact_person: 'MD Zahin Khandaker (NHF)',
      email: 'digital@nationalhousingbd.com',
      phone: '+880 1711-000000',
      company: 'National Housing Finance and Investments Limited',
      service_interest: 'Dedicated Enterprise AI Operating System & Autonomous Digital Mortgage Sales Officer',
      source: 'Executive Direct Outbound',
      status: 'qualified',
      stage: 'Proposal Delivered',
      currency: 'BDT',
      budget: 'Enterprise AI Suite',
      value: 336000,
      score: 95,
      notes: 'Bound Prototype: https://gro10x-ai.vercel.app/prototypes/nhf-portal/ | Proposal ID: PROP-2026-002 (৳320,000) & PROP-2026-005 (৳75,000) | Invoice INV-2026-026 (৳336,000)',
      assigned_to: 'GRO-000',
      created_at: '2026-09-27T21:36:40.000Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 'LED-UCB-BANK',
      name: 'Zahin Head of Digital Banking',
      contact_person: 'Zahin Head of Digital Banking',
      email: 'digital.banking@ucb.com.bd',
      phone: '+880 1700-000000',
      company: 'United Commercial Bank PLC',
      service_interest: '24/7 AI-Powered Social Media Customer Automation (Facebook & Instagram)',
      source: 'Institutional Outbound',
      status: 'qualified',
      stage: 'Proposal Sent',
      currency: 'BDT',
      budget: '৳50,400 BDT',
      value: 50400,
      score: 90,
      notes: 'Proposal: PROP-2026-001 (৳48,000) | Invoice: INV-2026-022 (৳50,400)',
      assigned_to: 'GRO-003',
      created_at: '2026-09-14T22:34:14.000Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 'LED-CITYBANK-CAP',
      name: 'Investment Banking Head',
      contact_person: 'Investment Banking Head',
      email: 'investments@citybankcapital.com',
      phone: '+880 1711-990011',
      company: 'City Bank Capital PLC',
      service_interest: 'Private Equity AI Deal Screener & Portfolio Copilot',
      source: 'Executive Institutional Pitch',
      status: 'in_progress',
      stage: 'Draft Proposal',
      currency: 'BDT',
      budget: '৳250,000 BDT',
      value: 250000,
      score: 85,
      notes: 'Proposal: PROP-2026-004 (৳250,000)',
      assigned_to: 'GRO-003',
      created_at: '2026-09-20T10:00:00.000Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 'LED-SUMMIT-POWER',
      name: 'Chief Technology Officer',
      contact_person: 'Chief Technology Officer',
      email: 'procurement@summitpower.com',
      phone: '+880 1711-882200',
      company: 'Summit Power AI',
      service_interest: 'Enterprise AI Operations Hub',
      source: 'Direct Enterprise Account',
      status: 'won',
      stage: 'Onboarding',
      currency: 'BDT',
      budget: '৳105,000 BDT',
      value: 105000,
      score: 100,
      notes: 'Deposit Paid (INV-2026-018 ৳105,000 Paid)',
      assigned_to: 'GRO-000',
      created_at: '2026-09-16T23:16:58.000Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 'LED-APEX-FOOT',
      name: 'Lead Contact',
      contact_person: 'Lead Contact',
      email: 'partners@apexfootwear.com',
      phone: '+8801700998877',
      company: 'Apex Footwear Limited',
      service_interest: 'Monthly AI Retainer Service (Phase 5 E2E Cut)',
      source: 'Strategic Enterprise Retainer',
      status: 'won',
      stage: 'Active Retainer',
      currency: 'BDT',
      budget: '৳500,000 Total Spent',
      value: 86250,
      score: 100,
      notes: 'Active Retainer Client (CLI-MUAB69VK-DAE736) | Total Spent ৳500,000 | Current Retainer ৳86,250 (INV-2026-001)',
      assigned_to: 'GRO-000',
      created_at: '2026-09-20T21:08:31.000Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 'LED-HYPERSCALE',
      name: 'Rafiqul Islam (CTO)',
      contact_person: 'Rafiqul Islam (CTO)',
      email: 'rafiq@hyperscale.com',
      phone: '+8801711998877',
      company: 'HyperScale Retail Ltd',
      service_interest: 'Multi-Agent Support Co-Pilot (E-commerce AI Support)',
      source: 'Direct Outbound',
      status: 'qualified',
      stage: 'Onboarding',
      currency: 'BDT',
      budget: '৳105,000 BDT',
      value: 105000,
      score: 90,
      notes: 'Invoice: INV-2026-015 (৳105,000 Pending)',
      assigned_to: 'GRO-003',
      created_at: '2026-09-16T18:35:08.000Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 'LED-APEX-MESH',
      name: 'Apex Mesh CEO',
      contact_person: 'Apex Mesh CEO',
      email: 'ceo@apexmesh.com',
      phone: '+880 1711-554433',
      company: 'Apex Mesh Corp',
      service_interest: 'Real-Time Notification Pipeline',
      source: 'Enterprise Architecture Outbound',
      status: 'qualified',
      stage: 'Onboarding',
      currency: 'BDT',
      budget: '৳12,600 BDT',
      value: 12600,
      score: 85,
      notes: 'Invoice: INV-2026-021 (৳12,600 Pending)',
      assigned_to: 'GRO-003',
      created_at: '2026-09-28T15:31:04.000Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 'LED-APEX-BIO',
      name: 'Dr. Tariqul Alam',
      contact_person: 'Dr. Tariqul Alam',
      email: 'tariqul@apexbio.tech',
      phone: '+880 1711-998877',
      company: 'Apex BioTech Labs',
      service_interest: 'Full-Stack SaaS MVP Sprint for Clinical Trials',
      source: 'Biotech Commercial Pilot',
      status: 'qualified',
      stage: 'Onboarding',
      currency: 'BDT',
      budget: '৳2,625 BDT',
      value: 2625,
      score: 85,
      notes: 'Invoice: INV-2026-013 (৳2,625 Pending)',
      assigned_to: 'GRO-000',
      created_at: '2026-10-03T13:46:17.000Z',
      updated_at: new Date().toISOString()
    }
  ];

  for (const lead of enterpriseLeads) {
    const { error: upLeadErr } = await supabase.from('leads').upsert(lead, { onConflict: 'id' });
    if (upLeadErr) console.error(`❌ Error upserting lead ${lead.id}:`, upLeadErr.message);
    else console.log(`✅ Upserted lead ${lead.id} (${lead.company})`);
  }

  // 7. Synchronize data/db.json
  console.log('🔄 Synchronizing data/db.json clients and leads...');
  const dbPath = path.resolve(__dirname, '../data/db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // Fetch complete fresh clients and leads from Supabase
  const { data: freshClients } = await supabase.from('clients').select('*').order('created_at', { ascending: true });
  const { data: freshLeads } = await supabase.from('leads').select('*').order('created_at', { ascending: true });

  // Enrich clients with prototype mapping for local DB
  const prototypeMapping = {
    'CLI-SERVIQ-BPO': {
      bound_prototype: 'https://gro10x-ai.vercel.app/prototypes/serviq-pilot/',
      prototype_url: 'https://gro10x-ai.vercel.app/prototypes/serviq-pilot/',
      proposal_id: 'PROP-2026-SERVIQ',
      contract_value: 12000
    },
    'CLI-BAHON-MOBILITY': {
      bound_prototype: '/prototypes/bahon',
      prototype_url: '/prototypes/bahon',
      target_delivery: 'Saturday Oct 17, 2026',
      deal_originator: 'Arif Ahmed (GRO-PARTNER-01)'
    },
    'CLI-MUKC9FP4-A584': {
      bound_prototype: 'https://gro10x-ai.vercel.app/prototypes/nhf-portal/',
      prototype_url: 'https://gro10x-ai.vercel.app/prototypes/nhf-portal/'
    },
    'CLI-MTWK4BNC-24F6EA': {
      bound_prototype: 'https://gro10x-ai.vercel.app/prototypes/madmen-os/',
      prototype_url: 'https://gro10x-ai.vercel.app/prototypes/madmen-os/',
      venture_port: 6000
    }
  };

  db.clients = freshClients.map(c => {
    const extra = prototypeMapping[c.id] || {};
    return { ...c, ...extra };
  });

  db.leads = freshLeads;

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`✅ Successfully updated ${dbPath}`);
  console.log(`✨ Total Clients in db.json: ${db.clients.length}`);
  console.log(`✨ Total Leads in db.json: ${db.leads.length}`);

  console.log('🎉 Forensic Reconciliation Complete!');
}

reconcileCRM().then(() => process.exit(0)).catch(err => {
  console.error('Fatal reconciliation error:', err);
  process.exit(1);
});
