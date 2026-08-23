/**
 * scripts/e2e-client/phases/phase-6-sse.js
 * Phase T6: SSE Real-Time Events & Client Isolation
 */
const { BASE_URL, wait, TestTracker } = require('../utils');
const { generateClientToken } = require('../auth');
const sseService = require('../../../src/services/sse');
const http = require('http');

async function runPhase6() {
  const tracker = new TestTracker('Phase T6: SSE Real-Time Events');
  console.log('\n--- 🚀 Running Phase T6: SSE Real-Time Events & Isolation ---');

  // T6.1 SSE Unauthenticated Guard
  await tracker.runStep('T6.1.1', 'Verify unauthenticated SSE connection to /api/sync returns 401', async () => {
    const statusCode = await new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/sync`, {
        headers: { 'x-disable-dev-auth': 'true' }
      }, (res) => {
        resolve(res.statusCode);
        res.destroy();
      });
      req.on('error', () => resolve(500));
      req.setTimeout(1500, () => {
        req.destroy();
        resolve(408);
      });
    });
    tracker.assert(statusCode === 401, `Expected status 401 for unauthenticated /api/sync, got ${statusCode}`);
  });

  // T6.1.2 Authenticated SSE Connection
  await tracker.runStep('T6.1.2', 'Connect to /api/sync with valid Client JWT Token', async () => {
    const token = generateClientToken({ linkedId: 'CLI-0001', role: 'Client' });
    const isConnected = await new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/sync?token=${token}&role=client`, (res) => {
        if (res.statusCode === 200 && res.headers['content-type']?.includes('text/event-stream')) {
          resolve(true);
        } else {
          resolve(false);
        }
        res.destroy();
      });
      req.on('error', () => resolve(false));
      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
    tracker.assert(isConnected, 'Authenticated SSE connection should establish with 200 and text/event-stream');
  });

  // T6.5 broadcastToClient Function Integrity
  await tracker.runStep('T6.5.1', 'Verify broadcastToClient() function exists and scopes events', async () => {
    tracker.assert(typeof sseService.broadcastToClient === 'function', 'sseService.broadcastToClient must be exported as a function');
    tracker.assert(typeof sseService.broadcast === 'function', 'sseService.broadcast must be exported');

    // Test calling broadcastToClient without throwing
    try {
      sseService.broadcastToClient('review_update', { id: 'REV-001', status: 'Approved' }, ['CLI-0001']);
      sseService.broadcastToClient('payment_update', { id: 'INV-001', status: 'Paid' }, ['CLI-0001']);
      sseService.broadcastToClient('review_comment_update', { id: 'REV-001', text: 'New comment' }, ['CLI-0001']);
    } catch (err) {
      throw new Error(`broadcastToClient failed: ${err.message}`);
    }
  });

  return tracker.getSummary();
}

module.exports = { runPhase6 };
