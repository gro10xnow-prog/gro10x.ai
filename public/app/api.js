/**
 * public/app/api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PurpleOS Admin Portal API Client & Data Store v3.0
 * Handles session tokens, API requests, error catching, and local caching.
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.APP_API = {
  getToken() {
    return localStorage.getItem('sb-access-token') ||
           localStorage.getItem('purpleos_pin_token') ||
           localStorage.getItem('purple_token') || '';
  },

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: { ...this.getHeaders(), ...(options.headers || {}) }
    };

    if (options.body) {
      config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        console.warn('[PurpleOS API] 401 Unauthorized — Redirecting to login...');
        localStorage.removeItem('sb-access-token');
        window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`[PurpleOS API] Error fetching ${url}:`, err);
      throw err;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};
