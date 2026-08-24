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
           localStorage.getItem('purple_token') ||
           localStorage.getItem('gro10x_token') ||
           localStorage.getItem('jwt_token') || '';
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

window.APP_SSE = {
  _source: null,
  _listeners: {},
  _anyListeners: [],

  init() {
    if (!window.EventSource || this._source) return;
    try {
      const token = window.APP_API?.getToken() || localStorage.getItem('gro10x_token') || localStorage.getItem('sb-access-token') || '';
      const sseUrl = token ? `/api/sync?token=${encodeURIComponent(token)}&role=admin` : '/api/sync?role=admin';
      this._source = new EventSource(sseUrl);

      this._source.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          const evtType = payload.type || 'message';
          this._dispatch(evtType, payload.data || payload);
        } catch (err) {}
      };

      const eventNames = [
        'task_update', 'subtask_update', 'lead_update', 'client_update',
        'invoice_update', 'payment_update', 'expense_update', 'leave_update',
        'team_update', 'attendance_update', 'eod_update', 'review_update',
        'review_comment_update', 'post_update', 'social_post_update',
        'ticket_update', 'project_update', 'quote_update', 'cms_update',
        'workflow_update', 'custom_field_update', 'label_update', 'template_update'
      ];

      eventNames.forEach(evt => {
        this._source.addEventListener(evt, (e) => {
          try {
            const data = JSON.parse(e.data);
            this._dispatch(evt, data);
          } catch (err) {}
        });
      });

      this._source.onerror = () => {
        if (this._source) {
          this._source.close();
          this._source = null;
        }
        setTimeout(() => this.init(), 5000);
      };
    } catch (err) {
      console.warn('[Admin SSE] Connection error:', err);
    }
  },

  _dispatch(eventType, data) {
    if (window.APP_API && window.APP_API._cache) {
      window.APP_API._cache = {};
    }
    
    if (this._listeners[eventType]) {
      this._listeners[eventType].forEach(fn => {
        try { fn(data); } catch (e) {}
      });
    }
    this._anyListeners.forEach(fn => {
      try { fn(eventType, data); } catch (e) {}
    });
  },

  subscribe(eventType, callback) {
    if (!this._listeners[eventType]) {
      this._listeners[eventType] = [];
    }
    this._listeners[eventType].push(callback);
    if (!this._source) this.init();

    return () => {
      this._listeners[eventType] = (this._listeners[eventType] || []).filter(fn => fn !== callback);
    };
  },

  onAny(callback) {
    this._anyListeners.push(callback);
    if (!this._source) this.init();
    return () => {
      this._anyListeners = this._anyListeners.filter(fn => fn !== callback);
    };
  }
};

if (typeof window !== 'undefined') {
  setTimeout(() => window.APP_SSE.init(), 300);
}
