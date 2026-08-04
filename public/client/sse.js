/**
 * public/client/sse.js
 * Real-Time SSE Listener for Client Portal
 */
(function initClientSSE() {
  if (!window.EventSource) return;

  try {
    const evtSource = new EventSource('/api/events');

    evtSource.onmessage = function(e) {
      try {
        const eventData = JSON.parse(e.data);
        handleClientEvent(eventData);
      } catch(err) {}
    };

    evtSource.addEventListener('ticket_update', function(e) {
      triggerViewRefresh(['#tickets', '#home']);
    });

    evtSource.addEventListener('post_update', function(e) {
      triggerViewRefresh(['#review', '#campaign', '#home']);
    });

    evtSource.addEventListener('social_post_update', function(e) {
      triggerViewRefresh(['#review', '#campaign', '#home']);
    });

    evtSource.addEventListener('invoice_update', function(e) {
      triggerViewRefresh(['#invoices', '#home']);
    });

    evtSource.onerror = function() {
      // Reconnect automatically managed by browser EventSource
    };
  } catch (err) {
    console.warn('[Client SSE] Error connecting:', err);
  }

  function handleClientEvent(data) {
    if (data && data.type) {
      triggerViewRefresh(['#home']);
    }
  }

  function triggerViewRefresh(targetHashes) {
    const currentHash = window.location.hash || '#home';
    if (targetHashes.includes(currentHash)) {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  }
})();
