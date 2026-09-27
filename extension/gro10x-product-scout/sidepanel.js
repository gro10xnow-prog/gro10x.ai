/**
 * GRO10X Product Scout — Side Panel Script v1.0
 * Coordinates tab scraping, full-page screenshot canvas stitching, and Supabase cloud sync.
 */

const DEFAULT_SUPABASE_URL = 'https://rlgsckzqieikjercfwan.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZ3Nja3pxaWVpa2plcmNmd2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODEyMDYsImV4cCI6MjEwMzE1NzIwNn0.1do3cy6Dg_-l_uK-MeLxe5E6z85aL496tlxAya23ljc';

let config = {
  supabaseUrl: DEFAULT_SUPABASE_URL,
  supabaseKey: DEFAULT_SUPABASE_KEY,
  userName: 'DBM Member'
};

let captureMode = 'scroll'; // 'scroll' or 'viewport'
let currentActiveTab = null;

// UI Elements
const userEmailBadge = document.getElementById('userEmailBadge');
const btnToggleSettings = document.getElementById('btnToggleSettings');
const settingsDrawer = document.getElementById('settingsDrawer');
const settingUserName = document.getElementById('settingUserName');
const settingSupabaseUrl = document.getElementById('settingSupabaseUrl');
const settingSupabaseKey = document.getElementById('settingSupabaseKey');
const btnSaveSettings = document.getElementById('btnSaveSettings');

const activeDomainBadge = document.getElementById('activeDomainBadge');
const activePageTitle = document.getElementById('activePageTitle');
const btnModeScroll = document.getElementById('btnModeScroll');
const btnModeViewport = document.getElementById('btnModeViewport');
const btnCaptureProduct = document.getElementById('btnCaptureProduct');
const btnCaptureIcon = document.getElementById('btnCaptureIcon');
const btnCaptureText = document.getElementById('btnCaptureText');
const statusBanner = document.getElementById('statusBanner');

const previewCard = document.getElementById('previewCard');
const previewImage = document.getElementById('previewImage');
const previewTitle = document.getElementById('previewTitle');
const previewPrice = document.getElementById('previewPrice');
const previewSeller = document.getElementById('previewSeller');
const previewTypeBadge = document.getElementById('previewTypeBadge');
const previewTags = document.getElementById('previewTags');

const recentCapturesList = document.getElementById('recentCapturesList');
const btnRefreshRecent = document.getElementById('btnRefreshRecent');

// ── INITIALIZATION ──
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
  updateActiveTabInfo();
  loadRecentCaptures();

  // Listen for tab switches
  chrome.tabs.onActivated.addListener(() => {
    updateActiveTabInfo();
  });
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
      updateActiveTabInfo();
    }
  });
});

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['supabaseUrl', 'supabaseKey', 'userName'], (data) => {
      config.supabaseUrl = data.supabaseUrl || DEFAULT_SUPABASE_URL;
      config.supabaseKey = data.supabaseKey || DEFAULT_SUPABASE_KEY;
      config.userName = data.userName || 'DBM Member';

      settingSupabaseUrl.value = config.supabaseUrl;
      settingSupabaseKey.value = config.supabaseKey;
      settingUserName.value = config.userName;
      userEmailBadge.textContent = config.userName;
      resolve();
    });
  });
}

function setupEventListeners() {
  btnToggleSettings.addEventListener('click', () => {
    settingsDrawer.style.display = settingsDrawer.style.display === 'none' ? 'block' : 'none';
  });

  btnSaveSettings.addEventListener('click', () => {
    config.supabaseUrl = settingSupabaseUrl.value.trim() || DEFAULT_SUPABASE_URL;
    config.supabaseKey = settingSupabaseKey.value.trim() || DEFAULT_SUPABASE_KEY;
    config.userName = settingUserName.value.trim() || 'DBM Member';

    chrome.storage.local.set(config, () => {
      userEmailBadge.textContent = config.userName;
      settingsDrawer.style.display = 'none';
      showStatus('Configuration saved!', 'success');
      loadRecentCaptures();
    });
  });

  btnModeScroll.addEventListener('click', () => {
    captureMode = 'scroll';
    btnModeScroll.classList.add('active');
    btnModeViewport.classList.remove('active');
  });

  btnModeViewport.addEventListener('click', () => {
    captureMode = 'viewport';
    btnModeViewport.classList.add('active');
    btnModeScroll.classList.remove('active');
  });

  btnCaptureProduct.addEventListener('click', () => {
    executeProductCapture();
  });

  btnRefreshRecent.addEventListener('click', () => {
    loadRecentCaptures();
  });
}

async function updateActiveTabInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      currentActiveTab = tabs[0];
      try {
        const urlObj = new URL(currentActiveTab.url || '');
        const domain = urlObj.hostname.replace('www.', '');
        activeDomainBadge.textContent = `🌐 ${domain}`;
        activePageTitle.textContent = currentActiveTab.title || currentActiveTab.url || 'Active Tab';
      } catch (e) {
        activeDomainBadge.textContent = '🌐 Web Page';
        activePageTitle.textContent = currentActiveTab.title || 'Ready to capture';
      }
    }
  });
}

function showStatus(text, type = 'info') {
  statusBanner.style.display = 'block';
  statusBanner.className = `status-banner ${type === 'error' ? 'error' : ''}`;
  statusBanner.innerHTML = text;
}

function setCapturing(isCapturing, stepText = 'Capturing...') {
  btnCaptureProduct.disabled = isCapturing;
  if (isCapturing) {
    btnCaptureIcon.innerHTML = '<span class="spinner"></span>';
    btnCaptureText.textContent = stepText;
  } else {
    btnCaptureIcon.innerHTML = '📸';
    btnCaptureText.textContent = 'Capture This Product';
  }
}

// Helper: Convert DataURL to Blob
function dataURLtoBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// ── CORE CAPTURE WORKFLOW ──
async function executeProductCapture() {
  if (!currentActiveTab || !currentActiveTab.id) {
    showStatus('No active tab detected.', 'error');
    return;
  }

  // Skip chrome:// or extension pages
  if (currentActiveTab.url.startsWith('chrome://') || currentActiveTab.url.startsWith('edge://')) {
    showStatus('Cannot capture browser internal pages.', 'error');
    return;
  }

  setCapturing(true, 'Extracting data...');
  showStatus('⏳ Step 1/4: Harvesting product metadata & tags...');

  try {
    // 1. Extract metadata from content script
    let productData = null;
    try {
      const response = await chrome.tabs.sendMessage(currentActiveTab.id, { action: 'EXTRACT_PRODUCT_DATA' });
      if (response && response.success) {
        productData = response.data;
      }
    } catch (e) {
      // Content script may not be injected yet, try to execute it
      await chrome.scripting.executeScript({
        target: { tabId: currentActiveTab.id },
        files: ['content.js']
      });
      await new Promise(r => setTimeout(r, 150));
      const response = await chrome.tabs.sendMessage(currentActiveTab.id, { action: 'EXTRACT_PRODUCT_DATA' });
      if (response && response.success) productData = response.data;
    }

    if (!productData) {
      productData = {
        url: currentActiveTab.url,
        domain: new URL(currentActiveTab.url).hostname.replace('www.', ''),
        product_title: currentActiveTab.title || 'Untitled Product',
        price: 'N/A',
        currency: 'USD',
        description: '',
        image_urls: [],
        reviews_count: 0,
        star_rating: 0,
        tags: [],
        seller_name: '',
        product_type: 'unknown'
      };
    }

    // 2. Capture Screenshot (Scrolling or Viewport)
    let screenshotBlob = null;

    if (captureMode === 'scroll') {
      setCapturing(true, 'Auto-scrolling page...');
      showStatus('⏳ Step 2/4: Smooth scrolling page to harvest full visual layout...');

      const prepRes = await chrome.tabs.sendMessage(currentActiveTab.id, { action: 'PREPARE_SCROLL_CAPTURE' });
      const metrics = prepRes?.metrics || { steps: 2, viewportHeight: 800, viewportWidth: 1200, totalHeight: 1600 };

      // Build canvas
      const canvas = document.createElement('canvas');
      canvas.width = metrics.viewportWidth;
      canvas.height = metrics.totalHeight;
      const ctx = canvas.getContext('2d');

      for (let s = 0; s <= metrics.steps; s++) {
        const yOffset = s * metrics.viewportHeight;
        if (yOffset >= metrics.totalHeight) break;

        showStatus(`⏳ Step 2/4: Capturing segment ${s + 1}/${metrics.steps + 1}...`);
        await chrome.tabs.sendMessage(currentActiveTab.id, { action: 'SCROLL_TO_OFFSET', y: yOffset });

        // Capture visible frame via background service worker
        const capRes = await chrome.runtime.sendMessage({ type: 'CAPTURE_VISIBLE_TAB' });
        if (capRes && capRes.success && capRes.dataUrl) {
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, yOffset, metrics.viewportWidth, metrics.viewportHeight);
              resolve();
            };
            img.src = capRes.dataUrl;
          });
        }
      }

      // Restore scroll
      await chrome.tabs.sendMessage(currentActiveTab.id, { action: 'RESTORE_SCROLL' }).catch(() => {});

      screenshotBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    } else {
      // Viewport mode
      showStatus('⏳ Step 2/4: Capturing viewport snapshot...');
      const capRes = await chrome.runtime.sendMessage({ type: 'CAPTURE_VISIBLE_TAB' });
      if (capRes && capRes.success && capRes.dataUrl) {
        screenshotBlob = dataURLtoBlob(capRes.dataUrl);
      }
    }

    // 3. Upload Screenshot to Supabase Storage
    let screenshotUrl = null;
    if (screenshotBlob && config.supabaseUrl && config.supabaseKey) {
      setCapturing(true, 'Uploading screenshot...');
      showStatus('⏳ Step 3/4: Uploading high-res screenshot to Supabase Vault...');

      const filename = `scout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.png`;
      const uploadEndpoint = `${config.supabaseUrl}/storage/v1/object/product-screenshots/${filename}`;

      try {
        const uploadRes = await fetch(uploadEndpoint, {
          method: 'POST',
          headers: {
            'apikey': config.supabaseKey,
            'Authorization': `Bearer ${config.supabaseKey}`,
            'Content-Type': 'image/png',
            'x-upsert': 'true'
          },
          body: screenshotBlob
        });

        if (uploadRes.ok) {
          screenshotUrl = `${config.supabaseUrl}/storage/v1/object/public/product-screenshots/${filename}`;
        } else {
          console.warn('Storage upload error:', await uploadRes.text());
        }
      } catch (uploadErr) {
        console.warn('Screenshot upload fetch error:', uploadErr);
      }
    }

    // 4. Save to Supabase `product_suggestions`
    setCapturing(true, 'Syncing to Supabase...');
    showStatus('⏳ Step 4/4: Writing record to Product Suggestions registry...');

    const suggestionPayload = {
      url: productData.url,
      domain: productData.domain,
      product_title: productData.product_title,
      price: productData.price,
      currency: productData.currency || 'USD',
      description: productData.description,
      image_urls: productData.image_urls,
      reviews_count: productData.reviews_count || 0,
      star_rating: productData.star_rating || 0.0,
      tags: productData.tags,
      seller_name: productData.seller_name,
      product_type: productData.product_type,
      screenshot_url: screenshotUrl,
      raw_data: productData,
      captured_by: config.userName,
      status: 'suggestion'
    };

    let savedToCloud = false;
    try {
      const dbEndpoint = `${config.supabaseUrl}/rest/v1/product_suggestions`;
      const insertRes = await fetch(dbEndpoint, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(suggestionPayload)
      });

      if (insertRes.ok) {
        savedToCloud = true;
      } else {
        console.warn('Supabase DB table not yet created, saving locally:', await insertRes.text());
      }
    } catch (dbErr) {
      console.warn('Supabase DB error:', dbErr);
    }

    // Also sync to local backend if running
    try {
      await fetch('http://localhost:3000/api/brands/product-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestionPayload)
      });
    } catch (e) {}

    // Always cache in chrome.storage.local
    await new Promise(resolve => {
      chrome.storage.local.get(['cached_suggestions'], (res) => {
        const list = res.cached_suggestions || [];
        list.unshift({ ...suggestionPayload, id: 'local_' + Date.now(), created_at: new Date().toISOString() });
        chrome.storage.local.set({ cached_suggestions: list.slice(0, 30) }, resolve);
      });
    });

    // Success notification
    if (savedToCloud) {
      showStatus('🎉 Product captured &amp; synced to Supabase Suggestions queue!', 'success');
    } else {
      showStatus('🎉 Product captured successfully! (Saved to local queue — run Supabase SQL migration to sync cloud)', 'success');
    }

    renderPreviewCard(productData, screenshotUrl);
    loadRecentCaptures();

  } catch (err) {
    console.error('[Scout Capture Error]:', err);
    showStatus(`❌ Capture failed: ${err.message}`, 'error');
  } finally {
    setCapturing(false);
  }
}

function renderPreviewCard(data, screenshotUrl) {
  previewCard.style.display = 'block';
  previewTitle.textContent = data.product_title || 'Untitled Product';
  previewPrice.textContent = data.price || 'N/A';
  previewSeller.textContent = `Seller: ${data.seller_name || data.domain}`;
  previewTypeBadge.textContent = `📦 ${(data.product_type || 'Product').toUpperCase()}`;

  // Use hero image or screenshot as preview
  const imgUrl = (data.image_urls && data.image_urls[0]) || screenshotUrl || '';
  if (imgUrl) {
    previewImage.src = imgUrl;
    previewImage.style.display = 'block';
  } else {
    previewImage.style.display = 'none';
  }

  // Tags
  if (data.tags && data.tags.length > 0) {
    previewTags.innerHTML = data.tags.slice(0, 6).map(t =>
      `<span style="font-size:0.65rem; background:rgba(255,255,255,0.06); padding:0.15rem 0.4rem; border-radius:4px; color:#cbd5e1;">#${t}</span>`
    ).join('');
  } else {
    previewTags.innerHTML = '';
  }
}

// ── RECENT CAPTURES FEED ──
async function loadRecentCaptures() {
  let items = [];

  // Try fetching from Supabase first
  if (config.supabaseUrl && config.supabaseKey) {
    try {
      const endpoint = `${config.supabaseUrl}/rest/v1/product_suggestions?select=*&order=created_at.desc&limit=10`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`
        }
      });

      if (res.ok) {
        items = await res.json();
      }
    } catch (e) {}
  }

  // Fallback to chrome.storage.local if Supabase table is not yet created
  if (!items || items.length === 0) {
    items = await new Promise(resolve => {
      chrome.storage.local.get(['cached_suggestions'], (res) => {
        resolve(res.cached_suggestions || []);
      });
    });
  }

  if (!items || items.length === 0) {
    recentCapturesList.innerHTML = `
      <div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.75rem;">
        No products captured yet.<br>Click "Capture This Product" on any e-commerce page to start!
      </div>
    `;
    return;
  }

  recentCapturesList.innerHTML = items.map(item => {
    const thumb = (item.image_urls && item.image_urls[0]) || item.screenshot_url || '';
    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent';

    return `
      <a href="${item.url}" target="_blank" class="recent-item">
        ${thumb ? `<img src="${thumb}" class="recent-thumb" alt="Thumb" onerror="this.style.display='none'">` : '<div class="recent-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📦</div>'}
        <div class="recent-content">
          <div class="recent-item-title" title="${item.product_title || ''}">${item.product_title || 'Untitled Product'}</div>
          <div class="recent-meta">
            <span class="recent-price">${item.price || 'N/A'}</span>
            <span>${item.domain || 'web'} · ${dateStr}</span>
          </div>
          <div style="font-size:0.65rem; color:var(--accent-purple); margin-top:0.2rem;">
            👤 ${item.captured_by || 'Team'} · <span style="color:#00df89;">${item.status || 'suggestion'}</span>
          </div>
        </div>
      </a>
    `;
  }).join('');
}
