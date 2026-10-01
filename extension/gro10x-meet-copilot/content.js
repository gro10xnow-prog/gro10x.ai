/**
 * GRO10X Meet Copilot - Content Script (Ultra-Robust Version)
 * Injected into https://meet.google.com/*
 *
 * Captures live speech from Google Meet closed captions, extracts attendees,
 * and relays streaming dialogue to the GRO10X sidepanel companion.
 */

(function () {
  'use strict';

  // Allow clean re-injection without duplicate observers
  if (window.__GRO10X_MEET_COPILOT_OBSERVER__) {
    try {
      window.__GRO10X_MEET_COPILOT_OBSERVER__.disconnect();
    } catch (_) {}
  }
  window.__GRO10X_MEET_COPILOT_ACTIVE__ = true;

  console.log('%c[GRO10X Meet Copilot] Activated on Google Meet', 'color: #6366f1; font-weight: bold; font-size: 13px;');

  let isCapturing = true;
  let lastFinalizedText = '';
  let activeCaptionBlock = {
    speaker: '',
    text: '',
    startedAt: null,
    timer: null
  };

  // Elements to strictly exclude (dialogs, device pickers, menus, buttons)
  const EXCLUDE_SELECTORS = [
    '[role="dialog"]',
    '[role="menu"]',
    '[role="menubar"]',
    '[role="toolbar"]',
    '[role="tablist"]',
    '[role="listbox"]',
    'button',
    '[data-tooltip]',
    '[aria-label*="Leave" i]',
    '[aria-label*="mute" i]',
    '[aria-label*="camera" i]',
    '[data-panel-id]',
    '.VfPpkd-Bz112c-LgbsSe'
  ];

  // UI Strings to ignore
  const UI_BLOCKLIST = [
    /^(Microphone|Camera|Speaker|Audio|Video|Settings|Send|Receive|Resolution)/i,
    /^(Realtek|HP TrueVision|OBS Virtual|Stereo Mix|High Definition|Display Audio)/i,
    /^(Turn off|Turn on|Join now|Leave call|Pin|Unpin|Mute|Unmute)/i,
    /^(arrow_downward|arrow_upward|more_vert|screen_share|present_to_all|info|people|chat|call_end)$/i,
    /^(Looking for others|You are presenting|Stop presenting|Your presentation)/i
  ];

  function getCurrentTimeString() {
    return new Date().toTimeString().split(' ')[0];
  }

  function isExcluded(element) {
    if (!element) return true;
    for (const sel of EXCLUDE_SELECTORS) {
      try {
        if (element.closest(sel)) return true;
      } catch (_) {}
    }
    return false;
  }

  function isBlockedUiText(text) {
    if (!text) return true;
    const trimmed = text.trim();
    if (trimmed.length < 2) return true;
    for (const pattern of UI_BLOCKLIST) {
      if (pattern.test(trimmed)) return true;
    }
    return false;
  }

  /**
   * Extract meeting title, code, and active participants
   */
  function getMeetingMetadata() {
    const url = new URL(window.location.href);
    const meetingCode = url.pathname.replace(/^\//, '').split('?')[0];

    let meetingTitle = '';
    const titleEl = document.querySelector('div[data-meeting-title], span[jsname="E2T6ec"], .u6vdEc, [data-meeting-code]');
    if (titleEl && titleEl.textContent) {
      meetingTitle = titleEl.textContent.trim();
    }
    if (!meetingTitle) {
      meetingTitle = document.title ? document.title.replace('- Google Meet', '').trim() : `Meeting (${meetingCode})`;
    }

    // Attendees extraction from People tab, video tiles, and list items
    const participantSet = new Set();
    const candidateEls = document.querySelectorAll(
      '[data-participant-id], [data-requested-participant-id], [role="listitem"], .zWGUib, .jV0rEc, .ZjFb7c, div[jsname="Ne3sFc"]'
    );

    candidateEls.forEach((el) => {
      let raw = el.textContent ? el.textContent.trim() : '';
      if (!raw || raw.length > 60) return;

      // Extract first line or clean name
      const firstLine = raw.split('\n')[0].trim();
      let clean = firstLine
        .replace(/\b(You|Meeting host|Your presentation|devices|presentation)\b/gi, '')
        .replace(/[()]/g, '')
        .trim();

      // Deduplicate repeats e.g. "MahmudMahmud"
      if (clean.length >= 6 && clean.length % 2 === 0) {
        const half = clean.length / 2;
        if (clean.slice(0, half) === clean.slice(half)) {
          clean = clean.slice(0, half);
        }
      }

      if (clean && clean.length >= 2 && !/^(mute|pin|remove|more options|turn on|contributors|in the meeting|search)/i.test(clean)) {
        participantSet.add(clean);
      }
    });

    return {
      meetingCode,
      meetingTitle: meetingTitle || `Meeting (${meetingCode})`,
      participants: Array.from(participantSet),
      url: window.location.href
    };
  }

  /**
   * Finalize and dispatch a speech block to the extension
   */
  function finalizeActiveSpeechBlock() {
    if (!activeCaptionBlock.text || !activeCaptionBlock.text.trim()) {
      return;
    }

    const cleanedText = activeCaptionBlock.text.trim();
    if (cleanedText === lastFinalizedText || cleanedText.length < 2) {
      return;
    }

    lastFinalizedText = cleanedText;
    const speaker = activeCaptionBlock.speaker || 'Participant';
    const time = activeCaptionBlock.startedAt || getCurrentTimeString();

    console.log(`%c[GRO10X] 🎙️ Speech: ${speaker}: "${cleanedText}"`, 'color: #10b981; font-weight: bold;');

    chrome.runtime.sendMessage({
      type: 'MEET_CAPTION_LINE',
      payload: {
        speaker,
        text: cleanedText,
        time,
        timestamp: Date.now()
      }
    }).catch(() => {});

    // Reset buffer
    activeCaptionBlock.speaker = '';
    activeCaptionBlock.text = '';
    activeCaptionBlock.startedAt = null;
    if (activeCaptionBlock.timer) {
      clearTimeout(activeCaptionBlock.timer);
      activeCaptionBlock.timer = null;
    }
  }

  /**
   * Handle incoming caption text chunks with deduplication
   */
  function handleCaptionChunk(speakerName, captionText) {
    if (!isCapturing || !captionText) return;

    let speaker = (speakerName || '').trim();
    const trimmedChunk = captionText.trim();

    if (isBlockedUiText(trimmedChunk)) return;

    // If speaker switched, finalize previous line immediately
    if (speaker && activeCaptionBlock.speaker && activeCaptionBlock.speaker !== speaker) {
      finalizeActiveSpeechBlock();
    }

    if (speaker) {
      activeCaptionBlock.speaker = speaker;
    }
    if (!activeCaptionBlock.startedAt) {
      activeCaptionBlock.startedAt = getCurrentTimeString();
    }

    // Google Meet updates sentences progressively
    if (!activeCaptionBlock.text) {
      activeCaptionBlock.text = trimmedChunk;
    } else {
      if (trimmedChunk.startsWith(activeCaptionBlock.text)) {
        activeCaptionBlock.text = trimmedChunk;
      } else if (!activeCaptionBlock.text.includes(trimmedChunk)) {
        activeCaptionBlock.text = `${activeCaptionBlock.text} ${trimmedChunk}`.trim();
      }
    }

    // Emit live preview update to side panel
    chrome.runtime.sendMessage({
      type: 'MEET_CAPTION_STREAM_UPDATE',
      payload: {
        speaker: activeCaptionBlock.speaker || 'Speaker',
        text: activeCaptionBlock.text,
        time: activeCaptionBlock.startedAt
      }
    }).catch(() => {});

    // Debounce finalization: after 1.8s of silence, commit line
    if (activeCaptionBlock.timer) clearTimeout(activeCaptionBlock.timer);
    activeCaptionBlock.timer = setTimeout(() => {
      finalizeActiveSpeechBlock();
    }, 1800);
  }

  /**
   * Check if closed captions are currently active
   */
  function checkCaptionsEnabled() {
    // 1. Direct detection: if any caption container exists with content, it IS on!
    const captionEl = document.querySelector(
      '[role="region"][aria-label*="caption" i], [role="region"][aria-label="Captions"], [aria-label="Captions"], [jsname="dsyhDe"]'
    );
    if (captionEl && captionEl.textContent && captionEl.textContent.trim().length > 0) {
      return true;
    }

    // 2. Toolbar button state
    const ccBtn = document.querySelector(
      'button[aria-label*="caption" i], button[data-tooltip*="caption" i], button[jsname="r8qRAd"], [aria-label*="Turn off captions" i]'
    );
    if (ccBtn) {
      const isPressed = ccBtn.getAttribute('aria-pressed') === 'true' ||
                        ccBtn.classList.contains('qs41qe') ||
                        /turn off captions/i.test(ccBtn.getAttribute('aria-label') || '');
      if (isPressed) return true;
    }

    // 3. Fallback: if we have actively captured text recently, captions are on!
    if (activeCaptionBlock.text || lastFinalizedText) {
      return true;
    }

    return false;
  }

  /**
   * Universal Caption Scanner
   * Searches Google Meet captions through multiple redundant strategies
   */
  function scanCaptions() {
    let found = false;

    // Strategy 1: The official Google Meet Captions Region ([role="region"][aria-label="Captions"])
    const captionRegions = document.querySelectorAll(
      '[role="region"][aria-label*="caption" i], [role="region"][aria-label="Captions"], [aria-label="Captions"], [jsname="dsyhDe"]'
    );

    for (const region of captionRegions) {
      if (isExcluded(region)) continue;

      // Check for speaker name inside this region
      let speaker = '';
      const speakerEl = region.querySelector(
        '.NWpY1d, [jsname="r4nke"], .zs7LEd, .cS7aqe, .NWkfze, .KcIKyf, img[alt]'
      );
      if (speakerEl) {
        speaker = (speakerEl.getAttribute && speakerEl.getAttribute('alt')) || speakerEl.textContent.trim();
        // Clean trailing colons
        speaker = speaker.replace(/[:：]$/, '').trim();
      }

      // Check for caption text elements
      let text = '';
      const textEls = region.querySelectorAll('.ygicle, .iTTPOb, [jsname="YSxPtf"], span.VbkSUe, .yg73Re, .bzf94, div.CNtlKf');
      for (const tEl of textEls) {
        const val = tEl.textContent ? tEl.textContent.trim() : '';
        if (val && val.length > 2 && !isBlockedUiText(val) && val !== speaker) {
          text = text ? `${text} ${val}` : val;
        }
      }

      // If text elements didn't match specific classes, take region innerText
      if (!text) {
        const raw = (region.innerText || region.textContent || '').trim();
        if (raw && !isBlockedUiText(raw)) {
          if (speaker && raw.startsWith(speaker)) {
            text = raw.slice(speaker.length).trim();
          } else {
            text = raw;
          }
        }
      }

      if (text && text.length > 2 && !isBlockedUiText(text)) {
        found = true;
        handleCaptionChunk(speaker || 'Participant', text);
        return true;
      }
    }

    // Strategy 2: Scan modern Google Meet floating caption blocks
    const floatingBlocks = document.querySelectorAll(
      'div[jscontroller="TEjq6e"], div[jscontroller="D1tHje"], div[jscontroller="KPn5nb"], div.nMcdL, div.iTTPOb'
    );

    for (const block of floatingBlocks) {
      if (isExcluded(block)) continue;
      const rect = block.getBoundingClientRect();
      if (rect.height === 0 || rect.width === 0) continue;

      let speaker = '';
      const sEl = block.querySelector('.NWpY1d, [jsname="r4nke"], .zs7LEd, img[alt]');
      if (sEl) {
        speaker = (sEl.getAttribute && sEl.getAttribute('alt')) || sEl.textContent.trim();
      }

      const tEl = block.querySelector('.ygicle, [jsname="YSxPtf"], .VbkSUe, .iTTPOb') || block;
      let text = tEl.textContent ? tEl.textContent.trim() : '';

      if (speaker && text.startsWith(speaker)) {
        text = text.slice(speaker.length).trim();
      }

      if (text && text.length > 3 && !isBlockedUiText(text)) {
        found = true;
        handleCaptionChunk(speaker || 'Participant', text);
        return true;
      }
    }

    return found;
  }

  let scanThrottleTimer = null;
  let currentlyObservedTarget = null;

  function scheduleScan() {
    if (scanThrottleTimer) return;
    scanThrottleTimer = setTimeout(() => {
      scanThrottleTimer = null;
      scanCaptions();
      checkAndRetargetObserver();
    }, 250);
  }

  /**
   * Retarget observer directly to the caption region if available
   * Eliminates 99% of DOM mutations from video frames, audio VU meters, and UI tooltips
   */
  function checkAndRetargetObserver() {
    const captionContainer = document.querySelector(
      '[role="region"][aria-label*="caption" i], [role="region"][aria-label="Captions"], [aria-label="Captions"], [jsname="dsyhDe"]'
    );

    const desiredTarget = captionContainer || document.body;
    if (desiredTarget !== currentlyObservedTarget && window.__GRO10X_MEET_COPILOT_OBSERVER__) {
      try {
        window.__GRO10X_MEET_COPILOT_OBSERVER__.disconnect();
        window.__GRO10X_MEET_COPILOT_OBSERVER__.observe(desiredTarget, {
          childList: true,
          subtree: true,
          characterData: true
        });
        currentlyObservedTarget = desiredTarget;
      } catch (_) {}
    }
  }

  /**
   * Observe Google Meet DOM mutations (Throttled & Targeted - Zero Fan Spinning)
   */
  function initObserver() {
    if (window.__GRO10X_MEET_COPILOT_OBSERVER__) {
      try { window.__GRO10X_MEET_COPILOT_OBSERVER__.disconnect(); } catch (_) {}
    }

    const obs = new MutationObserver(() => {
      scheduleScan();
    });

    const initialTarget = document.querySelector(
      '[role="region"][aria-label*="caption" i], [role="region"][aria-label="Captions"], [aria-label="Captions"], [jsname="dsyhDe"]'
    ) || document.body;

    obs.observe(initialTarget, {
      childList: true,
      subtree: true,
      characterData: true
    });

    currentlyObservedTarget = initialTarget;
    window.__GRO10X_MEET_COPILOT_OBSERVER__ = obs;
    console.log('[GRO10X Meet Copilot] Throttled Caption Observer attached (Energy-efficient mode).');
  }

  // Periodic metadata broadcaster (every 6 seconds to preserve CPU)
  setInterval(() => {
    try {
      const meta = getMeetingMetadata();
      const ccOn = checkCaptionsEnabled();
      chrome.runtime.sendMessage({
        type: 'MEET_METADATA_UPDATE',
        payload: {
          ...meta,
          captionsEnabled: ccOn
        }
      }).catch(() => {});
    } catch (_) {}
  }, 6000);

  // Message listener from Side Panel
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.type) {
      case 'QUERY_MEET_STATE': {
        const meta = getMeetingMetadata();
        const ccOn = checkCaptionsEnabled();
        sendResponse({
          ok: true,
          meta: {
            ...meta,
            captionsEnabled: ccOn
          }
        });
        break;
      }

      case 'TOGGLE_CAPTIONS_CLICK': {
        // Toggle captions button or simulate keyboard shortcut 'c'
        const ccBtn = document.querySelector(
          'button[aria-label*="caption" i], button[data-tooltip*="caption" i], button[jsname="r8qRAd"]'
        );
        let toggled = false;
        if (ccBtn) {
          ccBtn.click();
          toggled = true;
        } else {
          // Send 'c' keydown event to document to toggle CC
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', keyCode: 67, bubbles: true }));
          toggled = true;
        }
        sendResponse({ ok: true, toggled, isNowOn: true });
        break;
      }

      case 'SET_RECORDING_STATE': {
        isCapturing = msg.isRecording;
        if (!isCapturing) {
          finalizeActiveSpeechBlock();
        }
        sendResponse({ ok: true, isCapturing });
        break;
      }

      case 'FORCE_SCAN_CAPTIONS': {
        const found = scanCaptions();
        sendResponse({ ok: true, found });
        break;
      }

      default:
        break;
    }
    return true;
  });

  // Start observation
  initObserver();
})();
