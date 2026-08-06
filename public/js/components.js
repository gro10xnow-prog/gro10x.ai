/**
 * public/js/components.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PurpleOS Shared Frontend UI Components & Toast Notification Engine v2.0.
 * Standardizes modal creation, form validation helpers, state rendering,
 * and toast notifications across all portals.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function (window) {
  'use strict';

  /**
   * Unified Toast Notification System
   * @param {string} message - Toast content string
   * @param {string} type - 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - Autodismiss duration in ms
   */
  function showToast(message, type = 'info', duration = 4000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast-message">${window.escapeHTML ? window.escapeHTML(message) : message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease-out';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  /**
   * Standardized Shimmer Skeleton Generator
   * @param {string} type - 'card' | 'table' | 'kpi'
   * @param {number} count - Number of items to render
   */
  function renderSkeleton(type = 'card', count = 3) {
    let html = '';
    for (let i = 0; i < count; i++) {
      if (type === 'kpi') {
        html += `
          <div class="kpi-tile skeleton-box" style="height: 100px;"></div>
        `;
      } else if (type === 'table') {
        html += `
          <div class="skeleton-box" style="height: 48px; margin-bottom: 0.5rem; width: 100%; border-radius: 8px;"></div>
        `;
      } else {
        html += `
          <div class="card-glass skeleton-box" style="height: 180px; margin-bottom: 1rem;"></div>
        `;
      }
    }
    return html;
  }

  /**
   * Standardized Empty State Component
   */
  function renderEmptyState(title = 'No Data Found', message = 'There are no items matching your criteria.', icon = '📭', actionBtn = '') {
    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1.5rem; text-align: center; background: var(--surface-1); border: 1px solid var(--border-subtle); border-radius: 20px; margin: 1rem 0;">
        <div style="font-size: 3rem; margin-bottom: 0.75rem;">${icon}</div>
        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">${title}</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 400px; margin-bottom: 1rem;">${message}</p>
        ${actionBtn}
      </div>
    `;
  }

  /**
   * Standardized Error State Component
   */
  function renderErrorState(message = 'Failed to load data from server.', retryFnName = '') {
    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2.5rem 1.5rem; text-align: center; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 20px; margin: 1rem 0;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⚠️</div>
        <h4 style="font-size: 1rem; font-weight: 800; color: #fca5a5; margin-bottom: 0.35rem;">Something Went Wrong</h4>
        <p style="font-size: 0.82rem; color: var(--text-muted); max-width: 420px; margin-bottom: 1rem;">${message}</p>
        ${retryFnName ? `<button class="btn-secondary btn-sm" onclick="${retryFnName}()">🔄 Retry Connection</button>` : ''}
      </div>
    `;
  }

  /**
   * Helper to Open / Close Modals Cleanly
   */
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      const firstInput = modal.querySelector('input, select, textarea, button');
      if (firstInput) firstInput.focus();
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  // Export globals
  window.showToast = showToast;
  window.renderSkeleton = renderSkeleton;
  window.renderEmptyState = renderEmptyState;
  window.renderErrorState = renderErrorState;
  window.openModal = openModal;
  window.closeModal = closeModal;
})(window);
