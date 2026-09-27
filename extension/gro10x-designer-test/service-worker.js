/**
 * extension/gro10x-designer-test/service-worker.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Background service worker for GRO10X Designer Test
 * - Tracks download events triggered by the upscaler website
 * - Notifies popup with file completion, file path, and size
 * - Provides 1-click 'Show in Folder' & 'Open File' integration
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Handle installation & side panel behavior
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[GRO10X Designer Test] Service worker installed.');
  
  // Configure side panel to open upon extension icon click
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.warn('[Designer Test] setPanelBehavior error:', err);
    });
  }

  await chrome.storage.local.set({
    upscaleHistory: [],
    automationSettings: {
      autoOpenFolder: false,
      autoSaveToVault: false,
      preferredResolution: '4K',
      pollTimeoutSeconds: 90
    }
  });
});

// Fallback action click listener to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open && tab && tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (err) {
      console.warn('[Designer Test] Failed to open side panel:', err);
    }
  }
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === 'START_AUTOMATION_TRACKING') {
        await chrome.storage.session.set({
          activeAutomation: {
            tabId: message.tabId,
            resolution: message.resolution,
            originalName: message.originalName,
            startTime: Date.now()
          }
        });
        sendResponse({ success: true });
        return;
      }

      if (message.type === 'TRIGGER_DIRECT_FILE_DOWNLOAD') {
        const downloadOptions = {
          url: message.url,
          filename: message.filename || 'upscaled_image.png',
          conflictAction: 'uniquify',
          saveAs: false
        };

        chrome.downloads.download(downloadOptions, async (downloadId) => {
          if (chrome.runtime.lastError) {
            console.warn('[ServiceWorker] Direct download error:', chrome.runtime.lastError.message);
          } else {
            console.log('[ServiceWorker] Direct download initiated with ID:', downloadId);
            const { activeAutomation = {} } = await chrome.storage.session.get('activeAutomation');
            activeAutomation.downloadId = downloadId;
            activeAutomation.filename = downloadOptions.filename;
            activeAutomation.resolution = message.resolution;
            activeAutomation.startTime = Date.now();
            await chrome.storage.session.set({ activeAutomation });
          }
        });
        sendResponse({ success: true });
        return;
      }

      if (message.type === 'SHOW_IN_FOLDER') {
        if (typeof message.downloadId === 'number') {
          chrome.downloads.show(message.downloadId);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Invalid download ID' });
        }
        return;
      }

      if (message.type === 'OPEN_FILE') {
        if (typeof message.downloadId === 'number') {
          chrome.downloads.open(message.downloadId);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Invalid download ID' });
        }
        return;
      }

      if (message.type === 'UPSCALE_BLOB_CAPTURED') {
        const { upscaleHistory = [] } = await chrome.storage.local.get('upscaleHistory');
        const entry = {
          id: 'up_' + Date.now(),
          timestamp: new Date().toISOString(),
          resolution: message.resolution || '4K',
          originalName: message.originalName || 'image.png',
          dataUrl: message.dataUrl ? message.dataUrl.slice(0, 50000) : null,
          hasFullBlob: Boolean(message.dataUrl),
          sourceUrl: sender.tab?.url || ''
        };
        upscaleHistory.unshift(entry);
        if (upscaleHistory.length > 20) upscaleHistory.pop();
        await chrome.storage.local.set({ upscaleHistory });
        sendResponse({ success: true });
        return;
      }

      sendResponse({ success: true });
    } catch (err) {
      console.error('[ServiceWorker onMessage Error]:', err);
      sendResponse({ success: false, error: err.message });
    }
  })();
  return true; // Keep channel open for async response
});

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOADS API TRACKER — Catches the exact moment the file downloads
// ─────────────────────────────────────────────────────────────────────────────

chrome.downloads.onCreated.addListener(async (downloadItem) => {
  const { activeAutomation } = await chrome.storage.session.get('activeAutomation');
  if (!activeAutomation) return;

  if (Date.now() - activeAutomation.startTime < 180000) {
    activeAutomation.downloadId = downloadItem.id;
    activeAutomation.filename = downloadItem.filename;
    await chrome.storage.session.set({ activeAutomation });

    chrome.runtime.sendMessage({
      type: 'AUTOMATION_DOWNLOAD_STARTED',
      downloadId: downloadItem.id,
      filename: downloadItem.filename,
      fileSize: downloadItem.fileSize,
      resolution: activeAutomation.resolution
    }).catch(() => {});
  }
});

chrome.downloads.onChanged.addListener(async (delta) => {
  const { activeAutomation } = await chrome.storage.session.get('activeAutomation');
  if (!activeAutomation) return;

  const isTarget = (activeAutomation.downloadId && delta.id === activeAutomation.downloadId) ||
    (!activeAutomation.downloadId && (Date.now() - (activeAutomation.startTime || 0)) < 180000);
  if (!isTarget) return;

  if (delta.state && delta.state.current === 'complete') {
    const [item] = await chrome.downloads.search({ id: delta.id });
    const completedFilename = item ? item.filename : (activeAutomation.filename || 'upscaled_image');
    const fileSize = item ? item.fileSize : 0;

    const { upscaleHistory = [] } = await chrome.storage.local.get('upscaleHistory');
    upscaleHistory.unshift({
      id: 'up_' + Date.now(),
      downloadId: delta.id,
      timestamp: new Date().toISOString(),
      resolution: activeAutomation.resolution || '4K',
      originalName: activeAutomation.originalName || 'image.png',
      filePath: completedFilename,
      fileSize: fileSize
    });
    if (upscaleHistory.length > 20) upscaleHistory.pop();
    await chrome.storage.local.set({ upscaleHistory });

    await chrome.storage.session.remove('activeAutomation');

    chrome.runtime.sendMessage({
      type: 'AUTOMATION_DOWNLOAD_FINISHED',
      downloadId: delta.id,
      filePath: completedFilename,
      fileSize: fileSize,
      resolution: activeAutomation.resolution
    }).catch(() => {});
  }
});
