const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;       // Service-role client — used for ALL server-side DB operations (bypasses RLS)
let supabaseAnon = null;   // Anon client — used ONLY for verifying user session tokens
let supabaseAdmin = null;  // Alias for supabase (service-role), kept for backward compat

if (supabaseUrl && !supabaseUrl.includes('your-project-id')) {

  // Prefer service-role for server-side queries (bypasses RLS — safe since this runs server-side only)
  if (supabaseServiceKey && !supabaseServiceKey.includes('your_supabase')) {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    supabaseAdmin = supabase;
    console.log('✅ Supabase Service-Role Client initialized (server-side, bypasses RLS)');
  } else if (supabaseAnonKey && !supabaseAnonKey.includes('your_supabase')) {
    // Fallback to anon key if service role not available (dev mode)
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    supabaseAdmin = supabase;
    console.warn('⚠️  Supabase using ANON key for server queries. Set SUPABASE_SERVICE_ROLE_KEY for production.');
  }

  // Always create a separate anon client for user token verification
  if (supabaseAnonKey && !supabaseAnonKey.includes('your_supabase')) {
    supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  }

} else {
  console.warn('⚠️  Supabase credentials missing or unconfigured.');
}

// PRODUCTION ENFORCEMENT GUARD
// NOTE: Throwing an unhandled exception at module level crashes the entire Vercel serverless
// boot sequence before requests can be routed. Instead, log a prominent error and allow routes
// to check isSupabaseConfigured() and return clean 503/500 responses.
if ((process.env.NODE_ENV === 'production' || process.env.VERCEL) && supabase === null) {
  console.error('🚨 [Supabase] WARNING: Supabase credentials missing in production. Ensure SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are set in Vercel Environment Variables.');
}

function isSupabaseConfigured() {
  return supabase !== null;
}

module.exports = {
  supabase,
  supabaseAdmin,
  supabaseAnon,
  isSupabaseConfigured
};
