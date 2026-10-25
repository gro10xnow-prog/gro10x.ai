/**
 * tools/gro10x-lead-harvester/content.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X WhatsApp LeadHarvester: Content Script Injection
 * Interacts with WhatsApp Web DOM to extract Group Info, Description & Members.
 */

console.log('⚡ [GRO10X LeadHarvester] Content script loaded into WhatsApp Web.');

let isScanning = false;
let shouldStop = false;

// ─────────────────────────────────────────────────────────────────────────────
// DOM Helpers & Robust Selectors
// ─────────────────────────────────────────────────────────────────────────────

function getActiveGroupHeader() {
  return document.querySelector('#main header') || document.querySelector('header');
}

function getGroupInfo() {
  const header = getActiveGroupHeader();
  if (!header) {
    return { isGroup: false, title: '', description: '', memberCountText: '' };
  }

  // 1. Group Title
  let title = '';
  const titleSpan = header.querySelector('div[role="button"] span[title]') ||
                    header.querySelector('span[title]') ||
                    header.querySelector('span[dir="auto"]');
  if (titleSpan) {
    title = titleSpan.getAttribute('title') || titleSpan.textContent.trim();
  }

  // 2. Subtitle / Member count text in header
  let memberCountText = '';
  const subtitleElem = header.querySelector('div[role="button"] ~ div span') ||
                       header.querySelector('span[title="click here for group info"]') ||
                       header.querySelector('span._amk6');
  if (subtitleElem) {
    memberCountText = subtitleElem.textContent.trim();
  }

  // 3. Group Description (from Right Sidebar if opened)
  let description = '';
  const descElem = document.querySelector('div[data-testid="group-info-description"] span') ||
                    document.querySelector('div[data-testid="chat-info-description"] span') ||
                    document.querySelector('span[data-testid="group-description"]') ||
                    document.querySelector('div._amk4 span');
  if (descElem) {
    description = descElem.getAttribute('title') || descElem.textContent.trim();
  }

  return {
    isGroup: true,
    title: title || 'Active WhatsApp Group',
    description: description || 'No description preview available',
    memberCountText
  };
}

/**
 * Triggers opening the Group Details sidebar if not currently visible
 */
async function ensureGroupDetailsOpen() {
  // Check if sidebar or modal already open
  const existingList = document.querySelector('div[role="dialog"]') ||
                       document.querySelector('div[data-testid="group-members-list"]') ||
                       document.querySelector('div[data-testid="group-info-drawer"]');
  if (existingList) return true;

  const header = getActiveGroupHeader();
  if (header) {
    const clickableArea = header.querySelector('div[role="button"]') || header;
    clickableArea.click();
    await delay(600);
    return true;
  }
  return false;
}

/**
 * If WhatsApp has a "View all" / "More" members button in the sidebar, click it to open full list modal
 */
async function ensureAllMembersModalOpen() {
  await ensureGroupDetailsOpen();
  await delay(400);

  // Look for "View all" / "more" button
  const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
  const viewAllBtn = buttons.find(b => {
    const text = (b.textContent || '').toLowerCase();
    return text.includes('view all') || text.includes('more members') || text.includes('আরও দেখুন') || text.includes('members');
  });

  if (viewAllBtn && !document.querySelector('div[role="dialog"]')) {
    try {
      viewAllBtn.click();
      await delay(500);
    } catch (_) {}
  }
}

/**
 * Locates the active scrollable container holding member rows
 */
function findMembersScrollContainer() {
  // Strategy 1: Modal dialog body
  const modal = document.querySelector('div[role="dialog"]');
  if (modal) {
    const scrollableInModal = Array.from(modal.querySelectorAll('div')).find(el => {
      const style = window.getComputedStyle(el);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
    });
    if (scrollableInModal) return scrollableInModal;
  }

  // Strategy 2: Any listitem parent with overflow
  const sampleItem = document.querySelector('div[role="listitem"]') || document.querySelector('div[data-testid="cell-frame-container"]');
  if (sampleItem) {
    let parent = sampleItem.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
        return parent;
      }
      parent = parent.parentElement;
    }
  }

  // Strategy 3: Standard WhatsApp list wrapper
  return document.querySelector('div[data-testid="group-members-list"]') ||
         document.querySelector('div[tabindex="0"]') ||
         document.querySelector('#app');
}

/**
 * Parses a single member DOM element
 */
function parseMemberElement(elem) {
  if (!elem) return null;

  const fullText = elem.textContent || '';

  // 1. Detect Admin status
  const isAdmin = /group admin|community admin|admin|গ্রুপ অ্যাডমিন/i.test(fullText) ||
                  Boolean(elem.querySelector('div[data-testid="admin-tag"], span[data-testid="admin-tag"]'));

  // 2. Extract Phone Number (Bangladeshi +880 or international format)
  const phoneMatch = fullText.match(/\+?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  let rawPhone = phoneMatch ? phoneMatch[0].trim() : '';
  const cleanPhone = rawPhone.replace(/[^\d+]/g, '');

  // 3. Extract Display Name & Pushname
  let displayName = '';
  const titleElem = elem.querySelector('span[title]') || elem.querySelector('span[dir="auto"]');
  if (titleElem) {
    displayName = titleElem.getAttribute('title') || titleElem.textContent.trim();
  }

  // Check for WhatsApp pushname (~Name)
  const pushMatch = fullText.match(/~([^•\n\r]+)/);
  if (pushMatch) {
    if (!displayName || displayName === rawPhone || /^\+?\d+$/.test(displayName.replace(/\D/g, ''))) {
      displayName = pushMatch[1].trim();
    }
  }

  // 4. Extract "About" status string
  let aboutText = '';
  const spans = Array.from(elem.querySelectorAll('span[title], span[dir="auto"]'));
  for (const s of spans) {
    const text = (s.getAttribute('title') || s.textContent || '').trim();
    if (text && text !== displayName && text !== rawPhone && !/admin|you/i.test(text)) {
      if (text.length > aboutText.length) {
        aboutText = text;
      }
    }
  }

  // Fallback name if still raw phone
  if (!displayName) {
    displayName = cleanPhone ? cleanPhone : 'WhatsApp Member';
  }

  return {
    name: displayName,
    phone: cleanPhone || rawPhone,
    about: aboutText,
    isAdmin
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Scanning & Auto-Scroll Engine
// ─────────────────────────────────────────────────────────────────────────────

async function executeScan(scrollDelay = 350) {
  if (isScanning) return;
  isScanning = true;
  shouldStop = false;

  const membersMap = new Map(); // phone/id -> Member

  try {
    // 1. Ensure modal or member list is visible
    await ensureAllMembersModalOpen();
    await delay(500);

    const container = findMembersScrollContainer();
    if (!container) {
      chrome.runtime.sendMessage({
        type: 'SCAN_ERROR',
        error: 'Could not find members scroll container. Please click on the Group Header to open Group Info.'
      });
      isScanning = false;
      return;
    }

    let lastScrollTop = -1;
    let stuckCount = 0;
    const maxStuck = 4;

    // Scroll to top first
    container.scrollTop = 0;
    await delay(250);

    while (!shouldStop) {
      // Collect visible items in current viewport
      const rows = container.querySelectorAll('div[role="listitem"], div[data-testid="cell-frame-container"]');
      
      rows.forEach(row => {
        const member = parseMemberElement(row);
        if (member && (member.phone || member.name)) {
          const key = member.phone || member.name;
          if (!membersMap.has(key)) {
            membersMap.set(key, member);
          } else {
            // Update with more detailed About if available
            const existing = membersMap.get(key);
            if (!existing.about && member.about) {
              existing.about = member.about;
            }
            if (member.isAdmin) existing.isAdmin = true;
          }
        }
      });

      // Send live progress
      chrome.runtime.sendMessage({
        type: 'SCAN_PROGRESS',
        count: membersMap.size
      });

      // Auto-scroll down
      const previous = container.scrollTop;
      container.scrollTop += 320;
      await delay(scrollDelay);

      // Check if reached the bottom
      if (container.scrollTop === previous || (container.scrollTop + container.clientHeight >= container.scrollHeight - 5)) {
        stuckCount++;
        if (stuckCount >= maxStuck) {
          console.log('⚡ [GRO10X LeadHarvester] Bottom of member list reached.');
          break;
        }
      } else {
        stuckCount = 0;
      }
    }

    const finalMembers = Array.from(membersMap.values());

    chrome.runtime.sendMessage({
      type: 'SCAN_COMPLETE',
      count: finalMembers.length,
      members: finalMembers
    });

  } catch (err) {
    console.error('[GRO10X LeadHarvester] Scan error:', err);
    chrome.runtime.sendMessage({
      type: 'SCAN_ERROR',
      error: err.message
    });
  } finally {
    isScanning = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Message Listener from Popup
// ─────────────────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_GROUP_INFO') {
    const info = getGroupInfo();
    sendResponse(info);
    return true;
  }

  if (request.type === 'START_SCAN') {
    executeScan(request.scrollDelay || 350);
    sendResponse({ ok: true, status: 'Scanning initiated' });
    return true;
  }

  if (request.type === 'STOP_SCAN') {
    shouldStop = true;
    sendResponse({ ok: true, status: 'Stop signal acknowledged' });
    return true;
  }
});
