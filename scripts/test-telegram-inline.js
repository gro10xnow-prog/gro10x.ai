const { getTeamBot, getClientBot, initBot } = require('../src/services/bot');

async function testTelegramInlineQueries() {
  console.log('🧪 Starting Phase 10 Priority 6 Telegram Inline Query Verification...\n');
  let passed = 0;
  let total = 0;

  // Initialize bots
  initBot();

  const teamBot = getTeamBot();
  const clientBot = getClientBot();

  // 1. Check teamBot initialization & inline_query listener
  total++;
  if (teamBot && teamBot.listeners('inline_query').length > 0) {
    console.log('✅ Test 1 Passed: teamBot initialized with active inline_query event listener');
    passed++;
  } else {
    console.error('❌ Test 1 Failed: teamBot inline_query listener missing');
  }

  // 2. Check clientBot initialization & inline_query listener
  total++;
  if (clientBot && clientBot.listeners('inline_query').length > 0) {
    console.log('✅ Test 2 Passed: clientBot initialized with active inline_query event listener');
    passed++;
  } else {
    console.error('❌ Test 2 Failed: clientBot inline_query listener missing');
  }

  // 3. Test teamBot inline_query execution
  total++;
  try {
    let answeredQueryId = null;
    let answeredResults = null;

    await new Promise(resolve => {
      teamBot.answerInlineQuery = (id, results) => {
        answeredQueryId = id;
        answeredResults = results;
        resolve();
        return Promise.resolve(true);
      };
      teamBot.emit('inline_query', { id: 'QRY-TEAM-001', query: 'Commercial' });
      setTimeout(resolve, 3000);
    });

    if (answeredQueryId === 'QRY-TEAM-001' && Array.isArray(answeredResults)) {
      console.log(`✅ Test 3 Passed: teamBot responded to inline query with ${answeredResults.length} task cards`);
      passed++;
    } else {
      console.error('❌ Test 3 Failed:', { answeredQueryId, answeredResults });
    }
  } catch (e) { console.error('❌ Test 3 Exception:', e.message); }

  // 4. Test clientBot inline_query execution
  total++;
  try {
    let answeredQueryId = null;
    let answeredResults = null;

    await new Promise(resolve => {
      clientBot.answerInlineQuery = (id, results) => {
        answeredQueryId = id;
        answeredResults = results;
        resolve();
        return Promise.resolve(true);
      };
      clientBot.emit('inline_query', { id: 'QRY-CLIENT-001', query: 'Invoice' });
      setTimeout(resolve, 3000);
    });

    if (answeredQueryId === 'QRY-CLIENT-001' && Array.isArray(answeredResults)) {
      console.log(`✅ Test 4 Passed: clientBot responded to inline query with ${answeredResults.length} invoice cards`);
      passed++;
    } else {
      console.error('❌ Test 4 Failed:', { answeredQueryId, answeredResults });
    }
  } catch (e) { console.error('❌ Test 4 Exception:', e.message); }

  console.log(`\n📊 TELEGRAM INLINE VERIFICATION RESULTS: ${passed}/${total} PASSED (${Math.round(passed/total*100)}%)`);
  process.exit(0);
}

testTelegramInlineQueries();
