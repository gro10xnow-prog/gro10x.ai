/**
 * scripts/seed-v1.3.js
 * ─────────────────────────────────────────────────────────────────
 * Phase 1 companion: backfills the new v1.3 columns from db.json
 * into Supabase profiles. Run AFTER applying v1.3 SQL migration.
 *
 * Run: node scripts/seed-v1.3.js
 * ─────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const db = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/db.json'), 'utf8'));
const team = db.team || [];

function calcBadge(xp) {
  if (xp >= 2000) return '💜 Champion';
  if (xp >= 1000) return '🔥 Performer';
  if (xp >= 500)  return '⭐ Rising Star';
  return '🌱 Recruit';
}

async function run() {
  console.log(`\n🔄 Phase 1 backfill — ${team.length} employees\n`);

  let ok = 0, fail = 0;

  for (const emp of team) {
    const xp = emp.xp || 0;
    const update = {
      phone:              emp.phone || '',
      access_level:       emp.accessLevel || 'Specialist / Crew',
      badge:              emp.badge || calcBadge(xp),
      xp:                 xp,
      onboarding_complete: emp.id === 'PBD-000' ? true : (emp.onboardingComplete || false),
      status:             emp.status || 'Offline',
      telegram_id:        emp.telegramId ? String(emp.telegramId) : null,
    };

    const { error } = await supabase
      .from('profiles')
      .update(update)
      .eq('emp_code', emp.id);

    if (error) {
      console.log(`  ❌ ${emp.id} ${emp.name}: ${error.message}`);
      fail++;
    } else {
      const tg = emp.telegramId ? ` [TG ✓]` : '';
      console.log(`  ✅ ${emp.id} ${emp.name} — ${update.access_level}${tg}`);
      ok++;
    }
  }

  console.log(`\n📊 Results: ${ok} updated | ${fail} failed\n`);

  // Verification
  console.log('🔍 Verifying key profiles...\n');
  const { data } = await supabase
    .from('profiles')
    .select('emp_code, name, access_level, badge, xp, onboarding_complete, telegram_id')
    .in('emp_code', ['PBD-000', 'PBD-001', 'PBD-002', 'PBD-003'])
    .order('emp_code');

  (data || []).forEach(p => {
    const tg = p.telegram_id ? `TG:${p.telegram_id}` : 'No TG';
    const ob = p.onboarding_complete ? '✅ Activated' : '⏳ Onboarding';
    console.log(`  ${p.emp_code} | ${p.name}`);
    console.log(`    Access: ${p.access_level} | Badge: ${p.badge} | XP: ${p.xp}`);
    console.log(`    ${ob} | ${tg}\n`);
  });

  console.log('🎉 Phase 1 backfill complete!\n');
}

run().catch(console.error);
