/**
 * scripts/seed-dce-orders.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds initial demo/canonical DCE omnichannel orders into data/db.json
 * (dce_orders) and Supabase if configured.
 * 
 * Usage:
 *   node scripts/seed-dce-orders.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');
const { supabase, isSupabaseConfigured } = require('../src/services/supabase');

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');

const SEED_DCE_ORDERS = [
  {
    id: 'ord-etsy-01',
    channel_code: 'ETSY',
    external_order_id: 'ETSY-REC-902184',
    customer_id: 'cust-sarah',
    customer_name: 'Sarah Miller',
    customer_email: 'sarah.miller@example.com',
    brand_id: 'b-pq-01',
    brand_name: 'PlannerQueen',
    total_amount: 9.99,
    currency: 'USD',
    channel_fee: 1.15,
    net_amount: 8.84,
    status: 'COMPLETED',
    fulfillment_type: 'DIGITAL',
    placed_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    items: [
      {
        id: 'item-01',
        sku_id: 'sku-01',
        sku: 'PLNRQN-PDF-ETSY-USD9.99',
        title: 'Daily & Weekly Planner GoodNotes Aesthetic Digital Template 2026',
        quantity: 1,
        unit_price: 9.99,
        line_total: 9.99
      }
    ],
    events: [
      { id: 'ev-01', event_type: 'ORDER_SYNCED', new_status: 'COMPLETED', source: 'poll', created_at: new Date(Date.now() - 172800000).toISOString() }
    ]
  },
  {
    id: 'ord-gum-02',
    channel_code: 'GUMROAD',
    external_order_id: 'GUM-SALE-783921',
    customer_id: 'cust-sarah',
    customer_name: 'Sarah Miller',
    customer_email: 'sarah.miller@example.com',
    brand_id: 'b-pq-01',
    brand_name: 'PlannerQueen',
    total_amount: 7.99,
    currency: 'USD',
    channel_fee: 1.30,
    net_amount: 6.69,
    status: 'COMPLETED',
    fulfillment_type: 'DIGITAL',
    placed_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    items: [
      {
        id: 'item-02',
        sku_id: 'sku-02',
        sku: 'PLNRQN-PDF-GUMROAD-USD7.99',
        title: 'PlannerQueen Digital Daily & Weekly System (PDF Download)',
        quantity: 1,
        unit_price: 7.99,
        line_total: 7.99
      }
    ],
    events: [
      { id: 'ev-02', event_type: 'WEBHOOK_RECEIVED', new_status: 'COMPLETED', source: 'webhook', created_at: new Date(Date.now() - 86400000).toISOString() }
    ]
  },
  {
    id: 'ord-amz-03',
    channel_code: 'AMAZON',
    external_order_id: '114-8392019-3829104',
    customer_id: 'cust-alex',
    customer_name: 'Alex Reed',
    customer_email: 'alex.reed@example.com',
    brand_id: 'b-pq-01',
    brand_name: 'PlannerQueen',
    total_amount: 14.99,
    currency: 'USD',
    channel_fee: 2.25,
    net_amount: 12.74,
    status: 'DISPATCHED',
    fulfillment_type: 'PHYSICAL',
    tracking_number: 'TBA9382019482',
    shipping_carrier: 'Amazon Logistics',
    placed_at: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    items: [
      {
        id: 'item-03',
        sku_id: 'sku-03',
        sku: 'PLNRQN-PRINT-AMAZON-USD14.99',
        title: 'PlannerQueen Hardcover Daily & Weekly Undated Productivity Journal',
        quantity: 1,
        unit_price: 14.99,
        line_total: 14.99
      }
    ],
    events: [
      { id: 'ev-03', event_type: 'ORDER_SYNCED', new_status: 'PROCESSING', source: 'poll', created_at: new Date(Date.now() - 14400000).toISOString() },
      { id: 'ev-04', event_type: 'STATUS_CHANGE', old_status: 'PROCESSING', new_status: 'DISPATCHED', source: 'poll', created_at: new Date(Date.now() - 7200000).toISOString() }
    ]
  }
];

async function seedDCEOrders() {
  console.log('📦 Seeding DCE Omnichannel Orders...');

  // 1. Seed data/db.json
  try {
    let db = {};
    if (fs.existsSync(DB_JSON_PATH)) {
      db = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    }
    db.dce_orders = db.dce_orders || [];

    let addedLocal = 0;
    for (const seed of SEED_DCE_ORDERS) {
      const idx = db.dce_orders.findIndex(o => o.id === seed.id || o.external_order_id === seed.external_order_id);
      if (idx === -1) {
        db.dce_orders.push(seed);
        addedLocal++;
      } else {
        db.dce_orders[idx] = { ...db.dce_orders[idx], ...seed };
      }
    }
    fs.writeFileSync(DB_JSON_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log(`✅ Local data/db.json synced (${addedLocal} new orders, total: ${db.dce_orders.length})`);
  } catch (err) {
    console.warn('⚠️  Could not write to data/db.json:', err.message);
  }

  // 2. Seed Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      let sbSynced = 0;
      for (const seed of SEED_DCE_ORDERS) {
        const record = {
          id: seed.id,
          channel_code: seed.channel_code,
          external_order_id: seed.external_order_id,
          customer_id: null,
          brand_id: null,
          total_amount: seed.total_amount,
          currency: seed.currency,
          channel_fee: seed.channel_fee,
          net_amount: seed.net_amount,
          status: seed.status,
          fulfillment_type: seed.fulfillment_type,
          placed_at: seed.placed_at,
          raw_payload: { brand_name: seed.brand_name, items: seed.items },
          synced_at: new Date().toISOString()
        };
        const { error } = await supabase.from('dce_orders').upsert([record]);
        if (!error) sbSynced++;
      }
      console.log(`✅ Supabase dce_orders synced (${sbSynced} orders)`);
    } catch (err) {
      console.warn('⚠️  Supabase dce_orders sync note:', err.message);
    }
  }

  console.log('🎉 DCE Orders seeding finished successfully.');
}

if (require.main === module) {
  seedDCEOrders().then(() => process.exit(0)).catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}

module.exports = { SEED_DCE_ORDERS, seedDCEOrders };
