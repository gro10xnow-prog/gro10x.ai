// 🔮 PURPLEBOT DIGITAL — PUBLIC PURPLE BOT AI WIDGET (v0.7.5.1)

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
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      #purple-widget-btn:hover { transform: scale(1.1); }

      #purple-widget-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        background: #10b981;
        border: 2px solid #ffffff;
        border-radius: 50%;
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
        animation: widgetSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes widgetSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
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

      .pb-chip:hover {
        background: #7c3aed;
        color: #ffffff;
        border-color: #7c3aed;
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
      }

      #purpleWidgetInput:focus { border-color: #7c3aed; background: #ffffff; }

      .pb-widget-send-btn {
        padding: 0.65rem 1rem;
        background: linear-gradient(135deg, #7c3aed, #ec4899);
        border: none;
        border-radius: 12px;
        color: #ffffff;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.15s ease;
      }

      .pb-widget-send-btn:hover { transform: scale(1.05); }
    </style>

    <div id="purple-widget-btn" onclick="togglePurpleWidget()">
      🤖
      <div id="purple-widget-badge"></div>
    </div>

    <div id="purple-widget-box">
      <div id="purple-widget-header">
        <div style="display:flex; align-items:center; gap:0.65rem;">
          <div style="width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">🦉</div>
          <div>
            <div style="font-weight:800; font-size:0.95rem;">Purple Bot</div>
            <div style="font-size:0.72rem; color:#fbcfe8;">🟢 Online • Agency AI Lead Specialist</div>
          </div>
        </div>
        <button style="background:none; border:none; color:#ffffff; font-size:1.4rem; cursor:pointer; opacity:0.8;" onclick="togglePurpleWidget()">✕</button>
      </div>

      <div id="purple-widget-feed">
        <!-- Messages rendered dynamically -->
      </div>

      <form id="purple-widget-input-form" onsubmit="handlePurpleWidgetSubmit(event)">
        <input type="text" id="purpleWidgetInput" placeholder="Type your response..." required autocomplete="off">
        <button type="submit" class="pb-widget-send-btn">Send 🚀</button>
      </form>
    </div>
  `;

  document.body.appendChild(root);
  initBotState();
})();

// BOT CONVERSATION STATE MACHINE
let botState = {
  step: 'GREETING', // GREETING -> ASK_NAME -> ASK_COMPANY -> ASK_SERVICE -> ASK_PHONE -> FINISHED
  name: '',
  company: '',
  service: '',
  phone: ''
};

function initBotState() {
  const feed = document.getElementById('purple-widget-feed');
  if (!feed) return;

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
}

function togglePurpleWidget() {
  const box = document.getElementById('purple-widget-box');
  if (!box) return;

  if (box.style.display === 'flex') {
    box.style.display = 'none';
  } else {
    box.style.display = 'flex';
    document.getElementById('purpleWidgetInput')?.focus();
    // Track widget open
    trackEvent('bot_open', 'Widget Clicked');
  }
}

function openPurpleBot(serviceTitle) {
  togglePurpleWidget();

  if (serviceTitle) {
    botState.service = serviceTitle;
    appendBotMsg(`I noticed you're interested in <strong>${serviceTitle}</strong>! Excellent choice.`);
    if (botState.step === 'ASK_NAME') {
      appendBotMsg(`What is your name?`);
    } else if (botState.step === 'ASK_SERVICE') {
      botState.step = 'ASK_PHONE';
      appendBotMsg(`Great! What is your <strong>WhatsApp / Phone Number</strong> so our account director can reach out with details?`);
    }
  }
}

function appendUserMsg(text) {
  const feed = document.getElementById('purple-widget-feed');
  if (!feed) return;
  const div = document.createElement('div');
  div.className = 'pb-w-msg pb-w-user';
  div.innerText = text;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
}

function appendBotMsg(htmlContent, chips = null) {
  const feed = document.getElementById('purple-widget-feed');
  if (!feed) return;

  const div = document.createElement('div');
  div.className = 'pb-w-msg pb-w-bot';
  div.innerHTML = htmlContent;

  if (chips && chips.length > 0) {
    const chipsDiv = document.createElement('div');
    chipsDiv.className = 'pb-chips-container';
    chips.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'pb-chip';
      btn.innerText = c;
      btn.onclick = () => selectChip(c);
      chipsDiv.appendChild(btn);
    });
    div.appendChild(chipsDiv);
  }

  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
}

function selectChip(serviceText) {
  appendUserMsg(serviceText);
  botState.service = serviceText;
  botState.step = 'ASK_PHONE';
  appendBotMsg(`Awesome choice! Lastly, what is your <strong>WhatsApp or Phone Number</strong>? Our team will reach out with a custom quote.`);
}

async function handlePurpleWidgetSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('purpleWidgetInput');
  if (!input) return;

  const val = input.value.trim();
  if (!val) return;

  appendUserMsg(val);
  input.value = '';

  // Mode B Check: Check if user is asking a general Q&A question
  const lower = val.toLowerCase();
  if (lower.includes('price') || lower.includes('cost') || lower.includes('package') || lower.includes('rate') || lower.includes('services')) {
    handleQnA(val);
    return;
  }

  // State Machine Step Processing (Mode A)
  if (botState.step === 'ASK_NAME') {
    botState.name = val;
    botState.step = 'ASK_COMPANY';
    appendBotMsg(`Nice to meet you, <strong>${val}</strong>! What is the name of your <strong>Company or Brand</strong>?`);
  } else if (botState.step === 'ASK_COMPANY') {
    botState.company = val;
    botState.step = 'ASK_SERVICE';
    appendBotMsg(`Thanks! Which service package are you looking for today?`, [
      '📱 Digital Marketing',
      '🎬 Video Reels & TVC',
      '🎨 Branding & Design',
      '💻 Website & Tech',
      '💬 Custom Package'
    ]);
  } else if (botState.step === 'ASK_SERVICE') {
    botState.service = val;
    botState.step = 'ASK_PHONE';
    appendBotMsg(`Got it! What is your <strong>WhatsApp or Phone Number</strong> so our account team can reach you?`);
  } else if (botState.step === 'ASK_PHONE') {
    botState.phone = val;
    botState.step = 'SUBMITTING';
    appendBotMsg(`Checking details... ⏳`);

    await checkClientAndSubmitLead();
  } else if (botState.step === 'FINISHED') {
    appendBotMsg(`Thanks <strong>${botState.name}</strong>! We already have your inquiry. Feel free to call us directly at <strong>+88 01711 019550</strong> if urgent.`);
  }
}

async function handleQnA(query) {
  try {
    appendBotMsg(`Looking up service details for you... 🔍`);
    const res = await fetch('/api/services');
    const services = await res.json();

    let reply = `🎨 <strong>Purplebot Core Offerings:</strong><br><ul style="padding-left:1.2rem; margin:0.4rem 0;">`;
    (services || []).slice(0, 4).forEach(s => {
      reply += `<li><strong>${s.title}</strong> — ${s.price}</li>`;
    });
    reply += `</ul>Would you like a custom proposal? Tell me your <strong>Company Name</strong> to get started!`;

    botState.step = 'ASK_COMPANY';
    appendBotMsg(reply);
  } catch (err) {
    appendBotMsg(`Our packages start at <strong>$750/mo</strong> for Social Media & Reels! Tell me your <strong>Company Name</strong> to get a quote.`);
    botState.step = 'ASK_COMPANY';
  }
}

async function checkClientAndSubmitLead() {
  const cleanPhone = botState.phone.replace(/[^0-9+]/g, '');

  try {
    // Mode C Check: Is this an existing client?
    const clientRes = await fetch('/api/clients');
    const clients = await clientRes.json();
    const existingClient = (clients || []).find(c => (c.phone || '').includes(cleanPhone));

    if (existingClient) {
      appendBotMsg(`🎉 Welcome back, <strong>${existingClient.name}</strong>! You're already registered as an active client partner.<br><br>You can access your Client Portal directly at <a href="/partners" style="color:#7c3aed; font-weight:700;">purplebot.digital/partners</a>.`);
      botState.step = 'FINISHED';
      return;
    }

    // Mode A: Post new lead
    const utmRaw = sessionStorage.getItem('utm');
    const utm = utmRaw ? JSON.parse(utmRaw) : {};

    const leadRes = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: botState.company,
        contactPerson: botState.name,
        contactEmail: `${botState.name.toLowerCase().replace(/\s+/g, '')}@lead.com`,
        phone: botState.phone,
        service: botState.service || 'General Inquiry',
        notes: `Submitted via Purple Bot AI Chat Widget. UTM: ${JSON.stringify(utm)}`,
        source: 'Purple Bot — Website Widget'
      })
    });

    const data = await leadRes.json();
    if (data.success) {
      appendBotMsg(`✅ <strong>Thank you ${botState.name}!</strong><br><br>Your campaign brief for <strong>${botState.company}</strong> has been logged.<br><br>Our lead director will contact you via WhatsApp at <strong>${botState.phone}</strong> within 2 hours.`);
      botState.step = 'FINISHED';
      trackEvent('lead_captured', botState.service);
    } else {
      appendBotMsg(`⚠️ There was a slight issue saving your brief. Please WhatsApp us directly at <strong>+88 01711 019550</strong>.`);
    }
  } catch (err) {
    console.error('Bot submission error:', err);
    appendBotMsg(`✅ <strong>Thank you ${botState.name}!</strong> Your request has been recorded. Our team will reach out shortly!`);
    botState.step = 'FINISHED';
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
