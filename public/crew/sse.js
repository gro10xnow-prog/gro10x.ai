/**
 * public/crew/sse.js
 * Real-Time SSE Listener, Notification Bell & Live Sync for Crew Workspace
 */
(function initCrewSSE() {
  if (!window.EventSource) return;

  // ── Notification Store with LocalStorage Persistence ──
  function loadPersistedNotifications() {
    try {
      const stored = localStorage.getItem('crew_notifications_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function savePersistedNotifications() {
    try {
      const toSave = (window._crewNotifications || []).slice(0, 30);
      localStorage.setItem('crew_notifications_v1', JSON.stringify(toSave));
    } catch {}
  }

  window._crewNotifications = loadPersistedNotifications();
  let _myEmpCode = null;
  let _myName = null;

  async function getMyProfile() {
    if (_myEmpCode && _myName) return { empCode: _myEmpCode, name: _myName };
    try {
      const token = localStorage.getItem('sb-access-token') || localStorage.getItem('gro10x_token') || localStorage.getItem('gro10x_token') || '';
      const res = await fetch('/api/auth/me', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      const d = await res.json();
      _myEmpCode = d.user?.emp_code || d.user?.id || null;
      _myName = d.user?.name || null;
    } catch {}
    return { empCode: _myEmpCode, name: _myName };
  }

  // ── Toast Notification UI ──
  function showNotificationToast(text, icon = '🔔') {
    const el = document.createElement('div');
    el.className = 'crew-notification-toast';
    el.innerHTML = `<span style="font-size:1.2rem;">${icon}</span> <span style="font-weight:600;">${text}</span>`;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('visible'), 50);
    setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 350);
    }, 4500);
  }

  // ── Bell Badge Updater ──
  function updateNotificationBell() {
    const badge = document.getElementById('crewNotifBadge');
    if (!badge) return;
    const unread = (window._crewNotifications || []).filter(n => !n.read).length;
    badge.textContent = unread > 9 ? '9+' : String(unread);
    badge.style.display = unread > 0 ? 'flex' : 'none';
  }

  // Initial badge update
  setTimeout(updateNotificationBell, 300);

  // ── Trigger SPA Hash Refresh ──
  function triggerViewRefresh(targetHashes) {
    const currentHash = window.location.hash || '#home';
    if (targetHashes.includes(currentHash)) {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  }

  // ── Process Incoming Event ──
  async function handleCrewEvent(type, data) {
    const { empCode, name } = await getMyProfile();
    const myNameLower = (name || '').toLowerCase();

    if (type === 'task_update') {
      const tasks = Array.isArray(data) ? data : [data];
      let hasMyTask = false;
      for (const t of tasks) {
        if (!t) continue;
        const isMine = (t.assignee_id && empCode && t.assignee_id === empCode) ||
                       (t.assignee && myNameLower && t.assignee.toLowerCase().includes(myNameLower));
        if (isMine) {
          hasMyTask = true;
          const n = {
            id: Date.now() + Math.random(),
            icon: '📋',
            text: `Task "${t.title || 'Assignment'}" updated to ${t.stage || 'new stage'}`,
            read: false,
            ts: new Date()
          };
          window._crewNotifications.unshift(n);
          savePersistedNotifications();
          showNotificationToast(n.text, n.icon);
          updateNotificationBell();
        }
      }
      if (hasMyTask) {
        triggerViewRefresh(['#tasks', '#home', '#deliverables']);
      }
    }

    if (type === 'leave_update') {
      const leaves = Array.isArray(data) ? data : [data];
      let hasMyLeave = false;
      for (const l of leaves) {
        if (!l) continue;
        const isMine = (l.employee_id && empCode && l.employee_id === empCode) ||
                       (l.employeeId && empCode && l.employeeId === empCode);
        if (isMine) {
          hasMyLeave = true;
          const status = l.status || 'Updated';
          const icon = status.includes('Approve') ? '✅' : status.includes('Reject') ? '❌' : '🌴';
          const n = {
            id: Date.now() + Math.random(),
            icon,
            text: `Leave request status: ${status}`,
            read: false,
            ts: new Date()
          };
          window._crewNotifications.unshift(n);
          savePersistedNotifications();
          showNotificationToast(n.text, icon);
          updateNotificationBell();
        }
      }
      if (hasMyLeave) {
        triggerViewRefresh(['#leaves', '#home']);
      }
    }

    if (type === 'team_update') {
      const updates = Array.isArray(data) ? data : [data];
      for (const u of updates) {
        if (!u) continue;
        const isMe = empCode && (u.emp_code === empCode || u.employee_id === empCode || u.id === empCode);
        const isXPUpdate = u.xp !== undefined;
        if (isMe || isXPUpdate) {
          triggerViewRefresh(['#home', '#earnings', '#leaderboard']);
        }
      }
    }

    if (type === 'expense_update') {
      const expenses = Array.isArray(data) ? data : [data];
      let hasMyExpense = false;
      for (const exp of expenses) {
        if (!exp) continue;
        const isMine = empCode && (
          exp.submitted_by_id === empCode || 
          exp.submittedById === empCode || 
          exp.employee_id === empCode || 
          exp.employeeId === empCode
        );
        if (isMine) {
          hasMyExpense = true;
          const status = exp.status || 'Updated';
          const icon = status.includes('Disbursed') || status.includes('Paid') ? '💸' : 
                       status.includes('Reject') ? '❌' : 
                       status.includes('Approve') ? '✅' : '🧾';
          const n = {
            id: Date.now() + Math.random(),
            icon,
            text: `Expense claim "${exp.title || exp.category || 'Claim'}" status: ${status}`,
            read: false,
            ts: new Date()
          };
          window._crewNotifications.unshift(n);
          savePersistedNotifications();
          showNotificationToast(n.text, icon);
          updateNotificationBell();
        }
      }
      if (hasMyExpense) {
        triggerViewRefresh(['#home', '#expenses']);
      }
    }

    if (type === 'attendance_update') {
      const attUpdates = Array.isArray(data) ? data : [data];
      let hasMyAtt = false;
      for (const a of attUpdates) {
        if (!a) continue;
        const isMine = empCode && (a.employee_id === empCode || a.employeeId === empCode || a.emp_code === empCode);
        if (isMine) hasMyAtt = true;
      }
      if (hasMyAtt) {
        triggerViewRefresh(['#home']);
      }
    }

    if (type === 'eod_update') {
      triggerViewRefresh(['#home', '#leaderboard']);
    }

    if (type === 'review_update') {
      const reviews = Array.isArray(data) ? data : [data];
      for (const r of reviews) {
        if (!r) continue;
        const isApproved = r.isApproved || r.status === 'approved';
        const isRevision = r.status === 'revision_requested' || !!r.revisionNotes;
        const icon = isApproved ? '✅' : isRevision ? '✏️' : '🎬';
        const statusText = isApproved ? 'Approved by Client! 🎉' : isRevision ? `Revision Requested: ${r.revisionNotes || ''}` : 'Updated';
        const n = {
          id: Date.now() + Math.random(),
          icon,
          text: `Deliverable "${r.projectName || r.project_name || 'Project'}": ${statusText}`,
          read: false,
          ts: new Date()
        };
        window._crewNotifications.unshift(n);
        savePersistedNotifications();
        showNotificationToast(n.text, icon);
        updateNotificationBell();
      }
      triggerViewRefresh(['#deliverables', '#home', '#tasks']);
    }

    if (type === 'review_comment_update') {
      const c = data?.comment || data || {};
      const author = c.author || 'Client';
      const text = c.text ? (c.text.length > 50 ? c.text.substring(0, 47) + '...' : c.text) : 'New feedback comment';
      const n = {
        id: Date.now() + Math.random(),
        icon: '💬',
        text: `Review comment from ${author}: ${text}`,
        read: false,
        ts: new Date()
      };
      window._crewNotifications.unshift(n);
      savePersistedNotifications();
      showNotificationToast(n.text, '💬');
      updateNotificationBell();
      triggerViewRefresh(['#deliverables']);
    }

    if (type === 'drawing_update') {
      const n = {
        id: Date.now() + Math.random(),
        icon: '🎨',
        text: `Client added visual markup annotation on deliverable`,
        read: false,
        ts: new Date()
      };
      window._crewNotifications.unshift(n);
      savePersistedNotifications();
      showNotificationToast(n.text, '🎨');
      updateNotificationBell();
      triggerViewRefresh(['#deliverables']);
    }

    if (type === 'post_update') {
      const posts = Array.isArray(data) ? data : [data];
      for (const p of posts) {
        if (!p) continue;
        const title = p.title || p.topicIdea || p.topic || 'Post';
        const status = p.status || 'Updated';
        const icon = status.includes('Approve') || status === 'approved' ? '✅' : status.includes('Reject') ? '❌' : '📱';
        const n = {
          id: Date.now() + Math.random(),
          icon,
          text: `Social post "${title}" status: ${status}`,
          read: false,
          ts: new Date()
        };
        window._crewNotifications.unshift(n);
        savePersistedNotifications();
        showNotificationToast(n.text, icon);
        updateNotificationBell();
      }
      triggerViewRefresh(['#social', '#home']);
    }

    if (type === 'social_post_update') {
      triggerViewRefresh(['#social', '#home']);
    }

    if (type === 'studio_booking_update') {
      const booking = data || {};
      const slot = booking.title || booking.slot || booking.time || 'Schedule updated';
      const n = {
        id: Date.now() + Math.random(),
        icon: '🎙️',
        text: `Studio booking updated: ${slot}`,
        read: false,
        ts: new Date()
      };
      window._crewNotifications.unshift(n);
      savePersistedNotifications();
      showNotificationToast(n.text, '🎙️');
      updateNotificationBell();
      triggerViewRefresh(['#tasks', '#home']);
    }
  }

  // ── Establish SSE Stream ──
  try {
    const sseToken = window.CREW_API ? window.CREW_API.getToken() : (localStorage.getItem('sb-access-token') || localStorage.getItem('gro10x_token') || '');
    let cachedEmp = '';
    try {
      const u = JSON.parse(localStorage.getItem('crew_user') || '{}');
      cachedEmp = u.emp_code || u.empCode || u.id || '';
    } catch (_) {}
    const empQuery = cachedEmp ? `&emp_code=${encodeURIComponent(cachedEmp)}` : '';
    const sseEndpoint = sseToken 
      ? `/api/sync?token=${encodeURIComponent(sseToken)}&role=crew${empQuery}` 
      : `/api/sync?role=crew${empQuery}`;
    const evtSource = new EventSource(sseEndpoint);

    evtSource.onmessage = function(e) {
      try {
        const eventData = JSON.parse(e.data);
        if (eventData && eventData.type && eventData.type !== 'connected') {
          handleCrewEvent(eventData.type, eventData.data);
        }
      } catch (err) {}
    };

    evtSource.addEventListener('leave_update', function(e) {
      try { handleCrewEvent('leave_update', JSON.parse(e.data)); } catch(err) {}
    });

    evtSource.addEventListener('task_update', function(e) {
      try { handleCrewEvent('task_update', JSON.parse(e.data)); } catch(err) {}
    });

    evtSource.addEventListener('team_update', function(e) {
      try { handleCrewEvent('team_update', JSON.parse(e.data)); } catch(err) {}
    });

    evtSource.addEventListener('expense_update', function(e) {
      try { handleCrewEvent('expense_update', JSON.parse(e.data)); } catch(err) {}
    });

    evtSource.addEventListener('attendance_update', function(e) {
      try { handleCrewEvent('attendance_update', JSON.parse(e.data)); } catch(err) {}
    });

    evtSource.addEventListener('eod_update', function(e) {
      try { handleCrewEvent('eod_update', JSON.parse(e.data)); } catch(err) {}
    });

    evtSource.addEventListener('review_update', function(e) {
      try { handleCrewEvent('review_update', JSON.parse(e.data)); } catch(err) {}
    });

    evtSource.addEventListener('review_comment_update', function(e) {
      try { handleCrewEvent('review_comment_update', JSON.parse(e.data)); } catch(err) {}
    });

    evtSource.addEventListener('drawing_update', function(e) {
      try { handleCrewEvent('drawing_update', JSON.parse(e.data)); } catch(err) {}
    });

    evtSource.addEventListener('post_update', function(e) {
      try { handleCrewEvent('post_update', JSON.parse(e.data)); } catch(err) {}
    });

    evtSource.addEventListener('social_post_update', function(e) {
      try { handleCrewEvent('social_post_update', JSON.parse(e.data)); } catch(err) {}
    });

    evtSource.addEventListener('studio_booking_update', function(e) {
      try { handleCrewEvent('studio_booking_update', JSON.parse(e.data)); } catch(err) {}
    });


    evtSource.onerror = function() {
      // Auto-reconnect managed by browser EventSource
    };
  } catch (err) {
    console.warn('[Crew SSE] Connection error:', err);
  }

  window.clearCrewNotifications = function() {
    window._crewNotifications = [];
    savePersistedNotifications();
    updateNotificationBell();
    const panel = document.getElementById('crewNotifPanel');
    if (panel) {
      panel.innerHTML = `
        <div style="padding:0.85rem 1rem; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:0.9rem; color:#fff;">🔔 Live Notifications</strong>
          <span style="font-size:0.75rem; color:var(--text-muted);">0 total</span>
        </div>
        <div style="padding:2rem 1rem; text-align:center; color:var(--text-muted); font-size:0.85rem;">
          All notifications cleared.
        </div>
      `;
    }
  };

  // ── Notification Bell Panel Toggle ──
  window.toggleCrewNotifications = function() {
    const panel = document.getElementById('crewNotifPanel');
    if (!panel) return;

    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';

    if (!isOpen) {
      // Mark all notifications as read
      (window._crewNotifications || []).forEach(n => n.read = true);
      savePersistedNotifications();
      updateNotificationBell();

      const notifs = window._crewNotifications || [];
      panel.innerHTML = `
        <div style="padding:0.85rem 1rem; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:0.9rem; color:#fff;">🔔 Live Notifications</strong>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:0.75rem; color:var(--text-muted);">${notifs.length} total</span>
            ${notifs.length > 0 ? `<button onclick="clearCrewNotifications()" style="background:transparent; border:none; color:var(--purple-light); font-size:0.75rem; font-weight:700; cursor:pointer;">Clear</button>` : ''}
          </div>
        </div>
        <div style="max-height:300px; overflow-y:auto;">
          ${notifs.length === 0 ? `
            <div style="padding:2rem 1rem; text-align:center; color:var(--text-muted); font-size:0.85rem;">
              No notifications yet in this session.
            </div>
          ` : notifs.slice(0, 20).map(n => `
            <div style="padding:0.75rem 1rem; border-bottom:1px solid var(--border-subtle); font-size:0.83rem; display:flex; gap:0.6rem; align-items:flex-start;">
              <span style="font-size:1.1rem; line-height:1;">${n.icon || '🔔'}</span>
              <div style="flex:1;">
                <div style="color:var(--text-primary); line-height:1.4;">${n.text}</div>
                <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.2rem;">
                  ${n.ts ? new Date(n.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  };

  // Close notifications panel on outside click
  document.addEventListener('click', function(e) {
    const panel = document.getElementById('crewNotifPanel');
    const bell = document.getElementById('crewNotifBell');
    if (panel && bell && panel.style.display !== 'none') {
      if (!panel.contains(e.target) && !bell.contains(e.target)) {
        panel.style.display = 'none';
      }
    }
  });
})();
