/**
 * public/my-portal/portal.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PlannerQueenGro · Universal Customer Portal Controller
 * Manages customer session, instant demo bypass, digital vault,
 * credit wallet ledger, real-time product unlocks, and in-app notifications.
 * Strict Zero Native Dialogs Policy Enforced: 0 alerts, 0 confirms, 0 prompts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TOKEN_KEY = 'gro10x_customer_token';

document.addEventListener('DOMContentLoaded', () => {
  initURLParams();
  checkSession();
  setupEventListeners();
});

// ──────── 1. IN-APP LUXURY TOAST & MODAL SYSTEM (Zero Native Dialogs) ────────

function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('portalToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'portalToastContainer';
    container.className = 'portal-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `portal-toast portal-toast-${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✨';
  if (type === 'error') icon = '⚠️';
  if (type === 'warning') icon = '⚡';

  toast.innerHTML = `<span style="font-weight: 600; margin-right: 0.35rem;">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('portal-toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration);
}

function showConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  const existing = document.getElementById('portalModalOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'portalModalOverlay';
  overlay.className = 'portal-modal-overlay';

  overlay.innerHTML = `
    <div class="portal-modal-card" role="dialog" aria-modal="true">
      <h3 class="portal-modal-title">${title}</h3>
      <div class="portal-modal-body">${message}</div>
      <div class="portal-modal-actions">
        <button type="button" class="btn-secondary-action" id="portalModalCancelBtn">
          <span>${cancelText}</span>
        </button>
        <button type="button" class="btn-primary-action" id="portalModalConfirmBtn">
          <span>${confirmText}</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', handleKey);
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') {
      close();
      if (typeof onCancel === 'function') onCancel();
    }
  };
  document.addEventListener('keydown', handleKey);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
      if (typeof onCancel === 'function') onCancel();
    }
  });

  document.getElementById('portalModalCancelBtn').addEventListener('click', () => {
    close();
    if (typeof onCancel === 'function') onCancel();
  });

  document.getElementById('portalModalConfirmBtn').addEventListener('click', async () => {
    close();
    if (typeof onConfirm === 'function') await onConfirm();
  });
}

// ──────── 2. SESSION & URL PARAMETERS ────────

function initURLParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const codeParam = urlParams.get('code');
  if (codeParam) {
    const codeInput = document.getElementById('inputCode');
    if (codeInput) codeInput.value = codeParam.trim().toUpperCase();
  }
}

async function checkSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    showAuthView();
    return;
  }

  try {
    const res = await fetch('/api/portal/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      localStorage.removeItem(TOKEN_KEY);
      showAuthView();
      return;
    }

    const data = await res.json();
    if (data.ok) {
      renderDashboard(data);
      showDashboardView();
    } else {
      localStorage.removeItem(TOKEN_KEY);
      showAuthView();
    }
  } catch (err) {
    console.error('Session validation error:', err);
    showAuthView();
  }
}

function showAuthView() {
  const authView = document.getElementById('authView');
  const dashboardView = document.getElementById('dashboardView');
  const headerRight = document.getElementById('headerRight');
  if (authView) authView.style.display = 'block';
  if (dashboardView) dashboardView.style.display = 'none';
  if (headerRight) headerRight.style.display = 'none';
}

function showDashboardView() {
  const authView = document.getElementById('authView');
  const dashboardView = document.getElementById('dashboardView');
  const headerRight = document.getElementById('headerRight');
  if (authView) authView.style.display = 'none';
  if (dashboardView) dashboardView.style.display = 'block';
  if (headerRight) headerRight.style.display = 'flex';
}

// ──────── 3. EVENT LISTENERS ────────

function setupEventListeners() {
  // Activation Form Submit
  const activationForm = document.getElementById('activationForm');
  if (activationForm) {
    activationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('inputCode').value.trim();
      const email = document.getElementById('inputEmail').value.trim();
      const name = document.getElementById('inputName').value.trim();

      const btn = document.getElementById('btnSubmitActivation');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Activating Vault...</span>';

      try {
        const res = await fetch('/api/portal/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, email, name })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          const errMsg = data.error || `Server returned status ${res.status}`;
          showToast(errMsg, 'error');
          return;
        }

        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
          showToast('🎉 Digital Vault activated successfully! Welcome to PlannerQueenGro.', 'success');
          await checkSession();
        } else {
          showToast(data.error || 'Please check your details and try again.', 'error');
        }
      } catch (err) {
        console.error('Activation request error:', err);
        showToast('Unable to reach activation service: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }

  // Instant Demo Access Button
  const btnInstantDemo = document.getElementById('btnInstantDemo');
  if (btnInstantDemo) {
    btnInstantDemo.addEventListener('click', async () => {
      const demoEmail = 'creator.demo@plannerqueengro.com';
      const demoName = 'Elena (VIP Creator)';
      const demoCode = 'PLA14-DEMO-2026';

      btnInstantDemo.disabled = true;
      btnInstantDemo.innerHTML = '<span>⚡ Loading Demo Vault...</span>';

      try {
        const res = await fetch('/api/portal/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: demoCode, email: demoEmail, name: demoName })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          const errMsg = data.error || `Server returned status ${res.status}`;
          showToast(errMsg, 'error');
          return;
        }

        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
          showToast('⚡ Instant Demo Vault initialized with 200 GroCredits.', 'success');
          await checkSession();
        } else {
          showToast(data.error || 'Server error', 'error');
        }
      } catch (err) {
        console.error('Demo access error:', err);
        showToast('Unable to reach demo portal: ' + err.message, 'error');
      } finally {
        btnInstantDemo.disabled = false;
        btnInstantDemo.innerHTML = '<span>⚡ 1-Click Instant Demo Access</span>';
      }
    });
  }

  // Sign Out Button (In-App Confirmation Modal, 0 Native Dialogs)
  const btnSignOut = document.getElementById('btnSignOut');
  if (btnSignOut) {
    btnSignOut.addEventListener('click', () => {
      showConfirmModal({
        title: 'Sign Out Confirmation',
        message: 'Are you sure you want to sign out of your PlannerQueenGro Customer Vault?',
        confirmText: 'Sign Out',
        cancelText: 'Stay in Vault',
        onConfirm: () => {
          localStorage.removeItem(TOKEN_KEY);
          showToast('Signed out of customer vault.', 'info');
          showAuthView();
        }
      });
    });
  }

  // Unlock PLA-15 with Credits
  const btnUnlockPla15 = document.getElementById('btnUnlockPla15');
  if (btnUnlockPla15) {
    btnUnlockPla15.addEventListener('click', () => {
      window.handleProductRedemption('PLA-15', 150, 'ADHD Low-Dopamine Daily Planner');
    });
  }

  // Redeem Merch Voucher
  const btnRedeemMerch = document.getElementById('btnRedeemMerch');
  if (btnRedeemMerch) {
    btnRedeemMerch.addEventListener('click', () => {
      window.handleProductRedemption('MERCH-01', 100, '$10 Custom Apparel Voucher');
    });
  }
}

// ──────── 4. DASHBOARD & LEDGER RENDERING ────────

function renderDashboard(data) {
  const { customer, wallet, transactions, products } = data;

  // Header & Hero
  const userGreeting = document.getElementById('userGreeting');
  const userTier = document.getElementById('userTier');
  const heroCreditBal = document.getElementById('heroCreditBal');
  const headerCreditBal = document.getElementById('headerCreditBal');

  if (userGreeting) userGreeting.textContent = `Welcome, ${customer.name || 'Creator'}`;
  if (userTier) userTier.textContent = wallet.tier || 'VIP Creator';
  if (heroCreditBal) heroCreditBal.textContent = `${wallet.balance} GroCredits`;
  if (headerCreditBal) headerCreditBal.textContent = `${wallet.balance} GroCredits`;

  // Wallet KPIs
  const walletBalance = document.getElementById('walletBalance');
  const walletLifetime = document.getElementById('walletLifetime');
  const walletTier = document.getElementById('walletTier');

  if (walletBalance) walletBalance.textContent = wallet.balance;
  if (walletLifetime) walletLifetime.textContent = wallet.lifetimeEarned || wallet.balance;
  if (walletTier) walletTier.textContent = wallet.tier || 'VIP Creator';

  // Products Vault Grid
  renderProductsVault(products, customer.unlockedSkus || []);

  // Transactions Ledger Table
  renderTransactions(transactions || []);
}

function renderProductsVault(products, unlockedSkus) {
  const container = document.getElementById('productsVaultGrid');
  if (!container) return;

  container.innerHTML = products.map(p => {
    const isUnlocked = unlockedSkus.includes(p.sku);
    const badgeColor = isUnlocked ? 'var(--accent-sage)' : 'var(--primary-plum)';
    const badgeLabel = isUnlocked ? 'Active License · Unlocked' : `Requires ${p.creditsCost} Credits`;

    return `
      <article class="product-vault-card" id="card-${p.sku.toLowerCase()}" style="border-top: 4px solid ${badgeColor};">
        <div class="product-card-top">
          <span class="product-sku-tag">SKU: ${p.sku} · ${badgeLabel}</span>
          <h3 class="product-name">${p.name}</h3>
          <p class="product-desc">${p.brand} interactive companion &amp; digital print bundle.</p>
        </div>
        <div class="product-actions">
          ${isUnlocked ? `
            <a href="${p.interactiveUrl || '#'}" class="btn-primary-action">
              <span>✨ Launch Interactive App</span>
            </a>
            ${p.pdfDownloadUrl && p.pdfDownloadUrl !== '#' ? `
              <a href="${p.pdfDownloadUrl}" download class="btn-secondary-action">
                <span>🖨️ Download Vector PDF</span>
              </a>
            ` : ''}
            ${p.canvaTemplateUrl && p.canvaTemplateUrl !== '#' ? `
              <a href="${p.canvaTemplateUrl}" target="_blank" class="btn-secondary-action">
                <span>🎨 Canva Editable Source</span>
              </a>
            ` : ''}
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.25rem;">
              <a href="/dce/track" target="_blank" class="btn-secondary-action">
                <span>📦 Track Physical</span>
              </a>
              <a href="/dce/store" target="_blank" class="btn-secondary-action">
                <span>🛍️ Order Add-ons</span>
              </a>
            </div>
          ` : `
            <button class="btn-primary-action" onclick="handleProductRedemption('${p.sku}', ${p.creditsCost}, '${p.name}')">
              <span>⚡ Unlock with ${p.creditsCost} Credits</span>
            </button>
          `}
        </div>
      </article>
    `;
  }).join('');
}

function renderTransactions(txns) {
  const tbody = document.getElementById('txnsTableBody');
  if (!tbody) return;

  if (txns.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
          No transactions yet. Complete planner sessions or redeem perks to see your ledger activity.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = txns.map(t => {
    const isCredit = (t.amount > 0) || (t.type === 'credit');
    const displayAmount = isCredit ? `+${Math.abs(t.amount)}` : `-${Math.abs(t.amount)}`;
    const amountColor = isCredit ? 'var(--accent-sage)' : 'var(--accent-rose)';
    const dateStr = new Date(t.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.85rem;">${dateStr}</td>
        <td style="font-weight: 500;">${t.reason || 'Ledger Activity'}</td>
        <td style="font-weight: 700; color: ${amountColor};">${displayAmount} Credits</td>
      </tr>
    `;
  }).join('');
}

// ──────── 5. REAL-TIME REDEMPTION HANDLER (API Driven, Zero Native Dialogs) ────────

window.handleProductRedemption = async function(sku, cost, name) {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    showToast('Customer session required. Please activate or sign in.', 'error');
    showAuthView();
    return;
  }

  const walletBalEl = document.getElementById('walletBalance');
  const currentBal = parseInt(walletBalEl?.textContent || '0', 10);

  if (currentBal < cost) {
    showToast(`Insufficient GroCredits. You have ${currentBal} credits, but unlocking ${name || sku} requires ${cost} credits.`, 'error');
    return;
  }

  showConfirmModal({
    title: 'Unlock Companion Product',
    message: `Unlock <strong>${name || sku}</strong> (${sku}) for <strong>${cost} GroCredits</strong> from your universal wallet?`,
    confirmText: `⚡ Unlock (${cost} Credits)`,
    cancelText: 'Keep Credits',
    onConfirm: async () => {
      try {
        const res = await fetch('/api/portal/redeem', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sku, creditsCost: cost, name })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          showToast(data.error || 'Failed to unlock product. Please check your credit balance.', 'error');
          return;
        }

        showToast(`🎉 Successfully unlocked ${name || sku}! Your companion license is active.`, 'success');
        // Re-hydrate session to update wallet, product cards, and transaction ledger
        await checkSession();
      } catch (err) {
        console.error('Redemption error:', err);
        showToast('Unable to connect to vault redemption service: ' + err.message, 'error');
      }
    }
  });
};
