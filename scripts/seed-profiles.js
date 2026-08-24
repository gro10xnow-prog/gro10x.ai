/**
 * scripts/seed-profiles.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Bootstraps or syncs the 33 team members from data/db.json into Supabase public.profiles
 * Maps all camelCase db.json properties to Supabase snake_case columns.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedProfiles() {
  console.log('⚡ Starting Profiles Seeder from data/db.json ...');
  
  const dbPath = path.resolve(__dirname, '../data/db.json');
  if (!fs.existsSync(dbPath)) {
    console.error('❌ data/db.json not found');
    process.exit(1);
  }

  const raw = fs.readFileSync(dbPath, 'utf8');
  const dbData = JSON.parse(raw);
  const team = dbData.team || [];

  if (!team.length) {
    console.log('ℹ️ No team members found in db.json');
    return;
  }

  console.log(`Found ${team.length} team members in db.json.`);

  const profilesToUpsert = team.map(emp => ({
    emp_code: emp.emp_code || emp.id,
    name: emp.name || 'Team Specialist',
    email: emp.email || null,
    phone: emp.phone || null,
    role: emp.role || 'Specialist',
    department: emp.department || 'Production',
    access_level: emp.accessLevel || 'Specialist / Crew',
    status: emp.status || 'Active',
    base_salary: Number(emp.baseSalary || 0),
    badge: emp.badge || null,
    xp: Number(emp.xp || 0),
    is_verified: true,
    casual_leaves_allowed: 10,
    sick_leaves_allowed: 14,
    leaves_balance: 14,
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profilesToUpsert, { onConflict: 'emp_code' })
    .select();

  if (error) {
    console.error('❌ Supabase upsert error:', error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully seeded/updated ${data ? data.length : profilesToUpsert.length} profiles in Supabase!`);
}

seedProfiles().catch(err => {
  console.error('❌ Seeder exception:', err.message);
  process.exit(1);
});
