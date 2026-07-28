(function() {
  if (document.getElementById('purple-chat-widget-root')) return;

  const root = document.createElement('div');
  root.id = 'purple-chat-widget-root';
  root.innerHTML = `
    <style>
      #purple-widget-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #a855f7, #ec4899);
        box-shadow: 0 10px 25px rgba(168,85,247,0.5);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.6rem;
        cursor: pointer;
        z-index: 99999;
        transition: transform 0.3s ease;
      }
      #purple-widget-btn:hover { transform: scale(1.1); }
      #purple-widget-box {
        position: fixed;
        bottom: 96px;
        right: 24px;
        width: 360px;
        height: 480px;
        background: rgba(24, 24, 27, 0.95);
        border: 1px solid rgba(168, 85, 247, 0.4);
        border-radius: 20px;
        backdrop-filter: blur(20px);
        box-shadow: 0 20px 40px rgba(0,0,0,0.8);
        display: none;
        flex-direction: column;
        z-index: 99999;
        overflow: hidden;
      }
      #purple-widget-header {
        padding: 0.85rem 1rem;
        background: rgba(9,9,11,0.9);
        border-bottom: 1px solid rgba(255,255,255,0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #purple-widget-feed {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .w-msg {
        max-width: 85%;
        padding: 0.65rem 0.85rem;
        border-radius: 14px;
        font-size: 0.82rem;
        line-height: 1.4;
      }
      .w-bot { background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3); color: #fff; align-self: flex-start; }
      .w-user { background: linear-gradient(135deg, #a855f7, #ec4899); color: #fff; align-self: flex-end; }
      #purple-widget-input-box {
        padding: 0.75rem;
        background: rgba(9,9,11,0.9);
        border-top: 1px solid rgba(255,255,255,0.08);
        display: flex;
        gap: 0.5rem;
      }
    </style>

    <div id="purple-widget-btn" onclick="togglePurpleWidget()">🤖</div>

    <div id="purple-widget-box">
      <div id="purple-widget-header">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="font-size:1.2rem;">🤖</span>
          <div>
            <div style="font-weight:800; font-size:0.9rem; color:#fff;">Purplebot Assistant</div>
            <div style="font-size:0.7rem; color:#34d399;">🟢 Online • Agency AI</div>
          </div>
        </div>
        <button style="background:none; border:none; color:#a1a1aa; font-size:1.2rem; cursor:pointer;" onclick="togglePurpleWidget()">✕</button>
      </div>

      <div id="purple-widget-feed">
        <div class="w-msg w-bot">
          👋 Hi! Welcome to Purplebot Digital Agency. How can we help your brand today?
        </div>
      </div>

      <form id="purple-widget-input-box" onsubmit="submitPurpleWidgetMsg(event)">
        <input type="text" id="purpleWidgetInput" placeholder="Ask about services, rates..." style="flex:1; padding:0.5rem 0.75rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:#fff; font-size:0.8rem; outline:none;" required>
        <button type="submit" style="padding:0.5rem 0.85rem; background:linear-gradient(135deg,#a855f7,#ec4899); border:none; border-radius:10px; color:#fff; font-weight:700; cursor:pointer;">🚀</button>
      </form>
    </div>
  `;

  document.body.appendChild(root);
})();

function togglePurpleWidget() {
  const box = document.getElementById('purple-widget-box');
  if (box.style.display === 'flex') {
    box.style.display = 'none';
  } else {
    box.style.display = 'flex';
  }
}

async function submitPurpleWidgetMsg(e) {
  e.preventDefault();
  const input = document.getElementById('purpleWidgetInput');
  const feed = document.getElementById('purple-widget-feed');
  const txt = input.value.trim();
  if (!txt) return;

  const uDiv = document.createElement('div');
  uDiv.className = 'w-msg w-user';
  uDiv.innerText = txt;
  feed.appendChild(uDiv);
  input.value = '';
  feed.scrollTop = feed.scrollHeight;

  try {
    const res = await fetch('/api/telegram-simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: txt, mode: 'client' })
    });
    const data = await res.json();
    const bDiv = document.createElement('div');
    bDiv.className = 'w-msg w-bot';
    bDiv.innerHTML = (data.responseText || 'Thanks! Our team will follow up.').replace(/\n/g, '<br>').replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    feed.appendChild(bDiv);
    feed.scrollTop = feed.scrollHeight;
  } catch (err) { console.error(err); }
}
