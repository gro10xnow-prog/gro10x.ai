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
    nameEl.innerText = 'GRO10X Client Bot (@gro10xb2bot)';
    chipsEl.innerHTML = `
      <button type="button" class="chip-btn" onclick="openEmbeddedMiniApp('review')">🎬 Review Room</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('What are your service packages and rates?')">💰 Service Rates</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('Can I see your portfolio?')">📁 Portfolio</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('How do I verify an invoice payment?')">💳 Invoice Billing</button>
    `;
    feed.innerHTML = `
      <div class="msg-bubble msg-bot">
        👋 Welcome to **GRO10X AI Agency**! How can we assist your brand today? Select a quick action below or type your inquiry.
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
function openEmbeddedMiniApp(type) {
  const feed = document.getElementById('chatFeed');
  const cardDiv = document.createElement('div');
  cardDiv.className = 'msg-bubble msg-bot';
  cardDiv.style.width = '95%';
  cardDiv.style.maxWidth = '100%';
  cardDiv.style.background = 'rgba(24, 24, 27, 0.95)';
  cardDiv.style.border = '1px solid rgba(168, 85, 247, 0.4)';
  cardDiv.style.boxShadow = '0 12px 30px rgba(0,0,0,0.6)';

  if (type === 'review') {
    cardDiv.innerHTML = `
      <div style="font-size:0.75rem; color:#c084fc; font-weight:800; margin-bottom:0.4rem;">🎬 EMBEDDED REVIEW ROOM V2 MINIAPP</div>
      <div style="font-size:0.9rem; font-weight:700; color:#fff; margin-bottom:0.6rem;">Chillox Eid Special Commercial Reel Cut V2 (4K)</div>
      <div style="border-radius:12px; overflow:hidden; background:#000; margin-bottom:0.75rem;">
        <video controls style="width:100%; display:block;" poster="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800">
          <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4">
        </video>
      </div>
      <div style="display:flex; gap:0.6rem;">
        <button class="btn-purple" style="flex:1; padding:0.6rem; font-size:0.8rem; justify-content:center;" onclick="approveWebCut(this)">✅ 1-Tap Approve Cut & Bill</button>
        <button class="btn-secondary" style="flex:1; padding:0.6rem; font-size:0.8rem; justify-content:center;" onclick="window.open('/partners','_blank')">🔗 Full Review Room</button>
      </div>
    `;
  } else if (type === 'clockin') {
    cardDiv.innerHTML = `
      <div style="font-size:0.75rem; color:#34d399; font-weight:800; margin-bottom:0.4rem;">🟢 STUDIO ATTENDANCE MINIAPP</div>
      <div style="font-size:0.9rem; font-weight:700; color:#fff; margin-bottom:0.4rem;">Gulshan Production Studio</div>
      <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;">Verify GPS distance & log clock-in status</div>
      <button class="btn-purple" style="width:100%; padding:0.65rem; background:linear-gradient(135deg,#10b981,#059669); justify-content:center;" onclick="webClockIn(this)">🟢 1-Tap Studio Clock In</button>
    `;
  } else if (type === 'tasks') {
    cardDiv.innerHTML = `
      <div style="font-size:0.75rem; color:#c084fc; font-weight:800; margin-bottom:0.4rem;">📋 CREW SHOOT KANBAN MINIAPP</div>
      <div style="font-size:0.85rem; font-weight:700; color:#fff; margin-bottom:0.6rem;">Active Assignments for Today</div>
      <div style="background:rgba(255,255,255,0.04); padding:0.6rem; border-radius:8px; font-size:0.8rem; margin-bottom:0.5rem;">
        <strong>1. Chillox Eid Special Reel</strong> — <span style="color:#c084fc;">Editing / Cut</span>
      </div>
      <div style="background:rgba(255,255,255,0.04); padding:0.6rem; border-radius:8px; font-size:0.8rem; margin-bottom:0.75rem;">
        <strong>2. Clear Men OVC Commercial</strong> — <span style="color:#fbbf24;">In Production</span>
      </div>
      <button class="btn-purple" style="width:100%; padding:0.65rem; justify-content:center;" onclick="window.open('/team-miniapp','_blank')">📱 Open Full Crew App</button>
    `;
  }

  feed.appendChild(cardDiv);
  feed.scrollTop = feed.scrollHeight;
}

async function approveWebCut(btn) {
  btn.disabled = true;
  btn.innerText = '✅ Cut Approved & Invoice Issued!';
  btn.style.background = '#059669';
  try {
    await fetch('/api/reviews/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId: 'REV-001', clientName: 'Chillox Fast Food' })
    });
  } catch (e) { console.error(e); }
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

  try {
    await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: userText, mode: currentChatMode })
    });
    // The response will arrive via SSE
  } catch (err) {
    appendMessage('🤖 Connection error: ' + err.message, 'bot');
  }
}

document.addEventListener('DOMContentLoaded', initWebChat);
