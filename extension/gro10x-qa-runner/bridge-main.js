/**
 * GRO10X QA Automation Runner - Main World Telemetry & Interceptor Bridge
 * Runs in the webpage execution context ("world": "MAIN")
 * Provides Zero Native Dialogs enforcement and reliable evaluation for page variables.
 */
(() => {
  'use strict';
  if (window.__GRO10X_QA_MAIN_BRIDGE__) return;
  window.__GRO10X_QA_MAIN_BRIDGE__ = true;

  // Ensure mock authentication session is active across all portals
  try {
    const mockToken = 'mock_qa_token_enterprise';
    if (!localStorage.getItem('gro10x_token') && !localStorage.getItem('sb-access-token')) {
      localStorage.setItem('gro10x_token', mockToken);
      localStorage.setItem('sb-access-token', mockToken);
      const mockUser = { id: 'user_qa_enterprise', name: 'Enterprise QA Specialist', email: 'qa@gro10x.ai', role: 'admin' };
      localStorage.setItem('gro10x_user', JSON.stringify(mockUser));
      localStorage.setItem('purple_user', JSON.stringify(mockUser));
    }
    // Synchronize cookies for same-origin fetch and SSR endpoints
    document.cookie = `gro10x_token=${mockToken}; path=/`;
    document.cookie = `dce_token=${mockToken}; path=/`;
    document.cookie = `sb-access-token=${mockToken}; path=/`;
  } catch (_) {}

  // Intercept native dialogs in the Main World
  const _alert = window.alert;
  window.alert = function(msg) {
    window.dispatchEvent(new CustomEvent('__gro10x_qa_event__', { detail: { type: 'dialog', dialogType: 'alert', message: String(msg) } }));
    console.warn('[GRO10X QA Main] Captured native alert():', msg);
  };

  const _confirm = window.confirm;
  window.confirm = function(msg) {
    window.dispatchEvent(new CustomEvent('__gro10x_qa_event__', { detail: { type: 'dialog', dialogType: 'confirm', message: String(msg) } }));
    console.warn('[GRO10X QA Main] Captured native confirm():', msg);
    return true;
  };

  const _prompt = window.prompt;
  window.prompt = function(msg, def) {
    window.dispatchEvent(new CustomEvent('__gro10x_qa_event__', { detail: { type: 'dialog', dialogType: 'prompt', message: String(msg) } }));
    console.warn('[GRO10X QA Main] Captured native prompt():', msg);
    return def || '';
  };

  // Intercept fetch for network health & auto-attach auth in Main World
  const _fetch = window.fetch;
  window.fetch = async function(...args) {
    try {
      let [resource, init] = args;
      const url = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
      const isSameOriginApi = url.startsWith('/api') || (typeof window !== 'undefined' && url.includes(window.location.host + '/api'));
      if (isSameOriginApi) {
        init = init || {};
        const token = localStorage.getItem('gro10x_token') || localStorage.getItem('sb-access-token') || 'mock_qa_token_enterprise';
        if (!init.headers) {
          init.headers = { 'Authorization': `Bearer ${token}` };
        } else if (init.headers instanceof Headers) {
          if (!init.headers.has('Authorization')) {
            init.headers.set('Authorization', `Bearer ${token}`);
          }
        } else if (typeof init.headers === 'object' && !init.headers['Authorization'] && !init.headers['authorization']) {
          init.headers = { ...init.headers, 'Authorization': `Bearer ${token}` };
        }
        args[1] = init;
      }

      const response = await _fetch.apply(this, args);
      if (!response.ok && response.status >= 400) {
        window.dispatchEvent(new CustomEvent('__gro10x_qa_event__', {
          detail: {
            type: 'network_error',
            url,
            status: response.status,
            statusText: response.statusText,
            time: Date.now()
          }
        }));
      }
      return response;
    } catch (err) {
      window.dispatchEvent(new CustomEvent('__gro10x_qa_event__', {
        detail: {
          type: 'network_error',
          url: typeof args[0] === 'string' ? args[0] : (args[0]?.url || ''),
          status: 0,
          statusText: err.message,
          time: Date.now()
        }
      }));
      throw err;
    }
  };

  // Capture unhandled errors and rejections in Main World
  window.addEventListener('error', (event) => {
    window.dispatchEvent(new CustomEvent('__gro10x_qa_event__', {
      detail: {
        type: 'console_error',
        message: event.message || 'Script error',
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        time: Date.now()
      }
    }));
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = typeof reason === 'object' && reason !== null ? (reason.message || JSON.stringify(reason)) : String(reason);
    window.dispatchEvent(new CustomEvent('__gro10x_qa_event__', {
      detail: {
        type: 'unhandled_rejection',
        message: msg,
        time: Date.now()
      }
    }));
  });

  // Handler for main-world evaluation requests dispatched by content script
  document.addEventListener('__gro10x_qa_eval_request__', (e) => {
    const { id, code } = e.detail || {};
    try {
      let fn;
      const trimmed = (code || '').trim();
      if (/^(var|let|const|if|for|while|switch|try|throw)\b/.test(trimmed) || trimmed.includes('\n') || trimmed.includes(';')) {
        fn = new Function(trimmed.includes('return ') ? trimmed : `${trimmed}; return true;`);
      } else {
        try {
          fn = new Function('return (' + trimmed + ');');
        } catch (_) {
          fn = new Function(trimmed);
        }
      }
      const value = fn();
      document.dispatchEvent(new CustomEvent('__gro10x_qa_eval_response__', { detail: { id, ok: true, value } }));
    } catch (err) {
      document.dispatchEvent(new CustomEvent('__gro10x_qa_eval_response__', { detail: { id, ok: false, error: err.message } }));
    }
  });

  console.log('⚡ [GRO10X QA Runner] Main World Telemetry & Evaluation Bridge loaded.');
})();
