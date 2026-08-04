require('dotenv').config();
const { supabase } = require('../src/services/supabase');

async function purgeOperationalData() {
  console.log('🚀 Starting Dummy Data Purge...');
  
  const tables = ['tasks', 'invoices', 'expenses', 'tickets', 'assets', 'leads', 'reviews'];
  
  for (const table of tables) {
    console.log(`🗑️  Purging all records from: ${table}`);
    try {
      // Deleting all records where id is not null (which effectively deletes all rows)
      const { data, error } = await supabase.from(table).delete().neq('id', 'DELETE_ALL_TRICK_THAT_MATCHES_NOTHING').not('id', 'is', null);
      if (error) {
        console.error(`❌ Error purging ${table}:`, error.message);
      } else {
        console.log(`✅ Successfully purged ${table}`);
      }
    } catch (e) {
      console.error(`❌ Exception while purging ${table}:`, e.message);
    }
  }

  console.log('✨ Data purge complete! Clean slate ready.');
  process.exit(0);
}

purgeOperationalData();
