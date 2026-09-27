/**
 * public/crew/modules/expenses.js
 * Native Web Expense & Compute COGS Claim Submission Module for Crew Workspace
 */
window.CREW_MODULES = window.CREW_MODULES || {};

window.submitCrewExpense = async function(passedEmpCode, passedEmpName) {
  const btn = document.getElementById('crewExpSubmitBtn');
  const empCode = passedEmpCode || btn?.dataset?.empCode || '';
  const empName = passedEmpName || btn?.dataset?.empName || '';

  const amount = parseFloat(document.getElementById('crewExpAmount')?.value);
  if (!amount || isNaN(amount) || amount <= 0) {
    if (typeof window.showCrewToast === 'function') window.showCrewToast('Please enter a valid expense amount in BDT.', 'error');
    return;
  }

  const category = document.getElementById('crewExpCategory')?.value || 'Transport';
  const description = (document.getElementById('crewExpDescription')?.value || '').trim() || category;
  const date = document.getElementById('crewExpDate')?.value || new Date().toISOString().split('T')[0];

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Submitting Claim...';
  }

  let receiptBase64 = null;
  const fileInput = document.getElementById('crewExpReceipt');
  if (fileInput?.files?.[0]) {
    const file = fileInput.files[0];
    receiptBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  try {
    const res = await CREW_API.post('/expenses', {
      submittedById: empCode,
      submittedBy: empName,
      employeeId: empCode,
      employeeName: empName,
      amount: amount,
      category: category,
      description: description,
      date: date,
      receiptBase64: receiptBase64
    });

    if (res && (res.success !== false && !res.error)) {
      if (typeof window.showCrewToast === 'function') {
        window.showCrewToast('Expense claim submitted for manager review! 🧾');
      }
      setTimeout(() => {
        window.location.hash = '#home';
      }, 900);
    } else {
      throw new Error(res?.error || 'Failed to submit expense claim');
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '✅ Submit Expense Claim';
    }
    if (typeof window.showCrewToast === 'function') {
      window.showCrewToast(`Error: ${err.message}`, 'error');
    }
  }
};

window.switchCrewExpenseTab = function(tab) {
  const stdTab = document.getElementById('tabBtnStandardExpense');
  const cogsTab = document.getElementById('tabBtnComputeCogs');
  const stdSection = document.getElementById('standardExpenseSection');
  const cogsSection = document.getElementById('computeCogsSection');

  if (tab === 'compute') {
    if (stdTab) stdTab.className = 'btn-secondary';
    if (cogsTab) cogsTab.className = 'btn-primary';
    if (stdSection) stdSection.style.display = 'none';
    if (cogsSection) cogsSection.style.display = 'block';
  } else {
    if (stdTab) stdTab.className = 'btn-primary';
    if (cogsTab) cogsTab.className = 'btn-secondary';
    if (stdSection) stdSection.style.display = 'block';
    if (cogsSection) cogsSection.style.display = 'none';
  }
};

window.syncCogsCurrency = function(changed) {
  const usdInput = document.getElementById('cogsAmountUsd');
  const bdtInput = document.getElementById('cogsAmountBdt');
  if (!usdInput || !bdtInput) return;

  const RATE = 120; // 1 USD = 120 BDT
  if (changed === 'usd') {
    const usdVal = parseFloat(usdInput.value) || 0;
    bdtInput.value = usdVal > 0 ? Math.round(usdVal * RATE) : '';
  } else {
    const bdtVal = parseFloat(bdtInput.value) || 0;
    usdInput.value = bdtVal > 0 ? (bdtVal / RATE).toFixed(2) : '';
  }

  window.updateCogsMarginPreview();
};

window.updateCogsMarginPreview = function() {
  const bdtInput = document.getElementById('cogsAmountBdt');
  const previewEl = document.getElementById('cogsMarginPreview');
  if (!previewEl) return;

  const claimBDT = parseFloat(bdtInput?.value) || 0;
  const projectRevenue = 200000; // Benchmark sprint revenue
  const baseCOGS = 20000;        // Base infrastructure COGS
  const totalCOGS = baseCOGS + claimBDT;
  const grossProfit = Math.max(0, projectRevenue - totalCOGS);
  const marginPercent = ((grossProfit / projectRevenue) * 100).toFixed(1);
  const isHealthy = Number(marginPercent) >= 70.0;

  previewEl.innerHTML = `
    <div style="background:${isHealthy ? 'rgba(0,223,137,0.1)' : 'rgba(245,158,11,0.1)'}; border:1px solid ${isHealthy ? 'rgba(0,223,137,0.3)' : 'rgba(245,158,11,0.3)'}; border-radius:12px; padding:1rem; margin-bottom:1.25rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.5rem;">
        <span style="font-size:0.8rem; font-weight:800; text-transform:uppercase; color:var(--text-muted);">
          📊 Live Margin Guardrail Telemetry
        </span>
        <span class="badge" style="background:${isHealthy ? 'rgba(0,223,137,0.2)' : 'rgba(245,158,11,0.2)'}; color:${isHealthy ? 'var(--accent-mint)' : 'var(--accent-amber)'}; font-size:0.75rem; font-weight:800;">
          ${isHealthy ? '✅ Target Margin Preserved (≥70%)' : '⚠️ Margin Warning (<70% Benchmark)'}
        </span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:0.75rem; font-size:0.82rem;">
        <div>
          <div style="color:var(--text-muted); font-size:0.72rem;">Sprint Revenue</div>
          <div style="font-weight:800; color:#fff; font-family:var(--font-mono);">৳${projectRevenue.toLocaleString()}</div>
        </div>
        <div>
          <div style="color:var(--text-muted); font-size:0.72rem;">Updated Total COGS</div>
          <div style="font-weight:800; color:var(--accent-amber); font-family:var(--font-mono);">৳${totalCOGS.toLocaleString()}</div>
        </div>
        <div>
          <div style="color:var(--text-muted); font-size:0.72rem;">Projected Margin</div>
          <div style="font-weight:900; color:${isHealthy ? 'var(--accent-mint)' : 'var(--accent-amber)'}; font-size:1rem; font-family:var(--font-mono);">${marginPercent}%</div>
        </div>
      </div>
    </div>
  `;
};

window.submitComputeCogsClaim = async function(e) {
  if (e && e.preventDefault) e.preventDefault();

  const projectId = document.getElementById('cogsProjectId')?.value || 'proj-purplebot-01';
  const vendor = document.getElementById('cogsVendor')?.value || 'RunPod';
  const itemType = document.getElementById('cogsItemType')?.value || 'Compute / GPU Cluster';
  const amountBDT = parseFloat(document.getElementById('cogsAmountBdt')?.value);
  const description = document.getElementById('cogsDescription')?.value?.trim() || `${vendor} — ${itemType}`;
  const receiptUrl = document.getElementById('cogsReceiptUrl')?.value?.trim() || null;

  if (!amountBDT || amountBDT <= 0) {
    if (typeof window.showCrewToast === 'function') {
      window.showCrewToast('Please specify a valid claim amount in USD or BDT.', 'error');
    }
    return;
  }

  const btn = document.getElementById('cogsSubmitBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Logging Compute Claim...';
  }

  try {
    const res = await CREW_API.post(`/projects/${encodeURIComponent(projectId)}/cogs-claim`, {
      itemType: `${vendor}: ${itemType}`,
      description,
      amountBDT,
      receiptUrl
    });

    if (res && res.ok) {
      if (typeof window.showCrewToast === 'function') {
        window.showCrewToast(`Compute COGS logged! Project Margin: ${res.grossMarginPercent || '75%'} ✅`);
      }

      // Add to recent list
      const listEl = document.getElementById('cogsRecentClaimsList');
      if (listEl) {
        const row = document.createElement('div');
        row.style.cssText = 'background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.85rem 1rem; display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; font-size:0.85rem;';
        row.innerHTML = `
          <div>
            <div style="font-weight:800; color:#fff;">${vendor}: ${itemType}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${description}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800; color:var(--accent-mint); font-family:var(--font-mono);">৳${amountBDT.toLocaleString()} BDT</div>
            <div style="font-size:0.72rem; color:var(--accent-cyan);">${res.grossMarginPercent || '75%'} Margin</div>
          </div>
        `;
        listEl.prepend(row);
      }

      // Reset fields
      document.getElementById('crewCogsClaimForm').reset();
      window.updateCogsMarginPreview();
    } else {
      throw new Error(res?.error || 'Failed to submit compute COGS claim');
    }
  } catch (err) {
    if (typeof window.showCrewToast === 'function') {
      window.showCrewToast(`Error: ${err.message}`, 'error');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '⚡ Submit Compute COGS Claim';
    }
  }
};

window.CREW_MODULES.expenses = async function(container) {
  const me = await CREW_API.getMe().catch(() => ({}));
  const user = me.user || {};
  const empCode = user.emp_code || user.id || 'GRO-000';
  const empName = user.name || 'Specialist';
  const todayStr = new Date().toISOString().split('T')[0];

  const CATEGORIES = [
    'Transport / Ride Share',
    'Meals & Team Food',
    'Studio & Shoot Supplies',
    'Hardware / Gear Rental',
    'Internet / Mobile Data',
    'Software / AI Tools',
    'Client Hospitality',
    'Other Operating Expense'
  ];

  const VENDORS = [
    'OpenAI',
    'RunPod',
    'Anthropic',
    'Modal',
    'AWS Bedrock',
    'Google Cloud Vertex',
    'Together AI'
  ];

  const ITEM_TYPES = [
    'Compute / GPU Cluster',
    'API Tokens & Inference',
    'Dedicated GPU Cloud Hours',
    'Model Fine-Tuning Compute',
    'Proxy & Web Scraping Infrastructure'
  ];

  container.innerHTML = `
    <div style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
      <div>
        <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">🧾 Specialist Expense Claims</h1>
        <div style="font-size:0.88rem; color:var(--text-muted);">Manage standard out-of-pocket reimbursements and project compute/GPU COGS.</div>
      </div>

      <!-- Sub-Tab Switcher -->
      <div style="display:flex; gap:0.5rem; background:rgba(0,0,0,0.35); padding:0.35rem; border-radius:12px; border:1px solid var(--border-subtle);">
        <button id="tabBtnStandardExpense" type="button" class="btn-primary" style="font-size:0.82rem; padding:0.45rem 0.9rem; border-radius:8px; cursor:pointer;" onclick="switchCrewExpenseTab('standard')">
          🧾 Out-of-Pocket
        </button>
        <button id="tabBtnComputeCogs" type="button" class="btn-secondary" style="font-size:0.82rem; padding:0.45rem 0.9rem; border-radius:8px; cursor:pointer;" onclick="switchCrewExpenseTab('compute')">
          ⚡ Compute & GPU Claims
        </button>
      </div>
    </div>

    <!-- TAB 1: STANDARD OUT-OF-POCKET CLAIM -->
    <div id="standardExpenseSection">
      <div class="card-glass" style="max-width:680px; margin:0 auto; padding:1.75rem;">
        <div style="margin-bottom:1.25rem;">
          <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--text-primary); margin-bottom:0.4rem;">
            Amount in BDT (৳) <span style="color:#ef4444;">*</span>
          </label>
          <input type="number" id="crewExpAmount" placeholder="e.g. 1500" min="1" step="1" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:inherit; font-size:1rem; font-weight:700; box-sizing:border-box;">
        </div>

        <div style="margin-bottom:1.25rem;">
          <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--text-primary); margin-bottom:0.4rem;">
            Expense Category <span style="color:#ef4444;">*</span>
          </label>
          <select id="crewExpCategory" style="width:100%; background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:inherit; font-size:0.9rem; box-sizing:border-box;">
            ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>

        <div style="margin-bottom:1.25rem;">
          <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--text-primary); margin-bottom:0.4rem;">
            Expense Description / Purpose
          </label>
          <input type="text" id="crewExpDescription" placeholder="e.g. Uber ride to client shoot location" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:inherit; font-size:0.9rem; box-sizing:border-box;">
        </div>

        <div style="margin-bottom:1.25rem;">
          <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--text-primary); margin-bottom:0.4rem;">
            Expense Date
          </label>
          <input type="date" id="crewExpDate" value="${todayStr}" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:inherit; font-size:0.9rem; box-sizing:border-box;">
        </div>

        <div style="margin-bottom:1.5rem;">
          <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--text-primary); margin-bottom:0.4rem;">
            Receipt / Voucher Photo (Optional)
          </label>
          <input type="file" id="crewExpReceipt" accept="image/*,application/pdf" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:10px; padding:0.6rem; color:#fff; font-family:inherit; font-size:0.85rem; box-sizing:border-box;">
        </div>

        <div style="background:rgba(139,92,246,0.1); border:1px solid rgba(139,92,246,0.3); border-radius:10px; padding:0.85rem 1rem; margin-bottom:1.5rem; font-size:0.82rem; color:var(--text-muted); line-height:1.5;">
          ℹ️ Approved out-of-pocket claims are disbursed directly to your verified bKash mobile number during standard payout cycles.
        </div>

        <button id="crewExpSubmitBtn" class="btn-primary" style="width:100%; padding:0.85rem; font-size:1rem; font-weight:700; border-radius:12px; cursor:pointer;" data-emp-code="${empCode}" data-emp-name="${(empName || '').replace(/"/g, '&quot;')}" onclick="submitCrewExpense()">
          ✅ Submit Expense Claim
        </button>
      </div>
    </div>

    <!-- TAB 2: COMPUTE COGS & GPU CLAIMS -->
    <div id="computeCogsSection" style="display:none;">
      <div class="card-glass" style="max-width:720px; margin:0 auto; padding:1.75rem; border:1px solid rgba(0,223,137,0.3);">
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.85rem;">
          <span style="font-size:1.5rem;">⚡</span>
          <div>
            <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin:0;">Specialist Compute & GPU COGS Desk</h3>
            <div style="font-size:0.8rem; color:var(--text-muted);">Allocate cloud GPU and token inference costs directly to client delivery sprints.</div>
          </div>
        </div>

        <form id="crewCogsClaimForm" onsubmit="submitComputeCogsClaim(event)">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.25rem;">
            <div>
              <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--text-primary); margin-bottom:0.35rem;">
                Target Project Sprint <span style="color:#ef4444;">*</span>
              </label>
              <select id="cogsProjectId" style="width:100%; background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:inherit; font-size:0.88rem; box-sizing:border-box;">
                <option value="proj-purplebot-01">proj-purplebot-01 (Voice AI Assistant)</option>
                <option value="PRJ-GRO-001">PRJ-GRO-001 (FinTech Orchestration)</option>
                <option value="PRJ-GRO-002">PRJ-GRO-002 (Autonomous Agent Pod)</option>
                <option value="proj-mvp-01">proj-mvp-01 (Rapid MVP Delivery)</option>
              </select>
            </div>

            <div>
              <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--text-primary); margin-bottom:0.35rem;">
                Infrastructure Provider <span style="color:#ef4444;">*</span>
              </label>
              <select id="cogsVendor" style="width:100%; background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:inherit; font-size:0.88rem; box-sizing:border-box;">
                ${VENDORS.map(v => `<option value="${v}">${v}</option>`).join('')}
              </select>
            </div>
          </div>

          <div style="margin-bottom:1.25rem;">
            <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--text-primary); margin-bottom:0.35rem;">
              Compute Item Specification <span style="color:#ef4444;">*</span>
            </label>
            <select id="cogsItemType" style="width:100%; background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:inherit; font-size:0.88rem; box-sizing:border-box;">
              ${ITEM_TYPES.map(it => `<option value="${it}">${it}</option>`).join('')}
            </select>
          </div>

          <!-- Currency Pair Input -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.25rem;">
            <div>
              <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--text-primary); margin-bottom:0.35rem;">
                Claim Amount (USD $)
              </label>
              <input type="number" id="cogsAmountUsd" placeholder="e.g. 125" min="0.01" step="0.01" oninput="syncCogsCurrency('usd')" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:var(--font-mono); font-size:0.95rem; font-weight:700; box-sizing:border-box;">
            </div>

            <div>
              <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--text-primary); margin-bottom:0.35rem;">
                Amount in BDT (৳ @ 120/$) <span style="color:#ef4444;">*</span>
              </label>
              <input type="number" id="cogsAmountBdt" placeholder="e.g. 15000" min="1" step="1" oninput="syncCogsCurrency('bdt')" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:var(--font-mono); font-size:0.95rem; font-weight:700; box-sizing:border-box;">
            </div>
          </div>

          <!-- Live Margin Preview Container -->
          <div id="cogsMarginPreview">
            <!-- Rendered by updateCogsMarginPreview() -->
          </div>

          <div style="margin-bottom:1.25rem;">
            <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--text-primary); margin-bottom:0.35rem;">
              Invoice / Usage Receipt URL (or Staging Run ID)
            </label>
            <input type="url" id="cogsReceiptUrl" placeholder="https://runpod.io/receipts/inv-8821.pdf" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:inherit; font-size:0.88rem; box-sizing:border-box;">
          </div>

          <div style="margin-bottom:1.5rem;">
            <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--text-primary); margin-bottom:0.35rem;">
              Compute Workload Rationale & Description <span style="color:#ef4444;">*</span>
            </label>
            <textarea id="cogsDescription" rows="3" placeholder="e.g. H100 GPU fine-tuning inference batch for custom agent checkpoint weights" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:inherit; font-size:0.88rem; box-sizing:border-box;" required></textarea>
          </div>

          <button id="cogsSubmitBtn" type="submit" class="btn-primary" style="width:100%; padding:0.85rem; font-size:1rem; font-weight:700; border-radius:12px; cursor:pointer;">
            ⚡ Submit Compute COGS Claim
          </button>
        </form>

        <!-- Recent Project Compute Claims -->
        <div style="margin-top:2rem; border-top:1px solid rgba(255,255,255,0.08); padding-top:1.25rem;">
          <h4 style="font-size:0.95rem; font-weight:800; color:#fff; margin:0 0 0.85rem;">Recent Compute Claims</h4>
          <div id="cogsRecentClaimsList">
            <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.85rem 1rem; display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; font-size:0.85rem;">
              <div>
                <div style="font-weight:800; color:#fff;">RunPod: GPU Cluster</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">H100 batch inference run #8821</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:800; color:var(--accent-mint); font-family:var(--font-mono);">৳15,000 BDT</div>
                <div style="font-size:0.72rem; color:var(--accent-cyan);">82.5% Margin</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Initialize preview
  window.updateCogsMarginPreview();
};

