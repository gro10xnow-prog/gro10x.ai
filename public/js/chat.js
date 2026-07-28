let currentChatMode = 'client';

function initWebChat() {
  const urlParams = new URLSearchParams(window.location.search);
  const modeParam = urlParams.get('mode');
  if (modeParam === 'team') {
    document.getElementById('chatModeSelect').value = 'team';
    switchChatMode('team');
  }
}

function switchChatMode(mode) {
  currentChatMode = mode;
  const nameEl = document.getElementById('chatBotName');
  const chipsEl = document.getElementById('quickChipsBar');
  const feed = document.getElementById('chatFeed');

  if (mode === 'team') {
    nameEl.innerText = 'Purple Man (Team Crew Bot)';
    chipsEl.innerHTML = `
      <button type="button" class="chip-btn" onclick="sendQuickMessage('/clockin')">🟢 Clock In Studio</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('/clockout')">🚪 Clock Out</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('/myearnings')">💰 My Earnings</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('/mybookings')">📅 Shoot Schedule</button>
    `;
    feed.innerHTML = `
      <div class="msg-bubble msg-bot">
        🤖 **Purple Man Crew Operations Active!** Tap quick actions below or use commands to log time and check shoot schedules.
      </div>
    `;
  } else {
    nameEl.innerText = 'Purple Bot (B2B Client Bot)';
    chipsEl.innerHTML = `
      <button type="button" class="chip-btn" onclick="sendQuickMessage('What are your service packages and rates?')">💰 Service Rates</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('Can I see your portfolio reel?')">📁 Campaign Portfolio</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('How do I review video cuts in Review Room?')">🎬 Review Room V2</button>
      <button type="button" class="chip-btn" onclick="sendQuickMessage('How do I verify an invoice payment?')">💳 Invoice Billing</button>
    `;
    feed.innerHTML = `
      <div class="msg-bubble msg-bot">
        👋 Welcome to **Purplebot Digital Agency**! How can we assist your brand today? Select a quick action below or type your inquiry.
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
    const res = await fetch('/api/telegram-simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: userText, mode: currentChatMode })
    });
    const data = await res.json();
    appendMessage(data.responseText || 'Received! Our team is processing your request.', 'bot');
  } catch (err) {
    appendMessage('🤖 Response error: ' + err.message, 'bot');
  }
}

document.addEventListener('DOMContentLoaded', initWebChat);
