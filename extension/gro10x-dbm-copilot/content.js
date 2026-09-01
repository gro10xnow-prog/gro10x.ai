/**
 * GRO10X DBM Copilot - Content Script (DOM Automation, WhatsApp Auto-Send & In-Page HUD)
 */

(function() {
  'use strict';

  if (window.__GRO10X_COPILOT_INJECTED__) return;
  window.__GRO10X_COPILOT_INJECTED__ = true;

  // ── WHATSAPP WEB AUTO-SENDER ENGINE ──
  function initWhatsAppAutoSender() {
    if (!window.location.hostname.includes('whatsapp.com')) return;

    chrome.storage.local.get('GRO10X_COPILOT_STATE', (res) => {
      const state = res.GRO10X_COPILOT_STATE || {};
      const autoSendEnabled = state.autoSendWhatsApp !== false; // default true

      if (!autoSendEnabled) {
        console.log('[GRO10X Copilot] WhatsApp Auto-Send is disabled in settings.');
        return;
      }

      console.log('[GRO10X Copilot] WhatsApp Web Chat Detected. Looking for Send button...');

      let attempts = 0;
      const checkTimer = setInterval(() => {
        attempts++;

        // Selectors for WhatsApp Web Send button
        const sendBtn = document.querySelector('button[aria-label="Send"], span[data-icon="send"], [data-testid="send"], [data-tab="11"], footer button:has(span[data-icon="send"])');

        if (sendBtn) {
          clearInterval(checkTimer);
          console.log('[GRO10X Copilot] Found Send Button! Auto-clicking in 1.5s...');

          setTimeout(() => {
            const clickTarget = sendBtn.closest('button') || sendBtn;
            clickTarget.focus();
            clickTarget.click();

            // Visual feedback indicator
            const bubble = document.createElement('div');
            bubble.style.cssText = `
              position: fixed;
              bottom: 80px;
              right: 24px;
              background: #00df89;
              color: #070b12;
              padding: 10px 18px;
              border-radius: 20px;
              font-weight: 800;
              font-size: 13px;
              z-index: 999999;
              box-shadow: 0 4px 16px rgba(0,0,0,0.4);
              font-family: system-ui, sans-serif;
            `;
            bubble.textContent = '🚀 GRO10X Copilot: Message Auto-Sent!';
            document.body.appendChild(bubble);
            setTimeout(() => bubble.remove(), 4000);

            // Notify extension
            chrome.runtime.sendMessage({ type: 'WHATSAPP_MESSAGE_SENT' });
          }, 1500);
        }

        if (attempts > 25) {
          clearInterval(checkTimer);
          console.log('[GRO10X Copilot] Send button search timed out. Ready for manual send.');
        }
      }, 600);
    });
  }

  let BATCH_STATE = {
    isRunning: false,
    isPaused: false,
    queue: [],
    currentIndex: 0,
    delaySeconds: 15,
    timerId: null,
    manualInputTarget: null,
    manualBtnTarget: null
  };

  // ── IN-PAGE FLOATING HUD OVERLAY (FOR AI TOOLS) ──
  let hudContainer = null;

  function createFloatingHUD() {
    if (window.location.hostname.includes('whatsapp.com')) return;
    if (document.getElementById('gro10x-copilot-hud')) return;

    hudContainer = document.createElement('div');
    hudContainer.id = 'gro10x-copilot-hud';
    hudContainer.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 99999999;
      background: #0a0e17;
      border: 1px solid #00df89;
      color: #f8fafc;
      padding: 8px 14px;
      border-radius: 10px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.85);
      display: none;
      align-items: center;
      gap: 8px;
      backdrop-filter: blur(12px);
      transition: all 0.3s ease;
    `;

    hudContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 16px; color: #00df89;">⚡</span>
        <div>
          <strong style="display: block; font-size: 11px; color: #00df89; text-transform: uppercase;">GRO10X Copilot</strong>
          <span id="hudStatusText" style="font-size: 11px; color: #cbd5e1;">Standby</span>
        </div>
      </div>
      <div style="width: 1px; height: 22px; background: rgba(255,255,255,0.15);"></div>
      <div id="hudStepBadge" style="background: rgba(0,223,137,0.15); color: #00df89; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
        0 / 0
      </div>
    `;

    document.body.appendChild(hudContainer);
  }

  function updateHUD(text, step, total, isRunning = true) {
    if (window.location.hostname.includes('whatsapp.com')) return;
    createFloatingHUD();
    const hud = document.getElementById('gro10x-copilot-hud');
    const statusText = document.getElementById('hudStatusText');
    const badge = document.getElementById('hudStepBadge');

    if (hud && statusText && badge) {
      hud.style.display = isRunning ? 'flex' : 'none';
      statusText.textContent = text;
      badge.textContent = `${step} / ${total}`;
    }
  }

  // ── RUNTIME MESSAGE LISTENER ──
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, payload } = message || {};

    if (type === 'START_BATCH_INJECTION') {
      BATCH_STATE.isRunning = true;
      BATCH_STATE.isPaused = false;
      BATCH_STATE.queue = payload.queue || [];
      BATCH_STATE.currentIndex = payload.startIndex || 0;
      BATCH_STATE.delaySeconds = payload.delaySeconds || 20;

      createFloatingHUD();
      sendResponse({ received: true, status: 'started' });
      return true;
    }

    if (type === 'AUTO_PUBLISH_SOCIAL_POST') {
      const post = payload || {};
      const fullText = [post.caption, post.firstComment ? `\n1st Comment:\n${post.firstComment}` : '', post.hashtags].filter(Boolean).join('\n\n');

      // Floating Action Banner
      const banner = document.createElement('div');
      banner.id = 'gro10x-social-auto-banner';
      banner.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #0f172a;
        border: 2px solid #06b6d4;
        color: #fff;
        padding: 12px 20px;
        border-radius: 12px;
        font-family: system-ui, sans-serif;
        font-size: 13px;
        z-index: 99999999;
        box-shadow: 0 8px 32px rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        gap: 12px;
      `;

      banner.innerHTML = `
        <span style="font-size: 18px;">🚀</span>
        <div>
          <strong style="color: #06b6d4;">GRO10X Copilot Ready:</strong>
          <span>${post.channel || 'Grow Bangla'} · ${post.title ? post.title.slice(0, 35) : 'Post'}</span>
        </div>
        <button id="gro10x-paste-btn" style="background: #06b6d4; color: #070b12; border: none; font-weight: 800; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
          ⚡ Paste to Composer
        </button>
        <button id="gro10x-close-banner-btn" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 14px;">✕</button>
      `;

      document.body.appendChild(banner);

      document.getElementById('gro10x-close-banner-btn')?.addEventListener('click', () => banner.remove());
      document.getElementById('gro10x-paste-btn')?.addEventListener('click', () => {
        // Try locating composer textarea / contenteditable on Facebook / YouTube
        const composer = document.querySelector('div[role="textbox"], textarea[aria-label*="What\'s on your mind"], textarea[placeholder*="Description"], textarea, div[contenteditable="true"]');
        if (composer) {
          composer.focus();
          if (composer.tagName === 'TEXTAREA' || composer.tagName === 'INPUT') {
            composer.value = fullText;
            composer.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            document.execCommand('insertText', false, fullText);
          }
        }
        navigator.clipboard.writeText(fullText);
        banner.innerHTML = `<span style="font-size: 18px;">✅</span> <strong>Post copy pasted & copied to clipboard!</strong>`;
        setTimeout(() => banner.remove(), 3500);
      });

      sendResponse({ received: true });
      return true;
    }
  });

  initWhatsAppAutoSender();
  console.log('[GRO10X Copilot] Automation Script Active.');
})();
