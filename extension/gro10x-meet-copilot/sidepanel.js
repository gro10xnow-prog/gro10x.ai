/**
 * GRO10X Meet Copilot - Sidepanel Controller
 * Handles real-time captions stream, notes scratchpad, AI compilation,
 * and multi-format exports (PDF, Email, Mailto, Markdown).
 */

(function () {
  'use strict';

  // State
  let recordingState = 'IDLE'; // 'IDLE' | 'RECORDING' | 'PAUSED'
  let recordingSeconds = 0;
  let timerInterval = null;

  let meetingMeta = {
    meetingTitle: 'Google Meet',
    meetingCode: '',
    participants: [],
    captionsEnabled: false
  };

  let transcript = [];
  let userNotes = '';
  let compiledSummary = null;
  let clientId = null;
  let sessionId = null;

  let settings = {
    backendUrl: 'http://localhost:3000',
    geminiKey: '',
    autoStartRec: true,
    autoCaptionsPrompt: true,
    liveTranslate: false,
    liveTranslateLang: 'English',
    summaryLang: 'English'
  };

  // DOM Elements
  const elStatusBadge = document.getElementById('statusBadge');
  const elStatusText = document.getElementById('statusText');
  const elTimerBadge = document.getElementById('timerBadge');
  const elMeetingTitle = document.getElementById('meetingTitle');
  const elParticipantCount = document.getElementById('participantCount');
  const elCcWarningBanner = document.getElementById('ccWarningBanner');
  const elBtnEnableCC = document.getElementById('btnEnableCC');

  // Tabs
  const tabLiveStudio = document.getElementById('tabLiveStudio');
  const tabExecutivePack = document.getElementById('tabExecutivePack');
  const tabSettings = document.getElementById('tabSettings');
  const viewLiveStudio = document.getElementById('viewLiveStudio');
  const viewExecutivePack = document.getElementById('viewExecutivePack');
  const viewSettings = document.getElementById('viewSettings');
  const elPackDot = document.getElementById('packDot');

  // Live Studio Elements
  const elTranscriptFeed = document.getElementById('transcriptFeed');
  const elEmptyTranscriptState = document.getElementById('emptyTranscriptState');
  const elTranscriptCountBadge = document.getElementById('transcriptCountBadge');
  const elTranscriptSearch = document.getElementById('transcriptSearch');
  const elChkAutoScroll = document.getElementById('chkAutoScroll');
  const elChkLiveTranslate = document.getElementById('chkLiveTranslate');
  const elSelLiveTranslateLang = document.getElementById('selLiveTranslateLang');
  const elLiveStreamPreview = document.getElementById('liveStreamPreview');
  const elLivePreviewSpeaker = document.getElementById('livePreviewSpeaker');
  const elLivePreviewText = document.getElementById('livePreviewText');

  // Notes Elements
  const elMeetingNotes = document.getElementById('meetingNotes');
  const elBtnTagTime = document.getElementById('btnTagTime');
  const elBtnTagDecision = document.getElementById('btnTagDecision');
  const elBtnTagAction = document.getElementById('btnTagAction');
  const elBtnTagBullet = document.getElementById('btnTagBullet');

  // Studio Controls
  const elBtnRecordToggle = document.getElementById('btnRecordToggle');
  const elBtnRecordText = document.getElementById('btnRecordText');
  const elBtnClearSession = document.getElementById('btnClearSession');
  const elBtnCompilePack = document.getElementById('btnCompilePack');
  const elBtnQuickCompile = document.getElementById('btnQuickCompile');

  // Executive Pack Elements
  const elCompileLoader = document.getElementById('compileLoader');
  const elEmptyPackState = document.getElementById('emptyPackState');
  const elCompiledContent = document.getElementById('compiledContent');
  const elPackOverview = document.getElementById('packOverview');
  const elPackDecisionsList = document.getElementById('packDecisionsList');
  const elPackActionTableBody = document.getElementById('packActionTableBody');
  const elPackDiscussionList = document.getElementById('packDiscussionList');
  const elPackUserNotes = document.getElementById('packUserNotes');
  const elCardUserNotesWrap = document.getElementById('cardUserNotesWrap');

  // Export Buttons
  const elBtnDownloadPdf = document.getElementById('btnDownloadPdf');
  const elBtnCopyEmail = document.getElementById('btnCopyEmail');
  const elBtnOpenMailto = document.getElementById('btnOpenMailto');
  const elBtnCopyMarkdown = document.getElementById('btnCopyMarkdown');
  const elBtnRecompile = document.getElementById('btnRecompile');

  // Settings Elements
  const elSettingBackendUrl = document.getElementById('settingBackendUrl');
  const elSettingGeminiKey = document.getElementById('settingGeminiKey');
  const elSettingAutoStartRec = document.getElementById('settingAutoStartRec');
  const elSettingAutoCaptionsPrompt = document.getElementById('settingAutoCaptionsPrompt');
  const elSettingSummaryLang = document.getElementById('settingSummaryLang');
  const elBtnSaveSettings = document.getElementById('btnSaveSettings');
  const elSaveConfirmation = document.getElementById('saveConfirmation');
  const elBtnSettingsToggle = document.getElementById('btnSettingsToggle');

  // Appendix toggle & Stats Elements
  const elChkIncludeTranscriptPdf = document.getElementById('chkIncludeTranscriptPdf');
  const elStatUserSessions = document.getElementById('statUserSessions');
  const elStatUserMinutes = document.getElementById('statUserMinutes');
  const elStatGlobalSessions = document.getElementById('statGlobalSessions');

  // Toast
  const elToast = document.getElementById('toastNotification');
  const elToastIcon = document.getElementById('toastIcon');
  const elToastMessage = document.getElementById('toastMessage');

  /**
   * Show animated notification toast
   */
  function showToast(message, icon = '📋') {
    elToastIcon.textContent = icon;
    elToastMessage.textContent = message;
    elToast.classList.remove('hidden');
    clearTimeout(elToast._timer);
    elToast._timer = setTimeout(() => {
      elToast.classList.add('hidden');
    }, 2800);
  }

  /**
   * Format seconds to mm:ss
   */
  function formatDuration(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /**
   * Get current formatted time HH:MM:SS
   */
  function getCurrentTimeString() {
    return new Date().toTimeString().split(' ')[0];
  }

  /**
   * Get or initialize persistent anonymous client ID
   */
  async function getClientId() {
    if (clientId) return clientId;
    try {
      const data = await chrome.storage.local.get('gro10x_client_id');
      if (data && data.gro10x_client_id) {
        clientId = data.gro10x_client_id;
      } else {
        clientId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        await chrome.storage.local.set({ gro10x_client_id: clientId });
      }
    } catch (_) {
      clientId = `usr_local_${Date.now()}`;
    }
    return clientId;
  }

  /**
   * Send non-blocking telemetry event to backend
   */
  async function sendTelemetry(eventType, extra = {}) {
    try {
      const cid = await getClientId();
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      }

      const payload = {
        clientId: cid,
        sessionId: sessionId,
        eventType: eventType,
        meetingCode: meetingMeta.meetingCode || '',
        meetingTitle: meetingMeta.meetingTitle || 'Google Meet',
        durationSeconds: recordingSeconds,
        turnCount: transcript.length,
        targetLanguage: settings.summaryLang || 'English',
        ...extra
      };

      const backendUrls = [
        `${settings.backendUrl || 'http://localhost:3000'}/api/meet-copilot/telemetry`,
        'http://localhost:3000/api/meet-copilot/telemetry',
        'https://gro10x.ai/api/meet-copilot/telemetry'
      ];

      for (const url of backendUrls) {
        try {
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).catch(() => {});
          break;
        } catch (_) {}
      }

      // Update local telemetry stats in storage
      chrome.storage.local.get('gro10x_local_stats', (res) => {
        const stats = (res && res.gro10x_local_stats) || { sessionsCount: 0, secondsRecorded: 0 };
        if (eventType === 'session_start') {
          stats.sessionsCount = (stats.sessionsCount || 0) + 1;
        }
        if (eventType === 'session_compile' || eventType === 'session_export') {
          stats.secondsRecorded = (stats.secondsRecorded || 0) + recordingSeconds;
        }
        chrome.storage.local.set({ gro10x_local_stats: stats });
        updateStatsUI(stats);
      });
    } catch (_) {}
  }

  /**
   * Fetch and update stats UI
   */
  async function updateStatsUI(localStats = null) {
    if (!localStats) {
      const res = await chrome.storage.local.get('gro10x_local_stats');
      localStats = (res && res.gro10x_local_stats) || { sessionsCount: 0, secondsRecorded: 0 };
    }
    if (elStatUserSessions) {
      elStatUserSessions.textContent = localStats.sessionsCount || 0;
    }
    if (elStatUserMinutes) {
      const mins = Math.round((localStats.secondsRecorded || 0) / 60);
      elStatUserMinutes.textContent = `${mins}m`;
    }

    // Attempt to fetch global team stats from backend
    try {
      const res = await fetch(`${settings.backendUrl || 'http://localhost:3000'}/api/meet-copilot/stats`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.totals && elStatGlobalSessions) {
          elStatGlobalSessions.textContent = data.totals.totalSessions || '-';
        }
      }
    } catch (_) {}
  }

  /**
   * Update recording status UI & badge
   */
  function setRecordingState(newState) {
    const prevState = recordingState;
    recordingState = newState;

    if (newState === 'RECORDING') {
      elStatusBadge.className = 'status-badge badge-rec';
      elStatusText.textContent = 'REC';
      elBtnRecordToggle.className = 'btn btn-record recording';
      elBtnRecordText.textContent = 'Pause Recording';

      if (prevState === 'IDLE') {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        sendTelemetry('session_start');
      }

      if (!timerInterval) {
        timerInterval = setInterval(() => {
          recordingSeconds++;
          elTimerBadge.textContent = formatDuration(recordingSeconds);
        }, 1000);
      }
    } else if (newState === 'PAUSED') {
      elStatusBadge.className = 'status-badge badge-pause';
      elStatusText.textContent = 'PAUSED';
      elBtnRecordToggle.className = 'btn btn-record';
      elBtnRecordText.textContent = 'Resume Recording';

      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    } else {
      elStatusBadge.className = 'status-badge badge-idle';
      elStatusText.textContent = 'READY';
      elBtnRecordToggle.className = 'btn btn-record';
      elBtnRecordText.textContent = 'Start Recording';

      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      recordingSeconds = 0;
      elTimerBadge.textContent = '00:00';
    }

    // Inform service worker for tab badge updates
    chrome.runtime.sendMessage({
      type: 'MEET_RECORDING_STATUS',
      status: newState
    }).catch(() => {});

    // Inform content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'SET_RECORDING_STATE',
          isRecording: newState === 'RECORDING'
        }).catch(() => {});
      }
    });

    saveSession();
  }

  /**
   * Switch Active Tabs
   */
  function switchTab(targetTab) {
    [tabLiveStudio, tabExecutivePack, tabSettings].forEach(t => t.classList.remove('active'));
    [viewLiveStudio, viewExecutivePack, viewSettings].forEach(v => {
      v.classList.remove('active-panel');
      v.classList.add('hidden-panel');
    });

    if (targetTab === 'pack') {
      tabExecutivePack.classList.add('active');
      viewExecutivePack.classList.remove('hidden-panel');
      viewExecutivePack.classList.add('active-panel');
      elPackDot.classList.add('hidden');
    } else if (targetTab === 'settings') {
      tabSettings.classList.add('active');
      viewSettings.classList.remove('hidden-panel');
      viewSettings.classList.add('active-panel');
      updateStatsUI();
    } else {
      tabLiveStudio.classList.add('active');
      viewLiveStudio.classList.remove('hidden-panel');
      viewLiveStudio.classList.add('active-panel');
    }
  }

  /**
   * Fast real-time translation of a single speech line
   */
  async function translateSpeechTurn(text, speaker, targetLang) {
    if (!text || text.trim().length < 2) return null;
    const effectiveKey = settings.geminiKey || '';
    const prompt = `Translate this speech by "${speaker || 'Speaker'}" into ${targetLang}. If already in ${targetLang}, return it unchanged. Output ONLY the direct translation:\n${text.trim()}`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${effectiveKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 250, temperature: 0.1 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translated) return translated;
      }
    } catch (_) {}
    return null;
  }

  /**
   * Append a completed speech line to transcript UI (with Dual Display translation)
   */
  function appendTranscriptBubble(line) {
    if (!line || !line.text) return;

    if (elEmptyTranscriptState && elEmptyTranscriptState.parentNode) {
      elEmptyTranscriptState.remove();
    }

    transcript.push(line);
    elTranscriptCountBadge.textContent = transcript.length;

    const bubble = document.createElement('div');
    bubble.className = 'transcript-bubble';
    bubble.dataset.speaker = (line.speaker || '').toLowerCase();
    bubble.dataset.text = (line.text || '').toLowerCase();

    bubble.innerHTML = `
      <div class="bubble-meta">
        <span class="bubble-speaker">👤 ${escapeHtml(line.speaker || 'Speaker')}</span>
        <span class="bubble-time">${escapeHtml(line.time || '')}</span>
      </div>
      <div class="bubble-text">${escapeHtml(line.text)}</div>
    `;

    // Dual-Display Live Translation
    const isTranslateOn = elChkLiveTranslate && elChkLiveTranslate.checked;
    const targetLang = (elSelLiveTranslateLang && elSelLiveTranslateLang.value) || 'English';
    const langCode = targetLang.slice(0, 2).toUpperCase();

    if (isTranslateOn) {
      const transWrap = document.createElement('div');
      transWrap.className = 'bubble-translation';
      transWrap.innerHTML = `<span class="trans-pill">↳ [${langCode}]:</span> <span class="trans-text"><span class="trans-pulse">Translating...</span></span>`;
      bubble.appendChild(transWrap);

      translateSpeechTurn(line.text, line.speaker, targetLang).then((trans) => {
        if (trans && transWrap) {
          line.translation = trans;
          transWrap.querySelector('.trans-text').textContent = trans;
          saveSession();
        } else if (transWrap) {
          transWrap.remove();
        }
      });
    } else if (line.translation) {
      const transWrap = document.createElement('div');
      transWrap.className = 'bubble-translation';
      transWrap.innerHTML = `<span class="trans-pill">↳ [${langCode}]:</span> <span class="trans-text">${escapeHtml(line.translation)}</span>`;
      bubble.appendChild(transWrap);
    }

    elTranscriptFeed.appendChild(bubble);

    if (elChkAutoScroll.checked) {
      elTranscriptFeed.scrollTop = elTranscriptFeed.scrollHeight;
    }

    saveSession();
  }

  /**
   * Filter transcript list
   */
  function filterTranscript(query) {
    const q = (query || '').toLowerCase().trim();
    const bubbles = elTranscriptFeed.querySelectorAll('.transcript-bubble');
    bubbles.forEach(b => {
      if (!q) {
        b.style.display = '';
      } else {
        const textMatch = (b.dataset.text || '').includes(q);
        const speakerMatch = (b.dataset.speaker || '').includes(q);
        b.style.display = (textMatch || speakerMatch) ? '' : 'none';
      }
    });
  }

  /**
   * Insert text tag into notes scratchpad
   */
  function insertNoteTag(tag) {
    const curPos = elMeetingNotes.selectionStart;
    const currentVal = elMeetingNotes.value;
    const prefix = (curPos > 0 && currentVal[curPos - 1] !== '\n') ? '\n' : '';
    const insertVal = `${prefix}${tag} `;
    
    elMeetingNotes.value = currentVal.slice(0, curPos) + insertVal + currentVal.slice(curPos);
    elMeetingNotes.selectionStart = elMeetingNotes.selectionEnd = curPos + insertVal.length;
    elMeetingNotes.focus();
    saveSession();
  }

  /**
   * Compile Executive Pack via Backend or Direct Gemini Key
   */
  async function compileMeetingPack() {
    userNotes = elMeetingNotes.value.trim();

    if (transcript.length === 0 && !userNotes) {
      showToast('Capture captions or type notes before compiling!', '⚠️');
      return;
    }

    switchTab('pack');
    elEmptyPackState.classList.add('hidden');
    elCompiledContent.classList.add('hidden');
    elCompileLoader.classList.remove('hidden');

    const uniqueParticipants = Array.from(new Set([
      ...(meetingMeta.participants || []),
      ...transcript.map(t => t.speaker).filter(Boolean)
    ]));

    const targetLang = (elSettingSummaryLang && elSettingSummaryLang.value) || settings.summaryLang || 'English';

    const payload = {
      transcript: transcript,
      notes: userNotes,
      title: meetingMeta.meetingTitle || 'Google Meet Sync',
      participants: uniqueParticipants,
      targetLanguage: targetLang,
      apiKey: settings.geminiKey || undefined
    };

    let result = null;
    let isAiGenerated = false;

    // 1. Try Platform Backend API (with quick timeout so we fall over to Direct Gemini if server is offline)
    const backendEndpoints = [
      `${settings.backendUrl || 'http://localhost:3000'}/api/ai/meeting-summary`,
      'http://localhost:3000/api/ai/meeting-summary',
      'https://gro10x.ai/api/ai/meeting-summary',
      'https://gro10x-ai.vercel.app/api/ai/meeting-summary'
    ];

    for (const url of backendEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.summary) {
            result = json.summary;
            isAiGenerated = true;
            console.log('[Compile] Backend compilation succeeded via', url);
            break;
          }
        }
      } catch (e) {
        console.warn(`[Compile] Backend attempt to ${url} bypassed:`, e.message);
      }
    }

    // 2. Direct Gemini Fallback if backend was unreachable
    const effectiveKey = settings.geminiKey || '';
    if (!result && effectiveKey) {
      try {
        console.log('[Compile] Attempting Direct Gemini API compilation...');
        result = await callDirectGemini(payload, effectiveKey);
        if (result && result.overview) {
          isAiGenerated = true;
        }
      } catch (err) {
        console.warn('[Compile] Direct Gemini fallback error:', err);
      }
    }

    // 3. Client-Side Fallback if both failed
    if (!result) {
      console.warn('[Compile] All AI compilation attempts failed. Using structured client-side fallback.');
      result = buildClientSideFallback(payload);
    }

    compiledSummary = result;
    renderCompiledPack(result);
    saveSession();

    elCompileLoader.classList.add('hidden');
    elCompiledContent.classList.remove('hidden');
    elPackDot.classList.remove('hidden');

    if (isAiGenerated) {
      showToast(`✨ Executive Pack compiled in ${targetLang}!`, '✨');
    } else {
      showToast('⚠️ AI unavailable; compiled via offline notes parser.', '⚠️');
    }
  }

  /**
   * Direct Gemini API call (gemini-3.5-flash-lite, gemini-3.6-flash, gemini-3.8-flash)
   */
  async function callDirectGemini(payload, apiKey) {
    const models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'];
    const targetLang = payload.targetLanguage || 'English';
    const meetingDate = new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const prompt = `You are the executive AI chief of staff for GRO10X.
Analyze the following Google Meet meeting notes and real-time transcript. Synthesize a comprehensive, executive-ready Meeting Pack.

MEETING TITLE: ${payload.title}
DATE: ${meetingDate}
PARTICIPANTS: ${(payload.participants || []).join(', ')}
TARGET OUTPUT LANGUAGE: ${targetLang}

SCRATCHPAD NOTES:
${payload.notes || '(None recorded)'}

TRANSCRIPT (${(payload.transcript || []).length} dialogue turns):
${(payload.transcript || []).map(t => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n').slice(0, 100000)}

MULTILINGUAL INSTRUCTION:
- Analyze all dialogue and notes across whatever languages were spoken (e.g. Bengali, English, Hindi, Spanish, or mixed multilingual conversation).
- Unify, translate, and write the entire Executive Pack (Overview, Discussion Points, Decisions, Action Items, Email Subject, Email Text) fluently and completely in ${targetLang}.
- Keep participant names in their original form.

Synthesize this into a structured JSON object with the following fields:
{
  "title": "${payload.title}",
  "date": "${meetingDate}",
  "overview": "Comprehensive 2-4 sentence executive overview detailing the core objectives discussed, outcomes, and progress, written in ${targetLang}.",
  "discussionPoints": ["Detailed discussion point 1 with context in ${targetLang}", "Point 2 in ${targetLang}", "Point 3 in ${targetLang}", "Point 4 in ${targetLang}"],
  "decisions": ["Concrete decision or agreement reached 1 in ${targetLang}", "Decision 2 in ${targetLang}"],
  "actionItems": [
    { "task": "Specific actionable next step written in ${targetLang}", "owner": "Owner or 'Team'", "priority": "High", "deadline": "Timeline or 'Next Sync'" }
  ],
  "emailSubject": "Meeting Summary & Next Steps: ${payload.title} (${meetingDate})",
  "emailText": "Clean plain-text version of this recap written in ${targetLang} ready for Slack or email"
}

Return ONLY raw valid JSON without markdown formatting or code blocks.`;

    for (const model of models) {
      try {
        console.log(`[Compile] Calling model ${model}...`);
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
          })
        });

        if (res.ok) {
          const data = await res.json();
          let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
            const parsed = JSON.parse(rawText);
            if (parsed && parsed.overview) {
              console.log(`[Compile] Direct Gemini model ${model} succeeded!`);
              return parsed;
            }
          }
        } else {
          const errText = await res.text();
          console.warn(`[Compile] Direct model ${model} HTTP ${res.status}:`, errText);
        }
      } catch (e) {
        console.warn(`[Compile] Direct model ${model} fetch failed:`, e);
      }
    }
    return null;
  }

  /**
   * Client-side rule-based fallback summary
   */
  function buildClientSideFallback(payload) {
    const meetingDate = new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const actionItems = [];
    const decisions = [];
    const allLines = ((payload.notes || '') + '\n' + (payload.transcript || []).map(t => t.text).join('\n')).split('\n');

    allLines.forEach(line => {
      const trimmed = line.trim();
      if (/\[action item\]|todo:|action:|task:/i.test(trimmed)) {
        actionItems.push({
          task: trimmed.replace(/^(\*|-|\d+\.|\[action item\]|todo:|action:|task:)\s*/i, ''),
          owner: 'Team',
          priority: 'Medium',
          deadline: 'Next Sync'
        });
      } else if (/\[decision\]|decision:|agreed:/i.test(trimmed)) {
        decisions.push(trimmed.replace(/^(\*|-|\d+\.|\[decision\]|decision:|agreed:)\s*/i, ''));
      }
    });

    return {
      title: payload.title || 'Google Meet Sync',
      date: meetingDate,
      overview: `Google Meet discussion compiled on ${meetingDate}. Captured ${payload.transcript?.length || 0} transcript turns and personal meeting notes.`,
      discussionPoints: payload.notes ? payload.notes.split('\n').filter(l => l.trim().length > 6).slice(0, 4) : ['Live meeting sync conducted.'],
      decisions: decisions.length > 0 ? decisions : ['Refer to scratchpad notes and meeting transcript.'],
      actionItems: actionItems.length > 0 ? actionItems : [
        { task: 'Follow up on discussion items with attendees', owner: 'Team', priority: 'Medium', deadline: 'Next Sync' }
      ],
      emailSubject: `Meeting Summary: ${payload.title} (${meetingDate})`,
      emailText: `Meeting Summary: ${payload.title}\nDate: ${meetingDate}\n\nNotes:\n${payload.notes || '(None)'}`
    };
  }

  /**
   * Render compiled summary to Executive Pack UI
   */
  function renderCompiledPack(data) {
    elPackOverview.textContent = data.overview || '';

    // Decisions
    elPackDecisionsList.innerHTML = '';
    const decisions = Array.isArray(data.decisions) && data.decisions.length > 0 ? data.decisions : ['No formal decisions logged.'];
    decisions.forEach(d => {
      const li = document.createElement('li');
      li.textContent = d;
      elPackDecisionsList.appendChild(li);
    });

    // Action Items
    elPackActionTableBody.innerHTML = '';
    const actions = Array.isArray(data.actionItems) && data.actionItems.length > 0 ? data.actionItems : [];
    if (actions.length === 0) {
      elPackActionTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No action items recorded.</td></tr>';
    } else {
      actions.forEach(a => {
        const tr = document.createElement('tr');
        const prioColor = a.priority === 'High' ? 'var(--accent-rose)' : a.priority === 'Medium' ? 'var(--accent-amber)' : 'var(--accent-emerald)';
        tr.innerHTML = `
          <td>${escapeHtml(a.task || '')}</td>
          <td><strong>${escapeHtml(a.owner || 'Team')}</strong></td>
          <td style="color: ${prioColor}; font-weight: 700;">${escapeHtml(a.priority || 'Medium')}</td>
          <td style="color: var(--text-secondary);">${escapeHtml(a.deadline || 'Next Sync')}</td>
        `;
        elPackActionTableBody.appendChild(tr);
      });
    }

    // Discussion Highlights
    elPackDiscussionList.innerHTML = '';
    const points = Array.isArray(data.discussionPoints) && data.discussionPoints.length > 0 ? data.discussionPoints : [];
    points.forEach(p => {
      const li = document.createElement('li');
      li.textContent = p;
      elPackDiscussionList.appendChild(li);
    });

    // User Notes
    if (userNotes) {
      elCardUserNotesWrap.classList.remove('hidden');
      elPackUserNotes.textContent = userNotes;
    } else {
      elCardUserNotesWrap.classList.add('hidden');
    }
  }

  /**
   * Copy Formatted Email Body (HTML + Plaintext)
   */
  async function copyEmailBody() {
    if (!compiledSummary) return;

    const emailSubject = compiledSummary.emailSubject || `Meeting Summary: ${meetingMeta.meetingTitle}`;
    const emailHtml = compiledSummary.emailHtml || generateFallbackEmailHtml(compiledSummary);
    const emailPlain = `${emailSubject}\n\n${compiledSummary.overview}\n\nDecisions:\n${(compiledSummary.decisions || []).map(d => '- ' + d).join('\n')}\n\nAction Items:\n${(compiledSummary.actionItems || []).map(a => `- [${a.priority || 'Medium'}] ${a.task} (@${a.owner})`).join('\n')}`;

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({
          'text/html': new Blob([emailHtml], { type: 'text/html' }),
          'text/plain': new Blob([emailPlain], { type: 'text/plain' })
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(emailPlain);
      }
      showToast('Formatted Email copied to clipboard!', '📋');
      sendTelemetry('session_export', { exportFormat: 'email' });
    } catch (e) {
      navigator.clipboard.writeText(emailPlain).then(() => {
        showToast('Text Email copied to clipboard!', '📋');
        sendTelemetry('session_export', { exportFormat: 'email' });
      });
    }
  }

  /**
   * Open default mail client via Mailto
   */
  function openMailto() {
    if (!compiledSummary) return;
    const subject = encodeURIComponent(compiledSummary.emailSubject || `Meeting Summary: ${meetingMeta.meetingTitle}`);
    const body = encodeURIComponent(
      `Hi Team,\n\nHere is the executive recap from our meeting today (${meetingMeta.meetingTitle}):\n\n` +
      `EXECUTIVE SUMMARY:\n${compiledSummary.overview}\n\n` +
      `KEY DECISIONS:\n${(compiledSummary.decisions || []).map(d => `• ${d}`).join('\n')}\n\n` +
      `ACTION ITEMS:\n${(compiledSummary.actionItems || []).map(a => `• [${a.priority}] ${a.task} -> ${a.owner} (${a.deadline})`).join('\n')}\n\n` +
      `Best regards,\nGRO10X Meet Copilot`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    sendTelemetry('session_export', { exportFormat: 'mailto' });
  }

  /**
   * Copy Markdown for Notion / Slack
   */
  function copyMarkdown() {
    if (!compiledSummary) return;
    const md = `# 📋 ${compiledSummary.title || meetingMeta.meetingTitle}\n` +
      `**Date:** ${compiledSummary.date || 'Today'}  \n` +
      `**Participants:** ${(meetingMeta.participants || []).join(', ')}\n\n` +
      `## 🎯 Executive Summary\n${compiledSummary.overview}\n\n` +
      `## 💡 Key Decisions\n${(compiledSummary.decisions || []).map(d => `- **${d}**`).join('\n')}\n\n` +
      `## ✅ Action Items\n| Task | Owner | Priority | Timeline |\n| --- | --- | --- | --- |\n` +
      `${(compiledSummary.actionItems || []).map(a => `| ${a.task} | ${a.owner} | ${a.priority} | ${a.deadline} |`).join('\n')}\n\n` +
      `## 📝 Discussion Points\n${(compiledSummary.discussionPoints || []).map(p => `- ${p}`).join('\n')}\n`;

    navigator.clipboard.writeText(md).then(() => {
      showToast('Markdown copied to clipboard!', '📝');
      sendTelemetry('session_export', { exportFormat: 'markdown' });
    });
  }

  /**
   * Download / Print PDF (1-2 Page Executive Brief)
   */
  function downloadPdf() {
    if (!compiledSummary) return;
    const includeTranscript = elChkIncludeTranscriptPdf ? elChkIncludeTranscriptPdf.checked : false;
    if (window.PDFGenerator) {
      window.PDFGenerator.downloadPdf({
        ...compiledSummary,
        participants: meetingMeta.participants,
        userNotes: userNotes,
        transcript: transcript,
        includeTranscript: includeTranscript
      });
      showToast('Preparing PDF document (1-2 pages)...', '📄');
      sendTelemetry('session_export', { exportFormat: 'pdf', includeTranscript });
    }
  }

  /**
   * Fallback email HTML generator
   */
  function generateFallbackEmailHtml(data) {
    return `<div style="font-family: sans-serif; max-width: 600px; color: #1e293b;">
      <h2 style="color: #4f46e5;">📋 ${escapeHtml(data.title || 'Meeting Summary')}</h2>
      <p style="color: #64748b;">${escapeHtml(data.date || '')}</p>
      <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin: 12px 0;">${escapeHtml(data.overview || '')}</div>
      <h3>Action Items</h3>
      <ul>${(data.actionItems || []).map(a => `<li><strong>${escapeHtml(a.owner || 'Team')}:</strong> ${escapeHtml(a.task || '')} (${escapeHtml(a.deadline || '')})</li>`).join('')}</ul>
    </div>`;
  }

  /**
   * Helper: Escape HTML string
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Save session state to chrome.storage.local
   */
  function saveSession() {
    chrome.storage.local.set({
      gro10x_meet_session: {
        recordingState,
        recordingSeconds,
        meetingMeta,
        transcript: transcript.slice(-300), // Keep last 300 dialogue turns
        userNotes: elMeetingNotes.value,
        compiledSummary
      }
    });
  }

  /**
   * Restore session state from chrome.storage.local
   */
  function restoreSession() {
    chrome.storage.local.get(['gro10x_meet_session', 'gro10x_meet_settings'], (res) => {
      if (res.gro10x_meet_settings) {
        settings = { ...settings, ...res.gro10x_meet_settings };
        elSettingBackendUrl.value = settings.backendUrl;
        elSettingGeminiKey.value = settings.geminiKey;
        elSettingAutoStartRec.checked = settings.autoStartRec;
        elSettingAutoCaptionsPrompt.checked = settings.autoCaptionsPrompt;
        if (elSettingSummaryLang && settings.summaryLang) {
          elSettingSummaryLang.value = settings.summaryLang;
        }
        if (elChkLiveTranslate && settings.liveTranslate !== undefined) {
          elChkLiveTranslate.checked = settings.liveTranslate;
        }
        if (elSelLiveTranslateLang && settings.liveTranslateLang) {
          elSelLiveTranslateLang.value = settings.liveTranslateLang;
        }
      }

      if (res.gro10x_meet_session) {
        const s = res.gro10x_meet_session;
        if (s.userNotes) {
          elMeetingNotes.value = s.userNotes;
          userNotes = s.userNotes;
        }
        if (Array.isArray(s.transcript) && s.transcript.length > 0) {
          s.transcript.forEach(t => appendTranscriptBubble(t));
        }
        if (s.meetingMeta) {
          updateMeetingMeta(s.meetingMeta);
        }
        if (s.compiledSummary) {
          compiledSummary = s.compiledSummary;
          renderCompiledPack(compiledSummary);
          elEmptyPackState.classList.add('hidden');
          elCompiledContent.classList.remove('hidden');
        }
      }
    });
  }

  /**
   * Update Meeting Metadata display
   */
  function updateMeetingMeta(meta) {
    if (!meta) return;
    meetingMeta = { ...meetingMeta, ...meta };

    if (meta.meetingTitle) {
      elMeetingTitle.textContent = meta.meetingTitle;
    }
    if (meta.participants) {
      const count = meta.participants.length;
      elParticipantCount.textContent = `${count} ${count === 1 ? 'attendee' : 'attendees'}`;
    }

    if (settings.autoCaptionsPrompt) {
      if (meta.captionsEnabled === false) {
        elCcWarningBanner.classList.remove('hidden');
      } else {
        elCcWarningBanner.classList.add('hidden');
      }
    }
  }

  // Setup Event Listeners
  function initListeners() {
    // Tabs
    tabLiveStudio.addEventListener('click', () => switchTab('studio'));
    tabExecutivePack.addEventListener('click', () => switchTab('pack'));
    tabSettings.addEventListener('click', () => switchTab('settings'));
    elBtnSettingsToggle.addEventListener('click', () => switchTab('settings'));

    // Recording Controls
    elBtnRecordToggle.addEventListener('click', () => {
      if (recordingState === 'RECORDING') {
        setRecordingState('PAUSED');
      } else {
        setRecordingState('RECORDING');
      }
    });

    elBtnClearSession.addEventListener('click', () => {
      if (confirm('Clear current transcript and scratchpad notes?')) {
        transcript = [];
        elTranscriptFeed.innerHTML = `
          <div class="empty-state" id="emptyTranscriptState">
            <div class="empty-icon">💬</div>
            <div class="empty-title">No dialogue captured yet</div>
            <div class="empty-desc">Make sure Closed Captions (CC) are enabled in Google Meet. As participants speak, real-time speaker dialogue will stream here.</div>
          </div>
        `;
        elTranscriptCountBadge.textContent = '0';
        elMeetingNotes.value = '';
        compiledSummary = null;
        elEmptyPackState.classList.remove('hidden');
        elCompiledContent.classList.add('hidden');
        setRecordingState('IDLE');
        saveSession();
        showToast('Session reset', '🗑️');
      }
    });

    // Notes quick tags
    elBtnTagTime.addEventListener('click', () => insertNoteTag(`[${getCurrentTimeString()}]`));
    elBtnTagDecision.addEventListener('click', () => insertNoteTag(`[DECISION]:`));
    elBtnTagAction.addEventListener('click', () => insertNoteTag(`[ACTION ITEM]: @[Owner] -`));
    elBtnTagBullet.addEventListener('click', () => insertNoteTag(`•`));

    elMeetingNotes.addEventListener('input', () => {
      saveSession();
    });

    // Transcript Search
    elTranscriptSearch.addEventListener('input', (e) => {
      filterTranscript(e.target.value);
    });

    // Compilation buttons
    elBtnCompilePack.addEventListener('click', compileMeetingPack);
    elBtnQuickCompile.addEventListener('click', compileMeetingPack);
    elBtnRecompile.addEventListener('click', compileMeetingPack);

    // Export buttons
    elBtnDownloadPdf.addEventListener('click', downloadPdf);
    elBtnCopyEmail.addEventListener('click', copyEmailBody);
    elBtnOpenMailto.addEventListener('click', openMailto);
    elBtnCopyMarkdown.addEventListener('click', copyMarkdown);

    // Turn on CC trigger
    elBtnEnableCC.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'TOGGLE_CAPTIONS_CLICK',
            forceOn: true
          }, (res) => {
            if (res && res.isNowOn) {
              elCcWarningBanner.classList.add('hidden');
              showToast('Closed Captions enabled in Google Meet!', '✔️');
            }
          });
        }
      });
    });

    // Save Settings
    elBtnSaveSettings.addEventListener('click', () => {
      settings.backendUrl = elSettingBackendUrl.value.trim() || 'http://localhost:3000';
      settings.geminiKey = elSettingGeminiKey.value.trim();
      settings.autoStartRec = elSettingAutoStartRec.checked;
      settings.autoCaptionsPrompt = elSettingAutoCaptionsPrompt.checked;
      if (elSettingSummaryLang) {
        settings.summaryLang = elSettingSummaryLang.value;
      }
      if (elChkLiveTranslate) {
        settings.liveTranslate = elChkLiveTranslate.checked;
      }
      if (elSelLiveTranslateLang) {
        settings.liveTranslateLang = elSelLiveTranslateLang.value;
      }

      chrome.storage.local.set({ gro10x_meet_settings: settings }, () => {
        elSaveConfirmation.classList.remove('hidden');
        setTimeout(() => elSaveConfirmation.classList.add('hidden'), 2000);
        showToast('Settings saved!', '💾');
      });
    });

    // Live studio quick toggles
    if (elChkLiveTranslate) {
      elChkLiveTranslate.addEventListener('change', () => {
        settings.liveTranslate = elChkLiveTranslate.checked;
        chrome.storage.local.set({ gro10x_meet_settings: settings });
        showToast(settings.liveTranslate ? `Live translation enabled (${elSelLiveTranslateLang.value})` : 'Live translation paused', '🌐');
      });
    }

    if (elSelLiveTranslateLang) {
      elSelLiveTranslateLang.addEventListener('change', () => {
        settings.liveTranslateLang = elSelLiveTranslateLang.value;
        chrome.storage.local.set({ gro10x_meet_settings: settings });
      });
    }

    // Runtime message listener from content script / service worker
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'MEET_CAPTION_LINE') {
        if (recordingState === 'RECORDING') {
          appendTranscriptBubble(msg.payload);
        }
      } else if (msg.type === 'MEET_CAPTION_STREAM_UPDATE') {
        if (recordingState === 'RECORDING' && msg.payload) {
          elLiveStreamPreview.classList.remove('hidden');
          elLivePreviewSpeaker.textContent = msg.payload.speaker || 'Speaker';
          elLivePreviewText.textContent = msg.payload.text || '';
          clearTimeout(elLiveStreamPreview._hideTimer);
          elLiveStreamPreview._hideTimer = setTimeout(() => {
            elLiveStreamPreview.classList.add('hidden');
          }, 2500);
        }
      } else if (msg.type === 'MEET_METADATA_UPDATE') {
        updateMeetingMeta(msg.payload);
      }
    });

    // Connect to Google Meet tab efficiently (Zero CPU fan spin)
    let hasInjectedTabId = null;

    function connectToMeetTab() {
      chrome.tabs.query({ url: '*://meet.google.com/*' }, async (tabs) => {
        if (!tabs || tabs.length === 0) return;
        let targetTab = tabs[0];
        for (const t of tabs) {
          if (t.active) { targetTab = t; break; }
        }

        // Only executeScript once per tab session
        if (hasInjectedTabId !== targetTab.id) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: targetTab.id },
              files: ['content.js']
            });
            hasInjectedTabId = targetTab.id;
          } catch (_) {}
        }

        chrome.tabs.sendMessage(targetTab.id, { type: 'QUERY_MEET_STATE' }, (res) => {
          if (chrome.runtime.lastError) {
            hasInjectedTabId = null; // Tab reloaded, allow re-injection
            return;
          }
          if (res && res.meta) {
            updateMeetingMeta(res.meta);
            if (settings.autoStartRec && recordingState === 'IDLE') {
              setRecordingState('RECORDING');
            }
          }
        });
      });
    }

    connectToMeetTab();
    setInterval(() => {
      if (!meetingMeta.meetingCode) {
        connectToMeetTab();
      }
    }, 10000);
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    initListeners();
    restoreSession();
  });
})();
