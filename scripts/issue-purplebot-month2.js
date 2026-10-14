const { createInvoiceRecord, inMemoryInvoices } = require('../src/routes/invoices');
const { supabase } = require('../src/services/supabase');
const fs = require('fs');
const path = require('path');

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');

async function issuePurplebotMonth2Invoice() {
  console.log('🏛️ GRO10X Commercial Billing Operations — Issuing PurpleBot Retainer (Month 2)');

  const invoicePayload = {
    client_id: 'CLI-MTWK4BNC-24F6EA',
    client_name: 'Purplebot Digital Limited',
    project_name: 'Monthly Retainer (Month 2)',
    project_ref: 'PRJ-CL-E2-1789596138497',
    engine_tag: 'engine2',
    invoice_type: 'monthly_retainer',
    settlement_rail: 'bdt_bank_wire',
    currency: 'BDT',
    issue_date: '2026-10-15',
    due_date: '2026-10-15', // Due upon receipt
    status: 'Pending',
    tax_rate: 5,
    discount: 0,
    items: [
      {
        description: 'AI Agency OS & Automated Retainer Infrastructure — Month 2 Retainer Sprint',
        notes: 'Automated delivery pipelines, Telegram bot mesh orchestration, client review cockpit governance, and retainer sprint cycle 2 for Purplebot Digital Limited.',
        qty: 1,
        rate: 20000,
        amount: 20000
      }
    ],
    amount: 21000, // 20,000 Net Subtotal + 5% VAT (1,000) = 21,000 Total Payable
    notes: 'Commercial Retainer Invoice (Month 2) for Purplebot Digital Limited. Attention: H. M. Ifteker Mahmud, Managing Director (ifteker@purplebot.digital | +880 1612-309290). Scope: Monthly Retainer (Month 2) AI Agency OS & Automated Retainer Infrastructure. Terms: Due upon receipt. Settlement Rail: Direct Corporate Bank Wire Transfer (BRAC Bank Limited: 2081636480001, Mohakhali Branch, Routing: 060263290). Canonical Parity: $175 USD (120 BDT/USD). [type:monthly_retainer][rail:bdt_bank_wire]'
  };

  // 1. Generate & Insert via Core Engine
  const invoice = await createInvoiceRecord(invoicePayload);
  console.log(`✅ Invoice successfully generated: ${invoice.id}`);
  console.log('Invoice details:', {
    id: invoice.id,
    client: invoice.clientName,
    clientId: invoice.clientId,
    subtotal: invoice.subtotal,
    taxRate: `${invoice.taxRate}%`,
    vatAmount: invoice.vatAmount,
    amount: invoice.amount,
    currency: invoice.currency,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    settlementRail: invoice.settlementRail
  });

  // 2. Guarantee Dual-Store Persistence to local data/db.json
  try {
    if (fs.existsSync(DB_JSON_PATH)) {
      const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
      dbContent.invoices = dbContent.invoices || [];
      const existingIdx = dbContent.invoices.findIndex(i => i.id === invoice.id);
      const rawRecord = {
        id: invoice.id,
        client_id: invoice.clientId,
        client_name: invoice.clientName,
        project_name: invoice.projectName,
        project_ref: invoice.projectRef,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        issue_date: invoice.issueDate,
        due_date: invoice.dueDate,
        items: invoice.items,
        notes: invoice.notes,
        tax_rate: invoice.taxRate,
        discount: invoice.discount,
        engine_tag: invoice.engineTag,
        created_at: invoice.createdAt,
        updated_at: new Date().toISOString()
      };

      if (existingIdx !== -1) {
        dbContent.invoices[existingIdx] = rawRecord;
      } else {
        dbContent.invoices.unshift(rawRecord);
      }
      fs.writeFileSync(DB_JSON_PATH, JSON.stringify(dbContent, null, 2), 'utf8');
      console.log('✅ Local data/db.json persistence confirmed.');
    }
  } catch (err) {
    console.warn('⚠️ data/db.json write note:', err.message);
  }

  // 3. Verify in Supabase
  if (supabase) {
    const { data: verified, error: verifyErr } = await supabase
      .from('invoices')
      .select('id, client_name, amount, status, issue_date, due_date')
      .eq('id', invoice.id)
      .single();
    if (verifyErr) {
      console.error('❌ Supabase verification error:', verifyErr.message);
    } else {
      console.log('✅ Supabase persistence verified:', verified);
    }
  }

  return invoice;
}

if (require.main === module) {
  issuePurplebotMonth2Invoice().then(() => process.exit(0)).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { issuePurplebotMonth2Invoice };
