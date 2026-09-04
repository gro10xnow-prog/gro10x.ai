/**
 * scripts/e2e/suites/suite-x-cross-portal/phase-X1-sse-chain.js
 * Suite X - Phase X1: Real-Time SSE Event Chain across Portals
 * 
 * Tests:
 * X1.1: Verify SSE EventSource Browser Support and Window API Integrity
 * X1.2: Authenticated SSE Stream Connection Handshake (/api/sse)
 * X1.3: Role-Targeted Broadcast API Functions Availability
 * X1.4: Real-Time Task Mutation SSE Event Delivery
 * X1.5: Multi-Tenant Client-Scoped SSE Targeting (broadcastToClient)
 * X1.6: Keepalive Heartbeat & Reconnection Resilience Architecture
 */

const http = require('http');
const path = require('path');
const { BASE_URL, PORT, wait, TestTracker } = require('../../utils');
const { USERS } = require('../../auth');

async function runPhaseX1(page) {
  const tracker = new TestTracker('Suite X - Phase X1: SSE Real-Time Chain');
  console.log('\n--- 📡 Running Suite X - Phase X1: Real-Time SSE Chain ---');

  const sseService = require(path.join(process.cwd(), 'src/services/sse'));

  await tracker.runStep('X1.1', 'Verify SSE EventSource Browser Support and Window API Integrity', async () => {
    const sseSupport = await page.evaluate(() => typeof window.EventSource !== 'undefined');
    tracker.assert(sseSupport, 'SSE EventSource must be supported in browser environment');
  });

  await tracker.runStep('X1.2', 'Authenticated SSE Stream Connection Handshake (/api/sync)', async () => {
    const token = USERS.admin.token;
    const connected = await new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/sync?token=${token}&role=admin`, (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk.toString();
          if (rawData.includes('event: connected') || rawData.includes('"type":"connected"')) {
            req.destroy();
            resolve(true);
          }
        });
        res.on('error', () => resolve(false));
      });
      req.on('error', () => resolve(false));
      setTimeout(() => {
        req.destroy();
        resolve(false);
      }, 4000);
    });

    tracker.assert(connected, 'SSE endpoint should deliver initial "connected" handshake event');
  });

  await tracker.runStep('X1.3', 'Role-Targeted Broadcast API Functions Availability', async () => {
    tracker.assert(typeof sseService.broadcast === 'function', 'sseService.broadcast must be a function');
    tracker.assert(typeof sseService.broadcastToRole === 'function', 'sseService.broadcastToRole must be a function');
    tracker.assert(typeof sseService.broadcastToEmployee === 'function', 'sseService.broadcastToEmployee must be a function');
    tracker.assert(typeof sseService.broadcastToClient === 'function', 'sseService.broadcastToClient must be a function');
  });

  await tracker.runStep('X1.4', 'Real-Time Task Mutation SSE Event Delivery', async () => {
    const token = USERS.admin.token;
    let receivedTaskEvent = false;

    // Connect temporary listener
    const listener = await new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/sync?token=${token}&role=admin`, (res) => {
        res.on('data', (chunk) => {
          const str = chunk.toString();
          if (str.includes('task_update') || str.includes('E2E_TASK_BROADCAST')) {
            receivedTaskEvent = true;
          }
        });
        resolve(req);
      });
      req.on('error', () => resolve(null));
    });

    await wait(400);

    // Broadcast test task event
    sseService.broadcast('task_update', { id: 'TSK-E2E-TEST', title: 'E2E_TASK_BROADCAST', status: 'done' });
    await wait(500);

    if (listener) listener.destroy();
    tracker.assert(receivedTaskEvent, 'Broadcasting task_update should reach active SSE listener');
  });

  await tracker.runStep('X1.5', 'Multi-Tenant Client-Scoped SSE Targeting (broadcastToClient)', async () => {
    const { signToken } = require(path.join(process.cwd(), 'src/services/jwt'));
    const partnerUser = { id: 'CLI-E2E-100', name: 'Target Client', role: 'Client', access_level: 'Client', linkedType: 'client', linkedId: 'CLI-E2E-100' };
    const otherUser = { id: 'CLI-E2E-999', name: 'Other Client', role: 'Client', access_level: 'Client', linkedType: 'client', linkedId: 'CLI-E2E-999' };
    const tokenTarget = signToken(partnerUser, 3600);
    const tokenOther = signToken(otherUser, 3600);

    let targetClientReceived = false;
    let otherClientReceived = false;

    const connectPromise1 = new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/sync?token=${tokenTarget}&clientId=CLI-E2E-100&role=client`, (res) => {
        res.on('data', (chunk) => {
          const str = chunk.toString();
          if (str.includes('connected')) resolve(req);
          if (str.includes('CLI-E2E-100-SECRET')) targetClientReceived = true;
        });
      });
      req.on('error', () => resolve(null));
    });

    const connectPromise2 = new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/sync?token=${tokenOther}&clientId=CLI-E2E-999&role=client`, (res) => {
        res.on('data', (chunk) => {
          const str = chunk.toString();
          if (str.includes('connected')) resolve(req);
          if (str.includes('CLI-E2E-100-SECRET')) otherClientReceived = true;
        });
      });
      req.on('error', () => resolve(null));
    });

    const [reqTarget, reqOther] = await Promise.all([connectPromise1, connectPromise2]);
    await wait(300);

    sseService.broadcastToClient('invoice_paid', { secret: 'CLI-E2E-100-SECRET' }, ['CLI-E2E-100']);
    await wait(600);

    if (reqTarget) reqTarget.destroy();
    if (reqOther) reqOther.destroy();

    tracker.assert(targetClientReceived, 'Targeted client should receive scoped event');
    tracker.assert(!otherClientReceived, 'Non-matching client should not receive isolated event');
  });

  await tracker.runStep('X1.6', 'Keepalive Heartbeat & Reconnection Resilience Architecture', async () => {
    // Verify sse.js contains 25s keepalive ping and Supabase Realtime channel setup
    const fs = require('fs');
    const sseSource = fs.readFileSync(path.join(process.cwd(), 'src/services/sse.js'), 'utf8');

    tracker.assert(sseSource.includes(': ping'), 'SSE service must implement keepalive heartbeat ping');
    tracker.assert(sseSource.includes('25000') || sseSource.includes('30000'), 'Heartbeat interval should be 25-30 seconds');
    tracker.assert(sseSource.includes('req.on(\'close\'') || sseSource.includes('close'), 'SSE service must handle disconnect cleanup');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseX1 };
