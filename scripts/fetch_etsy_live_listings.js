/**
 * scripts/fetch_etsy_live_listings.js
 * Queries Etsy Open API v3 for Brand 1 to inspect all active/draft/inactive listings.
 */
require('dotenv').config();
const { getConnection, etsyApiCall } = require('../src/services/etsy');

async function main() {
  const brandId = 1;
  const conn = await getConnection(brandId);
  if (!conn || !conn.shop_id) {
    console.error('❌ No Etsy shop connection found for brand 1:', conn);
    process.exit(1);
  }

  console.log(`Connected to Etsy Shop ID: ${conn.shop_id} (${conn.shop_name})`);

  try {
    // 1. Fetch active listings
    console.log('Fetching active listings from Etsy...');
    const activeRes = await etsyApiCall(brandId, `/shops/${conn.shop_id}/listings/active?limit=100`);
    console.log(`Found ${activeRes.results?.length || 0} active listings:`);
    (activeRes.results || []).forEach((l, i) => {
      console.log(`  [${i+1}] ID: ${l.listing_id} | State: ${l.state} | Title: "${l.title}" | Price: $${(l.price?.amount || 0)/(l.price?.divisor || 100)} ${l.price?.currency_code}`);
    });

    // 2. Fetch draft listings
    console.log('\nFetching draft listings from Etsy...');
    const draftRes = await etsyApiCall(brandId, `/shops/${conn.shop_id}/listings/draft?limit=100`);
    console.log(`Found ${draftRes.results?.length || 0} draft listings:`);
    (draftRes.results || []).forEach((l, i) => {
      console.log(`  [${i+1}] ID: ${l.listing_id} | State: ${l.state} | Title: "${l.title}"`);
    });

    // 3. Fetch inactive listings
    console.log('\nFetching inactive listings from Etsy...');
    const inactiveRes = await etsyApiCall(brandId, `/shops/${conn.shop_id}/listings/inactive?limit=100`);
    console.log(`Found ${inactiveRes.results?.length || 0} inactive listings:`);
    (inactiveRes.results || []).forEach((l, i) => {
      console.log(`  [${i+1}] ID: ${l.listing_id} | State: ${l.state} | Title: "${l.title}"`);
    });

  } catch (err) {
    console.error('❌ Etsy API error:', err.message);
  }
}

main();
