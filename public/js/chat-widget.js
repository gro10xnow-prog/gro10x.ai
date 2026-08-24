// 🔮 PURPLEBOT DIGITAL — PUBLIC PURPLE BOT AI WIDGET (v1.0.0 - Clean Rewrite)

// ─── BOT STATE ────────────────────────────────────────────────────────────────
var botState = {
  step: 'ASK_NAME',
  name: '',
  company: '',
  service: '',
  phone: ''
};

var STORAGE_KEY = 'purple_bot_session_v1';

// ─── WIDGET CSS ───────────────────────────────────────────────────────────────
var WIDGET_CSS = `
  #purple-widget-btn {
    position: fixed; bottom: 24px; right: 24px;
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #ec4899);
    box-shadow: 0 10px 25px rgba(124,58,237,0.45);
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 1.8rem; cursor: pointer; z-index: 999999; border: none; outline: none;
    transition: transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.3s ease;
  }
  #purple-widget-btn:hover { transform: scale(1.1); box-shadow: 0 14px 30px rgba(124,58,237,0.6); }

  #purple-widget-badge {
    position: absolute; top: -2px; right: -2px;
    width: 16px; height: 16px; background: #10b981;
    border: 2px solid #fff; border-radius: 50%; display: none;
    animation: badgePulse 2s infinite;
  }
  @keyframes badgePulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.25);} }

  #purple-widget-box {
    position: fixed; bottom: 98px; right: 24px;
    width: 380px; max-width: calc(100vw - 32px);
    height: 540px; max-height: calc(100vh - 120px);
    background: #fff; border: 1px solid rgba(124,58,237,0.2);
    border-radius: 24px; box-shadow: 0 20px 50px rgba(15,23,42,0.18);
    display: none; flex-direction: column; z-index: 999999;
    overflow: hidden; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }
  #purple-widget-box.is-open { display: flex; animation: widgetSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
  #purple-widget-box.is-closing { animation: widgetSlideDown 0.25s ease forwards; }

  @keyframes widgetSlideUp { from{opacity:0;transform:translateY(20px) scale(0.96);} to{opacity:1;transform:translateY(0) scale(1);} }
  @keyframes widgetSlideDown { from{opacity:1;transform:translateY(0) scale(1);} to{opacity:0;transform:translateY(20px) scale(0.96);} }

  #purple-widget-header {
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, #7c3aed, #6b21a8);
    color: #fff; display: flex; justify-content: space-between; align-items: center;
    flex-shrink: 0;
  }
  #purple-widget-feed {
    flex: 1; padding: 1.25rem 1rem; overflow-y: auto;
    display: flex; flex-direction: column; gap: 0.85rem;
    background: #f8fafc; scroll-behavior: smooth;
  }
  .pb-w-msg {
    max-width: 86%; padding: 0.75rem 1rem; border-radius: 18px;
    font-size: 0.88rem; line-height: 1.5; animation: msgFadeIn 0.2s ease;
  }
  @keyframes msgFadeIn { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
  .pb-w-bot {
    background: #fff; border: 1px solid rgba(124,58,237,0.15);
    color: #1e293b; align-self: flex-start; border-bottom-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  }
  .pb-w-user {
    background: linear-gradient(135deg, #7c3aed, #ec4899);
    color: #fff; align-self: flex-end; border-bottom-right-radius: 4px;
    box-shadow: 0 4px 12px rgba(124,58,237,0.25);
  }
  .pb-typing-indicator { display:inline-flex; align-items:center; gap:4px; padding:0.75rem 1.1rem; }
  .pb-typing-dot {
    width:6px; height:6px; border-radius:50%; background:#7c3aed;
    animation: typingBounce 1.4s infinite ease-in-out both;
  }
  .pb-typing-dot:nth-child(1){animation-delay:0s;}
  .pb-typing-dot:nth-child(2){animation-delay:0.2s;}
  .pb-typing-dot:nth-child(3){animation-delay:0.4s;}
  @keyframes typingBounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4;} 40%{transform:scale(1.1);opacity:1;} }

  .pb-chips-container { display:flex; flex-wrap:wrap; gap:0.4rem; margin-top:0.5rem; }
  .pb-chip {
    background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155;
    padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.78rem;
    font-weight: 700; cursor: pointer; transition: all 0.15s ease;
  }
  .pb-chip:hover { background: #7c3aed; color: #fff; border-color: #7c3aed; }

  #purple-widget-input-area {
    padding: 0.85rem; background: #fff; border-top: 1px solid #e2e8f0;
    display: flex; gap: 0.6rem; flex-shrink: 0;
  }
  #purpleWidgetInput {
    flex: 1; padding: 0.65rem 1rem; background: #f8fafc;
    border: 1px solid #cbd5e1; border-radius: 12px;
    color: #0f172a; font-size: 0.88rem; outline: none;
    transition: border-color 0.2s ease; font-family: inherit;
  }
  #purpleWidgetInput:focus { border-color: #7c3aed; background: #fff; }
  #purpleWidgetInput:disabled { opacity: 0.6; cursor: not-allowed; }
  #purpleWidgetSendBtn {
    width: 42px; height: 42px;
    background: linear-gradient(135deg, #7c3aed, #ec4899);
    border: none; border-radius: 12px; color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: transform 0.15s ease, opacity 0.15s ease;
    flex-shrink: 0;
  }
  #purpleWidgetSendBtn:hover { transform: scale(1.05); }
  #purpleWidgetSendBtn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

// ─── WIDGET HTML ──────────────────────────────────────────────────────────────
var WIDGET_HTML = `
  <button id="purple-widget-btn" aria-label="Chat with Purple Bot" aria-expanded="false" aria-controls="purple-widget-box">
    🤖
    <div id="purple-widget-badge"></div>
  </button>

  <div id="purple-widget-box" role="dialog" aria-modal="true" aria-label="Purple Bot AI Assistant">
    <div id="purple-widget-header">
      <div style="display:flex;align-items:center;gap:0.65rem;">
        <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🦉</div>
        <div>
          <div style="font-weight:800;font-size:0.95rem;">Purple Bot AI</div>
          <div style="font-size:0.72rem;color:#fbcfe8;">🟢 Online • Typically replies in minutes</div>
        </div>
      </div>
      <button id="purple-widget-close-btn" style="background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer;opacity:0.85;padding:4px;" aria-label="Close Chat Window">✕</button>
    </div>

    <div id="purple-widget-feed" aria-live="polite" aria-relevant="additions"></div>

    <div id="purple-widget-input-area">
      <input type="text" id="purpleWidgetInput" placeholder="Enter your name..." autocomplete="off" aria-label="Type your message">
      <button type="button" id="purpleWidgetSendBtn" aria-label="Send Message">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </div>
  </div>
`;

// ─── MOUNT WIDGET ─────────────────────────────────────────────────────────────
function mountWidget() {
  if (document.getElementById('purple-chat-widget-root')) return;

  // Inject CSS
  var style = document.createElement('style');
  style.textContent = WIDGET_CSS;
  document.head.appendChild(style);

  // Inject HTML
  var root = document.createElement('div');
  root.id = 'purple-chat-widget-root';
  root.innerHTML = WIDGET_HTML;
  document.body.appendChild(root);

  // Wire up toggle button
  var btn = document.getElementById('purple-widget-btn');
  if (btn) btn.addEventListener('click', togglePurpleWidget);

  // Wire up close button
  var closeBtn = document.getElementById('purple-widget-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closePurpleWidget);

  // Wire up send button
  var sendBtn = document.getElementById('purpleWidgetSendBtn');
  if (sendBtn) sendBtn.addEventListener('click', function() { handleSubmit(); });

  // Wire up Enter key on input
  var input = document.getElementById('purpleWidgetInput');
  if (input) {
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    });
  }

  // Escape to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var box = document.getElementById('purple-widget-box');
      if (box && box.classList.contains('is-open')) closePurpleWidget();
    }
  });

  // Init conversation
  initBotState();
}

// ─── WIDGET OPEN/CLOSE ────────────────────────────────────────────────────────
function togglePurpleWidget() {
  var box = document.getElementById('purple-widget-box');
  if (!box) return;
  if (box.classList.contains('is-open')) {
    closePurpleWidget();
  } else {
    openPurpleWidgetBox();
  }
}

function openPurpleWidgetBox() {
  var box = document.getElementById('purple-widget-box');
  var btn = document.getElementById('purple-widget-btn');
  var badge = document.getElementById('purple-widget-badge');
  if (!box) return;

  box.classList.remove('is-closing');
  box.classList.add('is-open');
  box.style.display = 'flex';
  if (btn) btn.setAttribute('aria-expanded', 'true');
  if (badge) badge.style.display = 'none';

  setTimeout(function() {
    var input = document.getElementById('purpleWidgetInput');
    if (input) input.focus();
  }, 150);

  trackEvent('bot_open', 'Widget Opened');
}

function closePurpleWidget() {
  var box = document.getElementById('purple-widget-box');
  var btn = document.getElementById('purple-widget-btn');
  if (!box || !box.classList.contains('is-open')) return;

  box.classList.add('is-closing');
  if (btn) btn.setAttribute('aria-expanded', 'false');

  setTimeout(function() {
    box.style.display = 'none';
    box.classList.remove('is-open', 'is-closing');
    if (btn) btn.focus();
  }, 250);
}

// ─── OPEN WITH SERVICE PRE-SELECTED (called from pricing buttons) ─────────────
function openPurpleBot(serviceTitle) {
  openPurpleWidgetBox();

  if (serviceTitle && botState.step !== 'FINISHED') {
    botState.service = serviceTitle;
    setTimeout(function() {
      showTypingIndicator();
      setTimeout(function() {
        removeTypingIndicator();
        appendBotMsg('🎯 Great choice! You selected <strong>' + serviceTitle + '</strong>.');
        if (botState.step === 'ASK_NAME') {
          appendBotMsg('May I have your <strong>Name</strong> to get started with your custom proposal?');
        }
        saveBotSession();
      }, 400);
    }, 100);
  }
}

// ─── BOT STATE INIT ───────────────────────────────────────────────────────────
function initBotState() {
  var feed = document.getElementById('purple-widget-feed');
  if (!feed) return;

  try {
    var savedRaw = sessionStorage.getItem(STORAGE_KEY);
    if (savedRaw) {
      var saved = JSON.parse(savedRaw);
      if (saved && saved.botState && saved.feedHTML) {
        botState = saved.botState;
        feed.innerHTML = saved.feedHTML;
        updateInputPlaceholder();
        return;
      }
    }
  } catch (err) {}

  feed.innerHTML = '<div class="pb-w-msg pb-w-bot">👋 Hello! Welcome to <strong>Purplebot Digital Agency</strong>. I\'m <strong>Purple Bot</strong>!<br><br>Whether you\'re looking for social media growth, video reels, or custom software — I\'m here to help.<br><br>May I have your <strong>Name</strong> to get started?</div>';
  botState = { step: 'ASK_NAME', name: '', company: '', service: '', phone: '' };
  updateInputPlaceholder();
  saveBotSession();
}

function saveBotSession() {
  try {
    var feed = document.getElementById('purple-widget-feed');
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      botState: botState,
      feedHTML: feed ? feed.innerHTML : ''
    }));
  } catch (err) {}
}

function updateInputPlaceholder() {
  var input = document.getElementById('purpleWidgetInput');
  if (!input) return;
  var map = {
    'ASK_NAME': 'Enter your full name...',
    'ASK_COMPANY': 'Your company or brand name...',
    'ASK_SERVICE': 'Select or type a service...',
    'ASK_PHONE': '+880 1700-000000 (WhatsApp/Phone)',
    'SUBMITTING': 'Processing brief...',
    'FINISHED': 'Type a follow-up question...'
  };
  input.placeholder = map[botState.step] || 'Type your message...';
}

// ─── MESSAGING ────────────────────────────────────────────────────────────────
function showTypingIndicator() {
  var feed = document.getElementById('purple-widget-feed');
  if (!feed || document.getElementById('pb-active-typing')) return;
  var div = document.createElement('div');
  div.id = 'pb-active-typing';
  div.className = 'pb-w-msg pb-w-bot pb-typing-indicator';
  div.innerHTML = '<div class="pb-typing-dot"></div><div class="pb-typing-dot"></div><div class="pb-typing-dot"></div>';
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
}

function removeTypingIndicator() {
  var el = document.getElementById('pb-active-typing');
  if (el) el.remove();
}

function setBotBusy(busy) {
  var input = document.getElementById('purpleWidgetInput');
  var sendBtn = document.getElementById('purpleWidgetSendBtn');
  if (input) input.disabled = busy;
  if (sendBtn) sendBtn.disabled = busy;
}

function appendUserMsg(text) {
  var feed = document.getElementById('purple-widget-feed');
  if (!feed) return;
  var div = document.createElement('div');
  div.className = 'pb-w-msg pb-w-user';
  div.innerText = text;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
  saveBotSession();
}

function appendBotMsg(htmlContent, chips) {
  var feed = document.getElementById('purple-widget-feed');
  var badge = document.getElementById('purple-widget-badge');
  var box = document.getElementById('purple-widget-box');
  if (!feed) return;

  removeTypingIndicator();

  var div = document.createElement('div');
  div.className = 'pb-w-msg pb-w-bot';
  div.innerHTML = htmlContent;

  if (chips && chips.length > 0) {
    var chipsDiv = document.createElement('div');
    chipsDiv.className = 'pb-chips-container';
    chips.forEach(function(c) {
      var chipBtn = document.createElement('button');
      chipBtn.type = 'button';
      chipBtn.className = 'pb-chip';
      chipBtn.innerText = c;
      chipBtn.addEventListener('click', function() { selectChip(c); });
      chipsDiv.appendChild(chipBtn);
    });
    div.appendChild(chipsDiv);
  }

  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;

  if (box && !box.classList.contains('is-open') && badge) {
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
  setTimeout(function() {
    appendBotMsg('Awesome choice! Lastly, what is your <strong>WhatsApp or Phone Number</strong>? Our team will reach out with a custom quote.');
  }, 400);
}

// ─── MESSAGE SUBMIT HANDLER ───────────────────────────────────────────────────
function handleSubmit() {
  var input = document.getElementById('purpleWidgetInput');
  if (!input) return;

  var val = input.value.trim();
  if (!val) return;

  // Phone validation
  if (botState.step === 'ASK_PHONE') {
    var digits = val.replace(/[^0-9]/g, '');
    if (digits.length < 10) {
      appendUserMsg(val);
      input.value = '';
      showTypingIndicator();
      setTimeout(function() {
        appendBotMsg('⚠️ Please re-enter a valid <strong>WhatsApp or Phone number</strong> (at least 10 digits) so our account lead can contact you.');
      }, 300);
      return;
    }
  }

  appendUserMsg(val);
  input.value = '';

  // Q&A shortcut
  var lower = val.toLowerCase();
  if (lower.includes('price') || lower.includes('cost') || lower.includes('package') || lower.includes('rate') || lower.includes('services')) {
    setBotBusy(true);
    showTypingIndicator();
    setTimeout(function() {
      handleQnA(val).finally(function() { setBotBusy(false); });
    }, 500);
    return;
  }

  // State machine
  if (botState.step === 'ASK_NAME') {
    botState.name = val;
    botState.step = 'ASK_COMPANY';
    updateInputPlaceholder();
    setBotBusy(true);
    showTypingIndicator();
    setTimeout(function() {
      removeTypingIndicator();
      appendBotMsg('Nice to meet you, <strong>' + val + '</strong>! What is the name of your <strong>Company or Brand</strong>?');
      setBotBusy(false);
    }, 450);

  } else if (botState.step === 'ASK_COMPANY') {
    botState.company = val;
    botState.step = 'ASK_SERVICE';
    updateInputPlaceholder();
    setBotBusy(true);
    showTypingIndicator();
    setTimeout(function() {
      removeTypingIndicator();
      appendBotMsg('Thanks! Which service are you looking for today?', [
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
    setTimeout(function() {
      removeTypingIndicator();
      appendBotMsg('Got it! What is your <strong>WhatsApp or Phone Number</strong> so our account team can reach you?');
      setBotBusy(false);
    }, 450);

  } else if (botState.step === 'ASK_PHONE') {
    botState.phone = val;
    botState.step = 'SUBMITTING';
    updateInputPlaceholder();
    setBotBusy(true);
    showTypingIndicator();
    checkClientAndSubmitLead();

  } else if (botState.step === 'FINISHED') {
    setBotBusy(true);
    showTypingIndicator();
    setTimeout(function() {
      removeTypingIndicator();
      appendBotMsg('Thanks <strong>' + botState.name + '</strong>! We already have your inquiry logged. Feel free to WhatsApp us directly at <strong>+88 01711 019550</strong> for urgent requests.');
      setBotBusy(false);
    }, 400);
  }
}

// ─── Q&A ──────────────────────────────────────────────────────────────────────
async function handleQnA(query) {
  try {
    var res = await fetch('/api/services');
    var services = await res.json();
    var reply = '🎨 <strong>Purplebot Core Offerings:</strong><br><ul style="padding-left:1.2rem;margin:0.4rem 0;">';
    (services || []).slice(0, 4).forEach(function(s) {
      reply += '<li><strong>' + s.title + '</strong> — ' + (s.price || '') + '</li>';
    });
    reply += '</ul>Would you like a custom proposal? Tell me your <strong>Company Name</strong> to get started!';
    botState.step = 'ASK_COMPANY';
    updateInputPlaceholder();
    appendBotMsg(reply);
  } catch (err) {
    appendBotMsg('Our packages start at <strong>৳45,000/mo</strong> for Social Media & Reels! Tell me your <strong>Company Name</strong> to get a quote.');
    botState.step = 'ASK_COMPANY';
    updateInputPlaceholder();
  }
}

// ─── LEAD SUBMISSION ──────────────────────────────────────────────────────────
async function checkClientAndSubmitLead() {
  var cleanPhone = botState.phone.replace(/[^0-9+]/g, '');
  try {
    try {
      var checkRes = await fetch('/api/public/client-check?phone=' + encodeURIComponent(cleanPhone));
      if (checkRes.ok) {
        var checkData = await checkRes.json();
        if (checkData.found) {
          appendBotMsg('🎉 Welcome back, <strong>' + (checkData.name || 'valued partner') + '</strong>! You\'re registered as an active client partner.<br><br>You can access your Workspace directly at <a href="/partners" style="color:#7c3aed;font-weight:700;">purplebot.digital/partners</a>.');
          botState.step = 'FINISHED';
          updateInputPlaceholder();
          setBotBusy(false);
          return;
        }
      }
    } catch (e) { /* non-critical */ }

    var utmRaw = sessionStorage.getItem('utm');
    var utm = utmRaw ? JSON.parse(utmRaw) : {};

    var leadRes = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: botState.company,
        contactPerson: botState.name,
        contactEmail: '',
        phone: botState.phone,
        service: botState.service || 'General Inquiry',
        notes: 'Submitted via Purple Bot AI Chat Widget.',
        source: 'Purple Bot — Website Widget',
        utm_source: utm.utm_source || utm.source || '',
        utm_medium: utm.utm_medium || utm.medium || '',
        utm_campaign: utm.utm_campaign || utm.campaign || ''
      })
    });

    var data = await leadRes.json();
    if (data.success || data.id) {
      appendBotMsg('✅ <strong>Thank you ' + botState.name + '!</strong><br><br>Your campaign brief for <strong>' + botState.company + '</strong> has been logged.<br><br>Our lead director will contact you via WhatsApp at <strong>' + botState.phone + '</strong> within 2 hours. 🚀');
      trackEvent('lead_captured', botState.service);
    } else {
      appendBotMsg('⚠️ There was a slight issue saving your brief. Please WhatsApp us directly at <strong>+88 01711 019550</strong>.');
    }
  } catch (err) {
    appendBotMsg('⚠️ <strong>Something went wrong connecting to our servers.</strong><br><br>Please reach out directly via WhatsApp at <strong>+88 01711 019550</strong> or email <strong>contact@purplebot.digital</strong> and our team will prepare your proposal immediately. 🙏');
  }

  botState.step = 'FINISHED';
  updateInputPlaceholder();
  setBotBusy(false);
}

// ─── TRACKING ─────────────────────────────────────────────────────────────────
function trackEvent(eventType, label) {
  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: eventType, label: label || '', referrer: document.referrer, utm: sessionStorage.getItem('utm') || '' })
    }).catch(function() {});
  } catch (err) {}
}

// ─── EXPOSE TO WINDOW (for pricing plan buttons: onclick="openPurpleBot(...)") ─
window.openPurpleBot = openPurpleBot;
window.togglePurpleWidget = togglePurpleWidget;
window.closePurpleWidget = closePurpleWidget;

// ─── BOOT ON DOM READY ────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountWidget);
} else {
  mountWidget();
}
