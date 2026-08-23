/**
 * public/client/modules/campaign.js
 * Scoped Campaign & Content Schedule Module
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
const escapeHTML = window.escapeHTML || function(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; };

window.CLIENT_MODULES.campaign = async function(container) {
  let allPosts = [];
  let currentFilter = 'all';
  let viewMode = localStorage.getItem('purple_campaign_view') || 'grid';

  function formatDisplayDate(dateStr, timeStr) {
    if (!dateStr) return 'TBD';
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetZero = new Date(target);
    targetZero.setHours(0, 0, 0, 0);
    
    const diffDays = Math.round((targetZero - today) / (1000 * 60 * 60 * 24));
    let relative = '';
    if (diffDays === 0) relative = 'Today';
    else if (diffDays === 1) relative = 'Tomorrow';
    else if (diffDays === -1) relative = 'Yesterday';
    else if (diffDays > 1 && diffDays <= 7) relative = `In ${diffDays} days`;
    else relative = target.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    return `${relative}${timeStr ? ` · ${timeStr}` : ''}`;
  }

  async function loadCampaignPosts() {
    let user = {};
    try { user = JSON.parse(localStorage.getItem('purple_user') || '{}'); } catch(e) {}
    const clientName = user.company || user.name || '';
    
    try {
      if (clientName) {
        allPosts = await CLIENT_API.get(`/posts/client/${encodeURIComponent(clientName)}`).catch(() => CLIENT_API.get('/posts'));
      } else {
        allPosts = await CLIENT_API.get('/posts');
      }
    } catch (e) {
      allPosts = [];
    }

    renderCampaignView();
  }

  function getFilteredPosts() {
    if (currentFilter === 'all') return allPosts;
    if (currentFilter === 'pending') {
      return allPosts.filter(p => p.status === 'Pending Client Approval' || p.status === 'Client Review');
    }
    if (currentFilter === 'approved') {
      return allPosts.filter(p => p.status === 'Approved');
    }
    if (currentFilter === 'scheduled') {
      return allPosts.filter(p => p.status === 'Scheduled' || p.status === 'Draft');
    }
    if (currentFilter === 'published') {
      return allPosts.filter(p => p.status === 'Published');
    }
    return allPosts;
  }

  function renderCampaignView() {
    const posts = getFilteredPosts();
    const pendingCount = allPosts.filter(p => p.status === 'Pending Client Approval' || p.status === 'Client Review').length;

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">
            📋 Campaign & Content Schedule
          </h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">
            Real-time publishing timeline, copy approvals, and social media schedules.
          </div>
        </div>

        <!-- View Mode Toggle -->
        <div style="display:flex; background:var(--surface-2); border-radius:10px; padding:0.2rem; border:1px solid var(--border-subtle); gap:0.2rem;">
          <button id="btnViewGrid" onclick="window.CLIENT_CAMPAIGN.setView('grid')" style="border:none; background:${viewMode === 'grid' ? 'var(--purple-brand)' : 'transparent'}; color:#fff; border-radius:8px; padding:0.4rem 0.65rem; font-size:0.8rem; font-weight:700; cursor:pointer;">
            🔲 Grid
          </button>
          <button id="btnViewList" onclick="window.CLIENT_CAMPAIGN.setView('list')" style="border:none; background:${viewMode === 'list' ? 'var(--purple-brand)' : 'transparent'}; color:#fff; border-radius:8px; padding:0.4rem 0.65rem; font-size:0.8rem; font-weight:700; cursor:pointer;">
            📄 List
          </button>
          <button id="btnViewCal" onclick="window.CLIENT_CAMPAIGN.setView('calendar')" style="border:none; background:${viewMode === 'calendar' ? 'var(--purple-brand)' : 'transparent'}; color:#fff; border-radius:8px; padding:0.4rem 0.65rem; font-size:0.8rem; font-weight:700; cursor:pointer;">
            📅 Calendar
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div style="display:flex; gap:0.5rem; overflow-x:auto; padding-bottom:0.5rem; margin-bottom:1.5rem;">
        <button class="btn-secondary btn-sm" style="border-radius:20px; ${currentFilter === 'all' ? 'background:var(--purple-brand); color:#fff; border-color:var(--purple-brand);' : ''}" onclick="window.CLIENT_CAMPAIGN.setFilter('all')">
          All Posts (${allPosts.length})
        </button>
        <button class="btn-secondary btn-sm" style="border-radius:20px; ${currentFilter === 'pending' ? 'background:var(--pink-brand); color:#fff; border-color:var(--pink-brand);' : ''}" onclick="window.CLIENT_CAMPAIGN.setFilter('pending')">
          Pending Approval (${pendingCount})
        </button>
        <button class="btn-secondary btn-sm" style="border-radius:20px; ${currentFilter === 'approved' ? 'background:var(--emerald-brand); color:#fff; border-color:var(--emerald-brand);' : ''}" onclick="window.CLIENT_CAMPAIGN.setFilter('approved')">
          Approved (${allPosts.filter(p => p.status === 'Approved').length})
        </button>
        <button class="btn-secondary btn-sm" style="border-radius:20px; ${currentFilter === 'scheduled' ? 'background:var(--amber-brand); color:#fff; border-color:var(--amber-brand);' : ''}" onclick="window.CLIENT_CAMPAIGN.setFilter('scheduled')">
          Scheduled (${allPosts.filter(p => p.status === 'Scheduled' || p.status === 'Draft').length})
        </button>
      </div>

      <!-- Main Posts View -->
      ${viewMode === 'calendar' ? renderCalendarView(posts) : viewMode === 'grid' ? renderGridView(posts) : renderListView(posts)}
    `;
  }

  function renderCalendarView(posts) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    let cellsHtml = '';
    for (let i = 0; i < firstDayIndex; i++) {
      cellsHtml += `<div style="background:rgba(255,255,255,0.02); min-height:85px; border-radius:8px; opacity:0.3;"></div>`;
    }

    for (let d = 1; d <= totalDays; d++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayPosts = posts.filter(p => p.scheduledDate && p.scheduledDate.startsWith(dayStr));
      const isToday = d === today.getDate();

      cellsHtml += `
        <div style="background:${isToday ? 'rgba(124,58,237,0.15)' : 'var(--surface-2)'}; border:1px solid ${isToday ? 'var(--purple-brand)' : 'var(--border-subtle)'}; min-height:90px; border-radius:10px; padding:0.4rem; display:flex; flex-direction:column; gap:0.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; font-weight:800; color:${isToday ? 'var(--pink-brand)' : 'var(--text-muted)'};">
            <span>${d}</span>
            ${dayPosts.length > 0 ? `<span style="background:rgba(236,72,153,0.3); color:#fff; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; font-size:0.6rem;">${dayPosts.length}</span>` : ''}
          </div>
          ${dayPosts.map(p => `
            <div style="background:var(--surface-3); border-left:3px solid var(--pink-brand); padding:0.25rem 0.35rem; border-radius:4px; font-size:0.68rem; font-weight:700; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHTML(p.title)}">
              ${escapeHTML(p.platform === 'Instagram' ? '📷' : p.platform === 'LinkedIn' ? '💼' : p.platform === 'Facebook' ? '📘' : '📱')} ${escapeHTML(p.title)}
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="card-glass" style="padding:1.25rem;">
        <div style="font-size:1.1rem; font-weight:800; font-family:var(--font-heading); margin-bottom:1rem; color:var(--text-primary); display:flex; align-items:center; justify-content:space-between;">
          <span>📅 ${monthName}</span>
          <span style="font-size:0.78rem; font-weight:600; color:var(--purple-light);">${posts.length} deliverables scheduled</span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:0.4rem; text-align:center; font-weight:700; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.4rem;">
          ${daysOfWeek.map(day => `<div>${day}</div>`).join('')}
        </div>
        <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:0.4rem;">
          ${cellsHtml}
        </div>
      </div>
    `;
  }

  function renderGridView(posts) {
    if (!posts.length) {
      return `<div class="card-glass" style="padding:3rem; text-align:center; color:var(--text-muted);">No posts found under this filter.</div>`;
    }

    return `
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem;">
        ${posts.map(p => {
          let badgeClass = 'badge-purple';
          if (p.platform === 'Instagram') badgeClass = 'badge-pink';
          else if (p.platform === 'LinkedIn') badgeClass = 'badge-cyan';
          else if (p.platform === 'Facebook') badgeClass = 'badge-purple';

          let statusBadge = 'badge-purple';
          const isPending = p.status === 'Pending Client Approval' || p.status === 'Client Review';
          const isApproved = p.status === 'Approved' || p.status === 'Published';
          
          if (isApproved) statusBadge = 'badge-emerald';
          else if (isPending) statusBadge = 'badge-amber';
          else if (p.status === 'Changes Requested') statusBadge = 'badge-pink';

          const placeholderSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'><rect width='100%' height='100%' fill='%231e1136'/><circle cx='200' cy='100' r='40' fill='%237c3aed' opacity='0.4'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='%23c084fc' font-family='sans-serif' font-size='14' font-weight='700'>PURPLEBOT CREATIVE</text></svg>";
          const mediaUrl = (p.mediaUrls && p.mediaUrls[0]) || placeholderSvg;
          const displayDate = formatDisplayDate(p.scheduledDate, p.scheduledTime);
          const safeId = escapeHTML(p.id);

          return `
            <div class="card-glass" style="padding:0; overflow:hidden; display:flex; flex-direction:column;">
              <div style="height:150px; background:#000; position:relative;">
                <img src="${escapeHTML(mediaUrl)}" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover;" alt="Creative Asset" onerror="this.src='${placeholderSvg}'">
                <span class="badge ${badgeClass}" style="position:absolute; top:0.6rem; left:0.6rem; z-index:2; backdrop-filter:blur(6px);">${escapeHTML(p.platform || 'Social')}</span>
                <span class="badge ${statusBadge}" style="position:absolute; top:0.6rem; right:0.6rem; z-index:2; backdrop-filter:blur(6px);">${escapeHTML(p.status || 'Active')}</span>
              </div>
              <div style="padding:1rem; flex:1; display:flex; flex-direction:column;">
                <h3 style="margin:0 0 0.3rem; font-size:1rem; font-weight:700; color:var(--text-primary);">${escapeHTML(p.title)}</h3>
                <div style="font-size:0.75rem; color:var(--purple-light); font-weight:600; margin-bottom:0.5rem;">
                  📅 ${escapeHTML(displayDate)}
                </div>
                <div style="font-size:0.8rem; color:var(--text-secondary); max-height:65px; overflow-y:auto; white-space:pre-wrap; background:var(--surface-3); padding:0.5rem; border-radius:8px; line-height:1.4; flex:1;">
                  ${escapeHTML(p.caption || 'No copy provided.')}
                </div>

                ${isPending ? `
                  <div style="margin-top:0.85rem; display:flex; gap:0.5rem;">
                    <button class="btn-primary btn-sm" style="flex:1;" onclick="window.CLIENT_CAMPAIGN.inlineApprove('${safeId}')">
                      ✅ Approve Post
                    </button>
                    <a href="#review" class="btn-secondary btn-sm" style="text-decoration:none;">
                      ✏️ Notes
                    </a>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderListView(posts) {
    if (!posts.length) {
      return `<div class="card-glass" style="padding:3rem; text-align:center; color:var(--text-muted);">No posts found under this filter.</div>`;
    }

    return `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Post Title & Copy</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${posts.map(p => {
              const isPending = p.status === 'Pending Client Approval' || p.status === 'Client Review';
              const displayDate = formatDisplayDate(p.scheduledDate, p.scheduledTime);
              const safeId = escapeHTML(p.id);

              return `
                <tr>
                  <td><span class="badge badge-purple">${escapeHTML(p.platform || 'Social')}</span></td>
                  <td>
                    <div style="font-weight:700; color:var(--text-primary);">${escapeHTML(p.title)}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted); max-width:350px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(p.caption || '')}</div>
                  </td>
                  <td style="font-size:0.8rem; font-weight:600; color:var(--purple-light); white-space:nowrap;">📅 ${escapeHTML(displayDate)}</td>
                  <td><span class="badge ${p.status === 'Approved' ? 'badge-emerald' : isPending ? 'badge-amber' : 'badge-purple'}">${escapeHTML(p.status || 'Active')}</span></td>
                  <td>
                    ${isPending ? `
                      <button class="btn-primary btn-sm" onclick="window.CLIENT_CAMPAIGN.inlineApprove('${safeId}')">
                        ✅ Approve
                      </button>
                    ` : `
                      <span style="font-size:0.75rem; color:var(--text-muted);">Ready</span>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  window.CLIENT_CAMPAIGN = {
    setFilter(filter) {
      currentFilter = filter;
      renderCampaignView();
    },
    setView(mode) {
      viewMode = mode;
      localStorage.setItem('purple_campaign_view', mode);
      renderCampaignView();
    },
    async inlineApprove(id) {
      try {
        await CLIENT_API.patch(`/posts/${id}/status`, { status: 'Approved' });
        if (window.showClientToast) window.showClientToast('Post approved for scheduling! 🚀');
        else alert('Post approved!');
        loadCampaignPosts();
      } catch (err) {
        if (window.showClientToast) window.showClientToast('Approval failed: ' + err.message, 'error');
        else alert('Error approving post');
      }
    }
  };

  await loadCampaignPosts();
};
