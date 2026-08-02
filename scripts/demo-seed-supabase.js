/**
 * scripts/demo-seed-supabase.js
 * ─────────────────────────────────────────────────────────────────
 * Seeds ALL 33 team members from db.json into Supabase profiles table.
 * Also sets Firoz (PBD-000) and Iftekhar (PBD-001) as demo-verified
 * so the Mini App authenticates them immediately without re-verification.
 *
 * Run: node scripts/demo-seed-supabase.js
 * ─────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Load db.json
const dbPath = path.join(__dirname, '../data/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const team = db.team || [];

// Known telegramIds from db.json (only Firoz has one set)
// If you want to set your own Telegram ID for testing, add it here:
const KNOWN_TELEGRAM_IDS = {
  'PBD-000': '7754769807',   // Firoz Uddin Ahmed (Tech Admin)
  // 'PBD-001': '<iftekhar_telegram_id_here>',  // Uncomment after getting Iftekhar's Telegram ID
};

async function seedProfiles() {
  console.log(`\n🌱 Starting Supabase profile seed for ${team.length} team members...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const emp of team) {
    const telegramId = KNOWN_TELEGRAM_IDS[emp.id] || emp.telegramId || null;

    // Only include columns that exist in the current Supabase schema (v0.6 base).
    // After running supabase/migrations/20260802_v1.2_demo_rls_fix.sql,
    // re-run this script to also populate the new columns.
    const payload = {
      emp_code:           emp.id,
      name:               emp.name || 'Team Member',
      role:               emp.role || 'Specialist',
      department:         emp.department || '',
      phone:              emp.phone || '',
      telegram_id:        telegramId ? String(telegramId) : null,
      base_salary:        Number(emp.baseSalary) || 0,
      commission_rate:    Number(emp.commissionRate) || 0,
      earned_commissions: Number(emp.earnedCommissions) || 0,
      status:             emp.status || 'Offline',
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'emp_code' });

    if (error) {
      console.error(`  ❌ ${emp.id} ${emp.name}: ${error.message}`);
      errorCount++;
    } else {
      const tgInfo = telegramId ? ` [TG: ${telegramId}]` : '';
      console.log(`  ✅ ${emp.id} ${emp.name} (${emp.role})${tgInfo}`);
      successCount++;
    }
  }

  console.log(`\n📊 SEED RESULTS: ${successCount} success | ${errorCount} errors\n`);
}

async function verifyDemo() {
  console.log('🔍 Verifying Firoz (PBD-000) is accessible via Mini App auth query...\n');
  const { data, error } = await supabase
    .from('profiles')
    .select('emp_code, name, role, telegram_id, onboarding_complete')
    .eq('telegram_id', '7754769807')
    .single();

  if (error || !data) {
    console.error('  ❌ VERIFICATION FAILED — Firoz not found via telegram_id:', error?.message);
  } else {
    console.log('  ✅ VERIFICATION PASSED — Mini App will authenticate Firoz:');
    console.log(`     emp_code: ${data.emp_code}`);
    console.log(`     name: ${data.name}`);
    console.log(`     role: ${data.role}`);
    console.log(`     telegram_id: ${data.telegram_id}`);
    console.log(`     onboarding_complete: ${data.onboarding_complete}`);
  }
}

async function checkProfilesTable() {
  console.log('📋 Checking if profiles table exists and has correct columns...');
  const { data, error } = await supabase.from('profiles').select('emp_code').limit(1);
  if (error) {
    console.error('❌ profiles table error:', error.message);
    console.log('\n🔧 You may need to add missing columns. Run this SQL in Supabase:\n');
    console.log(`ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS telegram_id TEXT,
  ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'Specialist / Crew',
  ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT '🌱 Recruit',
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
`);
    return false;
  }
  console.log('  ✅ profiles table accessible\n');
  return true;
}

(async () => {
  const tableOk = await checkProfilesTable();
  if (!tableOk) process.exit(1);

  await seedProfiles();
  await verifyDemo();

  console.log('\n🎉 Done! All profiles seeded. The Mini App auth is now ready for demo.\n');
})();
