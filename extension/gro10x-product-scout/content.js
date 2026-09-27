/**
 * GRO10X Product Scout — Content Script v1.0
 * Universal e-commerce metadata extractor & scrolling capture assistant.
 */

// Helper to sanitize text
function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

// Universal E-Commerce Metadata Harvester
function extractProductData() {
  const url = window.location.href;
  const hostname = window.location.hostname.replace('www.', '');

  let title = '';
  let price = '';
  let currency = 'USD';
  let description = '';
  let imageUrls = [];
  let reviewsCount = 0;
  let starRating = 0;
  let tags = [];
  let sellerName = '';
  let productType = 'unknown';

  // 1. Title Extraction
  const titleSelectors = [
    'h1[data-buy-box-listing-title]',
    'h1.wt-text-body-01',
    '#productTitle',
    'h1.product-title',
    'h1.product_title',
    'h1.product-single__title',
    '[itemprop="name"]',
    'meta[property="og:title"]',
    'h1'
  ];

  for (const sel of titleSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      title = el.tagName === 'META' ? el.getAttribute('content') : cleanText(el.innerText || el.textContent);
      if (title) break;
    }
  }

  if (!title) {
    title = document.title ? cleanText(document.title.split('|')[0].split('-')[0]) : 'Untitled Product';
  }

  // 2. Price Extraction
  const priceSelectors = [
    'div[data-buy-box-region] .wt-text-title-larger',
    'div[data-buy-box-region] .wt-text-title-03',
    '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
    '#corePrice_feature_div .a-price .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.product__price',
    '.price--current',
    '.price .amount',
    '[itemprop="price"]',
    'meta[property="product:price:amount"]'
  ];

  for (const sel of priceSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const val = el.tagName === 'META' ? el.getAttribute('content') : cleanText(el.innerText || el.textContent);
      if (val) {
        price = val;
        break;
      }
    }
  }

  // Fallback regex search for price in buy box
  if (!price) {
    const buyBox = document.querySelector('[data-buy-box-region], #buybox, #centerCol, form[action*="/cart"]');
    if (buyBox) {
      const match = buyBox.innerText.match(/(\$|€|£|৳)\s?[\d,]+(\.\d{2})?/);
      if (match) price = match[0];
    }
  }

  // Detect currency
  if (price.includes('$')) currency = 'USD';
  else if (price.includes('€')) currency = 'EUR';
  else if (price.includes('£')) currency = 'GBP';
  else if (price.includes('৳') || price.toLowerCase().includes('bdt')) currency = 'BDT';

  // 3. Description Extraction
  const descSelectors = [
    '#wt-content-toggle-product-details-read-more',
    'div[data-id="description-text"]',
    '#productDescription',
    '#feature-bullets',
    '.product-single__description',
    '.woocommerce-product-details__short-description',
    '[itemprop="description"]',
    'meta[property="og:description"]',
    'meta[name="description"]'
  ];

  for (const sel of descSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const val = el.tagName === 'META' ? el.getAttribute('content') : cleanText(el.innerText || el.textContent);
      if (val && val.length > 20) {
        description = val.substring(0, 2000); // cap at 2000 chars
        break;
      }
    }
  }

  // 4. Image URLs Extraction
  const seenImages = new Set();
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
  if (ogImage) {
    seenImages.add(ogImage);
    imageUrls.push(ogImage);
  }

  // Platform specific high-res images
  const imgEls = document.querySelectorAll(`
    li[data-carousel-pagination-item] img,
    .image-carousel-container img,
    #main-image-container img,
    #imgTagWrapperId img,
    .product-single__photos img,
    .woocommerce-product-gallery img,
    img[data-src*="794xN"],
    img[data-src*="il_fullxfull"]
  `);

  imgEls.forEach(img => {
    let src = img.getAttribute('data-src') || img.getAttribute('data-full-image-href') || img.src;
    if (src && src.startsWith('http') && !seenImages.has(src) && !src.includes('avatar') && !src.includes('icon')) {
      seenImages.add(src);
      imageUrls.push(src);
    }
  });

  // Limit to top 8 distinct images
  imageUrls = imageUrls.slice(0, 8);

  // 5. Reviews Count & Star Rating
  // Reviews Count
  const reviewsSelectors = [
    'a[href*="#reviews"] span',
    '#acrCustomerReviewText',
    '.review-count',
    '[itemprop="reviewCount"]',
    '.wt-badge--notification-03'
  ];

  for (const sel of reviewsSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const txt = cleanText(el.innerText || el.textContent);
      const m = txt.replace(/,/g, '').match(/\d+/);
      if (m) {
        reviewsCount = parseInt(m[0], 10);
        break;
      }
    }
  }

  // Star Rating
  const ratingSelectors = [
    'input[name="rating"]',
    '#acrPopover span.a-icon-alt',
    '[itemprop="ratingValue"]',
    '.wt-rating'
  ];

  for (const sel of ratingSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const val = el.value || el.innerText || el.getAttribute('content') || '';
      const m = val.match(/\d+(\.\d+)?/);
      if (m) {
        starRating = parseFloat(m[0]);
        break;
      }
    }
  }

  // 6. Tags & Categories
  const tagEls = document.querySelectorAll(`
    #wt-content-toggle-tags-read-more a,
    .listing-page-tag-list a,
    #wayfinding-breadcrumbs_container a,
    .breadcrumbs a,
    nav.breadcrumb a
  `);

  tagEls.forEach(el => {
    const t = cleanText(el.innerText || el.textContent);
    if (t && t.length > 2 && t.length < 35 && !tags.includes(t)) {
      tags.push(t);
    }
  });

  // Meta keywords fallback
  if (tags.length === 0) {
    const kw = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
    if (kw) {
      tags = kw.split(',').map(s => cleanText(s)).filter(Boolean).slice(0, 15);
    }
  }

  // 7. Seller Name
  const sellerSelectors = [
    'a[href*="/shop/"]',
    '#bylineInfo',
    '#sellerProfileTriggerId',
    '.product-vendor',
    '[itemprop="brand"]'
  ];

  for (const sel of sellerSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const val = cleanText(el.innerText || el.textContent);
      if (val && val.length > 1 && val.length < 50) {
        sellerName = val;
        break;
      }
    }
  }

  // 8. Product Type Classifier
  const fullBodyText = (document.body.innerText || '').toLowerCase();
  if (
    fullBodyText.includes('digital download') ||
    fullBodyText.includes('instant download') ||
    fullBodyText.includes('printable') ||
    fullBodyText.includes('pdf template') ||
    fullBodyText.includes('canva template') ||
    fullBodyText.includes('goodnotes')
  ) {
    productType = 'digital';
  } else if (
    fullBodyText.includes('custom service') ||
    fullBodyText.includes('gig') ||
    fullBodyText.includes('consultation') ||
    fullBodyText.includes('done for you')
  ) {
    productType = 'service';
  } else if (
    fullBodyText.includes('shipping') ||
    fullBodyText.includes('ships from') ||
    fullBodyText.includes('handmade item') ||
    fullBodyText.includes('material:') ||
    fullBodyText.includes('inches')
  ) {
    productType = 'physical';
  }

  return {
    url,
    domain: hostname,
    product_title: title,
    price: price || 'N/A',
    currency,
    description,
    image_urls: imageUrls,
    reviews_count: reviewsCount,
    star_rating: starRating,
    tags: tags.slice(0, 15),
    seller_name: sellerName || hostname,
    product_type: productType
  };
}

// ── SCROLLING & CANVAS CAPTURE COORDINATOR ──
let originalScrollPos = 0;

async function prepareScrollCapture() {
  originalScrollPos = window.scrollY;

  // Smooth fast-scroll to trigger lazy images
  const totalHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight
  );

  const viewportHeight = window.innerHeight;
  const steps = Math.min(Math.ceil(totalHeight / viewportHeight), 12); // Max 12 scrolls to avoid excessive size

  // Fast scroll down
  for (let i = 0; i <= steps; i++) {
    window.scrollTo(0, Math.min(i * viewportHeight, totalHeight));
    await new Promise(r => setTimeout(r, 120));
  }

  // Return to top
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 200));

  return {
    totalHeight: Math.min(totalHeight, viewportHeight * 12),
    viewportHeight,
    viewportWidth: window.innerWidth,
    steps
  };
}

async function scrollToOffset(y) {
  window.scrollTo(0, y);
  await new Promise(r => setTimeout(r, 250)); // Wait for repaint
  return { currentY: window.scrollY };
}

function restoreScrollPosition() {
  window.scrollTo(0, originalScrollPos);
}

// Message Dispatcher
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_PRODUCT_DATA') {
    try {
      const data = extractProductData();
      sendResponse({ success: true, data });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  }

  if (request.action === 'PREPARE_SCROLL_CAPTURE') {
    prepareScrollCapture().then(metrics => {
      sendResponse({ success: true, metrics });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }

  if (request.action === 'SCROLL_TO_OFFSET') {
    scrollToOffset(request.y).then(res => {
      sendResponse({ success: true, res });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }

  if (request.action === 'RESTORE_SCROLL') {
    restoreScrollPosition();
    sendResponse({ success: true });
    return true;
  }
});
