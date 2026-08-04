/**
 * public/crew/sse.js
 * Real-Time SSE Listener for Crew Workspace
 */
(function initCrewSSE() {
  if (!window.EventSource) return;

  try {
    const evtSource = new EventSource('/api/events');

    evtSource.onmessage = function(e) {
      try {
        const eventData = JSON.parse(e.data);
        handleCrewEvent(eventData);
      } catch(err) {}
    };

    evtSource.addEventListener('leave_update', function(e) {
      triggerViewRefresh(['#leaves', '#home']);
    });

    evtSource.addEventListener('task_update', function(e) {
      triggerViewRefresh(['#tasks', '#home']);
    });

    evtSource.onerror = function() {
      // Automatic reconnection
    };
  } catch (err) {
    console.warn('[Crew SSE] Error connecting:', err);
  }

  function handleCrewEvent(data) {
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
