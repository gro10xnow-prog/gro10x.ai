/**
 * scripts/seed-proposals.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds default commercial proposals into db.json and Supabase
 * Usage: node scripts/seed-proposals.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
const { readDB, writeDB } = require('../src/services/db');

const SEED_PROPOSALS = [
  {
    id: 'PROP-2026-001',
    share_token: 'ucb-meta-ai-7x9q',
    client_name: 'United Commercial Bank (UCB)',
    client_company: 'United Commercial Bank PLC',
    client_email: 'digital.banking@ucb.com.bd',
    client_phone: '+880 1700-000000',
    project_title: '24/7 AI-Powered Social Media Customer Automation (Facebook & Instagram)',
    project_summary: 'Implementation of a dedicated, enterprise-grade conversational AI chatbot architecture across UCB Official Facebook and Instagram channels. Features 24/7 real-time customer query handling, private single-tenant data isolation, custom banking FAQ knowledge grounding, and smart Telegram human-in-the-loop escalation dispatch.',
    scope_items: [
      {
        title: 'Meta Graph API & Webhook Infrastructure',
        description: 'Official Facebook Messenger & Instagram Direct Message API connection with dedicated webhook routing, real-time message handshake, and rate-limit buffering.'
      },
      {
        title: 'Custom Conversational AI Engine (Gemini 3.6 Flash)',
        description: 'Bilingual conversational intelligence (Bangla + English) fine-tuned on UCB retail banking services, cards, loans, branch locator, and general FAQs with context memory.'
      },
      {
        title: 'Dedicated Single-Tenant Control Dashboard',
        description: 'Private administrative dashboard with 100% data ownership (non-multi-tenant architecture). Real-time message logs, analytics, user session tracking, and manual override.'
      },
      {
        title: 'Telegram Human-in-the-Loop Escalation Bridge',
        description: 'Instant automated notification alerts dispatched directly to duty officers on Telegram when complex inquiries or high-priority customer requests require human takeover.'
      },
      {
        title: 'Security, Compliance & Load Testing',
        description: 'Enterprise data guardrails, PII masking, rigorous multi-turn stress testing, and seamless go-live handover.'
      }
    ],
    one_time_items: [
      {
        name: 'Architecture Setup & Meta API Integration',
        description: 'Facebook & Instagram Direct Webhook setup, token management & Meta Graph integration',
        amount: 15000
      },
      {
        name: 'Conversational AI Model Grounding & Custom Training',
        description: 'Gemini AI prompt engineering, banking FAQ embedding & bilingual Bangla/English dialogue tuning',
        amount: 18000
      },
      {
        name: 'Dedicated Single-Tenant Control Dashboard',
        description: 'Private administrative web dashboard, analytics, real-time audit logs & Telegram human-escalation bridge',
        amount: 15000
      }
    ],
    recurring_items: [
      {
        name: 'Monthly Dedicated AI Cloud Compute & Continuous Model Grounding',
        description: 'Gemini API token throughput buffer, uptime SLA monitoring, and weekly FAQ knowledge base retraining',
        amount: 9500,
        frequency: 'Monthly'
      }
    ],
    one_time_total: 48000,
    recurring_total: 9500,
    currency: 'BDT',
    timeline: '10–14 Working Days from Meta Credentials Handover',
    valid_until: '2026-10-31',
    terms: '• 50% advance mobilization deposit upon acceptance.\n• 50% upon successful staging validation and live channel connection.\n• Dedicated monthly retainer commences upon official go-live.\n• Any high-surge API token compute beyond quota billed at actual cost.',
    notes: 'Private Single-Tenant Build for United Commercial Bank PLC. High-priority flagship automation.',
    status: 'Sent',
    created_by: 'GRO-001',
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function seed() {
  console.log('🌱 Seeding Proposals...');

  // 1. Seed db.json
  const db = await readDB();
  db.proposals = db.proposals || [];

  for (const seedProp of SEED_PROPOSALS) {
    const idx = db.proposals.findIndex(p => p.id === seedProp.id || p.share_token === seedProp.share_token);
    if (idx !== -1) {
      db.proposals[idx] = { ...db.proposals[idx], ...seedProp };
    } else {
      db.proposals.push(seedProp);
    }
  }
  await writeDB(db);
  console.log(`✅ Seeded ${db.proposals.length} proposal(s) into db.json`);

  // 2. Seed Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('proposals').upsert(SEED_PROPOSALS);
      if (error) {
        console.warn('⚠️ Supabase proposals note:', error.message);
      } else {
        console.log('✅ Seeded proposals into Supabase');
      }
    } catch (e) {
      console.warn('⚠️ Supabase error:', e.message);
    }
  }

  console.log('🚀 Proposals Seeding Complete!');
}

if (require.main === module) {
  seed();
}

module.exports = { seed, SEED_PROPOSALS };
