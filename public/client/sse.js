/**
 * public/client/sse.js
 * Real-Time Authenticated SSE Listener for Client Portal
 */
(function initClientSSE() {
  if (!window.EventSource) return;

  try {
    const token = window.CLIENT_API ? window.CLIENT_API.getToken() : (localStorage.getItem('sb-access-token') || '');
    const sseUrl = token ? `/api/sync?token=${encodeURIComponent(token)}&role=client` : '/api/sync?role=client';
    const evtSource = new EventSource(sseUrl);

    evtSource.onmessage = function(e) {
      try {
        const eventData = JSON.parse(e.data);
        handleClientEvent(eventData);
      } catch(err) {}
    };

    evtSource.addEventListener('ticket_update', function(e) {
      if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/tickets');
      triggerViewRefresh(['#tickets', '#home']);
    });

    evtSource.addEventListener('review_update', function(e) {
      if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/reviews');
      triggerViewRefresh(['#review', '#home']);
    });

    evtSource.addEventListener('review_comment_update', function(e) {
      if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/reviews');
      triggerViewRefresh(['#review']);
    });

    evtSource.addEventListener('post_update', function(e) {
      if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/posts');
      triggerViewRefresh(['#review', '#campaign', '#home', '#retainer']);
    });

    evtSource.addEventListener('social_post_update', function(e) {
      if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/posts');
      triggerViewRefresh(['#review', '#campaign', '#home', '#retainer']);
    });

    evtSource.addEventListener('invoice_update', function(e) {
      if (window.CLIENT_API) window.CLIENT_API.invalidateCache('/invoices');
      triggerViewRefresh(['#invoices', '#home']);
    });

    evtSource.addEventListener('payment_update', function(e) {
      if (window.CLIENT_API) {
        window.CLIENT_API.invalidateCache('/invoices');
        window.CLIENT_API.invalidateCache('/payments');
      }
      triggerViewRefresh(['#invoices', '#home']);
    });

    evtSource.onerror = function() {
      // Automatic reconnect handled by browser EventSource
    };
  } catch (err) {
    console.warn('[Client SSE] Error connecting:', err);
  }

  function handleClientEvent(data) {
    if (data && data.type && data.type !== 'connected') {
      triggerViewRefresh(['#home']);
    }
  }

  function triggerViewRefresh(targetHashes) {
    // Avoid re-rendering if user is currently interacting with form inputs/modals
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
    if (isTyping) return;

    const currentHash = window.location.hash || '#home';
    if (targetHashes.includes(currentHash)) {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  }
})();
