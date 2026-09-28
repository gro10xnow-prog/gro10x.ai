/**
 * public/client/modules/retainer.js
 * Retainer Health & Service Utilization Dashboard
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
var escapeHTML = window.escapeHTML || function(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; };

window.CLIENT_MODULES.retainer = async function(container) {
  try {
    const me = await CLIENT_API.get('/auth/me').catch(() => ({}));
    let localUser = {};
    try { localUser = JSON.parse(localStorage.getItem('purple_user') || '{}'); } catch(e) {}
    const user = me?.user || me || localUser;
    const clientName = user.company || user.name || '';

    const [posts, rawClientInfo, reviews, projects] = await Promise.all([
      clientName 
        ? CLIENT_API.get(`/posts/client/${encodeURIComponent(clientName)}`).catch(() => CLIENT_API.get('/posts').catch(() => []))
        : CLIENT_API.get('/posts').catch(() => []),
      CLIENT_API.get('/clients/me').catch(() => ({})),
      CLIENT_API.get('/reviews').catch(() => []),
      CLIENT_API.get('/projects').catch(() => [])
    ]);

    const clientInfo = rawClientInfo?.client || rawClientInfo || {};

    // Retainer Hours Bank (Engine 2)
    const projectList = Array.isArray(projects) ? projects : [];
    const bankProject = projectList.find(p => p.retainerHours || p.retainer_hours || p.workflowType === 'composite_bundle' || p.workflow_type === 'composite_bundle') || projectList[0] || null;

    let bank = null;
    if (bankProject) {
      try {
        const bRes = await CLIENT_API.get(`/projects/${encodeURIComponent(bankProject.id)}/retainer-bank`).catch(() => null);
        if (bRes && (bRes.ok || bRes.bank)) {
          bank = bRes.bank || bRes;
        }
      } catch (_) {}
    }

    const clientRetainerHours = Number(clientInfo.retainerHours || clientInfo.retainer_hours || 0);

    if (!bank) {
      bank = {
        totalPurchasedHours: clientRetainerHours,
        rolloverHours: 0,
        totalAvailableHours: clientRetainerHours,
        usedHours: 0,
        remainingHours: clientRetainerHours,
        burnRatePercent: 0,
        status: clientRetainerHours > 0 ? 'healthy' : 'unallocated',
        hourlyRateUsd: 50,
        billingCycleStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        billingCycleEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString(),
        logs: []
      };
    }

    // Retainer calculations
    const approvedPosts = (posts || []).filter(p => p.status === 'Approved' || p.status === 'Published').length;
    const pendingPosts = (posts || []).filter(p => p.status === 'Pending Client Approval' || p.status === 'Client Review').length;
    const totalPosts = (posts || []).length;

    const approvedReels = (posts || []).filter(p => (p.platform === 'Instagram' || p.format === 'reel') && (p.status === 'Approved' || p.status === 'Published')).length;
    const approvedStatics = (posts || []).filter(p => (p.platform === 'Facebook' || p.platform === 'LinkedIn' || p.format === 'static') && (p.status === 'Approved' || p.status === 'Published')).length;
    const approvedReviews = (reviews || []).filter(r => r.isApproved || r.status === 'Approved').length;

    // Monthly Quota dynamically calculated from client profile or active deliverables
    const agreedQuota = clientInfo.agreedQuota || {
      reels: { agreed: Math.max(approvedReels, 4), delivered: approvedReels },
      statics: { agreed: Math.max(approvedStatics, 8), delivered: approvedStatics },
      commercials: { agreed: Math.max(approvedReviews, 1), delivered: approvedReviews },
      strategy: { agreed: 2, delivered: Math.min(2, Math.ceil(totalPosts / 4) || 1) }
    };

    const totalAgreed = agreedQuota.reels.agreed + agreedQuota.statics.agreed + agreedQuota.commercials.agreed + agreedQuota.strategy.agreed;
    const totalDelivered = agreedQuota.reels.delivered + agreedQuota.statics.delivered + agreedQuota.commercials.delivered + agreedQuota.strategy.delivered;
    const utilizationPct = Math.min(100, Math.round((totalDelivered / totalAgreed) * 100));

    // Current Month Cycle Days
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthProgressPct = Math.round((currentDay / daysInMonth) * 100);

    const isPaceHealthy = utilizationPct >= (monthProgressPct - 15);
    const msaUrl = bankProject ? `/msa-view.html?id=${encodeURIComponent(bankProject.id)}` : '/msa-view.html';

    let bankBadgeClass = 'badge-emerald';
    let bankBadgeText = '🟢 Healthy Capacity';
    if (bank.status === 'critical_overage') {
      bankBadgeClass = 'badge-pink';
      bankBadgeText = '🚨 Critical Overage';
    } else if (bank.status === 'critical_capacity') {
      bankBadgeClass = 'badge-pink';
      bankBadgeText = '⚠️ High Utilization (< 15% Remaining)';
    } else if (bank.status === 'nearing_capacity') {
      bankBadgeClass = 'badge-amber';
      bankBadgeText = '🟡 Nearing Capacity (>=75%)';
    } else if (bank.status === 'unallocated') {
      bankBadgeClass = 'badge-blue';
      bankBadgeText = '⚪ Unallocated';
    }

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size:1.55rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.35rem;">
            ⚡ Retainer Health & Service Utilization
          </h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">
            Real-time monthly deliverable pacing, engineering hours burn-down, and service agreement transparency.
          </div>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <a href="#brief" class="btn-primary" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
            📝 Add Scope / Brief
          </a>
          <a href="${msaUrl}" target="_blank" class="btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
            📜 Legal MSA & NDA
          </a>
        </div>
      </div>

      <!-- Engine 2: Engineering Retainer Hours Bank & Burn-Down -->
      <div class="card-glass" style="background:linear-gradient(135deg, rgba(6,78,59,0.25), rgba(15,23,42,0.6)); border:1px solid rgba(16,185,129,0.35); margin-bottom:1.5rem; padding:1.25rem 1.4rem; border-radius:14px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
              <span class="badge badge-emerald" style="font-size:0.75rem;">⚡ Engineering Hours Bank</span>
              <span class="badge ${bankBadgeClass}" style="font-size:0.75rem;">
                ${bankBadgeText}
              </span>
            </div>
            <h2 style="font-size:1.25rem; font-family:var(--font-heading); margin:0; color:#fff;">
              ${escapeHTML(bankProject.name || 'AI Engineering & Sprint Retainer')}
            </h2>
            <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.25rem;">
              Contracted Base: <strong>${bank.totalPurchasedHours || 30} hrs/mo</strong> · Rollover: <strong>${bank.rolloverHours || 0} hrs</strong> · Billing Cycle: <strong>${new Date(bank.billingCycleStart).toLocaleDateString('en-GB')} – ${new Date(bank.billingCycleEnd).toLocaleDateString('en-GB')}</strong>
            </div>
          </div>

          <div style="text-align:right;">
            <div style="font-size:1.8rem; font-weight:900; font-family:var(--font-heading); color:${bank.remainingHours <= 5 ? '#f59e0b' : '#34d399'};">
              ${bank.remainingHours} hrs <span style="font-size:0.85rem; color:var(--text-muted); font-weight:500;">left</span>
            </div>
            <div style="font-size:0.75rem; color:var(--text-dim);">
              ${bank.usedHours} of ${bank.totalAvailableHours} hrs consumed (${bank.burnRatePercent}%)
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div style="margin:1rem 0 1.25rem;">
          <div style="height:10px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
            <div style="height:100%; width:${Math.min(100, bank.burnRatePercent)}%; background:linear-gradient(90deg, #10b981, ${bank.burnRatePercent >= 85 ? '#ec4899' : (bank.burnRatePercent >= 75 ? '#f59e0b' : '#34d399')}); border-radius:999px;"></div>
          </div>
        </div>

        <!-- Task Logs Table -->
        <div style="background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.05); border-radius:10px; overflow:hidden;">
          <div style="padding:0.75rem 1rem; border-bottom:1px solid rgba(255,255,255,0.06); font-size:0.82rem; font-weight:700; color:var(--purple-light); display:flex; justify-content:space-between; align-items:center;">
            <span>📋 Transparent Engineering Activity Log (${bank.logs?.length || 0} Entries)</span>
            <span style="font-size:0.72rem; color:var(--text-muted);">Real-time Pod Attribution</span>
          </div>
          <div style="max-height:220px; overflow-y:auto;">
            <table style="width:100%; font-size:0.8rem; text-align:left; border-collapse:collapse;">
              <thead>
                <tr style="color:var(--text-muted); border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.72rem;">
                  <th style="padding:0.6rem 1rem;">DATE</th>
                  <th style="padding:0.6rem 1rem;">TASK / DELIVERABLE</th>
                  <th style="padding:0.6rem 1rem;">CATEGORY</th>
                  <th style="padding:0.6rem 1rem;">LOGGED BY</th>
                  <th style="padding:0.6rem 1rem; text-align:right;">HOURS</th>
                </tr>
              </thead>
              <tbody>
                ${(bank.logs || []).length === 0 ? `
                  <tr>
                    <td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">
                      No billable engineering tasks logged yet for this billing cycle.
                    </td>
                  </tr>
                ` : (bank.logs || []).map(l => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
                    <td style="padding:0.55rem 1rem; color:var(--text-dim);">${new Date(l.loggedAt).toLocaleDateString('en-GB')}</td>
                    <td style="padding:0.55rem 1rem; font-weight:600; color:#fff;">${escapeHTML(l.taskDescription)}</td>
                    <td style="padding:0.55rem 1rem;"><span class="badge badge-purple" style="font-size:0.68rem;">${escapeHTML(l.category)}</span></td>
                    <td style="padding:0.55rem 1rem; color:var(--text-secondary);">${escapeHTML(l.loggedBy)}</td>
                    <td style="padding:0.55rem 1rem; text-align:right; font-weight:800; color:#34d399;">+${l.hours}h</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Main Health Score Banner -->
      <div class="card-glass" style="background:linear-gradient(135deg, rgba(124,58,237,0.18), rgba(0,0,0,0.5)); border:1px solid rgba(139,92,246,0.35); margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1.25rem;">
          <div>
            <div style="font-size:0.8rem; font-weight:700; color:var(--purple-light); text-transform:uppercase; margin-bottom:0.3rem;">
              Monthly Retainer Cycle (${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
            </div>
            <div style="font-size:1.8rem; font-weight:900; font-family:var(--font-heading); color:#fff; display:flex; align-items:center; gap:0.75rem;">
              <span>${utilizationPct}% Delivered</span>
              <span class="badge ${isPaceHealthy ? 'badge-emerald' : 'badge-amber'}" style="font-size:0.8rem;">
                ${isPaceHealthy ? '🟢 On Schedule & Healthy' : '🟡 Reviewing Pace'}
              </span>
            </div>
            <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.35rem;">
              ${totalDelivered} of ${totalAgreed} agreed deliverables completed this billing cycle (Day ${currentDay} of ${daysInMonth}).
            </div>
          </div>

          <div style="min-width:220px; flex:1; max-width:320px;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.3rem;">
              <span>Deliverable Progress</span>
              <span>${totalDelivered}/${totalAgreed} units</span>
            </div>
            <div style="height:10px; background:rgba(255,255,255,0.1); border-radius:999px; overflow:hidden;">
              <div style="height:100%; width:${utilizationPct}%; background:linear-gradient(90deg, #8b5cf6, #10b981); border-radius:999px;"></div>
            </div>

            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-top:0.6rem; margin-bottom:0.3rem;">
              <span>Month Elapsed (${monthProgressPct}%)</span>
              <span>Day ${currentDay}/${daysInMonth}</span>
            </div>
            <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:999px; overflow:hidden;">
              <div style="height:100%; width:${monthProgressPct}%; background:rgba(255,255,255,0.4); border-radius:999px;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Format Quotas Grid -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1.15rem; margin-bottom:1.5rem;">
        
        <div class="card-glass">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <span style="font-size:1.2rem;">📱</span>
            <span class="badge badge-purple">${Math.round((agreedQuota.reels.delivered/agreedQuota.reels.agreed)*100)}%</span>
          </div>
          <div style="font-weight:700; font-size:0.95rem; color:#fff;">Short-Form Reels / Video</div>
          <div style="font-size:1.4rem; font-weight:800; color:var(--pink-brand); margin:0.3rem 0;">
            ${agreedQuota.reels.delivered} <span style="font-size:0.85rem; color:var(--text-muted); font-weight:500;">/ ${agreedQuota.reels.agreed} agreed</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-secondary);">9:16 Vertical Video Production</div>
        </div>

        <div class="card-glass">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <span style="font-size:1.2rem;">🎨</span>
            <span class="badge badge-purple">${Math.round((agreedQuota.statics.delivered/agreedQuota.statics.agreed)*100)}%</span>
          </div>
          <div style="font-weight:700; font-size:0.95rem; color:#fff;">Static Creatives & Carousels</div>
          <div style="font-size:1.4rem; font-weight:800; color:var(--purple-light); margin:0.3rem 0;">
            ${agreedQuota.statics.delivered} <span style="font-size:0.85rem; color:var(--text-muted); font-weight:500;">/ ${agreedQuota.statics.agreed} agreed</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-secondary);">Social Feeds & Ad Creatives</div>
        </div>

        <div class="card-glass">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <span style="font-size:1.2rem;">🎬</span>
            <span class="badge badge-emerald">${Math.round((agreedQuota.commercials.delivered/agreedQuota.commercials.agreed)*100)}%</span>
          </div>
          <div style="font-weight:700; font-size:0.95rem; color:#fff;">Master Commercial Cut</div>
          <div style="font-size:1.4rem; font-weight:800; color:var(--emerald-brand); margin:0.3rem 0;">
            ${agreedQuota.commercials.delivered} <span style="font-size:0.85rem; color:var(--text-muted); font-weight:500;">/ ${agreedQuota.commercials.agreed} agreed</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-secondary);">High-Production TVC / Digital Commercial</div>
        </div>

        <div class="card-glass">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <span style="font-size:1.2rem;">📊</span>
            <span class="badge badge-emerald">100%</span>
          </div>
          <div style="font-weight:700; font-size:0.95rem; color:#fff;">Strategy & Analytics Reports</div>
          <div style="font-size:1.4rem; font-weight:800; color:#38bdf8; margin:0.3rem 0;">
            ${agreedQuota.strategy.delivered} <span style="font-size:0.85rem; color:var(--text-muted); font-weight:500;">/ ${agreedQuota.strategy.agreed} agreed</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-secondary);">Weekly Pacing & Performance Audits</div>
        </div>

      </div>

      <!-- Contract Details & Creative Team Pod -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.25rem;">
        
        <div class="card-glass">
          <h3 style="font-size:1.1rem; margin-top:0; font-family:var(--font-heading);">📋 Retainer Contract Terms</h3>
          <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.85rem; color:var(--text-secondary);">
            <div><strong style="color:var(--text-muted);">Agreement Tier:</strong> <span style="color:#fff; font-weight:700;">${escapeHTML(clientInfo.status || 'Active Retainer')}</span></div>
            <div><strong style="color:var(--text-muted);">Renewal Cycle:</strong> 1st of every calendar month</div>
            <div><strong style="color:var(--text-muted);">Content Roll-over Policy:</strong> Up to 20% unused quota rolls to next month</div>
            <div><strong style="color:var(--text-muted);">Scope Revisions:</strong> 2 free revision rounds per master cut</div>
          </div>
        </div>

        <div class="card-glass">
          <h3 style="font-size:1.1rem; margin-top:0; font-family:var(--font-heading);">👥 Assigned Creative Team Pod</h3>
          <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.85rem;">
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--text-muted);">Client Services Lead:</span>
              <span style="font-weight:700; color:var(--purple-light);">${escapeHTML(clientInfo.accountManagerDetails?.name || clientInfo.accountManager || clientInfo.account_manager || 'GRO10X Executive Desk')}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--text-muted);">Art & Design Direction:</span>
              <span style="font-weight:700; color:#fff;">Ruhul Amin Rupom</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--text-muted);">Video & Post-Production:</span>
              <span style="font-weight:700; color:#fff;">Nasir Ullah Khan Nahian</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--text-muted);">Strategy & Copywriting:</span>
              <span style="font-weight:700; color:#fff;">S. M. Masud Ur Rahman</span>
            </div>
          </div>
        </div>

      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card-glass" style="padding:3rem; text-align:center; color:var(--text-muted);">Unable to load retainer health.</div>`;
  }
};
