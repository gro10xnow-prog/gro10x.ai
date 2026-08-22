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
  const role = req.query?.role || req.user?.role || req.user?.access_level || 'all';
  const empCode = req.query?.emp_code || req.query?.employeeId || req.user?.emp_code || '';
  const newClient = { id: clientId, res, role, empCode };
  clients.push(newClient);

  // Initial connection handshake
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId, role })}\n\n`);

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

function broadcastToRole(eventType, data, roles = []) {
  if (!roles || roles.length === 0) {
    return broadcast(eventType, data);
  }
  const roleList = roles.map(r => String(r).toLowerCase());
  try {
    const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
    clients = clients.filter(c => {
      try {
        if (c.res && !c.res.writableEnded && !c.res.finished) {
          const clientRole = String(c.role || '').toLowerCase();
          const matches = clientRole === 'all' || roleList.includes(clientRole) || roleList.some(r => clientRole.includes(r));
          if (matches) {
            c.res.write(`data: ${payload}\n\n`);
          }
          return true;
        }
      } catch (e) {}
      return false;
    });
  } catch (e) {}
}

function broadcastToEmployee(eventType, data, empCodes = []) {
  if (!empCodes || empCodes.length === 0) return;
  const codes = empCodes.map(c => String(c).toLowerCase());
  try {
    const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
    clients = clients.filter(c => {
      try {
        if (c.res && !c.res.writableEnded && !c.res.finished) {
          const clientCode = String(c.empCode || '').toLowerCase();
          if (clientCode && codes.includes(clientCode)) {
            c.res.write(`data: ${payload}\n\n`);
          }
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
  broadcastToRole,
  broadcastToEmployee,
  getActiveClientsCount
};
