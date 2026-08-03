// 🔮 PURPLEBOT DIGITAL — PUBLIC PURPLE BOT AI WIDGET (v0.8.0 - UI/UX Overhaul)

(function () {
  if (document.getElementById('purple-chat-widget-root')) return;

  const root = document.createElement('div');
  root.id = 'purple-chat-widget-root';
  root.innerHTML = `
    <style>
      #purple-widget-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7c3aed, #ec4899);
        box-shadow: 0 10px 25px rgba(124, 58, 237, 0.45);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
        cursor: pointer;
        z-index: 999999;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
        border: none;
        outline: none;
      }
      #purple-widget-btn:hover, #purple-widget-btn:focus-visible {
        transform: scale(1.1);
        box-shadow: 0 14px 30px rgba(124, 58, 237, 0.6);
      }

      #purple-widget-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        background: #10b981;
        border: 2px solid #ffffff;
        border-radius: 50%;
        display: none;
        animation: badgePulse 2s infinite;
      }

      @keyframes badgePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.25); }
      }

      #purple-widget-box {
        position: fixed;
        bottom: 98px;
        right: 24px;
        width: 380px;
        max-width: calc(100vw - 32px);
        height: 540px;
        max-height: calc(100vh - 120px);
        background: #ffffff;
        border: 1px solid rgba(124, 58, 237, 0.2);
        border-radius: 24px;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
        display: none;
        flex-direction: column;
        z-index: 999999;
        overflow: hidden;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        animation: widgetSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      #purple-widget-box.is-closing {
        animation: widgetSlideDown 0.25s ease forwards;
      }

      @keyframes widgetSlideUp {
        from { opacity: 0; transform: translateY(20px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      @keyframes widgetSlideDown {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(20px) scale(0.96); }
      }

      #purple-widget-header {
        padding: 1rem 1.25rem;
        background: linear-gradient(135deg, #7c3aed, #6b21a8);
        color: #ffffff;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      #purple-widget-feed {
        flex: 1;
        padding: 1.25rem 1rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        background: #f8fafc;
        scroll-behavior: smooth;
      }

      .pb-w-msg {
        max-width: 86%;
        padding: 0.75rem 1rem;
        border-radius: 18px;
        font-size: 0.88rem;
        line-height: 1.5;
        animation: msgFadeIn 0.2s ease;
      }

      @keyframes msgFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .pb-w-bot {
        background: #ffffff;
        border: 1px solid rgba(124, 58, 237, 0.15);
        color: #1e293b;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
      }

      .pb-w-user {
        background: linear-gradient(135deg, #7c3aed, #ec4899);
        color: #ffffff;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
      }

      .pb-typing-indicator {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 0.75rem 1.1rem;
      }

      .pb-typing-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #7c3aed;
        animation: typingBounce 1.4s infinite ease-in-out both;
      }

      .pb-typing-dot:nth-child(1) { animation-delay: 0s; }
      .pb-typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .pb-typing-dot:nth-child(3) { animation-delay: 0.4s; }

      @keyframes typingBounce {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1.1); opacity: 1; }
      }

      .pb-chips-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-top: 0.5rem;
      }

      .pb-chip {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #334155;
        padding: 0.4rem 0.8rem;
        border-radius: 20px;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .pb-chip:hover, .pb-chip:focus-visible {
        background: #7c3aed;
        color: #ffffff;
        border-color: #7c3aed;
        outline: none;
      }

      #purple-widget-input-form {
        padding: 0.85rem;
        background: #ffffff;
        border-top: 1px solid #e2e8f0;
        display: flex;
        gap: 0.6rem;
      }

      #purpleWidgetInput {
        flex: 1;
        padding: 0.65rem 1rem;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        color: #0f172a;
        font-size: 0.88rem;
        outline: none;
        transition: border-color 0.2s ease;
      }

      #purpleWidgetInput:focus { border-color: #7c3aed; background: #ffffff; }
      #purpleWidgetInput:disabled { opacity: 0.6; cursor: not-allowed; }

      .pb-widget-send-btn {
        width: 42px;
        height: 42px;
        background: linear-gradient(135deg, #7c3aed, #ec4899);
        border: none;
        border-radius: 12px;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.15s ease, opacity 0.15s ease;
      }

      .pb-widget-send-btn:hover { transform: scale(1.05); }
      .pb-widget-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    </style>

    <button id="purple-widget-btn" onclick="togglePurpleWidget()" aria-label="Chat with Purple Bot" aria-expanded="false" aria-controls="purple-widget-box">
      🤖
      <div id="purple-widget-badge"></div>
    </button>

    <div id="purple-widget-box" role="dialog" aria-modal="true" aria-label="Purple Bot AI Assistant">
      <div id="purple-widget-header">
        <div style="display:flex; align-items:center; gap:0.65rem;">
          <div style="width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">🦉</div>
          <div>
            <div style="font-weight:800; font-size:0.95rem;">Purple Bot AI</div>
            <div style="font-size:0.72rem; color:#fbcfe8;">🟢 Online • Typically replies in minutes</div>
          </div>
        </div>
        <button style="background:none; border:none; color:#ffffff; font-size:1.4rem; cursor:pointer; opacity:0.85; padding:4px;" onclick="closePurpleWidget()" aria-label="Close Chat Window">✕</button>
      </div>

      <div id="purple-widget-feed" aria-live="polite" aria-relevant="additions">
        <!-- Messages rendered dynamically -->
      </div>

      <form id="purple-widget-input-form" onsubmit="handlePurpleWidgetSubmit(event)">
        <input type="text" id="purpleWidgetInput" placeholder="Enter your name..." required autocomplete="off" aria-label="Type your message">
        <button type="submit" id="purpleWidgetSendBtn" class="pb-widget-send-btn" aria-label="Send Message">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(root);

  // Global keydown for Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const box = document.getElementById('purple-widget-box');
      if (box && box.style.display === 'flex') {
        closePurpleWidget();
      }
  const form = document.getElementById('purple-widget-input-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handlePurpleWidgetSubmit(e);
    });
  }

  initBotState();
})();

// BOT CONVERSATION STATE MACHINE
let botState = {
  step: 'ASK_NAME', // ASK_NAME -> ASK_COMPANY -> ASK_SERVICE -> ASK_PHONE -> FINISHED
  name: '',
  company: '',
  service: '',
  phone: ''
};

const STORAGE_KEY = 'purple_bot_session_v1';

function saveBotSession() {
  try {
    const feed = document.getElementById('purple-widget-feed');
    const data = {
      botState: botState,
      feedHTML: feed ? feed.innerHTML : ''
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {}
}

function initBotState() {
  const feed = document.getElementById('purple-widget-feed');
  if (!feed) return;

  // Check saved session
  try {
    const savedRaw = sessionStorage.getItem(STORAGE_KEY);
    if (savedRaw) {
      const saved = JSON.parse(savedRaw);
      if (saved && saved.botState && saved.feedHTML) {
        botState = saved.botState;
        feed.innerHTML = saved.feedHTML;
        updateInputPlaceholder();
        return;
      }
    }
  } catch (err) {}

  feed.innerHTML = `
    <div class="pb-w-msg pb-w-bot">
      👋 Hello! Welcome to <strong>Purplebot Digital Agency</strong>. I'm <strong>Purple Bot</strong>!
      <br><br>
      Whether you're looking for social media growth, video reels, or custom software — I'm here to help.
      <br><br>
      May I have your <strong>Name</strong> to get started?
    </div>
  `;
  botState.step = 'ASK_NAME';
  updateInputPlaceholder();
  saveBotSession();
}

function updateInputPlaceholder() {
  const input = document.getElementById('purpleWidgetInput');
  if (!input) return;

  const placeholders = {
    'ASK_NAME': 'Enter your full name...',
    'ASK_COMPANY': 'Your company or brand name...',
    'ASK_SERVICE': 'Select or type a service...',
    'ASK_PHONE': '+880 1700-000000 (WhatsApp/Phone)',
    'SUBMITTING': 'Processing brief...',
    'FINISHED': 'Type a follow-up question...'
  };

  input.placeholder = placeholders[botState.step] || 'Type your message...';
}

function togglePurpleWidget() {
  const box = document.getElementById('purple-widget-box');
  if (!box) return;

  if (box.style.display === 'flex') {
    closePurpleWidget();
  } else {
    openPurpleWidgetBox();
  }
}

function openPurpleWidgetBox() {
  const box = document.getElementById('purple-widget-box');
  const btn = document.getElementById('purple-widget-btn');
  const badge = document.getElementById('purple-widget-badge');

  if (!box) return;

  box.classList.remove('is-closing');
  box.style.display = 'flex';
  if (btn) btn.setAttribute('aria-expanded', 'true');
  if (badge) badge.style.display = 'none';

  setTimeout(() => {
    document.getElementById('purpleWidgetInput')?.focus();
  }, 100);

  trackEvent('bot_open', 'Widget Opened');
}

function closePurpleWidget() {
  const box = document.getElementById('purple-widget-box');
  const btn = document.getElementById('purple-widget-btn');
  if (!box || box.style.display !== 'flex') return;

  box.classList.add('is-closing');
  if (btn) btn.setAttribute('aria-expanded', 'false');

  setTimeout(() => {
    box.style.display = 'none';
    box.classList.remove('is-closing');
    btn?.focus();
  }, 230);
}

function openPurpleBot(serviceTitle) {
  openPurpleWidgetBox();

  if (serviceTitle && botState.step !== 'FINISHED') {
    botState.service = serviceTitle;
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      appendBotMsg(`🎯 Great choice! You selected <strong>${serviceTitle}</strong>.`);

      if (botState.step === 'ASK_NAME') {
        appendBotMsg(`May I have your <strong>Name</strong> to get started with your custom proposal?`);
      } else if (botState.step === 'ASK_SERVICE') {
        botState.step = 'ASK_PHONE';
        updateInputPlaceholder();
        appendBotMsg(`Great! What is your <strong>WhatsApp / Phone Number</strong> so our account director can reach out with details?`);
      }
      saveBotSession();
    }, 250);
  }
}

function showTypingIndicator() {
  const feed = document.getElementById('purple-widget-feed');
  if (!feed) return null;

  const div = document.createElement('div');
  div.id = 'pb-active-typing';
  div.className = 'pb-w-msg pb-w-bot pb-typing-indicator';
  div.innerHTML = `
    <div class="pb-typing-dot"></div>
    <div class="pb-typing-dot"></div>
    <div class="pb-typing-dot"></div>
  `;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
  return div;
}

function removeTypingIndicator() {
  const el = document.getElementById('pb-active-typing');
  if (el) el.remove();
}

function setBotBusy(busy) {
  const input = document.getElementById('purpleWidgetInput');
  const sendBtn = document.getElementById('purpleWidgetSendBtn');
  if (input) input.disabled = busy;
  if (sendBtn) sendBtn.disabled = busy;
}

function appendUserMsg(text) {
  const feed = document.getElementById('purple-widget-feed');
  if (!feed) return;
  const div = document.createElement('div');
  div.className = 'pb-w-msg pb-w-user';
  div.innerText = text;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
  saveBotSession();
}

function appendBotMsg(htmlContent, chips = null) {
  const feed = document.getElementById('purple-widget-feed');
  const badge = document.getElementById('purple-widget-badge');
  const box = document.getElementById('purple-widget-box');

  if (!feed) return;

  removeTypingIndicator();

  const div = document.createElement('div');
  div.className = 'pb-w-msg pb-w-bot';
  div.innerHTML = htmlContent;

  if (chips && chips.length > 0) {
    const chipsDiv = document.createElement('div');
    chipsDiv.className = 'pb-chips-container';
    chips.forEach(c => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pb-chip';
      btn.innerText = c;
      btn.onclick = () => selectChip(c);
      chipsDiv.appendChild(btn);
    });
    div.appendChild(chipsDiv);
  }

  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;

  // Show badge if widget is closed
  if (box && box.style.display !== 'flex' && badge) {
    badge.style.display = 'block';
  }

  saveBotSession();
}

function selectChip(serviceText) {
  appendUserMsg(serviceText);
  botState.service = serviceText;
  botState.step = 'ASK_PHONE';
  updateInputPlaceholder();

  showTypingIndicator();
  setTimeout(() => {
    appendBotMsg(`Awesome choice! Lastly, what is your <strong>WhatsApp or Phone Number</strong>? Our team will reach out with a custom quote.`);
  }, 400);
}

async function handlePurpleWidgetSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('purpleWidgetInput');
  if (!input) return;

  const val = input.value.trim();
  if (!val) return;

  // Check phone step validation
  if (botState.step === 'ASK_PHONE') {
    const digitsOnly = val.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 10) {
      appendUserMsg(val);
      input.value = '';
      showTypingIndicator();
      setTimeout(() => {
        appendBotMsg(`⚠️ Please re-enter a valid <strong>WhatsApp or Phone number</strong> (at least 10 digits) so our account lead can contact you.`);
      }, 300);
      return;
    }
  }

  appendUserMsg(val);
  input.value = '';

  // Q&A Check
  const lower = val.toLowerCase();
  if (lower.includes('price') || lower.includes('cost') || lower.includes('package') || lower.includes('rate') || lower.includes('services')) {
    setBotBusy(true);
    showTypingIndicator();
    setTimeout(() => {
      handleQnA(val).finally(() => setBotBusy(false));
    }, 500);
    return;
  }

  // State Machine Step Processing
  if (botState.step === 'ASK_NAME') {
    botState.name = val;
    botState.step = 'ASK_COMPANY';
    updateInputPlaceholder();
    setBotBusy(true);
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      appendBotMsg(`Nice to meet you, <strong>${val}</strong>! What is the name of your <strong>Company or Brand</strong>?`);
      setBotBusy(false);
    }, 450);
  } else if (botState.step === 'ASK_COMPANY') {
    botState.company = val;
    botState.step = 'ASK_SERVICE';
    updateInputPlaceholder();
    setBotBusy(true);
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      appendBotMsg(`Thanks! Which service package are you looking for today?`, [
        '📱 Digital Marketing',
        '🎬 Video Reels & TVC',
        '🎨 Branding & Design',
        '💻 Website & Tech',
        '💬 Custom Package'
      ]);
      setBotBusy(false);
    }, 450);
  } else if (botState.step === 'ASK_SERVICE') {
    botState.service = val;
    botState.step = 'ASK_PHONE';
    updateInputPlaceholder();
    setBotBusy(true);
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      appendBotMsg(`Got it! What is your <strong>WhatsApp or Phone Number</strong> so our account team can reach you?`);
      setBotBusy(false);
    }, 450);
  } else if (botState.step === 'ASK_PHONE') {
    botState.phone = val;
    botState.step = 'SUBMITTING';
    updateInputPlaceholder();
    setBotBusy(true);
    showTypingIndicator();

    await checkClientAndSubmitLead();
    setBotBusy(false);
  } else if (botState.step === 'FINISHED') {
    setBotBusy(true);
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      appendBotMsg(`Thanks <strong>${botState.name}</strong>! We already have your inquiry logged. Feel free to WhatsApp or call us directly at <strong>+88 01711 019550</strong> for urgent requests.`);
      setBotBusy(false);
    }, 400);
  }
}

async function handleQnA(query) {
  try {
    const res = await fetch('/api/services');
    const services = await res.json();

    let reply = `🎨 <strong>Purplebot Core Offerings:</strong><br><ul style="padding-left:1.2rem; margin:0.4rem 0;">`;
    (services || []).slice(0, 4).forEach(s => {
      reply += `<li><strong>${s.title}</strong> — ${s.price}</li>`;
    });
    reply += `</ul>Would you like a custom proposal? Tell me your <strong>Company Name</strong> to get started!`;

    botState.step = 'ASK_COMPANY';
    updateInputPlaceholder();
    appendBotMsg(reply);
  } catch (err) {
    appendBotMsg(`Our packages start at <strong>$750/mo</strong> for Social Media & Reels! Tell me your <strong>Company Name</strong> to get a quote.`);
    botState.step = 'ASK_COMPANY';
    updateInputPlaceholder();
  }
}

async function checkClientAndSubmitLead() {
  const cleanPhone = botState.phone.replace(/[^0-9+]/g, '');

  try {
    // Try a lightweight public phone check (won't break if endpoint doesn't exist)
    let isExistingClient = false;
    try {
      const checkRes = await fetch(`/api/public/client-check?phone=${encodeURIComponent(cleanPhone)}`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.found) {
          appendBotMsg(`🎉 Welcome back, <strong>${checkData.name || 'valued partner'}</strong>! You're registered as an active client partner.<br><br>You can access your Workspace directly at <a href="/partners" style="color:#7c3aed; font-weight:700;">purplebot.digital/partners</a>.`);
          botState.step = 'FINISHED';
          updateInputPlaceholder();
          return;
        }
      }
    } catch (e) { /* non-critical — proceed to lead submit */ }

    const utmRaw = sessionStorage.getItem('utm');
    const utm = utmRaw ? JSON.parse(utmRaw) : {};

    const leadRes = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: botState.company,
        contactPerson: botState.name,
        contactEmail: botState.email || '',
        phone: botState.phone,
        service: botState.service || 'General Inquiry',
        notes: `Submitted via Purple Bot AI Chat Widget. UTM: ${JSON.stringify(utm)}`,
        source: 'Purple Bot — Website Widget'
      })
    });

    const data = await leadRes.json();
    if (data.success || data.id) {
      appendBotMsg(`✅ <strong>Thank you ${botState.name}!</strong><br><br>Your campaign brief for <strong>${botState.company}</strong> has been logged.<br><br>Our lead director will contact you via WhatsApp at <strong>${botState.phone}</strong> within 2 hours.`);
      botState.step = 'FINISHED';
      updateInputPlaceholder();
      trackEvent('lead_captured', botState.service);
    } else {
      appendBotMsg(`⚠️ There was a slight issue saving your brief. Please WhatsApp us directly at <strong>+88 01711 019550</strong>.`);
      botState.step = 'FINISHED';
      updateInputPlaceholder();
    }
  } catch (err) {
    console.error('Bot submission error:', err);
    appendBotMsg(`✅ <strong>Thank you ${botState.name}!</strong> Your request has been recorded. Our team will reach out shortly!`);
    botState.step = 'FINISHED';
    updateInputPlaceholder();
  }
}

function trackEvent(eventType, label) {
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventType,
        label: label || '',
        referrer: document.referrer,
        utm: sessionStorage.getItem('utm') || ''
      })
    }).catch(e => {});
  } catch (err) {}
}

// EXPOSE TO GLOBAL WINDOW SCOPE FOR HTML INLINE EVENT HANDLERS
window.handlePurpleWidgetSubmit = handlePurpleWidgetSubmit;
window.openPurpleBot = openPurpleBot;
window.closePurpleWidget = closePurpleWidget;
window.togglePurpleWidget = togglePurpleWidget;
window.selectChip = selectChip;
