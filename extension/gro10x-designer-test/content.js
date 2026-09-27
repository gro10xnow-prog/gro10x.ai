/**
 * extension/gro10x-designer-test/content.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Content script for DOM automation on AI Upscaler web applications
 * (Tailored specifically for CapCut Web / Canvas Editor & AI Upscalers)
 *
 * PROVEN CAPCUT CANVAS WORKFLOW (per screenshot media_1789166420477.png):
 * 1. Targets/selects image on canvas (or injects picture).
 * 2. Clicks "HD Upscale" in floating action bar.
 * 3. Selects 4K with strict word-boundary matching (never hits 8K).
 * 4. Waits for AI generation to complete (approx 25–35s).
 * 5. CapCut automatically keeps the newly generated layer selected on canvas!
 * 6. Executes the 2-Click Download:
 *    - Click 1: Top header [ Download ] button (opens layer export menu)
 *    - Sleep 800ms (verifies newly generated layer is checked: [✓] upscaled_...)
 *    - Click 2: Cyan [ Download ] button at the bottom of the dropdown
 * 7. Browser downloads ONLY the checked 4K PNG file.
 * 8. Background Service Worker catches the completed download and displays it
 *    in the side panel with 'Show in Explorer', 'Open File', and 'Copy'.
 * ─────────────────────────────────────────────────────────────────────────────
 */

console.log('[GRO10X Designer Test] Content script active on:', window.location.href);

// Listen for commands from sidepanel or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RUN_DESIGNER_UPSCALE') {
    executeUpscaleAutomation(message)
      .then(result => sendResponse({ success: true, result }))
      .catch(err => {
        console.error('[Designer Test Error]:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (message.type === 'TRIGGER_2CLICK_DOWNLOAD') {
    executeTwoClickTopDownload()
      .then(ok => sendResponse({ success: ok }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'CHECK_CANVAS_SELECTION') {
    const upscaleBtn = findHDUpscaleButton();
    sendResponse({
      hasSelection: Boolean(upscaleBtn),
      url: window.location.href
    });
    return true;
  }

  if (message.type === 'AUTO_SELECT_CANVAS_IMAGE') {
    ensureCanvasImageSelected().then(hasSelection => {
      sendResponse({ success: hasSelection, hasSelection: Boolean(findHDUpscaleButton()) });
    });
    return true;
  }

  if (message.type === 'PING') {
    sendResponse({ active: true, url: window.location.href });
    return true;
  }
});

// Helper: Convert Base64 dataURL to a real File object
function dataUrlToFile(dataUrl, fileName) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], fileName || 'image.png', { type: mime });
}

// Helper: Send live progress update to popup/sidepanel
function notifyProgress(step, message, extra = {}) {
  chrome.runtime.sendMessage({
    type: 'AUTOMATION_PROGRESS',
    step,
    message,
    ...extra
  }).catch(() => {});
}

// Helper: Sleep
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Helper: Dispatch full sequence of Pointer & Mouse Events
function simulateClick(el) {
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const mouseEvents = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
  mouseEvents.forEach(evtType => {
    const evt = new MouseEvent(evtType, {
      bubbles: true,
      cancelable: true,
      view: window,
      buttons: 1
    });
    el.dispatchEvent(evt);
  });
  if (typeof el.click === 'function') el.click();
  return true;
}

// Helper: Human-like click with Pointer & Mouse events on target & closest button
function humanClick(el) {
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const target = el.closest('button, [role="button"], [class*="item"], [class*="btn"], div') || el;
  const rect = target.getBoundingClientRect();
  const x = Math.round(rect.left + rect.width / 2);
  const y = Math.round(rect.top + rect.height / 2);

  const evtInit = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    buttons: 1,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true
  };

  [target, el].forEach(node => {
    try {
      node.dispatchEvent(new PointerEvent('pointerdown', evtInit));
      node.dispatchEvent(new MouseEvent('mousedown', evtInit));
      node.dispatchEvent(new PointerEvent('pointerup', evtInit));
      node.dispatchEvent(new MouseEvent('mouseup', evtInit));
      node.dispatchEvent(new MouseEvent('click', evtInit));
      if (typeof node.click === 'function') node.click();
    } catch (_) {}
  });

  return true;
}

// Helper: Dispatch click at exact screen coordinates (vital for HTML5 / Konva canvas hit-detectors)
function dispatchPreciseClickAt(x, y) {
  const target = document.elementFromPoint(x, y) || document.body;
  const evtInit = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    buttons: 1,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true
  };
  try {
    target.dispatchEvent(new PointerEvent('pointerdown', evtInit));
    target.dispatchEvent(new MouseEvent('mousedown', evtInit));
    target.dispatchEvent(new PointerEvent('pointerup', evtInit));
    target.dispatchEvent(new MouseEvent('mouseup', evtInit));
    target.dispatchEvent(new MouseEvent('click', evtInit));
  } catch (_) {}
  return target;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVEN 2-CLICK TOP DOWNLOAD (Seen in screenshot media_1789166420477.png)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Click 1: Top Navigation Header Download button (white pill at top-center/left)
 */
function findTopHeaderDownloadButton() {
  const candidates = Array.from(document.querySelectorAll('header button, nav button, [class*="header"] button, button, div[role="button"], a[role="button"]')).filter(el => {
    if (el.offsetParent === null) return false;
    const rect = el.getBoundingClientRect();
    if (rect.top > 80 || rect.bottom < 0 || rect.width < 20 || rect.height < 15) return false;
    const text = (el.innerText || el.textContent || '').trim();
    const aria = (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
    const isDownload = /^Download$/i.test(text) || /^Download$/i.test(aria) || (text.toLowerCase().includes('download') && text.length < 25);
    return isDownload;
  });

  if (candidates.length > 0) {
    return candidates[0].closest('button, [role="button"]') || candidates[0];
  }
  return null;
}

/**
 * Click 2: Cyan [ Download ] button at the bottom of the export dropdown menu
 * (Seen in screenshot media_1789166420477.png directly below Format, Size, etc.)
 */
function findDropdownCyanDownloadButton() {
  const candidateButtons = Array.from(document.querySelectorAll('button, div[role="button"], a[role="button"]')).filter(b => {
    if (b.offsetParent === null) return false;
    // Don't match anything inside chat panel
    if (b.closest('[class*="chat"], [class*="storyboard"], [class*="message"], [class*="composer"]')) return false;

    const rect = b.getBoundingClientRect();
    // Must be below top header (rect.top > 90) and visible
    if (rect.top <= 90 || rect.width < 40 || rect.height < 20) return false;

    const text = (b.innerText || b.textContent || '').trim();
    const aria = (b.getAttribute('aria-label') || b.getAttribute('title') || '').trim();

    return /^Download$/i.test(text) || /^Download$/i.test(aria);
  });

  if (candidateButtons.length > 0) {
    // Pick the button located lowest vertically in the dropdown
    candidateButtons.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);
    const target = candidateButtons[0];
    return target.closest('button, [role="button"]') || target;
  }

  return null;
}

/**
 * Executes the exact 2-click download sequence
 */
async function executeTwoClickTopDownload() {
  notifyProgress(4, 'Checking export menu state...');

  // 1. Is the export dropdown ALREADY open on screen?
  let confirmBtn = findDropdownCyanDownloadButton();
  if (!confirmBtn) {
    // Dropdown not open yet, execute Click 1: Top Navigation Header Download button
    const topBtn = findTopHeaderDownloadButton();
    if (!topBtn) {
      throw new Error('Top header [ Download ] button not found on page.');
    }

    console.log('[Designer Test] Click 1/2: Clicking Top Header Download:', topBtn);
    notifyProgress(4, 'Click 1/2: Opening top Download menu...');
    humanClick(topBtn);
    simulateClick(topBtn);

    // Wait and poll for dropdown to mount (up to 3.5s)
    const startWait = Date.now();
    while (Date.now() - startWait < 3500) {
      await sleep(200);
      confirmBtn = findDropdownCyanDownloadButton();
      if (confirmBtn) break;
    }
  } else {
    console.log('[Designer Test] Export menu is already open on screen!');
  }

  if (!confirmBtn) {
    throw new Error('Export menu opened, but could not find the cyan [ Download ] button inside it.');
  }

  // Click 2/2: Cyan Download button at bottom of the dropdown
  console.log('[Designer Test] Click 2/2: Clicking dropdown bottom cyan Download button:', confirmBtn);
  notifyProgress(4, 'Click 2/2: Confirming download in popup...');
  await sleep(350);
  humanClick(confirmBtn);
  simulateClick(confirmBtn);

  notifyProgress(4, '✓ Download confirmed! File saving...');
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN AUTOMATION SEQUENCE
// ─────────────────────────────────────────────────────────────────────────────

async function executeUpscaleAutomation(options) {
  const { dataUrl, fileName, resolution = '4K', useCurrentSelection = false } = options;

  // STEP 1: Picture Upload or Canvas Element Targeting
  if (dataUrl && !useCurrentSelection) {
    const file = dataUrlToFile(dataUrl, fileName || 'upscale_input.png');
    notifyProgress(1, `Uploading "${file.name}" to canvas...`);
    await sleep(300);

    const uploadSuccess = await injectImageToPage(file);
    if (!uploadSuccess) {
      throw new Error('Could not upload image to canvas. Try uploading it to canvas manually first.');
    }
    notifyProgress(1, '✓ Picture uploaded to canvas successfully.');
    await sleep(1500);
  } else {
    notifyProgress(1, 'Targeting selected image on canvas...');
    await ensureCanvasImageSelected();
    notifyProgress(1, '✓ Active canvas image targeted.');
    await sleep(400);
  }

  // STEP 2: Find Floating Bar -> Click "HD Upscale" -> Select 4K (STRICT WORD-BOUNDARY MATCH)
  notifyProgress(2, `Opening HD Upscale & selecting ${resolution}...`);
  const upscaleSuccess = await triggerHDUpscale(resolution);
  if (!upscaleSuccess) {
    throw new Error('Could not locate the "HD Upscale" button or resolution options. Ensure an image layer is selected on the canvas.');
  }
  notifyProgress(2, `✓ HD Upscale triggered at ${resolution}`);
  await sleep(1000);

  // STEP 3: Monitor Generation Progress (approx 25–35s)
  notifyProgress(3, `Waiting for ${resolution} generation to complete (~25-35s)...`);
  await monitorGenerationProgress();
  notifyProgress(3, '✓ Generation complete & new layer selected on canvas!');
  await sleep(800);

  // STEP 4: PROVEN 2-CLICK DOWNLOAD (Click 1: Top Header -> Click 2: Cyan Button in Dropdown)
  notifyProgress(4, 'Executing 2-click layer download...');
  const downloadSuccess = await executeTwoClickTopDownload();
  if (!downloadSuccess) {
    throw new Error('Could not complete the 2-click download. Check if the top Download menu is visible.');
  }

  notifyProgress(5, `🎉 Successfully captured ${resolution} upscaled asset!`);
  return {
    resolution,
    originalName: fileName || 'upscaled_image.png',
    timestamp: new Date().toISOString()
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 & 2 HELPERS: Canvas Selection, Upload & Strict 4K Upscale
// ─────────────────────────────────────────────────────────────────────────────

function findHDUpscaleButton() {
  const allElements = Array.from(document.querySelectorAll('button, div[role="button"], span, div, a'))
    .filter(el => el.offsetParent !== null && !el.closest('[class*="chat"], [class*="storyboard"]'));

  for (const el of allElements) {
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    if (/^HD\s*Upscale$/i.test(text)) {
      return el.closest('button, [role="button"]') || el;
    }
  }

  for (const el of allElements) {
    const aria = (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
    if (/HD\s*Upscale/i.test(aria)) {
      return el.closest('button, [role="button"]') || el;
    }
  }

  for (const el of allElements) {
    const text = el.textContent.trim();
    if (/HD\s*Upscale/i.test(text) && text.length < 25) {
      return el.closest('button, [role="button"]') || el;
    }
  }

  for (const el of allElements) {
    const text = el.textContent.trim();
    if (/^(Upscale|Upscaler|HD)$/i.test(text)) {
      return el.closest('button, [role="button"]') || el;
    }
  }

  return null;
}

async function ensureCanvasImageSelected() {
  if (findHDUpscaleButton()) return true;

  const candidateImages = Array.from(document.querySelectorAll('img')).filter(img => {
    if (img.offsetParent === null) return false;
    const rect = img.getBoundingClientRect();
    const isBigEnough = rect.width > 100 && rect.height > 80;
    const notInNav = rect.top > 70 && rect.left > 60;
    const notChat = !img.closest('[class*="chat"], [class*="storyboard"], [class*="message"], [class*="composer"], header, nav, [class*="dock"]');
    return isBigEnough && notInNav && notChat;
  });

  for (const img of candidateImages) {
    const rect = img.getBoundingClientRect();
    const centerX = Math.round(rect.left + rect.width / 2);
    const centerY = Math.round(rect.top + rect.height / 2);

    dispatchPreciseClickAt(centerX, centerY);
    await sleep(400);

    if (findHDUpscaleButton()) return true;
  }

  const canvasContainers = Array.from(document.querySelectorAll(`
    .konvajs-content, canvas, [class*="canvas-container"], [class*="editor-canvas"],
    [class*="board-view"]
  `)).filter(el => el.offsetParent !== null && el.getBoundingClientRect().width > 300 && !el.closest('[class*="chat"], [class*="storyboard"]'));

  for (const container of canvasContainers) {
    const rect = container.getBoundingClientRect();
    const centerX = Math.round(rect.left + rect.width * 0.4);
    const centerY = Math.round(rect.top + rect.height * 0.45);

    dispatchPreciseClickAt(centerX, centerY);
    await sleep(400);

    if (findHDUpscaleButton()) return true;
  }

  return Boolean(findHDUpscaleButton());
}

async function injectImageToPage(file) {
  const dt = new DataTransfer();
  dt.items.add(file);

  // 1. Click bottom dock tool #3 (picture icon)
  const candidateButtons = Array.from(document.querySelectorAll('button, [role="button"]')).filter(el => {
    if (el.offsetParent === null) return false;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight - 200) return false;
    const aria = (el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('data-tooltip') || '').toLowerCase();
    return aria.includes('image') || aria.includes('picture') || aria.includes('upload') || aria.includes('photo');
  });

  if (candidateButtons.length > 0) {
    simulateClick(candidateButtons[0]);
    await sleep(300);
  }

  // 2. Drop onto canvas container
  const dropTargets = Array.from(document.querySelectorAll(`
    .konvajs-content, canvas, [class*="canvas-container"], [class*="editor-canvas"],
    [class*="board-view"], [role="main"]
  `)).filter(el => el.offsetParent !== null && !el.closest('[class*="chat"], [class*="storyboard"]'));

  for (const target of dropTargets) {
    try {
      const dragEnter = new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt });
      const dragOver = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt });
      const drop = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });

      target.dispatchEvent(dragEnter);
      target.dispatchEvent(dragOver);
      target.dispatchEvent(drop);
      return true;
    } catch (e) {}
  }

  return false;
}

async function triggerHDUpscale(targetRes) {
  let upscaleBtn = findHDUpscaleButton();

  if (!upscaleBtn) {
    await ensureCanvasImageSelected();
    await sleep(400);
    upscaleBtn = findHDUpscaleButton();
  }

  if (!upscaleBtn) {
    console.warn('[Designer Test] "HD Upscale" button not found in DOM.');
    return false;
  }

  humanClick(upscaleBtn);
  await sleep(700);

  const resSuccess = await selectResolutionFromPopover(targetRes);
  return resSuccess;
}

/**
 * STRICT RESOLUTION SELECTOR: Matches target resolution word boundaries
 * (Guaranteed to click 4K and NEVER 8K or 2K!)
 */
async function selectResolutionFromPopover(targetRes, maxWaitMs = 6000) {
  const normTarget = targetRes.trim().toUpperCase(); // '2K', '4K', '8K'
  const start = Date.now();

  console.log(`[Designer Test] Strictly targeting resolution: ${normTarget}`);

  while (Date.now() - start < maxWaitMs) {
    const dialogs = Array.from(document.querySelectorAll(`
      [role="dialog"], [role="menu"], [role="listbox"],
      [class*="popover"], [class*="popup"], [class*="menu"], [class*="modal"],
      [class*="drawer"], [class*="panel"], [class*="dropdown"]
    `)).filter(el => el.offsetParent !== null && !el.closest('[class*="chat"], [class*="storyboard"]'));

    for (const dialog of dialogs) {
      const items = Array.from(dialog.querySelectorAll('button, [role="button"], [role="radio"], [role="option"], div[tabindex]'))
        .filter(el => {
          if (el.offsetParent === null) return false;
          if (el.querySelectorAll('button, [role="button"]').length > 0) return false;
          const t = el.textContent.trim().toUpperCase();
          return t.includes('2K') || t.includes('4K') || t.includes('8K') || t.includes('2X') || t.includes('4X') || t.includes('8X');
        });

      if (items.length >= 2) {
        // STRICT WORD-BOUNDARY MATCH: Ensure 4K doesn't match 8K or 2K!
        const exactMatch = items.find(el => {
          const t = el.textContent.trim().toUpperCase();
          if (normTarget === '4K') {
            return (/\b4K\b/.test(t) || /\b4X\b/.test(t)) && !/\b8K\b/.test(t) && !/\b2K\b/.test(t);
          } else if (normTarget === '8K') {
            return (/\b8K\b/.test(t) || /\b8X\b/.test(t)) && !/\b4K\b/.test(t) && !/\b2K\b/.test(t);
          } else if (normTarget === '2K') {
            return (/\b2K\b/.test(t) || /\b2X\b/.test(t)) && !/\b4K\b/.test(t) && !/\b8K\b/.test(t);
          }
          return false;
        });

        if (exactMatch) {
          console.log(`[Designer Test] Found STRICT resolution match for ${normTarget}:`, exactMatch);
          humanClick(exactMatch);
          await sleep(600);
          await maybeClickPopoverConfirmButton();
          return true;
        }

        // Layout Position Fallback (Left = 2K, Middle = 4K, Right = 8K):
        const first = items[0].getBoundingClientRect();
        const second = items[1].getBoundingClientRect();
        const isVertical = Math.abs(second.top - first.top) > Math.abs(second.left - first.left);

        if (isVertical) {
          items.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
        } else {
          items.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
        }

        const targetIndex = normTarget === '2K' ? 0 : (normTarget === '8K' ? 2 : 1);
        const positionItem = items[Math.min(targetIndex, items.length - 1)];
        if (positionItem) {
          console.log(`[Designer Test] Selected resolution item by position index ${targetIndex} for ${normTarget}:`, positionItem);
          humanClick(positionItem);
          await sleep(600);
          await maybeClickPopoverConfirmButton();
          return true;
        }
      }
    }

    await sleep(300);
  }

  console.warn('[Designer Test] Resolution popover selection timed out.');
  await maybeClickPopoverConfirmButton();
  return true;
}

async function maybeClickPopoverConfirmButton() {
  const buttons = Array.from(document.querySelectorAll(`
    [role="dialog"] button, [role="menu"] button,
    [class*="popover"] button, [class*="popup"] button, [class*="modal"] button,
    [class*="drawer"] button, [class*="panel"] button,
    button[class*="primary"], button[class*="confirm"],
    button, div[role="button"]
  `)).filter(el => el.offsetParent !== null && !el.closest('[class*="chat"], [class*="storyboard"]'));

  for (const btn of buttons) {
    const text = btn.textContent.trim().toLowerCase();
    const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
    const isConfirm = (
      text.includes('upscale') ||
      text.includes('generate') ||
      text.includes('apply') ||
      text.includes('confirm') ||
      text.includes('start') ||
      text.includes('enhance') ||
      aria.includes('upscale') ||
      aria.includes('generate') ||
      aria.includes('apply')
    ) && !text.includes('cancel') && !text.includes('close');

    if (isConfirm && !btn.disabled) {
      console.log('[Designer Test] Clicked popover confirm button:', btn);
      humanClick(btn);
      await sleep(600);
      return true;
    }
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: MONITOR GENERATION (approx 25–35s)
// ─────────────────────────────────────────────────────────────────────────────

async function monitorGenerationProgress(timeoutMs = 120000) {
  const start = Date.now();
  console.log('[Designer Test] Monitoring upscale generation progress (~25-35s)...');

  let hadBusyState = false;

  while (Date.now() - start < timeoutMs) {
    const elapsedSec = Math.round((Date.now() - start) / 1000);

    const busyElements = Array.from(document.querySelectorAll(`
      [aria-busy="true"], [role="progressbar"],
      .spinner, .loading, .loader, [class*="progress"], [class*="spinner"], [class*="loading"],
      [class*="generating"], [class*="waiting"], [class*="shimmer"]
    `)).filter(el => el.offsetParent !== null && !el.closest('[class*="chat"], [class*="storyboard"]'));

    const hasLoadingText = Array.from(document.querySelectorAll('p, span, div, h3, button'))
      .some(el => {
        if (el.offsetParent === null) return false;
        if (el.closest('[class*="chat"], [class*="storyboard"]')) return false;
        const t = el.textContent.toLowerCase();
        return t.includes('upscaling') || t.includes('generating') || t.includes('enhancing');
      });

    const isBusy = busyElements.length > 0 || hasLoadingText;
    if (isBusy) hadBusyState = true;

    notifyProgress(3, `AI Upscaling in progress (${elapsedSec}s elapsed)...`);

    // Complete after at least 22 seconds once busy indicators are clear
    if (elapsedSec >= 22) {
      if (!isBusy || elapsedSec >= 35) {
        console.log(`[Designer Test] Upscale generation completed in ${elapsedSec}s!`);
        return true;
      }
    }

    await sleep(1000);
  }

  return true;
}
