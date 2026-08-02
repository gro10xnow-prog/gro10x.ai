const fs = require('fs');
const path = require('path');

function runBotTextTests() {
  console.log('🧪 Starting Phase 11 Priority 3 Telegram Bot Text Polish Verification...\n');
  let passed = 0;
  let total = 0;

  const botJsPath = path.join(__dirname, '../src/services/bot.js');
  const fileContent = fs.readFileSync(botJsPath, 'utf8');

  // Test 1: teamBot has distinct /help handler
  total++;
  if (fileContent.includes("teamBot.onText(/\\/help/") && fileContent.includes("PURPLEOS TEAM BOT — COMMAND GUIDE")) {
    console.log('✅ Test 1 Passed: teamBot has a distinct, rich /help command handler');
    passed++;
  } else {
    console.error('❌ Test 1 Failed: teamBot missing distinct /help command handler');
  }

  // Test 2: clientBot has distinct /help handler
  total++;
  if (fileContent.includes("clientBot.onText(/\\/help/") && fileContent.includes("PURPLEOS CLIENT BOT — QUICK GUIDE")) {
    console.log('✅ Test 2 Passed: clientBot has a distinct, rich /help command handler');
    passed++;
  } else {
    console.error('❌ Test 2 Failed: clientBot missing distinct /help command handler');
  }

  // Test 3: Currency in inline query is BDT
  total++;
  if (fileContent.includes("Amount: BDT ${(Number(inv.amount)")) {
    console.log('✅ Test 3 Passed: clientBot inline invoice card uses BDT currency format');
    passed++;
  } else {
    console.error('❌ Test 3 Failed: clientBot inline invoice card currency not BDT');
  }

  // Test 4: setMyCommands uses emoji descriptions
  total++;
  if (fileContent.includes("🚀 Verify identity") && fileContent.includes("🎨 View agency services")) {
    console.log('✅ Test 4 Passed: Both bots have emoji-enhanced setMyCommands descriptions');
    passed++;
  } else {
    console.error('❌ Test 4 Failed: setMyCommands descriptions missing emoji enhancements');
  }

  console.log(`\n📊 BOT TEXT POLISH VERIFICATION RESULTS: ${passed}/${total} PASSED (${Math.round(passed/total*100)}%)`);
}

runBotTextTests();
