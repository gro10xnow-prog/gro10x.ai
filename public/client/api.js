/**
 * public/client/api.js
 * Client Portal API Client
 */
window.CLIENT_API = {
  _cache: {},
  _cacheTTL: 30000,

  getToken() {
    return localStorage.getItem('sb-access-token') ||
           localStorage.getItem('purpleos_pin_token') ||
           localStorage.getItem('purple_token') || '';
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
        localStorage.removeItem('sb-access-token');
        window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
        return null;
      }
      const data = await response.json();
      
      if (method === 'GET') {
        this._cache[url] = { data, timestamp: Date.now() };
      }
      
      return data;
    } catch (err) {
      console.error(`[Client API] Error:`, err);
      throw err;
    }
  },

  get(ep) { return this.request(ep, { method: 'GET' }); },
  post(ep, body) { return this.request(ep, { method: 'POST', body }); },
  put(ep, body) { return this.request(ep, { method: 'PUT', body }); },
  patch(ep, body) { return this.request(ep, { method: 'PATCH', body }); }
};
