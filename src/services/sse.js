/**
 * src/services/sse.js
 * Server-Sent Events (SSE) manager with keepalive heartbeat & Supabase Realtime cross-instance pub/sub sync.
 */

const { supabase } = require('./supabase');

let clients = [];
let realtimeChannel = null;
let isRealtimeSubscribed = false;
const instanceId = `node_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;

function sseHandler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const role = req.query?.role || req.user?.role || req.user?.access_level || req.user?.accessLevel || 'all';
  const empCode = req.query?.emp_code || req.query?.employeeId || req.user?.emp_code || '';
  const clientAccountId = req.query?.clientId || req.query?.client_id || req.query?.linkedId || (req.user?.linkedType === 'client' ? req.user?.linkedId : '') || '';
  const newClient = { id: clientId, res, role, empCode, clientAccountId };
  clients.push(newClient);

  // Initialize Realtime pub/sub if not already active
  initRealtimePubSub();

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

function initRealtimePubSub() {
  if (!supabase || isRealtimeSubscribed || realtimeChannel) return;
  try {
    realtimeChannel = supabase.channel('purpleos_system_events', {
      config: { broadcast: { self: false } }
    });

    realtimeChannel
      .on('broadcast', { event: 'sse_event' }, (message) => {
        if (!message || !message.payload) return;
        const { eventType, data, filterType, filterArgs, senderId } = message.payload;
        if (senderId === instanceId) return; // Prevent echoing own messages
        deliverLocally(eventType, data, filterType, filterArgs);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isRealtimeSubscribed = true;
          console.log('📡 SSE Multi-Instance Realtime Sync connected via Supabase');
        }
      });
  } catch (err) {
    console.warn('⚠️ Supabase Realtime Pub/Sub note:', err.message);
  }
}

// Note: initRealtimePubSub() is called on-demand when an active SSE connection is opened in sseHandler()

function publishToRealtime(eventType, data, filterType = 'all', filterArgs = null) {
  if (!realtimeChannel || !isRealtimeSubscribed) return;
  try {
    realtimeChannel.send({
      type: 'broadcast',
      event: 'sse_event',
      payload: { eventType, data, filterType, filterArgs, senderId: instanceId }
    }).catch?.(() => {});
  } catch (_) {}
}

function deliverLocally(eventType, data, filterType = 'all', filterArgs = null) {
  try {
    const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
    
    clients = clients.filter(c => {
      try {
        if (!c.res || c.res.writableEnded || c.res.finished) {
          return false;
        }

        if (filterType === 'all') {
          c.res.write(`data: ${payload}\n\n`);
          return true;
        }

        if (filterType === 'role') {
          const roleList = (Array.isArray(filterArgs) ? filterArgs : [filterArgs]).map(r => String(r).toLowerCase());
          const clientRole = String(c.role || '').toLowerCase();
          const matches = clientRole === 'all' || roleList.includes(clientRole) || roleList.some(r => clientRole.includes(r));
          if (matches) {
            c.res.write(`data: ${payload}\n\n`);
          }
          return true;
        }

        if (filterType === 'employee') {
          const codes = (Array.isArray(filterArgs) ? filterArgs : [filterArgs]).map(code => String(code).toLowerCase());
          const clientCode = String(c.empCode || '').toLowerCase();
          if (clientCode && codes.includes(clientCode)) {
            c.res.write(`data: ${payload}\n\n`);
          }
          return true;
        }

        if (filterType === 'client') {
          const idList = (Array.isArray(filterArgs) ? filterArgs : [filterArgs]).map(id => String(id).toLowerCase());
          const clientRole = String(c.role || '').toLowerCase();
          const targetId = String(c.clientAccountId || '').toLowerCase();
          const isStaff = ['owner', 'admin', 'manager', 'specialist', 'team'].some(r => clientRole.includes(r));
          const matches = isStaff || !targetId || idList.includes(targetId) || idList.some(id => targetId.includes(id));
          if (matches) {
            c.res.write(`data: ${payload}\n\n`);
          }
          return true;
        }

        // Default: broadcast to all
        c.res.write(`data: ${payload}\n\n`);
        return true;
      } catch (e) {
        return false;
      }
    });
  } catch (e) {}
}

function broadcast(eventType, data) {
  deliverLocally(eventType, data, 'all');
  publishToRealtime(eventType, data, 'all');
}

function broadcastToRole(eventType, data, roles = []) {
  if (!roles || roles.length === 0) {
    return broadcast(eventType, data);
  }
  deliverLocally(eventType, data, 'role', roles);
  publishToRealtime(eventType, data, 'role', roles);
}

function broadcastToEmployee(eventType, data, empCodes = []) {
  if (!empCodes || empCodes.length === 0) return;
  deliverLocally(eventType, data, 'employee', empCodes);
  publishToRealtime(eventType, data, 'employee', empCodes);
}

function broadcastToClient(eventType, data, clientIds = []) {
  if (!clientIds || (Array.isArray(clientIds) && clientIds.length === 0)) {
    return broadcast(eventType, data);
  }
  deliverLocally(eventType, data, 'client', clientIds);
  publishToRealtime(eventType, data, 'client', clientIds);
}

function getActiveClientsCount() {
  return clients.length;
}

module.exports = {
  sseHandler,
  broadcast,
  broadcastToRole,
  broadcastToEmployee,
  broadcastToClient,
  getActiveClientsCount,
  initRealtimePubSub
};
