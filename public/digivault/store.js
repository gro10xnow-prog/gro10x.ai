/**
 * public/digivault/store.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DigiVault — Public Customer Storefront Engine v1.0
 * 
 * Features:
 * - 🌐 Instant Bilingual Translation (EN / বাংলা)
 * - 📦 Real-Time Product Catalog & Search
 * - 🔗 Automated UTM & Campaign Deep-Link Tracking
 * - 🛒 Seamless Checkout & bKash / Nagad Payment Upload
 * - 🔍 Public Order Tracking & Verification Timeline
 * ─────────────────────────────────────────────────────────────────────────────
 */

const DIGIVAULT_CONFIG = {
  apiBase: '/api/digistore',
  bkashNumber: '01711019550',
  nagadNumber: '01711019550',
  whatsappNumber: '+880 1889-825025',
  telegramBot: 'Digivault20bot'
};

// Bilingual Strings
const DV_I18N = {
  en: {
    brandTag: 'DIGIVAULT BD',
    navHome: 'Home',
    navCatalog: 'Catalog',
    navTrack: 'Track Order',
    navBot: 'Telegram Bot',
    heroTitle: 'Premium Digital Subscriptions in Bangladesh',
    heroSubtitle: 'Access world-class AI tools, streaming, creative suites, and professional software with instant verification and full warranty.',
    btnBrowse: '🛒 Browse Catalog',
    btnTelegram: '📱 Order via Telegram Bot',
    heroSpotlightBadge: '⭐ BEST SELLER HERO DEAL',
    heroSpotlightTitle: 'Gemini Pro 18 Months Admin Account + VEO 3 Pro',
    heroSpotlightDesc: 'Full 18 months Google Gemini Pro Advanced access with VEO 3 Pro generative AI video. 100% private admin account.',
    heroSpotlightPrice: '৳2,000 BDT',
    btnOrderNow: 'Order Now',
    catAll: 'All Products',
    catAI: '🤖 AI Tools',
    catStreaming: '🎬 Streaming',
    catMusic: '🎵 Music',
    catCreative: '🎨 Creative',
    catCloud: '💼 Cloud & Office',
    catCareer: '🚀 Career & LinkedIn',
    catCourses: '📚 Courses',
    catVPN: '🔒 VPN',
    searchPlaceholder: 'Search 45+ subscriptions (e.g. Netflix, Gemini, ChatGPT)...',
    trustTitle1: '⚡ Instant Fulfillment',
    trustDesc1: 'Credentials delivered to your inbox/Telegram within 15-30 minutes.',
    trustTitle2: '🔒 100% Private & Safe',
    trustDesc2: 'No shared email risks. Private profiles and official family slots.',
    trustTitle3: '🛡️ Full Period Warranty',
    trustDesc3: '100% replacement warranty throughout your active subscription.',
    trustTitle4: '💳 bKash / Nagad Native',
    trustDesc4: 'Fast, secure local mobile payments with instant screenshot upload.',
    footerText: '© 2026 DigiVault BD. An institutional brand of GRO10X Operating System.',
    orderModalTitle: 'Place Your Subscription Order',
    lblFullName: 'Full Name',
    lblContact: 'Mobile Number',
    lblWhatsapp: 'WhatsApp Number',
    lblChannel: 'Preferred Delivery Channel',
    lblPayMethod: 'Payment Method',
    lblPayFrom: 'Sender Account No. (Optional)',
    lblTrxId: 'bKash / Nagad Transaction ID (Optional)',
    lblScreenshot: 'Payment Screenshot',
    btnSubmitOrder: 'Confirm & Place Order',
    orderSuccessTitle: 'Order Placed Successfully!',
    orderRefLabel: 'Order Reference',
    payNotice: 'Please Send Money to:',
    trackTitle: 'Track Your Subscription Order',
    trackSubtitle: 'Enter your order reference (e.g. DIGI-102938) to check payment and delivery status.',
    btnTrack: 'Check Status',
    statusPendingPay: '⏳ Awaiting Payment Verification',
    statusVerified: '✅ Payment Verified — Processing Delivery',
    statusDelivered: '🔑 Delivered & Active',
    statusRejected: '❌ Payment Rejected',
    orderReviewTitle: 'Order Review',
    lblConfirmOrder: 'Confirm Order',
    lblEditOrder: 'Edit Details',
    errOrderNotFound: 'Order not found. Please verify your reference number.',
    btnSupportWhatsApp: 'Contact WhatsApp Support',
    pqBannerBadge: '👑 GRO10X FLAGSHIP DIGITAL PRODUCT',
    pqBannerTitle: 'PlannerQueen™ 2026 Daily & Weekly System',
    pqBannerDesc: 'Hyperlinked interactive digital planning system for iPad, tablets, and desktop, plus luxury hardcover spiral edition. Includes 450+ hyperlinked spreads, finance trackers, and GoodNotes / Notion integration.',
    pqBadgeUpdates: 'Lifetime 2026 Updates',
    pqBadgeSpreads: '✨ 450+ Hyperlinked Spreads',
    pqBadgeInteractive: '📱 Interactive Web App',
    pqBadgeLicense: '🔒 Instant Cryptographic License',
    pqPriceLabel: 'Special Direct Price:',
    pqBtnStore: '🛍️ Order on PlannerQueen Store',
    pqBtnDemo: '✨ Try Live App Demo',
    pqBtnTrack: 'Track',
    backToCatalog: '← Back to Catalog',
    totalPayable: 'Total Payable Amount:',
    fullWarrantyInc: '✅ Full Period Warranty Included',
    durationLabel: 'Duration:',
    deliveryNoticeDefault: 'Credentials will be dispatched within 15-30 minutes after payment verification.',
    lblPaySendMoney: 'Send Money to:',
    sendInstruction: 'Send exact amount via bKash or Nagad Personal (Send Money), then provide your sender number or TrxID below:',
    copiedToast: 'Number copied to clipboard!',
    step1Select: '1. Select Payment Method',
    step2Send: '2. Send Money',
    step3Verify: '3. Verification Details',
    trackOrderNotFound: 'Order Not Found',
    trackOrderNotFoundDesc: 'Please verify your order reference number (e.g. DIGI-123456).',
    viewCatalog: '🛒 View Catalog',
    statusClosed: '✅ Activation Confirmed & Order Completed',
    statusDeliveredBanner: '🔑 Delivered! Your credentials or access link are ready below',
    statusProcuring: '⏳ Processing & Procuring Account',
    etaTitle: 'Delivery Tracking: In Progress',
    etaMinutes: '15-20 Mins',
    stepOrderPlaced: 'Order Placed',
    stepPaymentSent: 'Payment Sent',
    stepPaymentVerified: 'Verified',
    stepProcuring: 'Procuring',
    stepDelivered: 'Delivered',
    catalogTitle: '📦 Digital Products & Subscriptions Catalog',
    catalogSubtitle: 'Choose from 45+ premium subscriptions, AI models & professional suites',
    noProductsFound: 'No Products Found',
    noProductsFoundDesc: 'Try searching with different keywords or switch categories.',
    offerPrice: 'Offer Price:',
    btnOrderNowCard: 'Order Now ➔',
    btnBookNowCard: 'Pre-Book',
    stockOutBadge: '🚫 Out of Stock',
    bestDealBadge: '⭐ Best Deal'
  },
  bn: {
    brandTag: 'ডিজিভল্ট বিডি',
    navHome: 'হোম',
    navCatalog: 'ক্যাটালগ',
    navTrack: 'অর্ডার ট্র্যাক',
    navBot: 'টেলিগ্রাম বট',
    heroTitle: 'বাংলাদেশে প্রিমিয়াম ডিজিটাল সাবস্ক্রিপশনের বিশ্বস্ত প্ল্যাটফর্ম',
    heroSubtitle: 'বিশ্বসেরা AI মডেল, ওটিটি স্ট্রিমিং, ক্রিয়েটিভ সফটওয়্যার ও প্রফেশনাল টুলস — দ্রুত ডেলিভারি ও সম্পূর্ণ মেয়াদের গ্যারান্টি সহ।',
    btnBrowse: '🛒 সকল প্রোডাক্ট দেখুন',
    btnTelegram: '📱 টেলিগ্রাম বট দিয়ে অর্ডার',
    heroSpotlightBadge: '⭐ সেরা হট ডিল অফার',
    heroSpotlightTitle: 'Gemini Pro ১৮ মাস অ্যাডমিন অ্যাকাউন্ট + VEO 3 Pro',
    heroSpotlightDesc: 'টানা ১৮ মাসের জন্য গুগল জেমিনাই প্রো অ্যাডভান্সড ও ভিও ৩ প্রো ভিডিও জেনারেটর। ১০০% প্রাইভেট অ্যাডমিন অ্যাকাউন্ট।',
    heroSpotlightPrice: '৳২,০০০ টাকা',
    btnOrderNow: 'এখনই অর্ডার করুন',
    catAll: 'সকল প্রোডাক্ট',
    catAI: '🤖 AI টুলস',
    catStreaming: '🎬 স্ট্রিমিং',
    catMusic: '🎵 মিউজিক',
    catCreative: '🎨 ক্রিয়েটিভ',
    catCloud: '💼 ক্লাউড ও অফিস',
    catCareer: '🚀 ক্যারিয়ার ও LinkedIn',
    catCourses: '📚 কোর্স',
    catVPN: '🔒 ভিপিএন',
    searchPlaceholder: 'সার্চ করুন (যেমন: Netflix, Gemini, ChatGPT)...',
    trustTitle1: '⚡ দ্রুত ডেলিভারি',
    trustDesc1: 'পেমেন্ট ভেরিফাই হওয়ার ১৫-৩০ মিনিটের মধ্যে সরাসরি ডেলিভারি।',
    trustTitle2: '🔒 সম্পূর্ণ প্রাইভেট ও নিরাপদ',
    trustDesc2: 'প্রাইভেট অ্যাকাউন্ট এবং অফিসিয়াল স্লট। কোনো ডেটা রিস্ক নেই।',
    trustTitle3: '🛡️ ফুল মেয়াদী ওয়ারেন্টি',
    trustDesc3: 'সাবস্ক্রিপশনের পুরো সময় জুড়ে ফুল রিপ্লেসমেন্ট গ্যারান্টি।',
    trustTitle4: '💳 বিকাশ ও নগদ পেমেন্ট',
    trustDesc4: 'সহজ লোকাল পেমেন্ট এবং চ্যাটেই স্ক্রিনশট আপলোড সুবিধা।',
    footerText: '© ২০২৬ ডিজিভল্ট বিডি। গ্রো১০এক্স (GRO10X) ইকোসিস্টেমের ডিজিটাল ব্র্যান্ড।',
    orderModalTitle: 'সাবস্ক্রিপশন অর্ডার ফর্ম',
    lblFullName: 'আপনার পুরো নাম',
    lblContact: 'মোবাইল নম্বর',
    lblWhatsapp: 'WhatsApp নম্বর',
    lblChannel: 'ডেলিভারির মাধ্যম',
    lblPayMethod: 'পেমেন্ট মাধ্যম',
    lblPayFrom: 'আপনার সেন্ডার নম্বর (ঐচ্ছিক)',
    lblTrxId: 'বিকাশ / নগদ ট্রানজেকশন আইডি (ঐচ্ছিক)',
    lblScreenshot: 'পেমেন্টের স্ক্রিনশট',
    btnSubmitOrder: 'অর্ডার নিশ্চিত করুন',
    orderSuccessTitle: 'অর্ডার সফলভাবে গ্রহণ করা হয়েছে!',
    orderRefLabel: 'অর্ডার রেফারেন্স নম্বর',
    payNotice: 'অনুগ্রহ করে টাকা পাঠান:',
    trackTitle: 'অর্ডার স্ট্যাটাস চেক করুন',
    trackSubtitle: 'আপনার অর্ডার নম্বর দিয়ে (যেমন: DIGI-102938) বর্তমান অবস্থা চেক করুন।',
    btnTrack: 'স্ট্যাটাস দেখুন',
    statusPendingPay: '⏳ পেমেন্ট ভেরিফিকেশন প্রক্রিয়াধীন',
    statusVerified: '✅ পেমেন্ট ভেরিফাইড — ডেলিভারি তৈরি হচ্ছে',
    statusDelivered: '🔑 ডেলিভারি সম্পন্ন ও অ্যাক্টিভ',
    statusRejected: '❌ পেমেন্ট বাতিল করা হয়েছে',
    orderReviewTitle: 'অর্ডার তথ্য যাচাই',
    lblConfirmOrder: 'অর্ডার কনফার্ম করুন',
    lblEditOrder: 'তথ্য পরিবর্তন করুন',
    errOrderNotFound: 'অর্ডার পাওয়া যায়নি। অনুগ্রহ করে রেফারেন্স নম্বরটি যাচাই করুন।',
    btnSupportWhatsApp: 'WhatsApp সাপোর্টে যোগাযোগ করুন',
    pqBannerBadge: '👑 গ্রো১০এক্স ফ্ল্যাগশিপ প্রোডাক্ট',
    pqBannerTitle: 'PlannerQueen™ ২০২৬ ডেইলি ও উইকলি সিস্টেম',
    pqBannerDesc: 'iPad, ট্যাবলেট ও ডেক্সটপের জন্য আল্ট্রা-ফাস্ট হাইপারলিঙ্কড ডিজিটাল প্ল্যানার এবং লাক্সারি হার্ডকভার স্পাইরাল এডিশন। GoodNotes, Notability ও Notion ইন্টিগ্রেশন সহ ৪৫০+ স্প্রেড এবং ফাইন্যান্স ট্র্যাকার।',
    pqBadgeUpdates: 'লাইফটাইম ২০২৬ আপডেট',
    pqBadgeSpreads: '✨ ৪৫০+ হাইপারলিঙ্কড স্প্রেড',
    pqBadgeInteractive: '📱 সরাসরি ওয়েব অ্যাপ',
    pqBadgeLicense: '🔒 ইনস্ট্যান্ট ক্রিপ্টোগ্রাফিক লাইসেন্স',
    pqPriceLabel: 'বিশেষ ডিরেক্ট প্রাইস:',
    pqBtnStore: '🛍️ প্ল্যানার স্টোরে অর্ডার করুন',
    pqBtnDemo: '✨ লাইভ অ্যাপ ডেমো',
    pqBtnTrack: 'ট্র্যাক',
    backToCatalog: '← ক্যাটালগে ফিরে যান',
    totalPayable: 'সর্বমোট প্রদেয় মূল্য:',
    fullWarrantyInc: '✅ সম্পূর্ণ মেয়াদের ওয়ারেন্টি অন্তর্ভুক্ত',
    durationLabel: 'মেয়াদ:',
    deliveryNoticeDefault: 'অর্ডার করার পর ১৫-৩০ মিনিটের মধ্যে ডেলিভারি সম্পন্ন হবে।',
    lblPaySendMoney: 'টাকা পাঠান:',
    sendInstruction: 'বিকাশ বা নগদ পার্সোনাল নাম্বারে সেন্ড মানি করুন, তারপর আপনার সেন্ডার নাম্বার বা TrxID নিচে দিন:',
    copiedToast: 'নম্বর কপি করা হয়েছে!',
    step1Select: '১. পেমেন্ট মেথড বেছে নিন',
    step2Send: '২. টাকা পাঠান',
    step3Verify: '৩. ভেরিফিকেশন তথ্য',
    trackOrderNotFound: 'অর্ডার পাওয়া যায়নি',
    trackOrderNotFoundDesc: 'দয়া করে আপনার অর্ডার রেফারেন্স নম্বরটি সঠিক কিনা যাচাই করুন (যেমন: DIGI-123456)।',
    viewCatalog: '🛒 ক্যাটালগ দেখুন',
    statusClosed: '✅ অ্যাক্টিভেশন নিশ্চিত ও অর্ডার সফলভাবে সম্পন্ন',
    statusDeliveredBanner: '🔑 ডেলিভারি সম্পন্ন! লিংক বা অ্যাক্সেস নিচে দেওয়া হয়েছে',
    statusProcuring: '⏳ অ্যাকাউন্ট প্রকিউরমেন্ট প্রক্রিয়াধীন',
    etaTitle: 'ডেলিভারি ট্র্যাকিং: প্রস্তুত হচ্ছে',
    etaMinutes: '১৫-২০ মিনিট',
    stepOrderPlaced: 'অর্ডার গ্রহণ',
    stepPaymentSent: 'পেমেন্ট তথ্য',
    stepPaymentVerified: 'ভেরিফাইড',
    stepProcuring: 'প্রস্তুত হচ্ছে',
    stepDelivered: 'ডেলিভারি',
    catalogTitle: '📦 ডিজিটাল প্রোডাক্ট ক্যাটালগ',
    catalogSubtitle: '৪৫+ প্রিমিয়াম সাবস্ক্রিপশন ও AI টুলস থেকে পছন্দেরটি বেছে নিন',
    noProductsFound: 'কোনো প্রোডাক্ট পাওয়া যায়নি',
    noProductsFoundDesc: 'অন্য কি-ওয়ার্ড বা ক্যাটাগরি দিয়ে চেষ্টা করুন।',
    offerPrice: 'অফার প্রাইস:',
    btnOrderNowCard: 'অর্ডার করুন ➔',
    btnBookNowCard: 'বুকিং করুন',
    stockOutBadge: '🚫 স্টক আউট',
    bestDealBadge: '⭐ সেরা ডিল'
  }
};

class DigiVaultStore {
  constructor() {
    this.lang = localStorage.getItem('dv_lang') || 'bn'; // Default to Bengali
    this.products = [];
    this.selectedCategory = 'all';
    this.utmData = this.captureUTM();
  }

  async init() {
    this.applyLanguage();
    this.bindGlobalEvents();
    this.trackLinkClick();
    await this.hydrateConfig();
  }

  async hydrateConfig() {
    try {
      const res = await fetch(`${DIGIVAULT_CONFIG.apiBase}/config`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          Object.assign(DIGIVAULT_CONFIG, json.data);
          window.dispatchEvent(new CustomEvent('digivault_config_loaded', { detail: DIGIVAULT_CONFIG }));
        }
      }
    } catch (e) {
      console.warn('[DigiVault Store] Config hydration note:', e.message);
    }
  }

  // ── Language Controller ──
  setLanguage(lang) {
    this.lang = lang;
    localStorage.setItem('dv_lang', lang);
    this.applyLanguage();
  }

  toggleLanguage() {
    this.setLanguage(this.lang === 'bn' ? 'en' : 'bn');
  }

  t(key) {
    return DV_I18N[this.lang]?.[key] || DV_I18N['en']?.[key] || key;
  }

  applyLanguage() {
    document.body.classList.toggle('lang-bn', this.lang === 'bn');
    
    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && this.t(key)) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = this.t(key);
        } else {
          el.textContent = this.t(key);
        }
      }
    });

    const langToggleBtn = document.getElementById('btnLangToggle');
    if (langToggleBtn) {
      langToggleBtn.innerHTML = this.lang === 'bn' ? '🇬🇧 English' : '🇧🇩 বাংলা';
    }
  }

  // ── UTM Tracking ──
  captureUTM() {
    const params = new URLSearchParams(window.location.search);
    const utm = {
      utm_source: params.get('utm_source') || 'direct',
      utm_medium: params.get('utm_medium') || 'web',
      utm_campaign: params.get('utm_campaign') || 'storefront',
      ref: params.get('ref') || null
    };

    if (params.get('utm_source') || params.get('ref')) {
      sessionStorage.setItem('dv_utm', JSON.stringify(utm));
    }

    const saved = sessionStorage.getItem('dv_utm');
    return saved ? JSON.parse(saved) : utm;
  }

  async trackLinkClick() {
    if (this.utmData && (this.utmData.ref || this.utmData.utm_source !== 'direct')) {
      try {
        fetch(`${DIGIVAULT_CONFIG.apiBase}/links/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shortCode: this.utmData.ref })
        }).catch(() => {});
      } catch (e) {}
    }
  }

  // ── Data Fetching ──
  async fetchProducts() {
    try {
      const res = await fetch(`${DIGIVAULT_CONFIG.apiBase}/products`);
      const json = await res.json();
      this.products = (json && json.data) || [];
      return this.products;
    } catch (e) {
      console.warn('[DigiVault Store] Products fetch note:', e.message);
      return [];
    }
  }

  bindGlobalEvents() {
    const btnLang = document.getElementById('btnLangToggle');
    if (btnLang) {
      btnLang.addEventListener('click', () => this.toggleLanguage());
    }
  }
}

// Instantiate global store
window.DV_STORE = new DigiVaultStore();
document.addEventListener('DOMContentLoaded', () => {
  window.DV_STORE.init();
});
