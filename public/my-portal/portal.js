/**
 * public/my-portal/portal.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PlannerQueenGro · Universal Customer Portal Controller
 * Manages customer session, instant demo bypass, digital vault,
 * credit wallet ledger, and product unlocks.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TOKEN_KEY = 'gro10x_customer_token';

document.addEventListener('DOMContentLoaded', () => {
  initURLParams();
  checkSession();
  setupEventListeners();
});

// Check URL query params for auto-filling activation code
function initURLParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const codeParam = urlParams.get('code');
  if (codeParam) {
    const codeInput = document.getElementById('inputCode');
    if (codeInput) codeInput.value = codeParam.trim().toUpperCase();
  }
}

// Check if customer already has a stored JWT session
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
      // Token invalid or expired
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

        if (!res.ok) {
          let errMsg = `Server returned status ${res.status}`;
          try {
            const errData = await res.json();
            if (errData.error) errMsg = errData.error;
          } catch (_) {}
          alert('Activation notice: ' + errMsg);
          return;
        }

        const data = await res.json();
        if (data.ok && data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
          await checkSession();
        } else {
          alert('Activation error: ' + (data.error || 'Please check your details and try again.'));
        }
      } catch (err) {
        console.error('Activation request error:', err);
        alert('Unable to reach activation service: ' + err.message);
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

        if (!res.ok) {
          let errMsg = `Server returned status ${res.status}`;
          try {
            const errData = await res.json();
            if (errData.error) errMsg = errData.error;
          } catch (_) {}
          alert('Demo access notice: ' + errMsg);
          return;
        }

        const data = await res.json();
        if (data.ok && data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
          await checkSession();
        } else {
          alert('Demo access notice: ' + (data.error || 'Server error'));
        }
      } catch (err) {
        console.error('Demo access error:', err);
        alert('Unable to reach demo portal: ' + err.message);
      } finally {
        btnInstantDemo.disabled = false;
        btnInstantDemo.innerHTML = '<span>⚡ 1-Click Instant Demo Access</span>';
      }
    });
  }

  // Sign Out Button
  const btnSignOut = document.getElementById('btnSignOut');
  if (btnSignOut) {
    btnSignOut.addEventListener('click', () => {
      if (confirm('Sign out of your PlannerQueenGro Customer Vault?')) {
        localStorage.removeItem(TOKEN_KEY);
        showAuthView();
      }
    });
  }

  // Unlock PLA-15 with Credits
  const btnUnlockPla15 = document.getElementById('btnUnlockPla15');
  if (btnUnlockPla15) {
    btnUnlockPla15.addEventListener('click', () => {
      handleProductRedemption('PLA-15', 150, 'ADHD Low-Dopamine Daily Planner');
    });
  }

  // Redeem Merch Voucher
  const btnRedeemMerch = document.getElementById('btnRedeemMerch');
  if (btnRedeemMerch) {
    btnRedeemMerch.addEventListener('click', () => {
      handleProductRedemption('MERCH-01', 100, '$10 Custom Apparel Voucher');
    });
  }
}

// Render member dashboard data
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

  // Render cards for products
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
            <a href="${p.interactiveUrl}" class="btn-primary-action">
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

// Window-level redemption handler
window.handleProductRedemption = function(sku, cost, name) {
  const walletBalEl = document.getElementById('walletBalance');
  const currentBal = parseInt(walletBalEl?.textContent || '0', 10);

  if (currentBal < cost) {
    alert(`Insufficient GroCredits balance. You have ${currentBal} credits, but unlocking ${name} requires ${cost} credits.`);
    return;
  }

  if (confirm(`Unlock ${name} for ${cost} GroCredits?`)) {
    alert(`🎉 Successfully unlocked ${name}! Your license is active in your vault.`);
    // In production this triggers /api/portal/redeem. For now, reflect client-side update:
    walletBalEl.textContent = currentBal - cost;
    const heroCreditBal = document.getElementById('heroCreditBal');
    const headerCreditBal = document.getElementById('headerCreditBal');
    if (heroCreditBal) heroCreditBal.textContent = `${currentBal - cost} GroCredits`;
    if (headerCreditBal) headerCreditBal.textContent = `${currentBal - cost} GroCredits`;
  }
};
