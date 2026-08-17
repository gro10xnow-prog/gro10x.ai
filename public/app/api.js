/**
 * public/app/api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PurpleOS Admin Portal API Client & Data Store v3.0
 * Handles session tokens, API requests, error catching, and local caching.
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.APP_API = {
  _cache: {},
  _cacheTTL: 30000, // 30 seconds

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
    const method = options.method || 'GET';
    const config = {
      method: method,
      headers: { ...this.getHeaders(), ...(options.headers || {}) }
    };

    if (options.body) {
      config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    // Cache interception for GET requests
    if (method === 'GET') {
      const cached = this._cache[url];
      if (cached && (Date.now() - cached.timestamp < this._cacheTTL)) {
        return cached.data; // Return a shallow copy if possible, but for JSON objects this is fine
      }
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        console.warn('[PurpleOS API] 401 Unauthorized — Redirecting to login...');
        localStorage.removeItem('sb-access-token');
        window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
        return null;
      }

      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { error: text || `HTTP ${response.status}` };
      }

      if (!response.ok || (data && data.error)) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }
      
      // Store in cache
      if (method === 'GET') {
        this._cache[url] = { data, timestamp: Date.now() };
      }
      
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
