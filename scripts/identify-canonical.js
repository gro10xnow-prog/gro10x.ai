const { supabase } = require('../src/services/supabase');

async function listCanonical() {
  const { data: invs } = await supabase.from('invoices').select('*').order('created_at', { ascending: true });

  console.log('--- AUDITING UNIQUE REAL COMMERCIAL DEALS ---');
  // Group real clients
  const realClientsDeals = [
    { client: 'Purplebot Digital Limited', project: 'AI Agency OS & Automated Retainer Infrastructure', amount: 26250, desc: 'Month 1 Retainer' },
    { client: 'Purplebot Digital Limited', project: 'Monthly Retainer (Month 2)', amount: 21000, desc: 'Month 2 Retainer' },
    { client: 'Purplebot Digital', project: 'Agentic CRM Orchestration Sprint - Milestone 2 (Handover & Acceptance)', amount: 75000, desc: 'Milestone 2 Acceptance' },
    { client: 'Summit Power AI', project: 'Enterprise AI Operations Hub', amount: 105000, desc: 'Enterprise Upfront Sprint Deposit' },
    { client: 'United Commercial Bank PLC', project: '24/7 AI-Powered Social Media Customer Automation (Facebook & Instagram)', amount: 50400, desc: 'Enterprise AI Banking Automation' },
    { client: 'HyperScale Retail Ltd', project: 'Multi-Agent Support Co-Pilot', amount: 105000, desc: 'E-commerce AI Support Co-Pilot' },
    { client: 'National Housing Finance and Investments Limited', project: 'Dedicated Enterprise AI Operating System & Autonomous Digital Mortgage Sales Officer', amount: 336000, desc: 'Digital Mortgage Sales Officer' },
    { client: 'Apex Mesh Corp', project: 'Real-Time Notification Pipeline', amount: 12600, desc: 'Notification Pipeline Retainer' },
    { client: 'National Housing Finance PLC', project: 'AI Growth Proposal', amount: 52500, desc: 'AI Growth Retainer' },
    { client: 'Apex BioTech Labs', project: 'Full-Stack SaaS MVP Sprint for Clinical Trials', amount: 2625, desc: 'Clinical Trials SaaS MVP' },
    { client: 'Apex Footwear Limited', project: 'Monthly AI Retainer Service (Phase 5 E2E Cut)', amount: 86250, desc: 'Creative Retainer Sprint' }
  ];

  for (const deal of realClientsDeals) {
    const matched = invs.filter(i => (i.client_name || '').includes(deal.client.split(' ')[0]) && i.amount === deal.amount);
    console.log(`\nDeal: ${deal.desc} (${deal.client}) — ৳${deal.amount.toLocaleString()} BDT`);
    console.log(`  Matched Records in Supabase: ${matched.length}`);
    if (matched.length > 0) {
      console.log(`  Canonical to KEEP: ${matched[0].id} (Created: ${matched[0].created_at}) Status: ${matched[0].status}`);
      if (matched.length > 1) {
        console.log(`  Duplicate Test Records to PURGE: ${matched.length - 1} records (${matched.slice(1).map(m => m.id).join(', ')})`);
      }
    }
  }
}

listCanonical().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
