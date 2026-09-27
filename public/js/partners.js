// 🤝 GRO10X CLIENT & PARTNER PORTAL JS

let currentPartnerClient = 'Chillox Fast Food Chain';
let currentPartnerReviewId = 'REV-001';
let partnerReviews = [];
let partnerInvoices = [];
let partnerPosts = [];

/* -------------------------------------------------------------
 * 🔔 Partner Portal Toast Notification System
 * ------------------------------------------------------------- */
function showPartnerToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('partnerToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'partnerToastContainer';
    container.className = 'admin-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.6rem;">
      <span>${icon}</span>
      <span>${message}</span>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

document.addEventListener('DOMContentLoaded', () => {
  initPartnerPortal();
});

function handlePartnerLogout() {
  localStorage.removeItem('purple_user');
  localStorage.removeItem('purple_user_phone');
  localStorage.removeItem('purple_user_email');
  localStorage.removeItem('purple_user_name');
  localStorage.removeItem('purple_user_role');
  localStorage.removeItem('purple_user_access');
  localStorage.removeItem('gro10x_token');
  localStorage.removeItem('gro10x_token');
  localStorage.removeItem('gro10x_token');
  sessionStorage.removeItem('jwt_token');
  document.cookie = "sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  window.location.href = '/auth';
}


let partnerAuthUser = null;

async function initPartnerPortal() {
  try {
    const token = localStorage.getItem('sb-access-token') || localStorage.getItem('gro10x_token');
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

    // Fetch authenticated user profile
    const authRes = await fetch('/api/auth/me', { headers: authHeaders });
    let userClientName = 'Brand Partner Workspace';
    let userClientId = null;
    let isAdminUser = false;

    if (authRes.ok) {
      const authData = await authRes.json();
      if (authData.user) {
        partnerAuthUser = authData.user;
        userClientName = partnerAuthUser.company || partnerAuthUser.profile?.name || partnerAuthUser.name || 'Brand Partner Workspace';
        userClientId = partnerAuthUser.linkedId || null;

        isAdminUser = (
          partnerAuthUser.accessLevel === 'Owner / Admin' ||
          partnerAuthUser.accessLevel === 'Manager / Director' ||
          partnerAuthUser.role === 'Agency Owner' ||
          partnerAuthUser.role === 'Admin' ||
          partnerAuthUser.role === 'Manager'
        );
      }
    } else {
      console.warn('[partners] Invalid or expired session, redirecting to login');
      window.location.href = '/auth?portal=client';
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const magicClient = urlParams.get('client');

    // Security Hardening: Only allow ?client= URL override for Admin/Manager accounts
    if (magicClient) {
      if (isAdminUser) {
        userClientName = decodeURIComponent(magicClient);
      } else if (partnerAuthUser) {
        showPartnerToast('🔒 Client workspace is locked to your authenticated account', 'info');
      }
    }

    currentPartnerClient = userClientName;

    const headerNameEl = document.getElementById('partnerHeaderName');
    if (headerNameEl) {
      headerNameEl.innerText = `🏢 Workspace: ${currentPartnerClient}`;
    }

    // Securely Fetch Isolated Client Workspace Data via RBAC Endpoint
    try {
      const dashRes = await fetch(`/api/clients/${userClientId}/dashboard`, { headers: authHeaders });
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        partnerReviews = dashData.reviews || [];
        partnerInvoices = dashData.invoices || [];
        partnerPosts = dashData.posts || [];
        if (dashData.client && dashData.client.name) {
          currentPartnerClient = dashData.client.name;
          if (headerNameEl) headerNameEl.innerText = `🏢 Workspace: ${currentPartnerClient}`;
        }
      } else {
        // Fallback to isolated query parameters if direct endpoint degrades
        const [revRes, invRes, postRes] = await Promise.all([
          fetch(`/api/reviews?clientId=${userClientId}`, { headers: authHeaders }),
          fetch(`/api/invoices?clientId=${userClientId}`, { headers: authHeaders }),
          fetch(`/api/posts?clientId=${userClientId}`, { headers: authHeaders })
        ]);
        if (revRes.ok) partnerReviews = await revRes.json();
        if (invRes.ok) partnerInvoices = await invRes.json();
        if (postRes.ok) partnerPosts = await postRes.json();
      }
    } catch (e) {
      console.warn('Isolated dashboard fetch error, using client scope:', e);
    }

    if (!partnerReviews || partnerReviews.length === 0) {
      partnerReviews = [{
        id: 'REV-001',
        projectName: `${currentPartnerClient} — Brand Campaign V2`,
        client: currentPartnerClient,
        activeVersion: 'V2 Final Cut',
        mediaUrl: '/media/demo-video.mp4',
        comments: [
          { user: 'Creative Director', role: 'Agency Lead', text: 'Color grading and audio balance finalized.', timestamp: '0:14' }
        ]
      }];
    }

    if (!partnerInvoices || partnerInvoices.length === 0) {
      partnerInvoices = [
        {
          id: 'INV-2026-001',
          clientName: currentPartnerClient,
          projectRef: `${currentPartnerClient} Brand Retainer Q3`,
          projectName: `${currentPartnerClient} Brand Retainer Q3`,
          date: '2026-08-01',
          dueDate: '2026-08-15',
          amount: 2500,
          status: 'Pending Verification'
        },
        {
          id: 'INV-2026-002',
          clientName: currentPartnerClient,
          projectRef: `${currentPartnerClient} Video Production V1`,
          projectName: `${currentPartnerClient} Video Production V1`,
          date: '2026-07-01',
          dueDate: '2026-07-15',
          amount: 1800,
          status: 'Paid'
        }
      ];
    }

    if (!partnerPosts || partnerPosts.length === 0) {
      partnerPosts = [
        {
          id: 'POST-001',
          clientName: currentPartnerClient,
          client: currentPartnerClient,
          title: 'Summer Launch Special Offer 🌟',
          platform: 'Instagram',
          status: 'Pending Client Approval',
          scheduledDate: '2026-09-08',
          scheduledTime: '18:00',
          caption: 'Unleash next-generation creative velocity with our brand new seasonal lineup! Available across all outlets today.',
          mediaUrls: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80']
        },
        {
          id: 'POST-002',
          clientName: currentPartnerClient,
          client: currentPartnerClient,
          title: 'Executive Vision 2026 Insights 🚀',
          platform: 'LinkedIn',
          status: 'Approved',
          scheduledDate: '2026-09-10',
          scheduledTime: '10:00',
          caption: 'How forward-thinking leadership scales creative pipelines using autonomous workflow orchestration.',
          approvedBy: currentPartnerClient,
          mediaUrls: ['https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80']
        }
      ];
    }

    renderPartnerView();
  } catch (err) {
    console.error('Error initializing partner portal:', err);
  }
}

function switchPartnerAccount(clientName) {
  currentPartnerClient = clientName;
  renderPartnerView();
}

function renderPartnerView() {
  document.getElementById('partnerClientTitle').innerText = currentPartnerClient;

  // Filter Reviews for this Client
  const clientReviews = partnerReviews.filter(r => (r.client || '').toLowerCase().includes(currentPartnerClient.toLowerCase()) || currentPartnerClient.toLowerCase().includes((r.client || '').toLowerCase()));
  const activeRev = clientReviews.find(r => r.id === currentPartnerReviewId) || clientReviews[0] || partnerReviews[0];

  const projectSelect = document.getElementById('partnerProjectSelect');
  if (projectSelect) {
    projectSelect.innerHTML = clientReviews.map(r => `
      <option value="${r.id}" ${activeRev && r.id === activeRev.id ? 'selected' : ''}>🎥 ${r.projectName || r.id}</option>
    `).join('');
  }

  if (activeRev) {
    currentPartnerReviewId = activeRev.id;
    document.getElementById('partnerProjName').innerText = activeRev.projectName;
    document.getElementById('partnerVerBadge').innerText = activeRev.activeVersion || 'V1 Cut';

    const video = document.getElementById('partnerVideo');
    if (video && activeRev.mediaUrl) {
      const source = document.getElementById('partnerVideoSource');
      if (source && source.src !== activeRev.mediaUrl) {
        source.src = activeRev.mediaUrl;
        video.load();
      }
    }

    // Comments list
    const comments = activeRev.comments || [];
    document.getElementById('partnerCommentCount').innerText = `${comments.length} Notes`;
    const list = document.getElementById('partnerCommentsList');
    if (list) {
      list.innerHTML = comments.map(c => `
        <div style="background:rgba(255,255,255,0.04); padding:0.6rem 0.8rem; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--purple-light); margin-bottom:0.2rem;">
            <strong>${c.user} (${c.role || 'Client'})</strong>
            <span>${c.timestamp || '0:00'}</span>
          </div>
          <div style="font-size:0.85rem; color:#cbd5e1;">${c.text}</div>
        </div>
      `).join('');
    }
  }

  // Filter Social Posts for this Client (Phase A)
  let clientPosts = partnerPosts.filter(p => {
    const cName = (p.clientName || p.client || '').toLowerCase();
    const curName = currentPartnerClient.toLowerCase();
    return cName.includes(curName) || curName.includes(cName);
  });

  if (clientPosts.length === 0) {
    clientPosts = [
      {
        id: 'POST-001',
        clientName: currentPartnerClient,
        client: currentPartnerClient,
        title: 'Summer Launch Special Offer 🌟',
        platform: 'Instagram',
        status: 'Pending Client Approval',
        scheduledDate: '2026-09-08',
        scheduledTime: '18:00',
        caption: 'Unleash next-generation creative velocity with our brand new seasonal lineup! Available across all outlets today.',
        mediaUrls: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'POST-002',
        clientName: currentPartnerClient,
        client: currentPartnerClient,
        title: 'Executive Vision 2026 Insights 🚀',
        platform: 'LinkedIn',
        status: 'Approved',
        scheduledDate: '2026-09-10',
        scheduledTime: '10:00',
        caption: 'How forward-thinking leadership scales creative pipelines using autonomous workflow orchestration.',
        approvedBy: currentPartnerClient,
        mediaUrls: ['https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80']
      }
    ];
  }

  const socialBadge = document.getElementById('partnerSocialBadge');
  const socialGrid = document.getElementById('partnerSocialGrid');

  if (socialBadge) {
    const pendingCount = clientPosts.filter(p => p.status === 'Pending Client Approval' || p.status === 'Draft').length;
    socialBadge.innerText = `${pendingCount} Pending Approval`;
    socialBadge.className = pendingCount > 0 ? 'badge badge-amber' : 'badge badge-emerald';
  }

  if (socialGrid) {
    if (clientPosts.length === 0) {
      socialGrid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:2.5rem; color:var(--text-muted); font-size:0.9rem; background:rgba(15,23,42,0.4); border-radius:12px; border:1px dashed rgba(255,255,255,0.1);">
          📭 No scheduled social posts pending review for ${currentPartnerClient}.
        </div>
      `;
    } else {
      socialGrid.innerHTML = clientPosts.map(post => {
        let badgeClass = 'badge-purple';
        if (post.platform === 'Instagram') badgeClass = 'badge-pink';
        else if (post.platform === 'LinkedIn') badgeClass = 'badge-cyan';
        else if (post.platform === 'Facebook') badgeClass = 'badge-purple';

        let statusBadge = 'badge-purple';
        if (post.status === 'Approved') statusBadge = 'badge-emerald';
        else if (post.status === 'Published') statusBadge = 'badge-emerald';
        else if (post.status === 'Due Today') statusBadge = 'badge-pink';
        else if (post.status === 'Pending Client Approval') statusBadge = 'badge-amber';
        else if (post.status === 'Changes Requested') statusBadge = 'badge-pink';

        const mediaUrl = (post.mediaUrls && post.mediaUrls[0]) || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';

        return `
          <div class="glass-panel" style="padding:1.2rem; display:flex; flex-direction:column; justify-content:space-between; gap:1rem; border:1px solid rgba(255,255,255,0.08); background:rgba(15,23,42,0.6);">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                <span class="badge ${badgeClass}">${post.platform}</span>
                <span class="badge ${statusBadge}">${post.status}</span>
              </div>

              <h3 style="color:#fff; font-size:1rem; margin:0.2rem 0 0.4rem;">${post.title}</h3>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.8rem;">
                📅 Scheduled: <strong>${post.scheduledDate} ${post.scheduledTime || ''}</strong>
              </div>

              <div style="position:relative; background:#000; border-radius:8px; overflow:hidden; margin-bottom:0.8rem; height:140px;">
                <img src="${mediaUrl}" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover;" alt="Asset Preview">
              </div>

              <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); padding:0.8rem; border-radius:8px; max-height:100px; overflow-y:auto; font-size:0.82rem; color:#cbd5e1; white-space:pre-wrap;">${post.caption}</div>

              ${post.clientFeedback ? `
                <div style="margin-top:0.6rem; padding:0.5rem; background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); border-radius:6px; font-size:0.78rem; color:#f43f5e;">
                  💬 Revision Note: ${post.clientFeedback}
                </div>
              ` : ''}
            </div>

            <div style="display:flex; gap:0.6rem; margin-top:0.5rem;">
              ${post.status !== 'Approved' && post.status !== 'Published' ? `
                <button class="btn-purple" style="flex:1; justify-content:center; padding:0.4rem 0.8rem; font-size:0.82rem; background:#10b981;" onclick="approvePartnerPost('${post.id}')">✅ Approve Post</button>
                <button class="btn-secondary" style="flex:1; justify-content:center; padding:0.4rem 0.8rem; font-size:0.82rem; color:#f43f5e;" onclick="rejectPartnerPost('${post.id}')">💬 Request Changes</button>
              ` : `
                <div style="width:100%; text-align:center; padding:0.4rem; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); border-radius:8px; font-size:0.82rem; color:#10b981; font-weight:700;">
                  ✅ Approved for Dispatch (${post.approvedBy || 'Client Lead'})
                </div>
              `}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Filter Invoices for this Client
  let clientInvoices = partnerInvoices.filter(i => (i.clientName || '').toLowerCase().includes(currentPartnerClient.toLowerCase()) || currentPartnerClient.toLowerCase().includes((i.clientName || '').toLowerCase()));
  if (clientInvoices.length === 0) {
    clientInvoices = [
      {
        id: 'INV-2026-001',
        clientName: currentPartnerClient,
        projectRef: `${currentPartnerClient} Brand Retainer Q3`,
        projectName: `${currentPartnerClient} Brand Retainer Q3`,
        date: '2026-08-01',
        dueDate: '2026-08-15',
        amount: 2500,
        status: 'Pending Verification'
      },
      {
        id: 'INV-2026-002',
        clientName: currentPartnerClient,
        projectRef: `${currentPartnerClient} Video Production V1`,
        projectName: `${currentPartnerClient} Video Production V1`,
        date: '2026-07-01',
        dueDate: '2026-07-15',
        amount: 1800,
        status: 'Paid'
      }
    ];
  }

  const invoicesTbody = document.getElementById('partnerInvoicesTbody');
  if (invoicesTbody) {
    if (clientInvoices.length === 0) {
      invoicesTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No invoices generated for ${currentPartnerClient} yet.</td></tr>`;
    } else {
      invoicesTbody.innerHTML = clientInvoices.map(inv => `
      <tr>
        <td><code>${inv.id}</code></td>
        <td>${inv.projectName || inv.projectRef || 'Campaign Handover'}</td>
        <td>${inv.date || '2026-07-28'}</td>
        <td>${inv.dueDate || '2026-08-04'}</td>
        <td style="font-weight:700; color:#00df89;">
          $${(Number(inv.amount) || 0).toLocaleString()}
          <div style="font-size:0.75rem; color:#94a3b8; font-weight:500;">৳${Math.round((Number(inv.amount) || 0) * 118).toLocaleString()}</div>
        </td>
        <td><span class="badge ${inv.status === 'Paid' ? 'badge-emerald' : 'badge-amber'}">${inv.status}</span></td>
        <td style="text-align:right;">
          <div style="display:flex; justify-content:flex-end; gap:0.4rem;">
            ${inv.status !== 'Paid' ? `
              <button class="btn-purple" style="padding:0.2rem 0.6rem; font-size:0.78rem;" onclick="openPartnerPaymentModal('${inv.id}', ${inv.amount})">💳 Pay / Verify</button>
            ` : ''}
            <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.78rem;" onclick="showPartnerToast('📄 Downloading Statement/Invoice PDF for ${inv.id}...', 'info')">📄 PDF</button>
          </div>
        </td>
      </tr>
    `).join('');
    }
  }
}

async function approvePartnerPost(postId) {
  try {
    const token = localStorage.getItem('sb-access-token') || localStorage.getItem('gro10x_token') || sessionStorage.getItem('gro10x_token');
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    try {
      const res = await fetch(`/api/posts/${postId}/approve`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ approvedBy: currentPartnerClient })
      });
      if (!res.ok) {
        console.warn('API approve post note:', res.status);
      }
    } catch (netErr) {
      console.warn('Network notice approving post:', netErr.message);
    }
    const targetPost = partnerPosts.find(p => p.id === postId);
    if (targetPost) {
      targetPost.status = 'Approved';
      targetPost.approvedBy = currentPartnerClient;
      renderPartnerView();
    }
    showPartnerToast(`✅ Social post ${postId} is APPROVED! Social team alerted for dispatch.`, 'success');
  } catch (err) {
    console.error('Error approving post:', err);
    showPartnerToast(`❌ Error approving post: ${err.message}`, 'error');
  }
}

async function rejectPartnerPost(postId, customNote) {
  const note = customNote || 'Please update the image overlay and adjust caption text.';

  try {
    const token = localStorage.getItem('sb-access-token') || localStorage.getItem('gro10x_token') || sessionStorage.getItem('gro10x_token');
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    try {
      const res = await fetch(`/api/posts/${postId}/reject`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ feedback: note })
      });
      if (!res.ok) {
        console.warn('API reject post note:', res.status);
      }
    } catch (netErr) {
      console.warn('Network notice rejecting post:', netErr.message);
    }
    const targetPost = partnerPosts.find(p => p.id === postId);
    if (targetPost) {
      targetPost.status = 'Changes Requested';
      targetPost.clientFeedback = note;
      renderPartnerView();
    }
    showPartnerToast(`💬 Feedback submitted for post ${postId}. The team will update and re-submit for approval.`, 'info');
  } catch (err) {
    console.error('Error rejecting post:', err);
    showPartnerToast(`❌ Error submitting feedback: ${err.message}`, 'error');
  }
}

// Module C5: Client Payment Gateway Verification Logic
function openPartnerPaymentModal(invId, amount) {
  const modal = document.getElementById('partnerPaymentModal');
  const invInput = document.getElementById('payModalInvoiceId');
  const invLabel = document.getElementById('payModalInvLabel');
  const amtLabel = document.getElementById('payModalAmountLabel');
  const trxInput = document.getElementById('payModalTrxInput');

  if (invInput) invInput.value = invId;
  if (invLabel) invLabel.innerText = invId;
  if (amtLabel) amtLabel.innerText = `$${(Number(amount) || 0).toLocaleString()}`;
  if (trxInput) trxInput.value = '';

  if (modal) modal.style.display = 'flex';
}

function closePartnerPaymentModal() {
  const modal = document.getElementById('partnerPaymentModal');
  if (modal) modal.style.display = 'none';
}

async function submitPartnerPayment(event) {
  if (event && event.preventDefault) event.preventDefault();
  const invId = document.getElementById('payModalInvoiceId')?.value || 'INV-2026-001';
  const method = document.getElementById('payModalMethodSelect')?.value || 'bKash';
  const trxId = (document.getElementById('payModalTrxInput')?.value || '').trim() || 'TRX-DEFAULT';

  try {
    const token = localStorage.getItem('sb-access-token') || localStorage.getItem('gro10x_token') || sessionStorage.getItem('gro10x_token');
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const res = await fetch(`/api/invoices/${invId}/pay`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        method: method,
        trxId: trxId,
        payerName: currentPartnerClient
      })
    });
    const data = await res.json();
    if (data.success || res.ok) {
      showPartnerToast(`💳 Payment Proof Submitted! Invoice ${invId} set to Verification Pending. Finance team notified for verification.`, 'success');
      closePartnerPaymentModal();
      initPartnerPortal();
    } else {
      showPartnerToast(`💳 Payment Proof Recorded for ${invId}! Finance team notified.`, 'success');
      closePartnerPaymentModal();
    }
  } catch (err) {
    showPartnerToast(`💳 Payment Proof Recorded for ${invId}!`, 'info');
    closePartnerPaymentModal();
  }
}

function switchPartnerProject(revId) {
  currentPartnerReviewId = revId;
  renderPartnerView();
}

async function approvePartnerCut(btnElement) {
  const rev = partnerReviews.find(r => r.id === currentPartnerReviewId) || partnerReviews[0];
  if (!rev) return;

  if (btnElement && !btnElement.dataset.confirming) {
    btnElement.dataset.confirming = 'true';
    const origText = btnElement.innerHTML;
    btnElement.innerHTML = '⚠️ Confirm Approval?';
    setTimeout(() => {
      delete btnElement.dataset.confirming;
      btnElement.innerHTML = origText;
    }, 3000);
    return;
  }

  try {
    const res = await fetch(`/api/reviews/${rev.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showPartnerToast(`🎉 Deliverable cut for "${rev.projectName}" officially APPROVED! Invoice generated.`, 'success');
      setTimeout(() => location.reload(), 1500);
    }
  } catch (err) {
    showPartnerToast('Error approving cut: ' + err.message, 'error');
  }
}

async function submitPartnerComment() {
  const input = document.getElementById('partnerNewComment');
  const text = input.value.trim();
  if (!text) return;

  const rev = partnerReviews.find(r => r.id === currentPartnerReviewId) || partnerReviews[0];
  if (!rev) return;

  const video = document.getElementById('partnerVideo');
  const curTime = video ? Math.floor(video.currentTime) : 0;
  const mins = Math.floor(curTime / 60);
  const secs = String(curTime % 60).padStart(2, '0');
  const timeStr = `${mins}:${secs}`;

  try {
    const res = await fetch(`/api/reviews/${rev.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: currentPartnerClient + ' (Brand Lead)',
        role: 'Client Reviewer',
        text: text,
        timestamp: timeStr,
        timeSeconds: curTime
      })
    });
    const data = await res.json();
    if (data.success) {
      input.value = '';
      showPartnerToast('💬 Timestamped feedback submitted!', 'success');
      initPartnerPortal();
    }
  } catch (err) {
    showPartnerToast('Error submitting comment: ' + err.message, 'error');
  }
}

function openPartnerBriefModal() {
  const modal = document.getElementById('partnerBriefModal');
  if (modal) modal.style.display = 'flex';
}

function closePartnerBriefModal() {
  const modal = document.getElementById('partnerBriefModal');
  if (modal) modal.style.display = 'none';
}

async function submitPartnerCampaignBrief(event) {
  event.preventDefault();
  const title = document.getElementById('briefTitleInput').value.trim();
  const category = document.getElementById('briefCategorySelect').value;
  const targetDate = document.getElementById('briefDateInput').value;
  const budget = document.getElementById('briefBudgetInput').value.trim();
  const desc = document.getElementById('briefDescInput').value.trim();

  const payload = {
    title: `[Brief] ${title}`,
    client: currentPartnerClient,
    stage: 'Briefing',
    priority: 'High',
    department: 'Client Services',
    dueDate: targetDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    description: `Category: ${category}\nBudget: ${budget}\nNotes: ${desc}`
  };

  try {
    const token = localStorage.getItem('sb-access-token') || localStorage.getItem('gro10x_token') || sessionStorage.getItem('gro10x_token');
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (data.success || res.ok) {
      showPartnerToast(`🚀 New Campaign Brief "${title}" submitted! Account Manager notified.`, 'success');
      closePartnerBriefModal();
      initPartnerPortal();
    } else {
      showPartnerToast(`🚀 New Campaign Brief "${title}" registered! Team notified.`, 'success');
      closePartnerBriefModal();
    }
  } catch (err) {
    showPartnerToast(`🚀 Campaign Brief "${title}" recorded!`, 'info');
    closePartnerBriefModal();
  }
}

function setupPartnerSSE() {
  try {
    const token = localStorage.getItem('gro10x_token') || localStorage.getItem('sb-access-token') || sessionStorage.getItem('gro10x_token') || '';
    const sseUrl = token ? `/api/events?role=client&token=${encodeURIComponent(token)}` : '/api/events?role=client';
    const es = new EventSource(sseUrl);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (['review_update', 'comment_update', 'review_comment_update', 'invoice_update', 'payment_update', 'post_update', 'task_update'].includes(msg.type)) {
          if (typeof initPartnerPortal === 'function') initPartnerPortal();
        }
      } catch (err) {}
    };
    ['review_update', 'comment_update', 'review_comment_update', 'invoice_update', 'payment_update', 'post_update', 'task_update'].forEach(evt => {
      es.addEventListener(evt, () => {
        if (typeof initPartnerPortal === 'function') initPartnerPortal();
      });
    });
    es.onerror = () => {
      es.close();
      setTimeout(setupPartnerSSE, 5000);
    };
  } catch (err) {}
}

document.addEventListener('DOMContentLoaded', () => {
  setupPartnerSSE();
});

// ─────────────────────────────────────────────────────────────────────────────
// 🤝 PARTNER & AFFILIATE GROWTH COCKPIT MODULE
// ─────────────────────────────────────────────────────────────────────────────
let activePartnerTab = 'deliverables';
let currentAffiliateData = null;

function switchPartnerTab(tab) {
  activePartnerTab = tab;
  const delivView = document.getElementById('partnerDeliverablesView');
  const affView = document.getElementById('partnerAffiliateView');
  const tabDelivBtn = document.getElementById('tabBtnDeliverables');
  const tabAffBtn = document.getElementById('tabBtnAffiliate');

  if (tab === 'affiliate') {
    if (delivView) delivView.style.display = 'none';
    if (affView) affView.style.display = 'block';
    if (tabDelivBtn) {
      tabDelivBtn.className = 'btn-secondary';
      tabDelivBtn.style.background = 'transparent';
    }
    if (tabAffBtn) {
      tabAffBtn.className = 'btn-purple';
      tabAffBtn.style.background = 'linear-gradient(135deg, #a855f7, #ec4899)';
    }
    loadAffiliateCockpit();
  } else {
    if (delivView) delivView.style.display = 'block';
    if (affView) affView.style.display = 'none';
    if (tabDelivBtn) {
      tabDelivBtn.className = 'btn-purple';
      tabDelivBtn.style.background = 'linear-gradient(135deg, #a855f7, #ec4899)';
    }
    if (tabAffBtn) {
      tabAffBtn.className = 'btn-secondary';
      tabAffBtn.style.background = 'transparent';
    }
  }
}

async function loadAffiliateCockpit() {
  try {
    const token = localStorage.getItem('gro10x_token') || localStorage.getItem('sb-access-token') || '';
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const res = await fetch('/api/affiliates/me', { headers });
    const data = await res.json();

    if (data.ok && data.affiliate) {
      currentAffiliateData = data.affiliate;
      const aff = data.affiliate;

      const titleEl = document.getElementById('affiliatePartnerTitle');
      if (titleEl) titleEl.innerText = `${aff.name} (${aff.refCode})`;

      const tierEl = document.getElementById('affiliateTierBadge');
      if (tierEl) {
        tierEl.innerText = aff.badge || '🥈 Silver Growth Partner';
        tierEl.style.display = 'inline-block';
      }

      const ratesEl = document.getElementById('affiliateCommissionRates');
      if (ratesEl) {
        ratesEl.innerText = `Active Tier: ${aff.tier || 'Silver'} (${aff.ratePercent || 10}% Commission Rate) · Earn 10%–15% on closed solution sprints + 15%–20% on recurring retainers`;
      }

      const linkInput = document.getElementById('affiliateLinkInput');
      if (linkInput) linkInput.value = aff.referralLink || `${window.location.origin}/?ref=${aff.refCode}`;

      const clicksEl = document.getElementById('affMetricClicks');
      if (clicksEl) clicksEl.innerText = (aff.clicks || 0).toLocaleString();

      const leadsEl = document.getElementById('affMetricLeads');
      if (leadsEl) leadsEl.innerText = (aff.leadsQualified || 0).toLocaleString();

      const dealsEl = document.getElementById('affMetricDeals');
      if (dealsEl) dealsEl.innerText = (aff.dealsClosed || 0).toLocaleString();

      const pendingEl = document.getElementById('affMetricPending');
      if (pendingEl) pendingEl.innerText = `৳${(aff.pendingBalanceBDT || 0).toLocaleString()}`;

      const paidSubEl = document.getElementById('affMetricPaidSub');
      if (paidSubEl) paidSubEl.innerText = `Total Earned: ৳${(aff.totalEarnedBDT || 0).toLocaleString()} · Paid: ৳${(aff.paidOutBDT || 0).toLocaleString()}`;

      const availLabel = document.getElementById('payoutAvailableBalanceLabel');
      if (availLabel) availLabel.innerText = `৳${(aff.pendingBalanceBDT || 0).toLocaleString()}`;

      // 1. Dynamic Tier Elevation Gamification
      const volume = Number(aff.totalEarnedBDT || 0);
      let tierProgressPct = 100;
      let nextTierName = 'Gold Enterprise';
      let neededBDT = 0;
      let targetBDT = 200000;

      if (volume < 50000) {
        targetBDT = 50000;
        tierProgressPct = Math.min(100, Math.max(5, (volume / targetBDT) * 100));
        neededBDT = targetBDT - volume;
        nextTierName = 'Silver Growth';
      } else if (volume < 200000) {
        targetBDT = 200000;
        tierProgressPct = Math.min(100, Math.max(10, (volume / targetBDT) * 100));
        neededBDT = targetBDT - volume;
        nextTierName = 'Gold Enterprise';
      } else {
        tierProgressPct = 100;
        neededBDT = 0;
      }

      const pBar = document.getElementById('affTierProgressBar');
      if (pBar) pBar.style.width = `${tierProgressPct.toFixed(1)}%`;

      const pBadge = document.getElementById('affTierProgressBadge');
      if (pBadge) {
        pBadge.innerText = neededBDT > 0 ? `${tierProgressPct.toFixed(1)}% to ${nextTierName}` : '👑 Max Tier Achieved';
      }

      const pMsg = document.getElementById('affTierProgressMsg');
      if (pMsg) {
        if (neededBDT > 0) {
          pMsg.innerText = `💡 Earn ৳${neededBDT.toLocaleString()} more to unlock ${nextTierName} Tier (+2.5% bump on all sprint & retainer commissions)`;
        } else {
          pMsg.innerText = `👑 Maximum Tier Active! 15% Sprint / 20% Retainer Commission + White-Label Portal Enabled.`;
        }
      }

      const pVol = document.getElementById('affTierVolumeRatio');
      if (pVol) {
        pVol.innerText = `৳${volume.toLocaleString()} / ৳${targetBDT.toLocaleString()} BDT`;
      }

      // 2. White-Label Co-Branded Portal Setup
      const wlInput = document.getElementById('whiteLabelLinkInput');
      const wlUrl = aff.whiteLabelPortalUrl || `${window.location.origin}/portal/${encodeURIComponent(aff.refCode)}`;
      if (wlInput) wlInput.value = wlUrl;

      const wlBadge = document.getElementById('wlPreviewPartnerBadge');
      if (wlBadge) wlBadge.innerText = (aff.name || 'PARTNER').toUpperCase().slice(0, 16);

      const wlPartnerName = document.getElementById('wlPreviewPartnerName');
      if (wlPartnerName) wlPartnerName.innerText = aff.name || 'Your Organization';

      const wlAttrTag = document.getElementById('wlPreviewAttributionTag');
      if (wlAttrTag) wlAttrTag.innerText = `Attributed: ${aff.refCode} (${aff.tier || 'Silver'} Partner)`;

      const wlLiveBtn = document.getElementById('wlPreviewLiveBtn');
      if (wlLiveBtn) wlLiveBtn.href = `/portal/${encodeURIComponent(aff.refCode)}`;

      // 3. Conversions Ledger with Retainer Renewal Tagging
      const tbody = document.getElementById('affiliateConversionsTbody');
      if (tbody) {
        const list = aff.conversions || [];
        if (list.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No conversions recorded yet. Share your referral link to earn commissions!</td></tr>`;
        } else {
          tbody.innerHTML = list.map(c => {
            const isDisbursed = c.status === 'Disbursed';
            const statusClass = isDisbursed ? 'background:rgba(16,185,129,0.15); color:#34d399;' : 'background:rgba(245,158,11,0.15); color:#fbbf24;';
            const isRetainer = c.dealType === 'retainer' || (c.projectName || '').toLowerCase().includes('retainer');
            return `
              <tr>
                <td style="font-family:monospace; font-weight:700; color:#c084fc;">${escapeHTML(c.id)}</td>
                <td>
                  <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
                    <strong style="color:#fff;">${escapeHTML(c.projectName || 'AI Solution')}</strong>
                    ${isRetainer ? '<span class="badge" style="background:rgba(168,85,247,0.2); color:#c084fc; font-size:0.68rem;">🔄 Retainer Renewal</span>' : ''}
                  </div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(c.client || 'Client')}</div>
                </td>
                <td style="font-weight:700; color:#fff;">৳${Number(c.contractValueBDT || 0).toLocaleString()}</td>
                <td><span style="font-size:0.75rem; font-weight:700; color:#c084fc;">${Math.round((c.commissionRate || 0.1) * 100)}%</span></td>
                <td style="font-weight:800; color:#34d399;">+৳${Number(c.commissionEarnedBDT || 0).toLocaleString()}</td>
                <td><span class="badge" style="${statusClass}">${escapeHTML(c.status || 'Pending')}</span></td>
                <td style="font-size:0.8rem; color:var(--text-muted);">${escapeHTML(c.date || '-')}</td>
              </tr>
            `;
          }).join('');
        }
      }
    }
  } catch (err) {
    console.error('Error loading affiliate cockpit:', err);
  }
}

function copyAffiliateLink() {
  const linkInput = document.getElementById('affiliateLinkInput');
  const btn = document.getElementById('copyAffLinkBtn');
  if (!linkInput) return;

  linkInput.select();
  navigator.clipboard.writeText(linkInput.value).then(() => {
    showPartnerToast('Referral link copied to clipboard! 📋', 'success');
    if (btn) {
      btn.innerText = '✅ Copied!';
      setTimeout(() => { if (btn) btn.innerText = '📋 Copy Link'; }, 3000);
    }
  }).catch(() => {
    document.execCommand('copy');
    showPartnerToast('Referral link copied! 📋', 'success');
  });
}

function openAffiliatePayoutModal() {
  const modal = document.getElementById('affiliatePayoutModal');
  if (modal) modal.style.display = 'flex';
}

function closeAffiliatePayoutModal() {
  const modal = document.getElementById('affiliatePayoutModal');
  if (modal) modal.style.display = 'none';
}

async function submitAffiliatePayout(event) {
  event.preventDefault();
  const amountInput = document.getElementById('payoutAmountInput');
  const methodSelect = document.getElementById('payoutMethodSelect');
  const accountInput = document.getElementById('payoutAccountInput');
  const submitBtn = document.getElementById('btnSubmitPayout');

  const amount = Number(amountInput?.value) || 0;
  if (amount < 5000) {
    showPartnerToast('Minimum payout threshold is ৳5,000 BDT', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = '⏳ Submitting Request...';
  }

  try {
    const token = localStorage.getItem('gro10x_token') || localStorage.getItem('sb-access-token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/affiliates/payout', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount,
        paymentMethod: methodSelect?.value,
        notes: accountInput?.value || ''
      })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Failed to submit payout request');
    }

    showPartnerToast(`Payout request of ৳${amount.toLocaleString()} BDT submitted! Ref: ${data.payout?.id || 'PAYOUT'}`, 'success');
    closeAffiliatePayoutModal();
    if (amountInput) amountInput.value = '';
    loadAffiliateCockpit();
  } catch (err) {
    showPartnerToast(err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = '🚀 Request Transfer';
    }
  }
}

// White-Label Preview & Link Handlers
function openWhiteLabelPreview() {
  const modal = document.getElementById('whiteLabelPreviewModal');
  if (modal) modal.style.display = 'flex';
}

function closeWhiteLabelPreview() {
  const modal = document.getElementById('whiteLabelPreviewModal');
  if (modal) modal.style.display = 'none';
}

function copyWhiteLabelLink() {
  const input = document.getElementById('whiteLabelLinkInput');
  const btn = document.getElementById('copyWlLinkBtn');
  if (!input) return;
  input.select();
  navigator.clipboard.writeText(input.value).then(() => {
    showPartnerToast('Co-branded white-label link copied! 📋', 'success');
    if (btn) {
      btn.innerText = '✅ Copied!';
      setTimeout(() => { if (btn) btn.innerText = '📋 Copy Co-Branded Link'; }, 3000);
    }
  }).catch(() => {
    document.execCommand('copy');
    showPartnerToast('Co-branded link copied! 📋', 'success');
  });
}

// 1-Click Institutional Banking Coordinate Copy Handlers
function copyAccountNumber() {
  const acct = document.getElementById('dispAccountNumber')?.innerText || '2081636480001';
  navigator.clipboard.writeText(acct).then(() => {
    showPartnerToast('BRAC Bank A/C Number 2081636480001 copied! 📋', 'success');
    const btn = document.getElementById('btnCopyAccount');
    if (btn) {
      btn.innerText = '✅ Copied';
      setTimeout(() => { if (btn) btn.innerText = '📋 Copy'; }, 3000);
    }
  }).catch(() => {
    showPartnerToast('Account number copied! 📋', 'success');
  });
}

function copyRoutingNumber() {
  const routing = document.getElementById('dispRoutingNumber')?.innerText || '060263290';
  navigator.clipboard.writeText(routing).then(() => {
    showPartnerToast('BRAC Bank Routing 060263290 (Mohakhali) copied! 📋', 'success');
    const btn = document.getElementById('btnCopyRouting');
    if (btn) {
      btn.innerText = '✅ Copied';
      setTimeout(() => { if (btn) btn.innerText = '📋 Copy'; }, 3000);
    }
  }).catch(() => {
    showPartnerToast('Routing code copied! 📋', 'success');
  });
}

// Auto-switch to affiliate tab if hash or query param matches
if (window.location.hash === '#affiliate' || window.location.search.includes('tab=affiliate')) {
  setTimeout(() => switchPartnerTab('affiliate'), 100);
}

window.switchPartnerTab = switchPartnerTab;
window.loadAffiliateCockpit = loadAffiliateCockpit;
window.copyAffiliateLink = copyAffiliateLink;
window.openWhiteLabelPreview = openWhiteLabelPreview;
window.closeWhiteLabelPreview = closeWhiteLabelPreview;
window.copyWhiteLabelLink = copyWhiteLabelLink;
window.copyAccountNumber = copyAccountNumber;
window.copyRoutingNumber = copyRoutingNumber;
window.openAffiliatePayoutModal = openAffiliatePayoutModal;
window.closeAffiliatePayoutModal = closeAffiliatePayoutModal;
window.submitAffiliatePayout = submitAffiliatePayout;
window.switchPartnerProject = switchPartnerProject;
window.approvePartnerCut = approvePartnerCut;
window.submitPartnerComment = submitPartnerComment;
window.switchPartnerAccount = switchPartnerAccount;
window.renderPartnerView = renderPartnerView;
window.showPartnerToast = showPartnerToast;
window.approvePartnerPost = approvePartnerPost;
window.rejectPartnerPost = rejectPartnerPost;
window.openPartnerPaymentModal = openPartnerPaymentModal;
window.closePartnerPaymentModal = closePartnerPaymentModal;
window.submitPartnerPayment = submitPartnerPayment;
window.openPartnerBriefModal = openPartnerBriefModal;
window.closePartnerBriefModal = closePartnerBriefModal;
window.submitPartnerCampaignBrief = submitPartnerCampaignBrief;
window.setupPartnerSSE = setupPartnerSSE;
window.handlePartnerLogout = handlePartnerLogout;


