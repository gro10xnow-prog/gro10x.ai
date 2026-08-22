/**
 * public/crew/modules/expenses.js
 * Native Web Expense Claim Submission Module for Crew Workspace
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

window.CREW_MODULES.expenses = async function(container) {
  const me = await CREW_API.getMe().catch(() => ({}));
  const user = me.user || {};
  const empCode = user.emp_code || user.id || 'PBD-001';
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

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">🧾 Submit Expense Claim</h1>
      <div style="font-size:0.88rem; color:var(--text-muted);">Submit out-of-pocket project expenses for reimbursement via bKash.</div>
    </div>

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
        ℹ️ Approved claims are disbursed directly to your verified bKash mobile number during standard payout cycles.
      </div>

      <button id="crewExpSubmitBtn" class="btn-primary" style="width:100%; padding:0.85rem; font-size:1rem; font-weight:700; border-radius:12px; cursor:pointer;" data-emp-code="${empCode}" data-emp-name="${(empName || '').replace(/"/g, '&quot;')}" onclick="submitCrewExpense()">
        ✅ Submit Expense Claim
      </button>
    </div>
  `;
};
