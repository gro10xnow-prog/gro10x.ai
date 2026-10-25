/**
 * tools/gro10x-lead-harvester/background.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X LeadHarvester Manifest v3 Background Service Worker
 * Handles cross-origin requests, tab messaging, and state bridging.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('⚡ GRO10X WhatsApp LeadHarvester & AI Profiler Extension Installed.');
});

// Proxy API requests from popup or content scripts to bypass potential CORS in browser tabs
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PROXY_FETCH') {
    const { url, options } = request;
    fetch(url, options)
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        let data;
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          data = await res.text();
        }
        sendResponse({ ok: res.ok, status: res.status, data });
      })
      .catch((err) => {
        sendResponse({ ok: false, error: err.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.type === 'UPDATE_BADGE') {
    const text = String(request.count || '');
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#00df89' });
    sendResponse({ ok: true });
    return true;
  }
});
