/**
 * public/js/formatters.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Standardized Date, Time, Currency, and Text Formatting Utility for PurpleOS.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function (window) {
  'use strict';

  const Formatters = {
    /**
     * Format ISO date string to "Aug 6, 2026"
     */
    formatDate(isoStr) {
      if (!isoStr) return 'N/A';
      try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return String(isoStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) {
        return String(isoStr);
      }
    },

    /**
     * Format ISO date string to "Aug 6, 2026, 6:15 PM"
     */
    formatDateTime(isoStr) {
      if (!isoStr) return 'N/A';
      try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return String(isoStr);
        return d.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } catch (e) {
        return String(isoStr);
      }
    },

    /**
     * Format numeric value to currency ("৳75,000" or "$1,500")
     */
    formatCurrency(amount, currency = 'BDT') {
      const num = Number(amount) || 0;
      if (currency === 'BDT') {
        return `৳${num.toLocaleString('en-BD')}`;
      }
      return `$${num.toLocaleString('en-US')}`;
    },

    /**
     * Relative time formatter ("2 hours ago", "In 3 days")
     */
    formatRelative(isoStr) {
      if (!isoStr) return '';
      try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return '';
        const now = new Date();
        const diffMs = d - now;
        const diffMins = Math.round(diffMs / 60000);
        const diffHours = Math.round(diffMs / 3600000);
        const diffDays = Math.round(diffMs / 86400000);

        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

        if (Math.abs(diffMins) < 60) {
          return rtf.format(diffMins, 'minute');
        } else if (Math.abs(diffHours) < 24) {
          return rtf.format(diffHours, 'hour');
        } else {
          return rtf.format(diffDays, 'day');
        }
      } catch (e) {
        return '';
      }
    }
  };

  window.Formatters = Formatters;
})(window);
