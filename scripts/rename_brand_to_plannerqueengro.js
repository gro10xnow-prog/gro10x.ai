/**
 * scripts/rename_brand_to_plannerqueengro.js
 * Updates brand name from 'PlannerQueenCo' to 'PlannerQueenGro' across local data and Supabase cloud.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Update data/brands_empire_state.json
const statePath = path.join(__dirname, '..', 'data', 'brands_empire_state.json');
if (fs.existsSync(statePath)) {
  let text = fs.readFileSync(statePath, 'utf8');
  text = text.replace(/PlannerQueenCo/g, 'PlannerQueenGro');
  text = text.replace(/plannerqueenco/g, 'plannerqueengro');
  fs.writeFileSync(statePath, text, 'utf8');
  console.log('✅ Updated data/brands_empire_state.json');
}

// 2. Sync to Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  async function syncSupabase() {
    console.log('Fetching brands_empire_state from Supabase...');
    const { data } = await supabase.from('custom_fields')
      .select('options')
      .eq('id', 'brands_empire_state')
      .maybeSingle();

    if (data && data.options) {
      let stringified = JSON.stringify(data.options);
      stringified = stringified.replace(/PlannerQueenCo/g, 'PlannerQueenGro');
      stringified = stringified.replace(/plannerqueenco/g, 'plannerqueengro');
      const updatedOptions = JSON.parse(stringified);

      const { error: upsertError } = await supabase.from('custom_fields').upsert({
        id: 'brands_empire_state',
        entity_type: 'app_setting',
        name: 'brands_empire_state',
        field_type: 'json',
        options: updatedOptions
      }, { onConflict: 'id' });

      if (upsertError) {
        console.error('❌ Supabase update error:', upsertError.message);
      } else {
        console.log('✅ Successfully updated Supabase brands_empire_state to PlannerQueenGro');
      }
    }
  }
  syncSupabase();
} else {
  console.warn('⚠️ Supabase credentials missing in .env');
}
