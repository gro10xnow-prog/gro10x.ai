/**
 * public/manager/api.js
 * Department Manager Portal API Client
 */
window.MANAGER_API = {
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
        localStorage.removeItem('sb-access-token');
        window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
        return null;
      }
      return await response.json();
    } catch (err) {
      console.error(`[Manager API] Error:`, err);
      throw err;
    }
  },

  get(ep) { return this.request(ep, { method: 'GET' }); },
  post(ep, body) { return this.request(ep, { method: 'POST', body }); },
  put(ep, body) { return this.request(ep, { method: 'PUT', body }); },
  patch(ep, body) { return this.request(ep, { method: 'PATCH', body }); }
};
