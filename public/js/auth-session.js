/**
 * public/js/auth-session.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Unified Client Authentication, Session & Currency SDK (v1.0)
 * Provides centralized session management, multi-role auth guards,
 * and global USD/BDT currency formatting across all stakeholder portals.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function(window) {
  'use strict';

  var TOKEN_KEY = 'gro10x_token';
  var LEGACY_TOKENS = ['sb-access-token', 'purple_token', 'purpleos_pin_token'];
  var USER_KEY = 'gro10x_user';
  var CURRENCY_KEY = 'gro10x_currency';

  var GRO10XAuth = {
    // ── 1. TOKEN MANAGEMENT ──
    getToken: function() {
      var token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      if (token) return token;

      // Migrate legacy tokens on first access
      for (var i = 0; i < LEGACY_TOKENS.length; i++) {
        var legToken = localStorage.getItem(LEGACY_TOKENS[i]) || sessionStorage.getItem(LEGACY_TOKENS[i]);
        if (legToken) {
          localStorage.setItem(TOKEN_KEY, legToken);
          // Clear legacy key
          localStorage.removeItem(LEGACY_TOKENS[i]);
          sessionStorage.removeItem(LEGACY_TOKENS[i]);
          return legToken;
        }
      }
      return null;
    },

    setToken: function(token, persist) {
      if (!token) return;
      // Clear all legacy keys on new login
      LEGACY_TOKENS.forEach(function(k) {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      if (persist) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.setItem(TOKEN_KEY, token);
      }
    },

    getUser: function() {
      try {
        var raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    },

    setUser: function(user, persist) {
      if (!user) return;
      var str = typeof user === 'string' ? user : JSON.stringify(user);
      if (persist) {
        localStorage.setItem(USER_KEY, str);
      } else {
        sessionStorage.setItem(USER_KEY, str);
      }
    },

    isAuthenticated: function() {
      return !!this.getToken();
    },

    // ── 2. ROLE-BASED ACCESS GUARDS ──
    getRole: function() {
      var user = this.getUser();
      if (!user) return 'guest';
      return (user.role || user.user_metadata?.role || 'specialist').toLowerCase();
    },

    isAdmin: function() {
      var r = this.getRole();
      return r === 'admin' || r === 'owner' || r === 'superadmin';
    },

    isManager: function() {
      var r = this.getRole();
      return this.isAdmin() || r === 'manager' || r === 'head_of_ops';
    },

    isCrew: function() {
      var r = this.getRole();
      return this.isManager() || r === 'specialist' || r === 'engineer' || r === 'artist' || r === 'crew';
    },

    isClient: function() {
      var r = this.getRole();
      return r === 'client' || r === 'partner' || r === 'brand';
    },

    requireAuth: function(options) {
      options = options || {};
      var portal = options.portal || 'general';
      var redirectUrl = options.redirect || window.location.pathname + window.location.search;

      if (!this.isAuthenticated()) {
        window.location.href = '/auth?portal=' + encodeURIComponent(portal) + '&redirect=' + encodeURIComponent(redirectUrl);
        return false;
      }
      return true;
    },

    logout: function(redirectPath) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      for (var i = 0; i < LEGACY_TOKENS.length; i++) {
        localStorage.removeItem(LEGACY_TOKENS[i]);
      }
      window.location.href = redirectPath || '/auth';
    },

    // ── 3. DUAL CURRENCY ENGINE (USD $ / BDT ৳) ──
    getCurrency: function() {
      return localStorage.getItem(CURRENCY_KEY) || 'USD';
    },

    setCurrency: function(curr) {
      var normalized = (curr || 'USD').toUpperCase();
      if (normalized !== 'USD' && normalized !== 'BDT') normalized = 'USD';
      localStorage.setItem(CURRENCY_KEY, normalized);
      
      // Dispatch global event for all listeners
      window.dispatchEvent(new CustomEvent('gro10x_currency_changed', { detail: { currency: normalized } }));
      
      // Auto-update elements with data-curr-usd / data-curr-bdt
      this.syncDOMCurrency(normalized);
    },

    formatPrice: function(usdAmount, bdtAmount) {
      var curr = this.getCurrency();
      if (curr === 'BDT') {
        if (typeof bdtAmount === 'number') {
          return '৳' + bdtAmount.toLocaleString();
        }
        if (typeof bdtAmount === 'string' && bdtAmount.trim()) {
          return bdtAmount.startsWith('৳') ? bdtAmount : '৳' + bdtAmount;
        }
        // Fallback conversion at 118 rate
        var val = typeof usdAmount === 'number' ? usdAmount : parseFloat(String(usdAmount).replace(/[^0-9.]/g, '')) || 0;
        return '৳' + Math.round(val * 118).toLocaleString();
      } else {
        if (typeof usdAmount === 'number') {
          return '$' + usdAmount.toLocaleString();
        }
        if (typeof usdAmount === 'string' && usdAmount.trim()) {
          return usdAmount.startsWith('$') ? usdAmount : '$' + usdAmount;
        }
        return '$0';
      }
    },

    syncDOMCurrency: function(curr) {
      curr = curr || this.getCurrency();
      var elements = document.querySelectorAll('[data-curr-usd]');
      elements.forEach(function(el) {
        var usdVal = el.getAttribute('data-curr-usd');
        var bdtVal = el.getAttribute('data-curr-bdt');
        if (curr === 'BDT' && bdtVal) {
          el.innerText = bdtVal;
        } else if (usdVal) {
          el.innerText = usdVal;
        }
      });
    },

    // ── 4. GLOBAL TOAST NOTIFICATION SYSTEM ──
    toast: function(message, type, duration) {
      type = type || 'info';
      duration = duration || 3500;
      var container = document.getElementById('gro10xToastContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'gro10xToastContainer';
        container.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:99999; display:flex; flex-direction:column; gap:8px; pointer-events:none;';
        document.body.appendChild(container);
      }

      var toast = document.createElement('div');
      var icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '⚡';
      var borderCol = type === 'success' ? '#00df89' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#06b6d4';
      
      toast.style.cssText = 'background:#0f172a; border:1px solid ' + borderCol + '; color:#f8fafc; padding:10px 16px; border-radius:12px; font-size:0.85rem; font-weight:600; box-shadow:0 12px 30px rgba(0,0,0,0.6); display:flex; align-items:center; gap:8px; pointer-events:auto; transition:all 0.25s ease; transform:translateY(10px); opacity:0; font-family:sans-serif;';
      toast.innerHTML = '<span>' + icon + '</span><span>' + message + '</span>';
      container.appendChild(toast);

      requestAnimationFrame(function() {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
      });

      setTimeout(function() {
        toast.style.transform = 'translateY(-10px)';
        toast.style.opacity = '0';
        setTimeout(function() {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
      }, duration);
    },

    // ── 5. AUTHORIZED API FETCH HELPER ──
    fetch: function(url, options) {
      options = options || {};
      options.headers = options.headers || {};
      var token = this.getToken();
      if (token && !options.headers['Authorization']) {
        options.headers['Authorization'] = 'Bearer ' + token;
      }
      return fetch(url, options).then(function(res) {
        if (res.status === 401) {
          var isAuthPage = typeof window !== 'undefined' && window.location.pathname.includes('/auth');
          if (!isAuthPage && typeof window !== 'undefined') {
            console.warn('[GRO10XAuth] 401 Unauthorized — Session expired');
            GRO10XAuth.clearSession();
            window.location.href = '/auth?expired=1';
          }
        }
        return res;
      });
    }
  };

  // Expose to window
  window.GRO10XAuth = GRO10XAuth;

  // Auto-sync DOM currency on initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      GRO10XAuth.syncDOMCurrency();
    });
  } else {
    GRO10XAuth.syncDOMCurrency();
  }

})(window);
