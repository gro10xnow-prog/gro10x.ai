/**
 * public/client/api.js
 * Client Portal API Client
 */
window.CLIENT_API = {
  _cache: {},
  _cacheTTL: 30000,

  getToken() {
    return localStorage.getItem('sb-access-token') ||
           localStorage.getItem('gro10x_token') ||
           localStorage.getItem('gro10x_token') || '';
  },

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
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

    if (method === 'GET') {
      const cached = this._cache[url];
      if (cached && (Date.now() - cached.timestamp < this._cacheTTL)) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(url, config);
      if (response.status === 401) {
        localStorage.removeItem('gro10x_token');
        window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
        return null;
      }
      const data = await response.json();
      
      if (method === 'GET') {
        this._cache[url] = { data, timestamp: Date.now() };
      } else {
        // Automatically invalidate cache on state mutations
        this.invalidateCache(endpoint);
      }
      
      return data;
    } catch (err) {
      console.error(`[Client API] Error:`, err);
      throw err;
    }
  },

  invalidateCache(endpoint = '') {
    if (!endpoint) {
      this._cache = {};
      return;
    }
    const clean = endpoint.split('/')[1] || '';
    Object.keys(this._cache).forEach(k => {
      if (clean && k.includes(clean)) {
        delete this._cache[k];
      }
    });
  },

  clearCache() {
    this._cache = {};
  },

  get(ep) { return this.request(ep, { method: 'GET' }); },
  post(ep, body) { return this.request(ep, { method: 'POST', body }); },
  put(ep, body) { return this.request(ep, { method: 'PUT', body }); },
  patch(ep, body) { return this.request(ep, { method: 'PATCH', body }); },
  delete(ep) { return this.request(ep, { method: 'DELETE' }); },
  async fetchRaw(endpoint, options = {}) {
    const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const token = this.getToken();
    const headers = { ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  }
};
