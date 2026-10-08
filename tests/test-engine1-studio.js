/**
 * tests/test-engine1-studio.js
 * Verification test for Phase 3 Engine 1 Studio, Knowledge Base & Embeds
 */

const assert = require('assert');
const kbService = require('../src/services/knowledge-base');

async function runStudioTests() {
  console.log('🧪 Starting Engine 1 Phase 3 Studio & Knowledge Base Verification...');

  // Test 1: In-House Assistant Verticals
  const assistants = kbService.getAssistants();
  console.log(`🤖 Found ${assistants.length} assistant verticals configured`);
  assert(assistants.length === 5, 'Must have exactly 5 in-house verticals');
  
  const verticalIds = assistants.map(a => a.id);
  assert(verticalIds.includes('group-academy'), 'Must include GroUp Academy');
  assert(verticalIds.includes('grocash-finledger'), 'Must include GroCash FinLedger');
  assert(verticalIds.includes('soloops-hub'), 'Must include SoloOps Hub');
  assert(verticalIds.includes('edagent-labs'), 'Must include EdAgent Labs');
  assert(verticalIds.includes('tasksync-founder'), 'Must include TaskSync');
  console.log('✅ Test 1 Passed: The 5 Handnotes Assistant Verticals are properly registered');

  // Test 2: Ingest New Knowledge Document
  const doc = kbService.addDocument({
    title: 'PurpleBot Phase 3 Sprint Scope.pdf',
    agentId: 'soloops-hub',
    projectId: 'proj-purplebot-01',
    content: 'Full scope specifications for AI Agent automated customer onboarding flow.',
    sourceType: 'pdf'
  });
  assert(doc && doc.id, 'Document must be created with ID');
  assert(doc.chunkCount >= 1, 'Chunk count must be >= 1');
  console.log(`📄 Ingested Document: ${doc.title} (${doc.tokenCount} tokens, ${doc.chunkCount} chunks)`);
  console.log('✅ Test 2 Passed: Knowledge document ingested and chunked');

  // Test 3: Query Knowledge by Project Tag
  const purplebotDocs = kbService.listKnowledge({ projectId: 'proj-purplebot-01' });
  assert(purplebotDocs.length >= 2, 'Should find at least 2 docs for proj-purplebot-01');
  console.log(`🔍 Found ${purplebotDocs.length} knowledge sources tagged for proj-purplebot-01`);
  console.log('✅ Test 3 Passed: Knowledge filtered by client project ID');

  // Test 4: Delete Ingested Document
  const deleted = kbService.removeDocument(doc.id);
  assert(deleted === true, 'Document removal must return true');
  console.log(`🗑️ Removed document ${doc.id}`);
  console.log('✅ Test 4 Passed: Knowledge document successfully deleted');

  console.log('\n🎉 ALL PHASE 3 STUDIO & RAG TESTS PASSED SUCCESSFULLY!');
}

runStudioTests().catch(err => {
  console.error('❌ Phase 3 verification failed:', err);
  process.exit(1);
});
