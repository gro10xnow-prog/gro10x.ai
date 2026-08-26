/**
 * scripts/sync_supabase_brands_state.js
 * Pushes the updated 100-product roadmap directly into Supabase custom_fields table.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
  const statePath = path.join(__dirname, '..', 'data', 'brands_empire_state.json');
  const localState = JSON.parse(fs.readFileSync(statePath, 'utf8'));

  console.log('Fetching existing brands_empire_state from Supabase...');
  const { data, error } = await supabase.from('custom_fields')
    .select('options')
    .eq('id', 'brands_empire_state')
    .maybeSingle();

  let remoteState = (data && data.options) || localState;
  
  if (!remoteState.productsCatalog) remoteState.productsCatalog = {};
  
  // Merge the enriched 100 products for Brand 1
  const enrichedCatalog1 = localState.productsCatalog["1"] || [];
  const existingCatalog1 = remoteState.productsCatalog["1"] || [];

  enrichedCatalog1.forEach(p => {
    const existing = existingCatalog1.find(ep => ep.code === p.code);
    if (existing) {
      // Keep live status, etsyListingId, vault, mockups, etc.
      Object.assign(existing, {
        name: p.name,
        category: p.category || existing.category,
        format: p.format || existing.format,
        hero: p.hero
      });
      if (p.price && (!existing.price || existing.price === 12)) {
        existing.price = p.price;
      }
    } else {
      existingCatalog1.push(p);
    }
  });

  remoteState.productsCatalog["1"] = existingCatalog1;

  console.log('Upserting updated state to Supabase custom_fields...');
  const { error: upsertError } = await supabase.from('custom_fields').upsert({
    id: 'brands_empire_state',
    entity_type: 'app_setting',
    name: 'brands_empire_state',
    field_type: 'json',
    options: remoteState
  }, { onConflict: 'id' });

  if (upsertError) {
    console.error('❌ Supabase upsert error:', upsertError.message);
  } else {
    console.log('✅ Successfully synced 100-product roadmap to Supabase!');
    console.log('Sample updated products:');
    console.log('  PLA-03:', existingCatalog1.find(p => p.code === 'PLA-03')?.name);
    console.log('  PLA-11:', existingCatalog1.find(p => p.code === 'PLA-11')?.name);
    console.log('  PLA-71:', existingCatalog1.find(p => p.code === 'PLA-71')?.name);
    console.log('  PLA-80:', existingCatalog1.find(p => p.code === 'PLA-80')?.name);
  }
}

sync();
