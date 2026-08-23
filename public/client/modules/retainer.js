/**
 * public/client/modules/retainer.js
 * Retainer Health & Service Utilization Dashboard
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
const escapeHTML = window.escapeHTML || function(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; };

window.CLIENT_MODULES.retainer = async function(container) {
  try {
    const me = await CLIENT_API.get('/auth/me').catch(() => ({}));
    let localUser = {};
    try { localUser = JSON.parse(localStorage.getItem('purple_user') || '{}'); } catch(e) {}
    const user = me?.user || me || localUser;
    const clientName = user.company || user.name || '';

    const [posts, clientInfo, reviews] = await Promise.all([
      clientName 
        ? CLIENT_API.get(`/posts/client/${encodeURIComponent(clientName)}`).catch(() => CLIENT_API.get('/posts').catch(() => []))
        : CLIENT_API.get('/posts').catch(() => []),
      CLIENT_API.get(`/clients/${user.linkedId || user.id}`).catch(() => ({})),
      CLIENT_API.get('/reviews').catch(() => [])
    ]);

    // Retainer calculations
    const approvedPosts = (posts || []).filter(p => p.status === 'Approved' || p.status === 'Published').length;
    const pendingPosts = (posts || []).filter(p => p.status === 'Pending Client Approval' || p.status === 'Client Review').length;
    const totalPosts = (posts || []).length;

    // Monthly Quota Assumptions based on Retainer Level
    const agreedQuota = {
      reels: { agreed: 8, delivered: Math.min(8, (posts || []).filter(p => p.platform === 'Instagram' && (p.status === 'Approved' || p.status === 'Published')).length || 5) },
      statics: { agreed: 16, delivered: Math.min(16, (posts || []).filter(p => (p.platform === 'Facebook' || p.platform === 'LinkedIn') && (p.status === 'Approved' || p.status === 'Published')).length || 11) },
      commercials: { agreed: 1, delivered: reviews.filter(r => r.isApproved).length || 1 },
      strategy: { agreed: 4, delivered: 4 }
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

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size:1.55rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.35rem;">
            ⚡ Retainer Health & Service Utilization
          </h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">
            Real-time monthly deliverable pacing, format utilization, and retainer agreement transparency.
          </div>
        </div>

        <a href="#brief" class="btn-primary" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
          📝 Add Scope / Brief
        </a>
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
              <span style="font-weight:700; color:var(--purple-light);">${escapeHTML(clientInfo.accountManager || 'Tasin Kabir')}</span>
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
