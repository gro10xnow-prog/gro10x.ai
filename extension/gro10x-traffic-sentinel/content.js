/**
 * extension/gro10x-traffic-sentinel/content.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Content script for automated Facebook Traffic Group post capture.
 * - Monitors group feeds via MutationObserver + periodic fallback polling.
 * - Extracts post text, canonical URL, author, and timestamp using semantic ARIA selectors.
 * - Enforces local deduplication using chrome.storage.local.
 * - Dispatches verified new posts to the backend API route with x-api-key header.
 * ─────────────────────────────────────────────────────────────────────────────
 */

console.log('[GRO10X Traffic Sentinel] Content script loaded on:', window.location.href);

let isMonitoringActive = false;
let backendApiUrl = 'http://localhost:3000/api/traffic';
let apiSecretKey = '';
let targetChatId = '';
let processedPostIds = new Set();
let observer = null;
let pollInterval = null;
let isProcessingBatch = false;

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION & SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

async function init() {
  const data = await chrome.storage.local.get([
    'monitoringActive',
    'backendApiUrl',
    'apiSecretKey',
    'targetChatId',
    'processedPostIds'
  ]);

  isMonitoringActive = data.monitoringActive !== undefined ? data.monitoringActive : false;
  backendApiUrl = data.backendApiUrl || 'http://localhost:3000/api/traffic';
  apiSecretKey = data.apiSecretKey || 'traffic_sec_gro10x_2026';
  targetChatId = data.targetChatId || '7754769807';

  if (!data.apiSecretKey || !data.targetChatId || !data.backendApiUrl) {
    chrome.storage.local.set({
      backendApiUrl,
      apiSecretKey,
      targetChatId
    });
  }

  if (Array.isArray(data.processedPostIds)) {
    processedPostIds = new Set(data.processedPostIds);
  }

  console.log(`[Traffic Sentinel] Loaded state: monitoringActive=${isMonitoringActive}, cachedPosts=${processedPostIds.size}`);

  if (isMonitoringActive) {
    startMonitoring();
  }

  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_UPDATED') {
      isMonitoringActive = Boolean(message.monitoringActive);
      backendApiUrl = message.backendApiUrl || backendApiUrl;
      apiSecretKey = message.apiSecretKey || apiSecretKey;
      targetChatId = message.targetChatId || targetChatId;

      if (isMonitoringActive) {
        startMonitoring();
      } else {
        stopMonitoring();
      }
      sendResponse({ success: true, isMonitoringActive });
      return true;
    }

    if (message.type === 'SCAN_FEED_NOW') {
      scanFeedForNewPosts().then(count => {
        sendResponse({ success: true, capturedCount: count });
      });
      return true;
    }

    if (message.type === 'GET_STATUS') {
      sendResponse({
        isMonitoringActive,
        cachedCount: processedPostIds.size,
        currentUrl: window.location.href,
        isChronological: window.location.href.includes('sorting_setting=CHRONOLOGICAL')
      });
      return true;
    }
  });

  // Suggest chronological sorting if on a group home
  checkChronologicalSorting();
}

function checkChronologicalSorting() {
  const url = window.location.href;
  if (url.includes('/groups/') && !url.includes('sorting_setting=CHRONOLOGICAL') && !url.includes('/posts/')) {
    console.warn('[Traffic Sentinel] Pro-tip: For real-time live traffic alerts, append "?sorting_setting=CHRONOLOGICAL" to the group URL.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MONITORING CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

function broadcastLog(message, type = 'info') {
  const time = new Date().toLocaleTimeString();
  chrome.runtime.sendMessage({
    type: 'ADD_LOG_ENTRY',
    log: { time, message, type }
  }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
// MONITORING CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

function startMonitoring() {
  console.log('[Traffic Sentinel] Starting feed monitor...');
  broadcastLog('🟢 Live feed observer started. Monitoring active.', 'success');
  if (observer) observer.disconnect();

  const feedContainer = document.querySelector('div[role="feed"]') || document.querySelector('div[role="main"]') || document.body;

  let debounceTimer = null;
  observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      broadcastLog('⚡ Feed scrolled or updated. Scanning for new posts...', 'info');
      scanFeedForNewPosts();
    }, 1500);
  });

  observer.observe(feedContainer, {
    childList: true,
    subtree: true
  });

  // Fallback interval polling every 25 seconds
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(() => {
    broadcastLog('⏱️ Background timer (25s): checking feed for new posts...', 'info');
    scanFeedForNewPosts();
  }, 25000);

  // Initial immediate scan
  scanFeedForNewPosts();
}

function stopMonitoring() {
  console.log('[Traffic Sentinel] Monitoring stopped.');
  broadcastLog('⏸️ Live feed monitoring paused.', 'warn');
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM EXTRACTION & CLEANING
// ─────────────────────────────────────────────────────────────────────────────

async function scanFeedForNewPosts() {
  if (isProcessingBatch) return 0;
  isProcessingBatch = true;

  try {
    const articleElements = Array.from(document.querySelectorAll('div[role="article"], div[data-pagelet*="FeedUnit"]'));
    let newPostsFound = 0;

    if (articleElements.length === 0) {
      broadcastLog('Scanning feed... (0 feed posts detected on screen, scroll down to load posts)', 'info');
      return 0;
    }

    for (const article of articleElements) {
      const parsedPost = extractPostDetails(article);
      if (!parsedPost) continue;

      if (processedPostIds.has(parsedPost.postId)) {
        continue;
      }

      console.log('[Traffic Sentinel] 🚨 New Post Detected:', parsedPost.author, parsedPost.postId);
      broadcastLog(`🚨 New post detected by "${parsedPost.author}". Forwarding to AI backend...`, 'info');

      // IMMEDIATE DEDUPLICATION: Mark as processed before network call to prevent duplicate scans
      processedPostIds.add(parsedPost.postId);
      await persistProcessedPostId(parsedPost.postId);
      newPostsFound++;

      // Dispatch to Backend API via background proxy
      const res = await dispatchPostToBackend(parsedPost);
      if (res && res.success) {
        broadcastLog(`✓ Post (${parsedPost.postId}) delivered & analyzed.`, 'success');
      } else {
        console.warn('[Traffic Sentinel] Dispatch warning/unconfirmed for post:', parsedPost.postId);
        broadcastLog(`✓ Post (${parsedPost.postId}) forwarded to background.`, 'info');
      }

      // Paced delay between network dispatches to stay well within Gemini RPM limits
      await new Promise(r => setTimeout(r, 1200));
    }

    broadcastLog(`Feed check complete: ${articleElements.length} post(s) checked. ${newPostsFound} new dispatched.`, newPostsFound > 0 ? 'success' : 'info');
    return newPostsFound;
  } catch (err) {
    console.error('[Traffic Sentinel] Error during feed scan:', err);
    broadcastLog('Error during feed scan: ' + err.message, 'error');
    return 0;
  } finally {
    isProcessingBatch = false;
  }
}

function extractPostDetails(article) {
  // 1. Extract Post Link & Post ID
  const permalinkAnchor = article.querySelector(`
    a[href*="/posts/"], a[href*="/permalink/"], a[href*="story_fbid="],
    a[href*="/videos/"], a[href*="/photos/"]
  `);

  let postUrl = '';
  let postId = '';

  if (permalinkAnchor && permalinkAnchor.href) {
    postUrl = cleanFacebookUrl(permalinkAnchor.href);
    postId = extractPostIdFromUrl(postUrl);
  }

  // 2. Extract Text Content (Semantic dir="auto" excluding UI buttons)
  const textContainers = Array.from(article.querySelectorAll('div[dir="auto"], span[dir="auto"]')).filter(el => {
    // Filter out toolbar buttons, reactions, and comment inputs
    if (el.closest('[role="toolbar"], [role="button"], form, input, textarea')) return false;
    const txt = el.textContent.trim();
    // Exclude common Facebook UI labels
    if (/^(Like|Comment|Share|Reply|Write a comment|View more comments|Top fan|Author|Admin|Public group|Suggested for you)$/i.test(txt)) return false;
    return txt.length > 5;
  });

  // Deduplicate and combine text paragraphs
  const uniqueTextLines = [];
  const seenLines = new Set();
  for (const el of textContainers) {
    const line = el.innerText ? el.innerText.trim() : el.textContent.trim();
    if (line.length > 5 && !seenLines.has(line)) {
      seenLines.add(line);
      uniqueTextLines.push(line);
    }
  }

  const fullText = uniqueTextLines.join('\n').trim();

  // Require at least 15 characters of content
  if (!fullText || fullText.length < 15) {
    return null;
  }

  // 3. Extract Author
  let author = 'Facebook User';
  const authorEl = article.querySelector('h2 a, h3 a, h4 a, strong a, [role="heading"] a');
  if (authorEl && authorEl.textContent.trim()) {
    author = authorEl.textContent.trim();
  }

  // Fallback post ID based on author + text snippet if no permalink found
  if (!postId) {
    postId = 'hash_' + hashString(author + '_' + fullText.slice(0, 100));
    postUrl = window.location.href;
  }

  return {
    postId,
    text: fullText,
    postUrl,
    author,
    timestamp: new Date().toISOString(),
    capturedAt: Date.now(),
    groupUrl: window.location.origin + window.location.pathname
  };
}

function cleanFacebookUrl(rawUrl) {
  try {
    const u = new URL(rawUrl, window.location.origin);
    const cleanU = new URL(u.origin + u.pathname);
    // Retain story_fbid and id query parameters if permalink requires them
    if (u.searchParams.has('story_fbid')) {
      cleanU.searchParams.set('story_fbid', u.searchParams.get('story_fbid'));
    }
    if (u.searchParams.has('id')) {
      cleanU.searchParams.set('id', u.searchParams.get('id'));
    }
    return cleanU.toString();
  } catch (_) {
    return rawUrl.split('?')[0];
  }
}

function extractPostIdFromUrl(url) {
  const matchPosts = url.match(/\/posts\/([a-zA-Z0-9_\-]+)/);
  if (matchPosts && matchPosts[1]) return matchPosts[1];

  const matchPermalink = url.match(/\/permalink\/([a-zA-Z0-9_\-]+)/);
  if (matchPermalink && matchPermalink[1]) return matchPermalink[1];

  const matchFbid = url.match(/story_fbid=([a-zA-Z0-9_\-]+)/);
  if (matchFbid && matchFbid[1]) return matchFbid[1];

  return '';
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL DEDUPLICATION PERSISTENCE
// ─────────────────────────────────────────────────────────────────────────────

async function persistProcessedPostId(postId) {
  try {
    const data = await chrome.storage.local.get('processedPostIds');
    let list = Array.isArray(data.processedPostIds) ? data.processedPostIds : [];
    list.push(postId);
    // Keep last 600 post IDs in storage
    if (list.length > 600) {
      list = list.slice(list.length - 600);
    }
    await chrome.storage.local.set({ processedPostIds: list });
  } catch (err) {
    console.warn('[Traffic Sentinel] Failed to save processed post ID:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPATCH TO BACKEND API
// ─────────────────────────────────────────────────────────────────────────────

async function dispatchPostToBackend(postData) {
  try {
    console.log(`[Traffic Sentinel] 🚀 Delegating post ${postData.postId} to background service worker...`);

    const res = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'DISPATCH_POST_TO_BACKEND',
        postData
      }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { success: true });
        }
      });
    });

    if (!res || !res.success) {
      throw new Error(res?.error || 'Failed to dispatch from background');
    }

    console.log('[Traffic Sentinel] ✓ Backend dispatch completed:', res.result);
    return res.result;

  } catch (err) {
    console.error('[Traffic Sentinel] Failed to forward post to backend:', err);
    await chrome.storage.local.set({
      lastCapturedPost: {
        ...postData,
        status: 'Error: ' + err.message
      }
    });
  }
}

// Start on load
init();
