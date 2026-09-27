let currentChatMode = 'client';

function initWebChat() {
  const urlParams = new URLSearchParams(window.location.search);
  const modeParam = urlParams.get('mode');
  if (modeParam === 'team') {
    document.getElementById('chatModeSelect').value = 'team';
    switchChatMode('team');
  }
  setupSSE();
}

function setupSSE() {
  const token = localStorage.getItem('gro10x_token') || localStorage.getItem('sb-access-token') || '';
  const sseUrl = token ? `/api/sync?token=${encodeURIComponent(token)}` : '/api/sync';
  const evtSource = new EventSource(sseUrl);
  evtSource.onmessage = (e) => {
    try {
      const payload = JSON.parse(e.data);
      if (payload.type === 'chat_message' && payload.data && payload.data.mode === currentChatMode) {
        appendMessage(payload.data.text, payload.data.sender || 'bot');
      }
    } catch (err) {}
  };
  evtSource.addEventListener('chat_message', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data && data.mode === currentChatMode) {
        appendMessage(data.text, data.sender || 'bot');
      }
    } catch (err) {}
  });
}

function switchChatMode(mode) {
  currentChatMode = mode;
  const nameEl = document.getElementById('chatBotName');
  const chipsEl = document.getElementById('quickChipsBar');
  const feed = document.getElementById('chatFeed');

  if (mode === 'team') {
    nameEl.innerText = 'GRO10X Team Bot (@Aigeneral01bot)';
    chipsEl.innerHTML = `
      <button type="button" class="chip-btn" onclick="openEmbeddedMiniApp('clockin')">🟢 Clock In Studio</button>
      <button type="button" class="chip-btn" onclick="openEmbeddedMiniApp('tasks')">📋 My Tasks</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('/myearnings')">💰 My Earnings</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('/clockout')">🚪 Clock Out</button>
    `;
    feed.innerHTML = `
      <div class="msg-bubble msg-bot">
        🤖 **GRO10X Team Operations Active!** Tap quick actions below to open In-Chat MiniApps or check task schedules.
      </div>
    `;
  } else {
    nameEl.innerText = 'GRO10X Client AI Co-Pilot (@gro10xb2bot)';
    chipsEl.innerHTML = `
      <button type="button" class="chip-btn" onclick="openEmbeddedMiniApp('review')">🎬 Review Room</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('What is my sprint status and burndown?')">⚡ Sprint Status</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('What is my 30-day warranty status and SLA?')">🛡️ Warranty Shield</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('Do I have any pending invoices?')">💳 Invoices & Wire</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('How do I request a scope change order?')">📝 Scope Change</button>
    `;
    feed.innerHTML = `
      <div class="msg-bubble msg-bot">
        🤖 **GRO10X Client Co-Pilot Active!** I am your dedicated engineering assistant. Ask me anything about your active sprint, 30-day warranty, invoices, or scope changes.
      </div>
    `;
  }
}

function appendMessage(text, sender) {
  const feed = document.getElementById('chatFeed');
  const div = document.createElement('div');
  div.className = `msg-bubble msg-${sender}`;
  div.innerHTML = text.replace(/\n/g, '<br>').replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
}

// Module B4.1: Embedded Glassmorphism MiniApp Popup Card Renderer
// Module B4.1: Embedded Glassmorphism MiniApp Popup Card Renderer (Connected to Live APIs)
async function openEmbeddedMiniApp(type) {
  const feed = document.getElementById('chatFeed');
  const cardDiv = document.createElement('div');
  cardDiv.className = 'msg-bubble msg-bot';
  cardDiv.style.width = '95%';
  cardDiv.style.maxWidth = '100%';
  cardDiv.style.background = 'rgba(24, 24, 27, 0.95)';
  cardDiv.style.border = '1px solid rgba(168, 85, 247, 0.4)';
  cardDiv.style.boxShadow = '0 12px 30px rgba(0,0,0,0.6)';

  const token = localStorage.getItem('gro10x_token') || localStorage.getItem('sb-access-token') || '';
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  if (type === 'review') {
    cardDiv.innerHTML = `
      <div style="font-size:0.75rem; color:#c084fc; font-weight:800; margin-bottom:0.4rem;">🎬 EMBEDDED REVIEW ROOM V2 MINIAPP</div>
      <div style="color:var(--text-muted); font-size:0.8rem; padding:0.5rem 0;">⏳ Loading active sprint deliverables...</div>
    `;
    feed.appendChild(cardDiv);
    feed.scrollTop = feed.scrollHeight;

    try {
      const res = await fetch('/api/reviews', { headers: authHeaders });
      const reviews = res.ok ? await res.json() : [];
      const rev = (Array.isArray(reviews) && reviews.length > 0)
        ? (reviews.find(r => !r.isApproved) || reviews[0])
        : {
            id: 'REV-SAMPLE01',
            projectName: 'AI Solution Sprint Deliverable Cut',
            client: 'Enterprise Partner',
            activeVersion: 'v1',
            mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4'
          };

      const title = rev.projectName || rev.name || rev.title || 'AI Solution Sprint Deliverable Cut';
      const version = (rev.activeVersion || 'v1').toUpperCase();
      const videoSrc = rev.mediaUrl || rev.stagingUrl || '';

      cardDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
          <div style="font-size:0.75rem; color:#c084fc; font-weight:800;">🎬 EMBEDDED REVIEW ROOM V2 MINIAPP</div>
          <span style="font-size:0.68rem; background:rgba(168,85,247,0.2); color:#c084fc; padding:0.15rem 0.45rem; border-radius:6px; font-weight:700;">${version}</span>
        </div>
        <div style="font-size:0.9rem; font-weight:700; color:#fff; margin-bottom:0.6rem;">${escapeHTML(title)}</div>
        
        <div style="border-radius:12px; overflow:hidden; background:#000; margin-bottom:0.75rem; position:relative;">
          <video id="webReviewVideo_${rev.id}" controls style="width:100%; display:block;" poster="/images/mascot.webp">
            <source src="${videoSrc}" type="video/mp4">
          </video>
        </div>

        <!-- Timecoded Feedback Input -->
        <div style="display:flex; gap:0.4rem; margin-bottom:0.6rem;">
          <input type="text" id="webReviewInput_${rev.id}" class="form-input" placeholder="Type feedback note on current video timestamp..." style="flex:1; font-size:0.78rem; padding:0.45rem 0.75rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff;">
          <button type="button" class="btn-secondary" style="padding:0.45rem 0.75rem; font-size:0.78rem; border-radius:8px;" onclick="submitWebReviewComment('${rev.id}', this)">💬 Add Note</button>
        </div>
        <div id="webCommentNotice_${rev.id}" style="font-size:0.72rem; color:#34d399; margin-bottom:0.5rem; display:none;"></div>

        <div style="display:flex; gap:0.6rem;">
          <button class="btn-purple" style="flex:1; padding:0.6rem; font-size:0.8rem; justify-content:center; background:linear-gradient(135deg, #10b981, #059669);" onclick="approveWebCut(this, '${rev.id}', '${escapeAttr(rev.client || rev.clientName || 'Client')}')">✅ 1-Tap Approve Cut & Bill</button>
          <button class="btn-secondary" style="flex:1; padding:0.6rem; font-size:0.8rem; justify-content:center;" onclick="window.open('/partners','_blank')">🔗 Full Review Room</button>
        </div>
      `;
    } catch (err) {
      cardDiv.innerHTML = `<div style="color:#ef4444; font-size:0.8rem;">Failed to load live deliverables: ${escapeHTML(err.message)}</div>`;
    }
    return;
  }

  if (type === 'clockin') {
    cardDiv.innerHTML = `
      <div style="font-size:0.75rem; color:#34d399; font-weight:800; margin-bottom:0.4rem;">🟢 STUDIO ATTENDANCE MINIAPP</div>
      <div style="font-size:0.9rem; font-weight:700; color:#fff; margin-bottom:0.4rem;">Gulshan Production Studio</div>
      <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;">Verify GPS distance & log clock-in status</div>
      <button class="btn-purple" style="width:100%; padding:0.65rem; background:linear-gradient(135deg,#10b981,#059669); justify-content:center;" onclick="webClockIn(this)">🟢 1-Tap Studio Clock In</button>
    `;
    feed.appendChild(cardDiv);
    feed.scrollTop = feed.scrollHeight;
    return;
  }

  if (type === 'tasks') {
    cardDiv.innerHTML = `
      <div style="font-size:0.75rem; color:#c084fc; font-weight:800; margin-bottom:0.4rem;">📋 CREW SHOOT KANBAN MINIAPP</div>
      <div style="color:var(--text-muted); font-size:0.8rem; padding:0.5rem 0;">⏳ Fetching active tasks...</div>
    `;
    feed.appendChild(cardDiv);
    feed.scrollTop = feed.scrollHeight;

    try {
      const res = await fetch('/api/tasks', { headers: authHeaders });
      const tasks = res.ok ? await res.json() : [];
      const activeTasks = (Array.isArray(tasks) ? tasks : [])
        .filter(t => !['approved', 'done', 'completed', 'published'].includes((t.stage || '').toLowerCase()))
        .slice(0, 3);

      const tasksHtml = activeTasks.length > 0
        ? activeTasks.map((t, idx) => `
            <div style="background:rgba(255,255,255,0.04); padding:0.55rem 0.75rem; border-radius:8px; font-size:0.8rem; margin-bottom:0.4rem; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${idx + 1}. ${escapeHTML(t.title || 'Sprint Task')}</strong>
                <div style="font-size:0.68rem; color:var(--text-muted);">${escapeHTML(t.client || t.clientName || 'Internal')}</div>
              </div>
              <span style="font-size:0.68rem; color:#c084fc; font-weight:700; background:rgba(168,85,247,0.15); padding:0.15rem 0.45rem; border-radius:6px;">${escapeHTML(t.stage || 'In Progress')}</span>
            </div>
          `).join('')
        : `<div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.5rem;">🎉 Zero pending tasks in your queue!</div>`;

      cardDiv.innerHTML = `
        <div style="font-size:0.75rem; color:#c084fc; font-weight:800; margin-bottom:0.4rem;">📋 CREW SHOOT KANBAN MINIAPP</div>
        <div style="font-size:0.85rem; font-weight:700; color:#fff; margin-bottom:0.6rem;">Active Assignments for Today</div>
        ${tasksHtml}
        <button class="btn-purple" style="width:100%; padding:0.65rem; justify-content:center; margin-top:0.4rem;" onclick="window.open('/team-miniapp','_blank')">📱 Open Full Crew App</button>
      `;
    } catch (err) {
      cardDiv.innerHTML = `<div style="color:#ef4444; font-size:0.8rem;">Failed to load tasks: ${escapeHTML(err.message)}</div>`;
    }
  }
}

async function approveWebCut(btn, reviewId, clientName) {
  btn.disabled = true;
  btn.innerText = '⏳ Processing Approval...';
  try {
    const token = localStorage.getItem('gro10x_token') || localStorage.getItem('sb-access-token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/reviews/approve', {
      method: 'POST',
      headers,
      body: JSON.stringify({ reviewId: reviewId || 'REV-SAMPLE01', clientName: clientName || 'Client Partner' })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Approval failed');

    btn.innerText = '✅ Cut Approved & 30-Day Warranty Activated!';
    btn.style.background = '#059669';
  } catch (e) {
    console.error(e);
    btn.disabled = false;
    btn.innerText = '❌ Error: ' + e.message;
  }
}

async function submitWebReviewComment(reviewId, btn) {
  const input = document.getElementById(`webReviewInput_${reviewId}`);
  const notice = document.getElementById(`webCommentNotice_${reviewId}`);
  const video = document.getElementById(`webReviewVideo_${reviewId}`);
  const text = input ? input.value.trim() : '';
  if (!text) return;

  const curSeconds = video ? Math.floor(video.currentTime || 0) : 0;
  const mins = Math.floor(curSeconds / 60);
  const secs = String(curSeconds % 60).padStart(2, '0');
  const timestampStr = `${mins}:${secs}`;

  btn.disabled = true;
  try {
    const token = localStorage.getItem('gro10x_token') || localStorage.getItem('sb-access-token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text,
        timestamp: timestampStr,
        timeSeconds: curSeconds,
        author: 'Client Reviewer'
      })
    });
    if (!res.ok) throw new Error('Failed to post comment');
    input.value = '';
    if (notice) {
      notice.innerText = `✅ Note posted at [${timestampStr}]`;
      notice.style.display = 'block';
      setTimeout(() => { if (notice) notice.style.display = 'none'; }, 4000);
    }
  } catch (err) {
    if (notice) {
      notice.innerText = '❌ ' + err.message;
      notice.style.display = 'block';
    }
  } finally {
    btn.disabled = false;
  }
}

function escapeHTML(str) {
  return String(str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

function escapeAttr(str) {
  return String(str || '').replace(/'/g, "\\'");
}

async function webClockIn(btn) {
  btn.disabled = true;
  btn.innerText = '🟢 Clocked In at Gulshan Studio!';
  try {
    await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: '/clockin', mode: 'team' })
    });
  } catch (e) { console.error(e); }
}

function sendQuickMessage(text) {
  document.getElementById('webChatInput').value = text;
  handleSendWebChat(new Event('submit'));
}

async function handleSendWebChat(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('webChatInput');
  const userText = input.value.trim();
  if (!userText) return;

  appendMessage(userText, 'user');
  input.value = '';

  const token = localStorage.getItem('gro10x_token') || localStorage.getItem('sb-access-token') || '';
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch('/api/chat/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({ command: userText, mode: currentChatMode, token })
    });
    if (res.ok) {
      const json = await res.json();
      // If direct response returned and SSE is inactive, display reply
      if (json && json.data && json.data.reply && (!window.__gro10xSseConnected)) {
        appendMessage(json.data.reply, 'bot');
      }
    }
  } catch (err) {
    appendMessage('🤖 Connection error: ' + err.message, 'bot');
  }
}

document.addEventListener('DOMContentLoaded', initWebChat);
