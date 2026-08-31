/**
 * public/dbm/api.js — GRO10X DBM Portal API Client
 */
(function(window) {
  'use strict';

  function getToken() {
    return localStorage.getItem('gro10x_token') || 
           sessionStorage.getItem('gro10x_token') || 
           localStorage.getItem('sb-access-token') || '';
  }

  window.DBM_API = {
    async request(path, options = {}) {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
        ...(options.headers || {})
      };

      if (options.body instanceof FormData) {
        delete headers['Content-Type'];
      }

      const url = '/api' + (path.startsWith('/') ? path : '/' + path);
      const res = await fetch(url, { ...options, headers });

      if (res.status === 401) {
        window.location.href = '/auth?redirect=/dbm';
        throw new Error('Session expired');
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || data.message || ('Server error ' + res.status);
        throw new Error(typeof msg === 'object' ? JSON.stringify(msg) : msg);
      }
      return data;
    },

    get(path) { return this.request(path, { method: 'GET' }); },
    post(path, body) {
      return this.request(path, {
        method: 'POST',
        body: body instanceof FormData ? body : JSON.stringify(body)
      });
    },
    patch(path, body) {
      return this.request(path, {
        method: 'PATCH',
        body: body instanceof FormData ? body : JSON.stringify(body)
      });
    },
    put(path, body) {
      return this.request(path, {
        method: 'PUT',
        body: body instanceof FormData ? body : JSON.stringify(body)
      });
    },
    delete(path) {
      return this.request(path, { method: 'DELETE' });
    }
  };
})(window);
