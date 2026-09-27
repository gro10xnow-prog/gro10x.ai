/**
 * extension/gro10x-designer-test/sidepanel.js
 * ─────────────────────────────────────────────────────────────────────────────
 * User interface controller for GRO10X Designer Test (Side Panel Edition)
 * Coordinates image selection, resolution choice (2K/4K/8K),
 * live canvas selection tracking, and direct download retrieval.
 * ─────────────────────────────────────────────────────────────────────────────
 */

let selectedImageDataUrl = null;
let selectedFileName = 'image.png';
let selectedResolution = '4K';
let selectedEngine = 'canvas'; // 'canvas' (Studio toolbar 2-click) or 'chat' (Fast prompt)
let lastDownloadId = null;
let lastResultBlob = null;
let isCanvasLayerSelected = false;

document.addEventListener('DOMContentLoaded', async () => {
  initDomainBadge();
  initDropzone();
  initEngineSelector();
  initResolutionSelector();
  initAutomationTrigger();
  initResultActions();
  initHistoryDrawer();
  loadSavedSettings();
  listenToBackgroundEvents();
  initCanvasSelectionWatcher();
});

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

async function initDomainBadge() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const domainEl = document.getElementById('activeDomain');
  if (tab && tab.url) {
    try {
      const url = new URL(tab.url);
      domainEl.textContent = url.hostname.replace('www.', '');
    } catch (_) {
      domainEl.textContent = 'Active Tab';
    }
  } else {
    domainEl.textContent = 'Ready';
  }
}

async function loadSavedSettings() {
  const { automationSettings } = await chrome.storage.local.get('automationSettings');
  if (automationSettings?.preferredEngine) {
    setEngine(automationSettings.preferredEngine);
  } else {
    setEngine('canvas');
  }
  if (automationSettings?.preferredResolution) {
    setResolution(automationSettings.preferredResolution);
  }
  if (automationSettings?.autoOpenFolder !== undefined) {
    document.getElementById('chkAutoOpen').checked = automationSettings.autoOpenFolder;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE CANVAS SELECTION WATCHER
// ─────────────────────────────────────────────────────────────────────────────

function initCanvasSelectionWatcher() {
  const dot = document.getElementById('selectionDot');
  const text = document.getElementById('selectionStatusText');
  const btnTarget = document.getElementById('btnRefreshSelection');

  async function checkSelection() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id || !tab.url || tab.url.startsWith('chrome://')) return;

      const res = await chrome.tabs.sendMessage(tab.id, { type: 'CHECK_CANVAS_SELECTION' });
      if (res && res.hasSelection) {
        isCanvasLayerSelected = true;
        if (dot) dot.className = 'selection-dot ready';
        if (text) {
          text.textContent = 'Active Image Selected (HD Upscale Ready)';
          text.className = 'selection-status-text ready';
        }
      } else {
        isCanvasLayerSelected = false;
        if (dot) dot.className = 'selection-dot';
        if (text) {
          text.textContent = 'No Image Selected — Click Canvas Image';
          text.className = 'selection-status-text';
        }
      }
      updateRunButtonText();
    } catch (_) {
      // Content script may not be injected yet
    }
  }

  // Periodic check every 1000ms
  setInterval(checkSelection, 1000);
  checkSelection();

  // Target Layer button
  if (btnTarget) {
    btnTarget.addEventListener('click', async () => {
      text.textContent = 'Targeting canvas image...';
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) return;
        const res = await chrome.tabs.sendMessage(tab.id, { type: 'AUTO_SELECT_CANVAS_IMAGE' });
        if (res && res.hasSelection) {
          isCanvasLayerSelected = true;
          if (dot) dot.className = 'selection-dot ready';
          if (text) {
            text.textContent = 'Active Image Selected (HD Upscale Ready)';
            text.className = 'selection-status-text ready';
          }
        } else {
          text.textContent = 'Could not auto-select — click image on canvas';
        }
        updateRunButtonText();
      } catch (e) {
        text.textContent = 'Could not communicate with tab';
      }
    });
  }
}

function initEngineSelector() {
  const buttons = document.querySelectorAll('.btn-engine');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const engine = btn.getAttribute('data-engine');
      setEngine(engine);
      chrome.storage.local.get('automationSettings').then(({ automationSettings = {} }) => {
        automationSettings.preferredEngine = engine;
        chrome.storage.local.set({ automationSettings });
      });
    });
  });
}

function setEngine(engine) {
  selectedEngine = engine;
  document.querySelectorAll('.btn-engine').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-engine') === engine);
  });
  updateRunButtonText();
}

function updateRunButtonText() {
  const btn = document.getElementById('btnRunAutomation');
  if (!btn) return;
  if (selectedEngine === 'chat') {
    if (selectedImageDataUrl) {
      btn.textContent = `⚡ Run AI Chat Upscale (${selectedResolution})`;
    } else if (isCanvasLayerSelected) {
      btn.textContent = `⚡ AI Chat Upscale Selected (${selectedResolution})`;
    } else {
      btn.textContent = `⚡ Run AI Chat Upscale (${selectedResolution})`;
    }
  } else {
    if (selectedImageDataUrl) {
      btn.textContent = `🎨 Upload & Upscale on Canvas (${selectedResolution})`;
    } else if (isCanvasLayerSelected) {
      btn.textContent = `🎨 Upscale Canvas Selection (${selectedResolution})`;
    } else {
      btn.textContent = `🎨 Auto-Select & Upscale (${selectedResolution})`;
    }
  }
  btn.disabled = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: DROPZONE & IMAGE SELECTION
// ─────────────────────────────────────────────────────────────────────────────

function initDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const content = document.getElementById('dropzoneContent');
  const preview = document.getElementById('previewContainer');
  const btnRemove = document.getElementById('btnRemoveImg');

  dropzone.addEventListener('click', () => {
    if (!selectedImageDataUrl) fileInput.click();
  });

  fileInput.addEventListener('change', e => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  });

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  btnRemove.addEventListener('click', e => {
    e.stopPropagation();
    clearSelectedImage();
  });
}

function handleImageFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file (PNG, JPG, WebP).');
    return;
  }

  selectedFileName = file.name;
  const reader = new FileReader();
  reader.onload = e => {
    selectedImageDataUrl = e.target.result;
    
    // Read dimensions
    const img = new Image();
    img.onload = () => {
      document.getElementById('previewDimensions').textContent = `${img.naturalWidth} × ${img.naturalHeight} px (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
    };
    img.src = selectedImageDataUrl;

    document.getElementById('previewImg').src = selectedImageDataUrl;
    document.getElementById('previewFileName').textContent = file.name;
    document.getElementById('dropzoneContent').style.display = 'none';
    document.getElementById('previewContainer').style.display = 'flex';
    updateRunButtonText();
  };
  reader.readAsDataURL(file);
}

function clearSelectedImage() {
  selectedImageDataUrl = null;
  selectedFileName = 'canvas_image.png';
  document.getElementById('fileInput').value = '';
  document.getElementById('dropzoneContent').style.display = 'block';
  document.getElementById('previewContainer').style.display = 'none';
  updateRunButtonText();
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: RESOLUTION SELECTOR
// ─────────────────────────────────────────────────────────────────────────────

function initResolutionSelector() {
  const buttons = document.querySelectorAll('.btn-res');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const res = btn.getAttribute('data-res');
      setResolution(res);
      chrome.storage.local.get('automationSettings').then(({ automationSettings = {} }) => {
        automationSettings.preferredResolution = res;
        chrome.storage.local.set({ automationSettings });
      });
    });
  });
}

function setResolution(res) {
  selectedResolution = res;
  document.querySelectorAll('.btn-res').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-res') === res);
  });
  updateRunButtonText();
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: AUTOMATION EXECUTION
// ─────────────────────────────────────────────────────────────────────────────

function initAutomationTrigger() {
  const btnRun = document.getElementById('btnRunAutomation');
  const btnQuickDownload = document.getElementById('btnQuick2ClickDownload');
  updateRunButtonText();

  // 1. Quick 2-Click Download Handler (For directly downloading active/generated layer)
  if (btnQuickDownload) {
    btnQuickDownload.addEventListener('click', async () => {
      btnQuickDownload.disabled = true;
      document.getElementById('resultCard').style.display = 'none';
      document.getElementById('progressSection').style.display = 'block';
      resetProgressSteps();
      updateStepStatus(1, 'completed');
      updateStepStatus(2, 'completed');
      updateStepStatus(3, 'completed');
      updateStepStatus(4, 'active');
      document.getElementById('progressTitle').textContent = 'Executing 2-Click Download Sequence...';
      document.getElementById('progressTitle').style.color = '#06b6d4';

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) throw new Error('No active browser tab found.');

        // Start background download tracking
        await chrome.runtime.sendMessage({
          type: 'START_AUTOMATION_TRACKING',
          tabId: tab.id,
          resolution: selectedResolution,
          originalName: selectedFileName || 'upscaled_image.png'
        });

        // Ensure content script is ready
        try {
          await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
        } catch (_) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
        }

        // Trigger the 2-click download sequence on page
        const res = await chrome.tabs.sendMessage(tab.id, {
          type: 'TRIGGER_2CLICK_DOWNLOAD'
        });

        if (!res || !res.success) {
          throw new Error(res?.error || 'Could not complete 2-click download sequence.');
        }

      } catch (err) {
        console.error('[Quick Download Error]:', err);
        document.getElementById('progressTitle').textContent = `❌ ${err.message}`;
        document.getElementById('progressTitle').style.color = '#ef4444';
      } finally {
        btnQuickDownload.disabled = false;
      }
    });
  }

  // 2. Full Upscale & Download Automation Handler
  btnRun.addEventListener('click', async () => {
    btnRun.disabled = true;
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('progressSection').style.display = 'block';
    resetProgressSteps();

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error('No active browser tab found.');

      // Notify service worker to track downloads
      await chrome.runtime.sendMessage({
        type: 'START_AUTOMATION_TRACKING',
        tabId: tab.id,
        resolution: selectedResolution,
        originalName: selectedFileName
      });

      // Ensure content script is ready
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
      } catch (_) {
        // Inject content script if not already present on page
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      }

      // Send command to content script to execute automation
      const res = await chrome.tabs.sendMessage(tab.id, {
        type: 'RUN_DESIGNER_UPSCALE',
        engine: selectedEngine,
        dataUrl: selectedImageDataUrl,
        fileName: selectedFileName,
        resolution: selectedResolution,
        useCurrentSelection: !selectedImageDataUrl
      });

      if (!res || !res.success) {
        throw new Error(res?.error || 'Automation script encountered an issue on page.');
      }

      // If direct image blob was returned by content script
      if (res.result && res.result.dataUrl) {
        displayCapturedResult(res.result.dataUrl, selectedResolution, selectedFileName);
      }

    } catch (err) {
      console.error('[Run Automation Error]:', err);
      document.getElementById('progressTitle').textContent = `❌ ${err.message}`;
      document.getElementById('progressTitle').style.color = '#ef4444';
      btnRun.disabled = false;
    }
  });
}

function resetProgressSteps() {
  document.getElementById('progressTitle').textContent = 'Automating Webpage...';
  document.getElementById('progressTitle').style.color = '#c084fc';
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step${i}`);
    el.className = 'step-item';
    el.querySelector('.step-icon').textContent = '○';
  }
}

function updateStepStatus(stepNum, status) {
  const el = document.getElementById(`step${stepNum}`);
  if (!el) return;
  if (status === 'active') {
    el.className = 'step-item active';
    el.querySelector('.step-icon').textContent = '▶';
  } else if (status === 'completed') {
    el.className = 'step-item completed';
    el.querySelector('.step-icon').textContent = '✓';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: BACKGROUND & DOWNLOAD TRACKING
// ─────────────────────────────────────────────────────────────────────────────

function listenToBackgroundEvents() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'AUTOMATION_PROGRESS') {
      const step = message.step;
      if (step >= 1 && step <= 4) {
        for (let i = 1; i < step; i++) updateStepStatus(i, 'completed');
        updateStepStatus(step, 'active');
      }
      if (step === 5) {
        for (let i = 1; i <= 4; i++) updateStepStatus(i, 'completed');
      }
    }

    if (message.type === 'UPSCALE_BLOB_CAPTURED') {
      displayCapturedResult(message.dataUrl, message.resolution, message.originalName);
    }

    if (message.type === 'AUTOMATION_DOWNLOAD_STARTED') {
      lastDownloadId = message.downloadId;
      updateStepStatus(4, 'active');
    }

    if (message.type === 'AUTOMATION_DOWNLOAD_FINISHED') {
      lastDownloadId = message.downloadId;
      updateStepStatus(4, 'completed');
      document.getElementById('progressTitle').textContent = '✓ Upscale Downloaded & Retrieved!';
      document.getElementById('progressTitle').style.color = '#00df89';
      document.getElementById('btnRunAutomation').disabled = false;

      // Show in Explorer automatically if checked
      const autoOpen = document.getElementById('chkAutoOpen').checked;
      if (autoOpen && typeof lastDownloadId === 'number') {
        chrome.runtime.sendMessage({ type: 'SHOW_IN_FOLDER', downloadId: lastDownloadId });
      }

      showResultCard(message.filePath, message.resolution, message.fileSize);
      refreshHistory();
    }
  });
}

function displayCapturedResult(dataUrl, resolution, originalName) {
  lastResultBlob = dataUrl;
  const resultCard = document.getElementById('resultCard');
  const resultImg = document.getElementById('resultImg');
  const resultBox = document.getElementById('resultPreviewBox');

  resultImg.src = dataUrl;
  resultBox.style.display = 'block';
  resultCard.style.display = 'block';
  document.getElementById('resultResBadge').textContent = `${resolution} Ultra-HD`;
}

function showResultCard(filePath, resolution, fileSize) {
  const resultCard = document.getElementById('resultCard');
  resultCard.style.display = 'block';
  document.getElementById('resultResBadge').textContent = `${resolution} Ultra-HD`;
  
  const pathDisplay = filePath ? filePath.split('\\').pop().split('/').pop() : 'upscaled_image';
  const sizeKb = fileSize ? ` (${(fileSize / (1024 * 1024)).toFixed(2)} MB)` : '';
  document.getElementById('resultFilePath').textContent = `${pathDisplay}${sizeKb}`;

  const resultBox = document.getElementById('resultPreviewBox');
  const resultImg = document.getElementById('resultImg');
  if (lastResultBlob) {
    resultImg.src = lastResultBlob;
    resultBox.style.display = 'block';
  } else if (selectedImageDataUrl) {
    resultImg.src = selectedImageDataUrl;
    resultBox.style.display = 'block';
  } else {
    resultBox.style.display = 'none';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: BRING-BACK-TO-ME ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

function initResultActions() {
  // 1. Show in Windows Explorer
  document.getElementById('btnShowInFolder').addEventListener('click', async () => {
    if (typeof lastDownloadId === 'number') {
      await chrome.runtime.sendMessage({ type: 'SHOW_IN_FOLDER', downloadId: lastDownloadId });
    } else {
      alert('Download ID not tracked. Check your browser Downloads folder.');
    }
  });

  // 2. Open File directly
  document.getElementById('btnOpenFile').addEventListener('click', async () => {
    if (typeof lastDownloadId === 'number') {
      await chrome.runtime.sendMessage({ type: 'OPEN_FILE', downloadId: lastDownloadId });
    } else {
      alert('Download ID not tracked.');
    }
  });

  // 3. Copy Image to Clipboard
  document.getElementById('btnCopyClipboard').addEventListener('click', async () => {
    const btn = document.getElementById('btnCopyClipboard');
    const origText = btn.textContent;
    try {
      if (!lastResultBlob) throw new Error('No image blob available in memory.');
      const res = await fetch(lastResultBlob);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = origText; }, 2000);
    } catch (err) {
      alert(`Clipboard copy failed: ${err.message}`);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY DRAWER
// ─────────────────────────────────────────────────────────────────────────────

function initHistoryDrawer() {
  const toggle = document.getElementById('btnToggleHistory');
  const list = document.getElementById('historyList');
  toggle.addEventListener('click', () => {
    const isHidden = list.style.display === 'none';
    list.style.display = isHidden ? 'flex' : 'none';
    if (isHidden) refreshHistory();
  });

  // Delegated click handler for Show in Folder buttons
  list.addEventListener('click', e => {
    const btn = e.target.closest('.btn-history-folder');
    if (btn) {
      const downloadId = parseInt(btn.getAttribute('data-download-id'), 10);
      if (!isNaN(downloadId)) {
        chrome.runtime.sendMessage({ type: 'SHOW_IN_FOLDER', downloadId });
      }
    }
  });

  refreshHistory();
}

async function refreshHistory() {
  const { upscaleHistory = [] } = await chrome.storage.local.get('upscaleHistory');
  const countBadge = document.getElementById('historyCountBadge');
  const list = document.getElementById('historyList');

  countBadge.textContent = upscaleHistory.length;
  if (upscaleHistory.length === 0) {
    list.innerHTML = '<div class="empty-history">No upscales yet</div>';
    return;
  }

  list.innerHTML = upscaleHistory.map(item => {
    const name = item.originalName ? item.originalName.slice(0, 24) : 'image.png';
    const date = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="history-item">
        <div>
          <span style="font-weight:700; color:#fff;">${name}</span>
          <span style="color:#a855f7; font-size:0.65rem; margin-left:0.3rem;">[${item.resolution || '4K'}]</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.4rem;">
          <span style="color:var(--text-muted); font-size:0.65rem;">${date}</span>
          ${item.downloadId ? `
            <button class="btn-history-folder" data-download-id="${item.downloadId}" style="background:none; border:none; color:#00df89; cursor:pointer; font-size:0.75rem;" title="Show in folder">📂</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}
