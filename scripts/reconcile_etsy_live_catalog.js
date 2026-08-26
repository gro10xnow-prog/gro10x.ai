/**
 * scripts/reconcile_etsy_live_catalog.js
 * Automatically reconciles live Etsy listings from Shop 66193600 with products in brands_empire_state.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { getConnection, etsyApiCall } = require('../src/services/etsy');

async function main() {
  const brandId = 1;
  const conn = await getConnection(brandId);
  if (!conn || !conn.shop_id) {
    console.error('❌ No Etsy shop connection found for brand 1');
    process.exit(1);
  }

  console.log(`Connected to Etsy Shop ID: ${conn.shop_id} (${conn.shop_name})`);

  const activeRes = await etsyApiCall(brandId, `/shops/${conn.shop_id}/listings/active?limit=100`);
  const liveListings = activeRes.results || [];
  console.log(`Found ${liveListings.length} live listings on Etsy.`);

  const statePath = path.join(__dirname, '..', 'data', 'brands_empire_state.json');
  const localState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const catalog = localState.productsCatalog["1"] || [];

  let reconciledCount = 0;

  liveListings.forEach(l => {
    const lTitle = (l.title || '').toLowerCase();
    const lId = l.listing_id;
    const lPrice = (l.price?.amount || 0) / (l.price?.divisor || 100);

    // Matching logic:
    let matchedProd = null;

    if (lId === 4562683744 || lTitle.includes('daily weekly planner – interactive') || lTitle.includes('planners #1')) {
      matchedProd = catalog.find(p => p.code === 'PLA-01');
    } else if (lId === 4562903974 || lTitle.includes('daily weekly planners – productivity') || lTitle.includes('planners #2') || lTitle.includes('executive work-life')) {
      matchedProd = catalog.find(p => p.code === 'PLA-02');
    } else if (lId === 4562964296 || lTitle.includes('adhd-friendly') || lTitle.includes('low-dopamine') || lTitle.includes('planners #3')) {
      matchedProd = catalog.find(p => p.code === 'PLA-03');
    } else if (lId === 4563030934 || lTitle.includes('teacher') || lTitle.includes('academic lesson') || lTitle.includes('planners #4')) {
      matchedProd = catalog.find(p => p.code === 'PLA-04');
    } else {
      // General fuzzy match against catalog product names
      matchedProd = catalog.find(p => {
        const pClean = p.name.toLowerCase().replace(/[^a-z0-9]/g, ' ');
        const words = pClean.split(' ').filter(w => w.length > 4);
        return words.some(w => lTitle.includes(w));
      });
    }

    if (matchedProd) {
      console.log(`✅ Reconciling SKU ${matchedProd.code} ("${matchedProd.name}") -> Etsy Listing #${lId}`);
      matchedProd.status = 'Live';
      matchedProd.etsyListingId = lId;
      matchedProd.price = lPrice || matchedProd.price;
      matchedProd.retailPrice = lPrice || matchedProd.retailPrice || matchedProd.price;
      matchedProd.liveListingUrl = l.url || `https://www.etsy.com/listing/${lId}`;
      matchedProd.etsyState = l.state || 'active';
      matchedProd.studioPercent = 100;
      matchedProd.approvedAt = matchedProd.approvedAt || new Date().toISOString();
      matchedProd.approvedBy = matchedProd.approvedBy || 'Admin';
      matchedProd.submittedAt = matchedProd.submittedAt || new Date().toISOString();
      matchedProd.submittedBy = matchedProd.submittedBy || 'DVM';
      reconciledCount++;
    } else {
      console.log(`⚠️ Unmatched Etsy Listing #${lId}: "${l.title}"`);
    }
  });

  fs.writeFileSync(statePath, JSON.stringify(localState, null, 2), 'utf8');
  console.log(`\n✅ Updated local state with ${reconciledCount} reconciled live products.`);

  // Sync to Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Syncing reconciled state to Supabase custom_fields...');
    const { error: upsertError } = await supabase.from('custom_fields').upsert({
      id: 'brands_empire_state',
      entity_type: 'app_setting',
      name: 'brands_empire_state',
      field_type: 'json',
      options: localState
    }, { onConflict: 'id' });

    if (upsertError) {
      console.error('❌ Supabase sync error:', upsertError.message);
    } else {
      console.log('✅ Successfully synced reconciled live products to Supabase Cloud!');
    }
  }
}

main();
