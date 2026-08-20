/**
 * src/services/sse.js
 * Server-Sent Events (SSE) manager with keepalive heartbeat.
 */

let clients = [];

function sseHandler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  // Initial connection handshake
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  // 25-second keepalive heartbeat ping for serverless / edge environments
  const heartbeat = setInterval(() => {
    try {
      if (res.writableEnded || res.finished) {
        clearInterval(heartbeat);
      } else {
        res.write(': ping\n\n');
      }
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 25000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    clients = clients.filter(c => c.id !== clientId);
  });
}

function broadcast(eventType, data) {
  try {
    const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
    clients = clients.filter(c => {
      try {
        if (c.res && !c.res.writableEnded && !c.res.finished) {
          c.res.write(`data: ${payload}\n\n`);
          return true;
        }
      } catch (e) {}
      return false;
    });
  } catch (e) {}
}

function getActiveClientsCount() {
  return clients.length;
}

module.exports = {
  sseHandler,
  broadcast,
  getActiveClientsCount
};
