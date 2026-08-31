/**
 * scripts/test-digivault-phase4b.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification Test Suite for DigiVault Phase 4B:
 * 1. Database Migration: public.digi_bot_sessions table definition & RLS
 * 2. Telegram Bot Session Store: getSession, saveSession, clearSession persistence
 * 3. Backend Routes: Vendor PUT & DELETE endpoints, Renewal WhatsApp link generator
 * 4. Admin Panel: Live Delivery Queue search & supplier filter
 * 5. Admin Panel: Dynamic Vendor CRUD (modals, edit, delete, add)
 * 6. Admin Panel: Renewals WA Follow-up & Procure buttons
 * 7. Admin Panel: Accurate Active Subscriptions KPI calculation
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runPhase4BTests() {
  console.log('🧪 Starting DigiVault Phase 4B Verification Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Database Migration Check
  const migPath = path.join(__dirname, '../supabase/migrations/20260904_v3.7_digivault_phase4b.sql');
  assert(fs.existsSync(migPath), 'Migration file 20260904_v3.7_digivault_phase4b.sql exists');
  if (fs.existsSync(migPath)) {
    const migContent = fs.readFileSync(migPath, 'utf8');
    assert(migContent.includes('CREATE TABLE IF NOT EXISTS public.digi_bot_sessions'), 'Migration creates digi_bot_sessions table');
    assert(/chat_id\s+TEXT\s+PRIMARY\s+KEY/i.test(migContent), 'Migration sets chat_id as PRIMARY KEY');
    assert(migContent.includes('ENABLE ROW LEVEL SECURITY'), 'Migration enables Row Level Security');
  }

  // 2. Telegram Bot Session Persistence
  const botService = require('../src/services/digivault-bot');
  assert(typeof botService.getSession === 'function', 'digivault-bot exports getSession');
  assert(typeof botService.saveSession === 'function', 'digivault-bot exports saveSession');
  assert(typeof botService.clearSession === 'function', 'digivault-bot exports clearSession');

  // Test session state lifecycle
  const testChatId = 'test_chat_99999';
  const initialSess = await botService.getSession(testChatId);
  assert(initialSess.lang === 'bn' && initialSess.step === 'idle', 'getSession returns default Bengali idle session');

  await botService.saveSession(testChatId, {
    lang: 'en',
    step: 'awaiting_payment',
    orderNumber: 'DIGI-TEST-001',
    customerName: 'Rahim Test'
  });

  const retrievedSess = await botService.getSession(testChatId);
  assert(retrievedSess.lang === 'en' && retrievedSess.step === 'awaiting_payment' && retrievedSess.orderNumber === 'DIGI-TEST-001', 'saveSession correctly persists and updates session data');

  await botService.clearSession(testChatId);
  const clearedSess = await botService.getSession(testChatId);
  assert(clearedSess.step === 'idle', 'clearSession resets chat session');

  const botPath = path.join(__dirname, '../src/services/digivault-bot.js');
  const botContent = fs.readFileSync(botPath, 'utf8');
  assert(botContent.includes("await saveSession(chatId, { lang: 'bn', step: 'idle' })"), '/start handler persists session');
  assert(botContent.includes('await saveSession(chatId, session)'), 'message handler persists intermediate steps');

  // 3. Backend Routes & Renewal WhatsApp Link Generator
  const routerPath = path.join(__dirname, '../src/routes/digistore.js');
  const routerContent = fs.readFileSync(routerPath, 'utf8');

  assert(routerContent.includes('generateRenewalWhatsAppReminderLink'), 'Router defines generateRenewalWhatsAppReminderLink helper');
  assert(routerContent.includes("router.put('/vendors/:id'"), 'Router defines PUT /api/digistore/vendors/:id');
  assert(routerContent.includes("router.delete('/vendors/:id'"), 'Router defines DELETE /api/digistore/vendors/:id');
  assert(routerContent.includes('whatsappReminderLink = generateRenewalWhatsAppReminderLink'), 'GET /renewals attaches whatsappReminderLink');

  // 4. Admin Panel Delivery Queue Live Search & Filter
  const adminModPath = path.join(__dirname, '../public/app/modules/digistore.js');
  const adminMod = fs.readFileSync(adminModPath, 'utf8');

  assert(adminMod.includes('id="inputDeliverySearch"'), 'Delivery queue has live search input #inputDeliverySearch');
  assert(adminMod.includes('id="selectDeliveryVendorFilter"'), 'Delivery queue has supplier filter dropdown #selectDeliveryVendorFilter');
  assert(adminMod.includes("inpSearch.addEventListener('input', filterQueue)"), 'Delivery queue binds real-time input filter listener');
  assert(adminMod.includes("selVendor.addEventListener('change', filterQueue)"), 'Delivery queue binds supplier change listener');

  // 5. Admin Panel Vendor CRUD & Modals
  assert(adminMod.includes('id="btnOpenAddVendorModal"'), 'Suppliers tab has ➕ Add Supplier button');
  assert(adminMod.includes('btn-edit-vendor'), 'Supplier cards include ✏️ Edit button');
  assert(adminMod.includes('btn-delete-vendor'), 'Supplier cards include 🗑️ Remove button');
  assert(adminMod.includes('openNewVendorModal()'), 'Admin module implements openNewVendorModal');
  assert(adminMod.includes('openEditVendorModal(vendor)'), 'Admin module implements openEditVendorModal');
  assert(adminMod.includes('APP_API.put(`/digistore/vendors/${vendor.id}`'), 'Edit supplier modal calls PUT /vendors/:id');
  assert(adminMod.includes('APP_API.delete(`/digistore/vendors/${id}`'), 'Delete supplier action calls DELETE /vendors/:id');

  // 6. Admin Panel Renewals Tab Upgrades
  assert(adminMod.includes('💬 WA Follow-up'), 'Renewals tab renders 💬 WA Follow-up button');
  assert(adminMod.includes('btn-procure-modal'), 'Renewals tab renders ⚡ Procure button');
  assert(adminMod.includes('this.openProcureModal(order)'), 'Procure button opens procurement modal directly from renewals');

  // 7. KPI Active Subscriptions Filter Integrity
  assert(adminMod.includes("o.orderStage !== 'confirmed_closed' && o.orderStage !== 'admin_closed'"), 'updateKPIs strictly excludes confirmed_closed and admin_closed orders from active subscriptions count');

  console.log(`\n========================================`);
  console.log(`Phase 4B Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4BTests();
