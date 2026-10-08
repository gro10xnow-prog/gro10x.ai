/**
 * public/crew/api.js
 * Crew Workspace API Client
 */
window.CREW_API = {
  getToken() {
    return localStorage.getItem('gro10x_token') ||
           sessionStorage.getItem('gro10x_token') ||
           localStorage.getItem('jwt_token') ||
           localStorage.getItem('sb-access-token') || '';
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
        localStorage.removeItem('gro10x_token');
        sessionStorage.removeItem('gro10x_token');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('gro10x_user');
        localStorage.removeItem('purple_user');
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('sb-') || k.includes('token'))) {
              localStorage.removeItem(k);
            }
          }
        } catch (_) {}
        const target = window.location.pathname + window.location.hash;
        window.location.href = '/auth?redirect=' + encodeURIComponent(target);
        return {};
      }
      return await response.json();
    } catch (err) {
      console.error(`[Crew API] Error:`, err);
      throw err;
    }
  },

  get(ep) { return this.request(ep, { method: 'GET' }); },
  post(ep, body) { return this.request(ep, { method: 'POST', body }); },
  put(ep, body) { return this.request(ep, { method: 'PUT', body }); },
  patch(ep, body) { return this.request(ep, { method: 'PATCH', body }); },
  delete(ep, body) { return this.request(ep, { method: 'DELETE', body }); },

  // 30-second in-memory cache for /auth/me to eliminate redundant route calls (F-P3-2)
  async getMe(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this._meCache && (now - this._meCacheTime) < 30000) {
      return this._meCache;
    }
    const res = await this.get('/auth/me').catch(() => ({}));
    if (res && res.user) {
      this._meCache = res;
      this._meCacheTime = now;
    }
    return res || {};
  },

  invalidateMe() {
    this._meCache = null;
    this._meCacheTime = 0;
  },

  // Shared BDT Currency Formatter (F-P3-4)
  formatBDT(amount) {
    if (amount === null || amount === undefined || isNaN(Number(amount))) return '৳ —';
    return `৳${Number(amount).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
};
