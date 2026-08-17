let clients = [];

function sseHandler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  // Initial connection heartbeat
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  req.on('close', () => {
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
