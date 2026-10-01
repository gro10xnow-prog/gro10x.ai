/**
 * scripts/seed-quotes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds default commercial quotations into data/db.json (quotes) and Supabase
 * Usage:
 *   node scripts/seed-quotes.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');
const { supabase, isSupabaseConfigured } = require('../src/services/supabase');

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');

const SEED_QUOTES = [
  {
    id: 'QTE-2026-001',
    client_id: 'CLI-MTLTKLN8-525533',
    client_name: 'Apex Footwear Limited',
    project_title: '24/7 Social Automation AI Retainer',
    scope: 'Enterprise AI customer interaction agent for Meta Graph (Messenger & IG Direct). Multi-turn intent detection, order tracking lookup, human escalation bridge.',
    amount: 65000,
    currency: 'BDT',
    status: 'Sent',
    valid_until: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    line_items: [
      { description: 'Conversational AI System Grounding & FAQ Embedding', qty: 1, amount: 35000 },
      { description: 'Meta Graph Webhook Gateway & Multi-Tenant Routing', qty: 1, amount: 20000 },
      { description: 'Human-in-the-Loop Telegram Duty Officer Escalation Bridge', qty: 1, amount: 10000 }
    ],
    notes: 'Payment Terms: 50% upfront deposit upon acceptance, 50% upon QA sign-off.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'QTE-2026-002',
    client_id: 'CLI-CHILLOX-001',
    client_name: 'Chillox Bangladesh',
    project_title: 'Viral Content Ops & Reel Production Sprint',
    scope: 'Batch of 10 viral food reels, on-site cinematic shoot in Banani flagship outlet, sound design, color grading, and TikTok/Reels organic pacing.',
    amount: 45000,
    currency: 'BDT',
    status: 'Draft',
    valid_until: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    line_items: [
      { description: 'Pre-production Scripting & Hook Strategy', qty: 1, amount: 12000 },
      { description: '4K Multi-Angle Food Shoot & Lighting Setup', qty: 1, amount: 18000 },
      { description: 'Post-production Editing, Dynamic Captions & Sound FX', qty: 1, amount: 15000 }
    ],
    notes: 'Includes 2 rounds of creative revisions via GRO10X Review Room.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

async function seedQuotes() {
  console.log('📄 Seeding Commercial Quotations...');

  // 1. Seed data/db.json
  try {
    let db = {};
    if (fs.existsSync(DB_JSON_PATH)) {
      db = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    }
    db.quotes = db.quotes || [];

    let addedLocal = 0;
    for (const seed of SEED_QUOTES) {
      const idx = db.quotes.findIndex(q => q.id === seed.id);
      if (idx === -1) {
        db.quotes.push(seed);
        addedLocal++;
      } else {
        db.quotes[idx] = { ...db.quotes[idx], ...seed };
      }
    }
    fs.writeFileSync(DB_JSON_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log(`✅ Local data/db.json synced (${addedLocal} new quotes, total: ${db.quotes.length})`);
  } catch (err) {
    console.warn('⚠️  Could not write quotes to data/db.json:', err.message);
  }

  // 2. Seed Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      let sbSynced = 0;
      for (const seed of SEED_QUOTES) {
        const { error } = await supabase.from('quotes').upsert([seed]);
        if (!error) sbSynced++;
      }
      console.log(`✅ Supabase quotes synced (${sbSynced} quotes)`);
    } catch (err) {
      console.warn('⚠️  Supabase quotes sync note:', err.message);
    }
  }

  console.log('🎉 Quotes seeding finished successfully.');
}

if (require.main === module) {
  seedQuotes().then(() => process.exit(0)).catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}

module.exports = { SEED_QUOTES, seedQuotes };
