/**
 * public/client/sse.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Resilient Real-Time Client SSE Manager
 * - Strict singleton pattern on window.__GRO10X_CLIENT_EVTSOURCE
 * - Exponential backoff auto-reconnect (1s up to 30s)
 * - Dynamic token resolution on every reconnection
 * - Zero Native Dialogs policy (no alert/confirm/prompt)
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function initResilientClientSSE() {
  if (typeof window === 'undefined') return;

  // 1. Prevent duplicate instances across view re-renders
  if (window.__GRO10X_CLIENT_EVTSOURCE) {
    try { window.__GRO10X_CLIENT_EVTSOURCE.close(); } catch (_) {}
    window.__GRO10X_CLIENT_EVTSOURCE = null;
  }

  let reconnectAttempts = 0;
  let reconnectTimer = null;
  const MAX_BACKOFF_MS = 30000;
  let isConnecting = false;

  function getToken() {
    if (window.CLIENT_API && typeof window.CLIENT_API.getToken === 'function') {
      const t = window.CLIENT_API.getToken();
      if (t) return t;
    }
    return localStorage.getItem('sb-access-token') ||
           localStorage.getItem('gro10x_token') ||
           localStorage.getItem('gro10x_client_token') ||
           '';
  }

  function triggerViewRefresh(targetHashes) {
    // Avoid interrupting active user inputs or open modals
    const activeEl = document.activeElement;
    const isTyping = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.tagName === 'SELECT' ||
      activeEl.isContentEditable
    );
    if (isTyping) return;

    const currentHash = window.location.hash || '#home';
    if (targetHashes.includes(currentHash)) {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  }

  function handleClientEvent(data) {
    if (data && data.type && data.type !== 'connected') {
      triggerViewRefresh(['#home']);
    }
  }

  function connect() {
    if (!window.EventSource) return;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (window.__GRO10X_CLIENT_EVTSOURCE) {
      try { window.__GRO10X_CLIENT_EVTSOURCE.close(); } catch (_) {}
      window.__GRO10X_CLIENT_EVTSOURCE = null;
    }

    try {
      const token = getToken();
      const sseUrl = token
        ? `/api/sync?token=${encodeURIComponent(token)}&role=client`
        : '/api/sync?role=client';

      const evtSource = new EventSource(sseUrl);
      window.__GRO10X_CLIENT_EVTSOURCE = evtSource;

      evtSource.onopen = function() {
        reconnectAttempts = 0;
        window.dispatchEvent(new CustomEvent('gro10x:sse_connected', { detail: { timestamp: new Date().toISOString() } }));
      };

      evtSource.onmessage = function(e) {
        try {
          const eventData = JSON.parse(e.data);
          handleClientEvent(eventData);
        } catch (_) {}
      };

      // ─── SUPPORT TICKETS & SLA EVENTS ─────────────────────────────────────
      evtSource.addEventListener('ticket_update', function() {
        if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/tickets');
        triggerViewRefresh(['#tickets', '#home']);
      });

      evtSource.addEventListener('ticket_created', function() {
        if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/tickets');
        triggerViewRefresh(['#tickets', '#home']);
      });

      evtSource.addEventListener('sla_breach_holdback', function() {
        if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/tickets');
        triggerViewRefresh(['#tickets', '#home']);
      });

      evtSource.addEventListener('sla_acknowledged', function() {
        if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/tickets');
        triggerViewRefresh(['#tickets', '#home']);
      });

      // ─── PROPOSALS & CONTRACTS ───────────────────────────────────────────
      evtSource.addEventListener('proposal_update', function() {
        if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/proposals');
        triggerViewRefresh(['#proposals', '#home', '#lockin']);
      });

      evtSource.addEventListener('proposal_viewed', function() {
        if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/proposals');
        triggerViewRefresh(['#proposals', '#home', '#lockin']);
      });

      evtSource.addEventListener('proposal_accepted', function() {
        if (window.CLIENT_API) {
          window.CLIENT_API.invalidateCache('/proposals');
          window.CLIENT_API.invalidateCache('/projects');
        }
        triggerViewRefresh(['#proposals', '#home', '#lockin']);
      });

      // ─── DELIVERABLES & REVIEWS ───────────────────────────────────────────
      evtSource.addEventListener('review_update', function() {
        if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/reviews');
        triggerViewRefresh(['#review', '#home']);
      });

      evtSource.addEventListener('review_comment_update', function() {
        if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/reviews');
        triggerViewRefresh(['#review']);
      });

      evtSource.addEventListener('review_revision_requested', function() {
        if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/reviews');
        triggerViewRefresh(['#review', '#home']);
      });

      // ─── CONTENT & SOCIAL POSTS ──────────────────────────────────────────
      evtSource.addEventListener('post_update', function() {
        if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/posts');
        triggerViewRefresh(['#review', '#campaign', '#home', '#retainer']);
      });

      evtSource.addEventListener('social_post_update', function() {
        if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/posts');
        triggerViewRefresh(['#review', '#campaign', '#home', '#retainer']);
      });

      // ─── BILLING & INVOICES ──────────────────────────────────────────────
      evtSource.addEventListener('invoice_update', function() {
        if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/invoices');
        triggerViewRefresh(['#invoices', '#home']);
      });

      evtSource.addEventListener('payment_update', function() {
        if (window.CLIENT_API) {
          window.CLIENT_API.invalidateCache('/invoices');
          window.CLIENT_API.invalidateCache('/payments');
        }
        triggerViewRefresh(['#invoices', '#home']);
      });

      evtSource.addEventListener('quote_update', function() {
        if (window.CLIENT_API) {
          window.CLIENT_API.invalidateCache('/quotes');
          window.CLIENT_API.invalidateCache('/invoices');
        }
        triggerViewRefresh(['#invoices', '#quotes', '#home']);
      });

      // ─── TASKS & SPRINT RETAINERS ────────────────────────────────────────
      evtSource.addEventListener('task_update', function() {
        if (window.CLIENT_API) {
          window.CLIENT_API.invalidateCache('/tasks');
          window.CLIENT_API.invalidateCache('/projects');
        }
        triggerViewRefresh(['#campaign', '#home', '#retainer']);
      });

      evtSource.addEventListener('retainer_update', function() {
        if (window.CLIENT_API) {
          window.CLIENT_API.invalidateCache('/projects');
          window.CLIENT_API.invalidateCache('/clients');
        }
        triggerViewRefresh(['#retainer', '#home']);
      });

      evtSource.addEventListener('warranty_update', function() {
        if (window.CLIENT_API) {
          window.CLIENT_API.invalidateCache('/projects');
          window.CLIENT_API.invalidateCache('/reviews');
        }
        triggerViewRefresh(['#home', '#review', '#lockin']);
      });

      evtSource.addEventListener('handover_update', function() {
        if (window.CLIENT_API) {
          window.CLIENT_API.invalidateCache('/projects');
          window.CLIENT_API.invalidateCache('/clients');
        }
        triggerViewRefresh(['#lockin', '#home']);
      });

      evtSource.addEventListener('client_update', function() {
        if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/clients');
        triggerViewRefresh(['#timeline', '#home']);
      });

      evtSource.addEventListener('clients_update', function() {
        if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/clients');
        triggerViewRefresh(['#timeline', '#home']);
      });

      // ─── ERROR & BACKOFF RECONNECTION ────────────────────────────────────
      evtSource.onerror = function(err) {
        try { evtSource.close(); } catch (_) {}
        window.__GRO10X_CLIENT_EVTSOURCE = null;
        window.dispatchEvent(new CustomEvent('gro10x:sse_disconnected', { detail: { error: err } }));

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_BACKOFF_MS);
        reconnectAttempts++;
        reconnectTimer = setTimeout(connect, delay);
      };
    } catch (err) {
      console.warn('[Client SSE] Connection initialization error:', err.message);
    }
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (window.__GRO10X_CLIENT_EVTSOURCE) {
      try { window.__GRO10X_CLIENT_EVTSOURCE.close(); } catch (_) {}
      window.__GRO10X_CLIENT_EVTSOURCE = null;
    }
  }

  function getStatus() {
    return {
      connected: !!(window.__GRO10X_CLIENT_EVTSOURCE && window.__GRO10X_CLIENT_EVTSOURCE.readyState === 1),
      readyState: window.__GRO10X_CLIENT_EVTSOURCE ? window.__GRO10X_CLIENT_EVTSOURCE.readyState : 2,
      reconnectAttempts: reconnectAttempts
    };
  }

  // Register public API handle
  window.GRO10X_CLIENT_SSE = {
    connect: connect,
    disconnect: disconnect,
    getStatus: getStatus
  };

  // Launch initial connection
  connect();
})();
