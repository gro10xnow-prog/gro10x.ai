/**
 * scripts/regenerate_all_blueprints_v2.js
 * Regenerates category-intelligent blueprints & mockup briefs for all 100 PlannerQueenGro products.
 * Updates data/brands_empire_state.json and syncs directly to Supabase custom_fields.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { generateCategoryBlueprint, generateCategoryMockups } = require('../src/services/blueprint-generator');

const statePath = path.join(__dirname, '..', 'data', 'brands_empire_state.json');
const localState = JSON.parse(fs.readFileSync(statePath, 'utf8'));

const brand = localState.brands.find(b => b.id === 1) || {
  id: 1,
  name: 'PlannerQueenGro',
  niche: 'Productivity & Life Planning',
  voice: 'Warm, empowering, practical, motivating',
  palette: ['#8B5A7A', '#FAF3E8', '#7D9B76', '#C4887C', '#2E2E2E'],
  fonts: 'Playfair Display + Lato',
  type: 'Digital'
};

const catalog = localState.productsCatalog["1"] || [];

console.log(`Regenerating Category-Intelligent Blueprints 2.0 for ${catalog.length} products...`);

let stats = {};

catalog.forEach((prod, idx) => {
  const bp = generateCategoryBlueprint(
    prod.name,
    brand.name,
    brand.niche,
    brand.voice,
    brand.palette,
    brand.fonts,
    prod.format || brand.type,
    prod.category || ''
  );

  const mock = generateCategoryMockups(
    prod.name,
    brand.name,
    brand.niche,
    brand.voice,
    brand.palette,
    brand.fonts,
    prod.format || brand.type,
    prod.category || ''
  );

  prod.blueprint = {
    geometry: bp.documentSpecs.dimensions,
    typography: bp.documentSpecs.typography.headingFont + ' + ' + bp.documentSpecs.typography.bodyFont,
    categoryName: bp.categoryName,
    targetAudience: bp.targetAudience,
    prompt: bp.googleFlowPrompt,
    googleFlowPrompt: bp.googleFlowPrompt,
    documentSpecs: bp.documentSpecs,
    pageBreakdown: bp.pageBreakdown,
    masterMockupPrompt: mock.masterMockupPrompt,
    videoPrompt: mock.videoPrompt,
    mockupsList: mock.mockups
  };

  const catKey = bp.categoryName || 'Other';
  stats[catKey] = (stats[catKey] || 0) + 1;
});

fs.writeFileSync(statePath, JSON.stringify(localState, null, 2), 'utf8');
console.log('✅ Updated data/brands_empire_state.json with Blueprint Engine 2.0');
console.log('Category Distribution across 100 SKUs:', stats);

// Sync to Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  async function syncSupabase() {
    console.log('Syncing updated state to Supabase custom_fields...');
    const { error: upsertError } = await supabase.from('custom_fields').upsert({
      id: 'brands_empire_state',
      entity_type: 'app_setting',
      name: 'brands_empire_state',
      field_type: 'json',
      options: localState
    }, { onConflict: 'id' });

    if (upsertError) {
      console.error('❌ Supabase update error:', upsertError.message);
    } else {
      console.log('✅ Successfully synced Blueprint Engine 2.0 to Supabase Cloud!');
      console.log('Sample verification:');
      console.log('  PLA-01 (Daily Planner):', catalog.find(p => p.code === 'PLA-01')?.blueprint?.pageBreakdown?.length, 'Spreads (', catalog.find(p => p.code === 'PLA-01')?.blueprint?.categoryName, ')');
      console.log('  PLA-04 (Teacher Planner):', catalog.find(p => p.code === 'PLA-04')?.blueprint?.pageBreakdown?.length, 'Spreads (', catalog.find(p => p.code === 'PLA-04')?.blueprint?.categoryName, ')');
      console.log('  PLA-11 (Budget Planner):', catalog.find(p => p.code === 'PLA-11')?.blueprint?.pageBreakdown?.length, 'Spreads (', catalog.find(p => p.code === 'PLA-11')?.blueprint?.categoryName, ')');
      console.log('  PLA-71 (Holiday Planner):', catalog.find(p => p.code === 'PLA-71')?.blueprint?.pageBreakdown?.length, 'Spreads (', catalog.find(p => p.code === 'PLA-71')?.blueprint?.categoryName, ')');
      console.log('  PLA-91 (E-book Guide):', catalog.find(p => p.code === 'PLA-91')?.blueprint?.pageBreakdown?.length, 'Modules (', catalog.find(p => p.code === 'PLA-91')?.blueprint?.categoryName, ')');
    }
  }
  syncSupabase();
}
