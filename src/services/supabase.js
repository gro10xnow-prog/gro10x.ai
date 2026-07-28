const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let supabaseAdmin = null;

if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id')) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase Client initialized with URL:', supabaseUrl);

  if (supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
} else {
  console.warn('⚠️ Supabase credentials missing or unconfigured. System will use local JSON fallback.');
}

function isSupabaseConfigured() {
  return supabase !== null;
}

module.exports = {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured
};
