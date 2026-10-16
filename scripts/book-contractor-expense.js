const { supabase } = require('../src/services/supabase');
const fs = require('fs');
const path = require('path');

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');
const SPRINT_LEDGER_PATH = path.join(__dirname, '../data/sprint_projects_ledger.json');
const HOLDINGS_MD_PATH = path.join(__dirname, '../docs/HOLDINGS_SPRINT_LEDGER.md');

async function bookContractorExpense() {
  console.log('🏛️ GRO10X Holdings — Contractor Milestone Expense Booking');
  console.log('Project: PRJ-PURPLEBOT-SP2-1 | Payee: S. M Mahmud Bin Murad (Onim)');

  const expenseId = 'EXP-20261016-QA01';
  const amountBdt = 2500;
  const creditEquivalent = 1250; // Pegged at BDT 2.00 / Credit

  const expenseRecord = {
    id: expenseId,
    title: 'PurpleOS V1 Handover QA Verification - S. M Mahmud Bin Murad (Onim)',
    category: 'Contractor QA & Human Verification',
    description: 'Independent exploratory QA audit and creative UX critique for PurpleOS V1 handover. Manual human user testing & Telegram group feedback loop before client handover to Iftekhar. [Project: PRJ-PURPLEBOT-SP2-1] [Payee Phone: +8801755087633] [Credits: 1250]',
    amount: amountBdt,
    currency: 'BDT',
    date: '2026-10-16',
    status: 'Approved',
    logged_by: 'Founder & CEO × Central Chief of Staff',
    submitted_by: 'S. M Mahmud Bin Murad (Onim)',
    submitted_via: 'holding_directive',
    engine_tag: 'engine3',
    tier1_approved: true,
    tier1_approved_by: 'Founder & CEO',
    tier1_approved_at: new Date().toISOString(),
    tier2_approved: true,
    tier2_approved_by: 'Central Chief of Staff & Virtual CTO',
    tier2_approved_at: new Date().toISOString(),
    finance_verified: true,
    finance_verified_by: 'Head of Finance & Treasury',
    finance_verified_at: new Date().toISOString(),
    disbursed: false,
    disbursed_by: null,
    disbursed_at: null,
    created_at: new Date().toISOString()
  };

  // 1. Persist to Supabase
  if (supabase) {
    const { data: existing } = await supabase.from('expenses').select('id').eq('id', expenseId).maybeSingle();
    if (existing) {
      console.log(`Updating existing record in Supabase: ${expenseId}`);
      const { error: updErr } = await supabase.from('expenses').update(expenseRecord).eq('id', expenseId);
      if (updErr) console.warn('Supabase update error:', updErr.message);
      else console.log('✅ Supabase expense updated successfully.');
    } else {
      console.log(`Inserting new expense into Supabase: ${expenseId}`);
      const { data: insData, error: insErr } = await supabase.from('expenses').insert([expenseRecord]).select();
      if (insErr) console.warn('Supabase insert error:', insErr.message);
      else console.log('✅ Supabase expense inserted successfully:', insData[0]?.id);
    }
  }

  // 2. Persist to data/db.json
  if (fs.existsSync(DB_JSON_PATH)) {
    const db = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    db.expenses = db.expenses || [];
    const idx = db.expenses.findIndex(e => e.id === expenseId);
    const localRecord = {
      id: expenseId,
      title: expenseRecord.title,
      amount: amountBdt,
      currency: 'BDT',
      creditEquivalent: creditEquivalent,
      category: expenseRecord.category,
      payee: {
        name: 'S. M Mahmud Bin Murad',
        nickname: 'Onim',
        phone: '+8801755087633'
      },
      projectId: 'PRJ-PURPLEBOT-SP2-1',
      venture: 'PurpleBot Digital Core OS',
      status: 'Approved',
      disbursementCondition: 'Disbursement upon delivery of QA feedback in Telegram group',
      date: '2026-10-16',
      loggedAt: expenseRecord.created_at,
      notes: expenseRecord.description,
      engineTag: 'engine3'
    };

    if (idx !== -1) {
      db.expenses[idx] = localRecord;
    } else {
      db.expenses.unshift(localRecord);
    }
    fs.writeFileSync(DB_JSON_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log('✅ Local data/db.json expense entry synchronized.');
  }

  // 3. Update data/sprint_projects_ledger.json
  if (fs.existsSync(SPRINT_LEDGER_PATH)) {
    const sLedger = JSON.parse(fs.readFileSync(SPRINT_LEDGER_PATH, 'utf8'));
    const list = Array.isArray(sLedger) ? sLedger : (sLedger.projects || []);
    const p = list.find(proj => proj.id === 'PRJ-PURPLEBOT-SP2-1');
    if (p) {
      p.contractorPayout = {
        expenseId: expenseId,
        payee: 'S. M Mahmud Bin Murad (Onim)',
        phone: '+8801755087633',
        role: 'Human QA Verification Specialist',
        category: 'Contractor QA & Human Verification',
        amountBdt: amountBdt,
        amountCredits: creditEquivalent,
        purpose: 'Independent exploratory QA audit and creative UX critique for PurpleOS V1 handover',
        status: 'Approved',
        disbursementCondition: 'Disbursement upon delivery of QA feedback in Telegram group',
        loggedDate: '2026-10-16'
      };
      fs.writeFileSync(SPRINT_LEDGER_PATH, JSON.stringify(sLedger, null, 2), 'utf8');
      console.log('✅ data/sprint_projects_ledger.json contractor payout updated.');
    }
  }

  // 4. Update docs/HOLDINGS_SPRINT_LEDGER.md with contractor expense record
  if (fs.existsSync(HOLDINGS_MD_PATH)) {
    let md = fs.readFileSync(HOLDINGS_MD_PATH, 'utf8');
    if (!md.includes(expenseId)) {
      const searchTarget = '| **`PRJ-PURPLEBOT-SP2-1`** | **PurpleBot Core OS**<br>*(Engine 3 Satellite #2)* | Production DB Sanitization, Chrome Extension v4.4.0, Auth Deduplication, Telegram Webhook Secret Fix | 🟡 IN_PROGRESS | 212 | 5,000 | ৳10,000 | $82.50 |';
      const replacement = `| **\`PRJ-PURPLEBOT-SP2-1\`** | **PurpleBot Core OS**<br>*(Engine 3 Satellite #2)* | Production DB Sanitization, Chrome Extension v4.4.0, Auth Deduplication, Telegram Webhook Secret Fix<br>↳ *Contractor QA Expense: \`${expenseId}\` (৳2,500 / 1,250 Credits) — S. M Mahmud Bin Murad (Onim)* | 🟡 IN_PROGRESS | 212 | 5,000 | ৳10,000 | $82.50 |`;
      if (md.includes(searchTarget)) {
        md = md.replace(searchTarget, replacement);
        fs.writeFileSync(HOLDINGS_MD_PATH, md, 'utf8');
        console.log('✅ docs/HOLDINGS_SPRINT_LEDGER.md updated with contractor expense note.');
      }
    }
  }

  console.log('\n--- VERIFICATION OF BOOKED EXPENSE ---');
  if (supabase) {
    const { data: vSupabase } = await supabase.from('expenses').select('id, category, amount, currency, status, date').eq('id', expenseId).maybeSingle();
    console.log('Supabase Entry:', vSupabase);
  }
}

bookContractorExpense().then(() => {
  console.log('🎉 Contractor milestone expense booked and approved successfully.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
