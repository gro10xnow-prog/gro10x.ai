/**
 * src/services/digivault-bot.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DigiVault Customer Commerce Telegram Bot (@Digivault20bot) v1.0
 * 
 * Features:
 * - 🌐 Bilingual (English & বাংলা) Interactive Menu
 * - 📦 44+ Products Catalog Browsing across 8 Categories
 * - ⭐ Hero Spotlight on Gemini Pro 18M + VEO 3 Pro (৳2,000)
 * - 🛒 Seamless Chat Checkout & Order Generation (DIGI-XXXXXX)
 * - 💳 bKash / Nagad Payment Screenshot Verification Flow
 * - 🔍 Order Status Tracking & Expiry Reminders
 * - 🔑 Instant Credential Dispatch directly to Customer Telegram Chat
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TelegramBot = require('node-telegram-bot-api');
const { supabase, isSupabaseConfigured } = require('./supabase');
const { broadcast } = require('./sse');
const { getTeamBot } = require('./bot');

let digivaultBot = null;
const userSessions = new Map(); // chatId -> { lang, step, selectedProduct, orderId, ... }

// Payment Receiver Numbers (Can be customized via App Settings)
const PAYMENT_CONFIG = {
  bkash: process.env.BKASH_NUMBER || '01312415757',
  nagad: process.env.NAGAD_NUMBER || '01312415757',
  supportPhone: process.env.SUPPORT_WHATSAPP || '+880 1889-825025'
};

// Bilingual Strings Dictionary
const STRINGS = {
  en: {
    welcomeTitle: '🏪 *Welcome to DigiVault!*',
    welcomeBody: 'Your premier destination for verified digital subscriptions, AI models, creative suites, streaming & pro tools.\n\n✨ *Fast Delivery (10-30 mins)*\n🔒 *100% Private & Guaranteed*',
    chooseCategory: '📂 *Select a category to browse:*',
    heroBadge: '⭐ BEST SELLER',
    price: 'Price',
    duration: 'Duration',
    orderNow: '🛒 Order Now',
    back: '🔙 Back',
    backCategories: '📂 Categories',
    changeLang: '🌐 বাংলা ভাষায় দেখুন',
    askName: '✍️ Please enter your *Full Name*:',
    askContact: '📱 Please enter your *WhatsApp or Mobile Number*:',
    orderSuccess: '🧾 *Order Placed Successfully!*',
    orderRef: 'Order Reference',
    payInstructions: '💳 *Payment Instructions:*\nPlease send exact amount via *Send Money* to:\n\n📱 *bKash (Personal):* `%BKASH%`\n📱 *Nagad (Personal):* `%NAGAD%`\n\n📸 *Next Step:* Send a *Screenshot* of your payment or Transaction ID right here in this chat.',
    screenshotReceived: '✅ *Payment Proof Received!*\n\nOur team is verifying your payment. Your credentials will be delivered *right here in this chat* within 15–30 minutes.\n\nTrack anytime with `/myorder %ORDER%`',
    trackPrompt: '🔍 To track your order, send `/myorder DIGI-XXXXXX`',
    orderNotFound: '❌ Order not found. Please check your order reference number.',
    contactText: '📞 *Customer Support:*\nWhatsApp: `%PHONE%`\nWeb: https://gro10x-ai.vercel.app/digivault',
    credentialsDelivered: '🎉 *Your DigiVault Order is Ready!*\n\n📦 *Product:* %PRODUCT%\n⏱️ *Duration:* %DURATION%\n\n🔑 *Access Details:*\n%CREDS%\n\n⏳ *Expiry Date:* `%EXPIRY%`\n\nThank you for choosing DigiVault! For renewal or issues, reply here anytime.'
  },
  bn: {
    welcomeTitle: '🏪 *ডিজিভল্ট (DigiVault)-এ স্বাগতম!*',
    welcomeBody: 'ভেরিফাইড ডিজিটাল সাবস্ক্রিপশন, AI টুলস, স্ট্রিমিং ও প্রফেশনাল সফটওয়্যারের বিশ্বস্ত প্ল্যাটফর্ম।\n\n✨ *দ্রুত ডেলিভারি (১০-৩০ মিনিট)*\n🔒 *১০০% প্রাইভেট ও ফুল ওয়ারেন্টি*',
    chooseCategory: '📂 *ক্যাটাগরি নির্বাচন করুন:*',
    heroBadge: '⭐ সেরা অফার',
    price: 'মূল্য',
    duration: 'মেয়াদ',
    orderNow: '🛒 এখনই অর্ডার করুন',
    back: '🔙 পিছনে যান',
    backCategories: '📂 ক্যাটাগরি সমূহ',
    changeLang: '🌐 Switch to English',
    askName: '✍️ অনুগ্রহ করে আপনার *পুরো নাম* লিখুন:',
    askContact: '📱 আপনার *মোবাইল বা WhatsApp নম্বর* লিখুন:',
    orderSuccess: '🧾 *অর্ডার সফলভাবে তৈরি হয়েছে!*',
    orderRef: 'অর্ডার রেফারেন্স',
    payInstructions: '💳 *পেমেন্ট নির্দেশিকা:*\nঅনুগ্রহ করে *Send Money* করুন:\n\n📱 *বিকাশ (Personal):* `%BKASH%`\n📱 *নগদ (Personal):* `%NAGAD%`\n\n📸 *পরবর্তী ধাপ:* টাকা পাঠিয়ে পেমেন্টের *স্ক্রিনশট* বা TrxID এই চ্যাটে পাঠিয়ে দিন।',
    screenshotReceived: '✅ *পেমেন্ট স্ক্রিনশট পাওয়া গেছে!*\n\nআমাদের টিম পেমেন্ট ভেরিফাই করছে। পরবর্তী ১৫-৩০ মিনিটের মধ্যে আপনার লগইন ডিটেইলস *সরাসরি এই চ্যাটে* দেওয়া হবে।\n\nঅর্ডার চেক করতে লিখুন: `/myorder %ORDER%`',
    trackPrompt: '🔍 আপনার অর্ডার চেক করতে লিখুন: `/myorder DIGI-XXXXXX`',
    orderNotFound: '❌ অর্ডার খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক রেফারেন্স নম্বর দিন।',
    contactText: '📞 *কাস্টমার সাপোর্ট:*\nWhatsApp: `%PHONE%`\nWeb: https://gro10x-ai.vercel.app/digivault',
    credentialsDelivered: '🎉 *আপনার ডিজিভল্ট অর্ডার সম্পন্ন হয়েছে!*\n\n📦 *প্রোডাক্ট:* %PRODUCT%\n⏱️ *মেয়াদ:* %DURATION%\n\n🔑 *লগইন ডিটেইলস:*\n%CREDS%\n\n⏳ *মেয়াদ শেষ:* `%EXPIRY%`\n\nডিজিভল্ট ব্যবহারের জন্য ধন্যবাদ! যেকোনো প্রয়োজনে এই চ্যাটে মেসেজ দিন।'
  }
};

const CATEGORIES = [
  { id: 'AI Tools', label: '🤖 AI Tools & Video', labelBn: '🤖 AI টুলস ও ভিডিও' },
  { id: 'Streaming', label: '🎬 Streaming & OTT', labelBn: '🎬 স্ট্রিমিং ও ওটিটি' },
  { id: 'Music', label: '🎵 Music & Audio', labelBn: '🎵 মিউজিক ও অডিও' },
  { id: 'Creative Tools', label: '🎨 Creative & Design', labelBn: '🎨 ক্রিয়েটিভ ও ডিজাইন' },
  { id: 'Productivity', label: '💼 Cloud & Office', labelBn: '💼 ক্লাউড ও অফিস' },
  { id: 'Professional', label: '🚀 LinkedIn & Career', labelBn: '🚀 লিংকডইন ও ক্যারিয়ার' },
  { id: 'Learning', label: '📚 Learning & Courses', labelBn: '📚 লার্নিং ও কোর্স' },
  { id: 'VPN', label: '🔒 VPN & Privacy', labelBn: '🔒 ভিপিএন ও প্রাইভেসি' }
];

function getLang(chatId) {
  const session = userSessions.get(chatId);
  return session?.lang || 'bn'; // Default to Bengali for BD audience
}

function t(chatId, key) {
  const lang = getLang(chatId);
  return STRINGS[lang]?.[key] || STRINGS['en'][key] || key;
}

// ─────────────────────────────────────────────────────────────────────────────
// BOT INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

function initDigiVaultBot() {
  const token = process.env.DIGIVAULT_BOT_TOKEN;
  if (!token || token.includes('your_token')) {
    console.warn('⚠️ [DigiVault Bot] DIGIVAULT_BOT_TOKEN missing or unconfigured.');
    return null;
  }

  if (digivaultBot) return digivaultBot;

  const isPolling = process.env.USE_POLLING === 'true' || process.env.NODE_ENV === 'development';

  try {
    digivaultBot = new TelegramBot(token, { polling: isPolling });
    console.log(`✅ [DigiVault Bot] @Digivault20bot initialized (Mode: ${isPolling ? 'Polling' : 'Webhook'})`);

    registerBotHandlers(digivaultBot);
  } catch (err) {
    console.error('❌ [DigiVault Bot] Initialization error:', err.message);
  }

  return digivaultBot;
}

function getDigiVaultBot() {
  return digivaultBot || initDigiVaultBot();
}

// ─────────────────────────────────────────────────────────────────────────────
// BOT HANDLERS & NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────

function registerBotHandlers(bot) {
  // Command: /start
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userSessions.set(chatId, { lang: 'bn', step: 'idle' });
    sendWelcomeMenu(bot, chatId);
  });

  // Command: /lang
  bot.onText(/\/lang/, (msg) => {
    const chatId = msg.chat.id;
    const current = getLang(chatId);
    const newLang = current === 'bn' ? 'en' : 'bn';
    const sess = userSessions.get(chatId) || {};
    userSessions.set(chatId, { ...sess, lang: newLang });
    bot.sendMessage(chatId, newLang === 'bn' ? '🇧🇩 ভাষা পরিবর্তন করা হয়েছে: বাংলা' : '🇬🇧 Language switched to: English');
    sendWelcomeMenu(bot, chatId);
  });

  // Command: /catalog
  bot.onText(/\/catalog/, (msg) => {
    const chatId = msg.chat.id;
    sendCategoryMenu(bot, chatId);
  });

  // Command: /contact
  bot.onText(/\/contact/, (msg) => {
    const chatId = msg.chat.id;
    const text = t(chatId, 'contactText').replace('%PHONE%', PAYMENT_CONFIG.supportPhone);
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  });

  // Command: /myorder <ref>
  bot.onText(/\/myorder(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const ref = match[1]?.trim();

    if (!ref) {
      return bot.sendMessage(chatId, t(chatId, 'trackPrompt'), { parse_mode: 'Markdown' });
    }

    await handleOrderTracking(bot, chatId, ref);
  });

  // Callback Query Handler (Inline Buttons)
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    try {
      bot.answerCallbackQuery(query.id).catch(() => {});

      if (data === 'menu_categories') {
        return sendCategoryMenu(bot, chatId, query.message.message_id);
      }
      if (data === 'menu_main') {
        return sendWelcomeMenu(bot, chatId, query.message.message_id);
      }
      if (data === 'toggle_lang') {
        const curr = getLang(chatId);
        const next = curr === 'bn' ? 'en' : 'bn';
        const sess = userSessions.get(chatId) || {};
        userSessions.set(chatId, { ...sess, lang: next });
        return sendWelcomeMenu(bot, chatId, query.message.message_id);
      }
      if (data.startsWith('cat:')) {
        const catId = data.replace('cat:', '');
        return sendProductsInCategory(bot, chatId, catId, query.message.message_id);
      }
      if (data.startsWith('prod:')) {
        const prodSlug = data.replace('prod:', '');
        return sendProductDetail(bot, chatId, prodSlug, query.message.message_id);
      }
      if (data.startsWith('order:')) {
        const prodSlug = data.replace('order:', '');
        return startOrderFlow(bot, chatId, prodSlug);
      }
      if (data === 'track_order') {
        return bot.sendMessage(chatId, t(chatId, 'trackPrompt'), { parse_mode: 'Markdown' });
      }
      if (data === 'contact_support') {
        const text = t(chatId, 'contactText').replace('%PHONE%', PAYMENT_CONFIG.supportPhone);
        return bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      }
    } catch (err) {
      console.error('[DigiVault Bot Callback Error]:', err.message);
    }
  });

  // Text Input Handler (Name & Contact step)
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    const chatId = msg.chat.id;
    const session = userSessions.get(chatId);
    if (!session || session.step === 'idle') return;

    if (session.step === 'awaiting_name') {
      session.customerName = msg.text.trim();
      session.step = 'awaiting_contact';
      userSessions.set(chatId, session);
      return bot.sendMessage(chatId, t(chatId, 'askContact'), { parse_mode: 'Markdown' });
    }

    if (session.step === 'awaiting_contact') {
      session.customerContact = msg.text.trim();
      session.step = 'awaiting_payment';
      userSessions.set(chatId, session);
      return completeOrderCreation(bot, chatId, session);
    }

    if (session.step === 'awaiting_payment') {
      // User sent TrxID as text
      session.trxId = msg.text.trim();
      userSessions.set(chatId, session);
      return handlePaymentProofSubmission(bot, chatId, session, null, msg.text.trim());
    }
  });

  // Photo / Screenshot Handler
  bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const session = userSessions.get(chatId);
    if (!session || !session.orderNumber) {
      // Find latest pending order for this chat
      const order = await findLatestPendingOrder(chatId);
      if (!order) return;
      return handlePaymentPhoto(bot, chatId, order, msg);
    }

    return handlePaymentPhoto(bot, chatId, { id: session.orderId, order_number: session.orderNumber, product_name: session.selectedProduct?.name }, msg);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UI MENU RENDERERS
// ─────────────────────────────────────────────────────────────────────────────

function sendWelcomeMenu(bot, chatId, messageId = null) {
  const lang = getLang(chatId);
  const text = `${t(chatId, 'welcomeTitle')}\n\n${t(chatId, 'welcomeBody')}\n\n${t(chatId, 'chooseCategory')}`;

  const keyboard = [
    [
      { text: lang === 'bn' ? '🤖 AI টুলস ও ভিডিও' : '🤖 AI & Video Tools', callback_data: 'cat:AI Tools' },
      { text: lang === 'bn' ? '🎬 স্ট্রিমিং ও OTT' : '🎬 Streaming & OTT', callback_data: 'cat:Streaming' }
    ],
    [
      { text: lang === 'bn' ? '🎵 মিউজিক ও অডিও' : '🎵 Music & Audio', callback_data: 'cat:Music' },
      { text: lang === 'bn' ? '🎨 ক্রিয়েটিভ ও ডিজাইন' : '🎨 Creative & Design', callback_data: 'cat:Creative Tools' }
    ],
    [
      { text: lang === 'bn' ? '💼 ক্লাউড ও অফিস' : '💼 Cloud & Office', callback_data: 'cat:Productivity' },
      { text: lang === 'bn' ? '🚀 লিংকডইন ও ক্যারিয়ার' : '🚀 Career & LinkedIn', callback_data: 'cat:Professional' }
    ],
    [
      { text: lang === 'bn' ? '📚 লার্নিং ও কোর্স' : '📚 Courses & Learning', callback_data: 'cat:Learning' },
      { text: lang === 'bn' ? '🔒 ভিপিএন ও প্রাইভেসি' : '🔒 VPN & Privacy', callback_data: 'cat:VPN' }
    ],
    [
      { text: lang === 'bn' ? '⭐ সেরা অফার: Gemini 18M' : '⭐ Hero Deal: Gemini 18M', callback_data: 'prod:gemini-pro-18m-veo-3' }
    ],
    [
      { text: lang === 'bn' ? '🔍 অর্ডার ট্র্যাক' : '🔍 Track Order', callback_data: 'track_order' },
      { text: t(chatId, 'changeLang'), callback_data: 'toggle_lang' }
    ]
  ];

  const opts = { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } };
  if (messageId) {
    bot.editMessageText(text, { chat_id: chatId, message_id: messageId, ...opts }).catch(() => {
      bot.sendMessage(chatId, text, opts);
    });
  } else {
    bot.sendMessage(chatId, text, opts);
  }
}

function sendCategoryMenu(bot, chatId, messageId = null) {
  const lang = getLang(chatId);
  const text = `${t(chatId, 'chooseCategory')}`;

  const keyboard = CATEGORIES.map(c => [
    { text: lang === 'bn' ? c.labelBn : c.label, callback_data: `cat:${c.id}` }
  ]);

  keyboard.push([
    { text: t(chatId, 'back'), callback_data: 'menu_main' }
  ]);

  const opts = { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } };
  if (messageId) {
    bot.editMessageText(text, { chat_id: chatId, message_id: messageId, ...opts });
  } else {
    bot.sendMessage(chatId, text, opts);
  }
}

async function sendProductsInCategory(bot, chatId, categoryId, messageId = null) {
  const lang = getLang(chatId);
  let products = [];

  if (isSupabaseConfigured()) {
    const { data } = await supabase.from('digi_products').select('*').eq('category', categoryId).eq('is_active', true).order('sort_order', { ascending: true });
    if (data) products = data;
  }

  if (products.length === 0) {
    const { SEED_PRODUCTS } = require('../../scripts/seed-digivault');
    products = SEED_PRODUCTS('', '').filter(p => p.category === categoryId);
  }

  let text = `📂 *${categoryId}*\n\n` + (lang === 'bn' ? 'পছন্দের প্রোডাক্টের উপর ট্যাপ করে বিস্তারিত দেখুন ও অর্ডার করুন:' : 'Tap a product to view pricing & place your order:');

  const keyboard = products.map(p => {
    const heroTag = p.is_hero ? '⭐ ' : '';
    return [{ text: `${heroTag}${p.name} — ৳${p.sale_price.toLocaleString()}`, callback_data: `prod:${p.slug}` }];
  });

  keyboard.push([
    { text: t(chatId, 'backCategories'), callback_data: 'menu_categories' }
  ]);

  const opts = { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } };
  if (messageId) {
    bot.editMessageText(text, { chat_id: chatId, message_id: messageId, ...opts });
  } else {
    bot.sendMessage(chatId, text, opts);
  }
}

async function sendProductDetail(bot, chatId, slug, messageId = null) {
  let product = null;

  if (isSupabaseConfigured()) {
    const { data } = await supabase.from('digi_products').select('*').eq('slug', slug).maybeSingle();
    if (data) product = data;
  }

  if (!product) {
    const { SEED_PRODUCTS } = require('../../scripts/seed-digivault');
    product = SEED_PRODUCTS('', '').find(p => p.slug === slug);
  }

  if (!product) {
    return bot.sendMessage(chatId, 'Product not found.');
  }

  const lang = getLang(chatId);
  let text = `📦 *${product.name}*\n\n`;
  if (product.is_hero) text += `⭐ *${t(chatId, 'heroBadge')}*\n\n`;
  text += `⏱️ *${t(chatId, 'duration')}:* ${product.duration}\n`;
  text += `💰 *${t(chatId, 'price')}:* ৳${product.sale_price.toLocaleString()} BDT\n\n`;

  if (product.delivery_notes) {
    text += `ℹ️ *${lang === 'bn' ? 'ডেলিভারি সংক্রান্ত তথ্য' : 'Delivery Details'}:*\n_${product.delivery_notes}_\n\n`;
  }

  text += `⚡ _${lang === 'bn' ? 'অর্ডার করার পর ১৫-৩০ মিনিটের মধ্যে ডেলিভারি পাবেন।' : 'Delivered within 15-30 minutes after payment verification.'}_`;

  const keyboard = [
    [{ text: t(chatId, 'orderNow'), callback_data: `order:${product.slug}` }],
    [{ text: t(chatId, 'back'), callback_data: `cat:${product.category}` }]
  ];

  const opts = { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } };
  if (messageId) {
    bot.editMessageText(text, { chat_id: chatId, message_id: messageId, ...opts });
  } else {
    bot.sendMessage(chatId, text, opts);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER CREATION & PAYMENT WORKFLOW
// ─────────────────────────────────────────────────────────────────────────────

async function startOrderFlow(bot, chatId, slug) {
  let product = null;

  if (isSupabaseConfigured()) {
    const { data } = await supabase.from('digi_products').select('*').eq('slug', slug).maybeSingle();
    product = data;
  }

  if (!product) {
    const { SEED_PRODUCTS } = require('../../scripts/seed-digivault');
    product = SEED_PRODUCTS('', '').find(p => p.slug === slug);
  }

  const lang = getLang(chatId);
  userSessions.set(chatId, {
    lang,
    step: 'awaiting_name',
    selectedProduct: product
  });

  const prompt = `🛒 *${lang === 'bn' ? 'অর্ডার শুরু হচ্ছে' : 'Starting Order'}: ${product.name}*\n💰 *${lang === 'bn' ? 'মূল্য' : 'Amount'}: ৳${product.sale_price.toLocaleString()}*\n\n${t(chatId, 'askName')}`;
  bot.sendMessage(chatId, prompt, { parse_mode: 'Markdown' });
}

async function completeOrderCreation(bot, chatId, session) {
  const prod = session.selectedProduct;
  const orderNumber = `DIGI-${Math.floor(100000 + Math.random() * 900000)}`;

  const payload = {
    order_number: orderNumber,
    customer_name: session.customerName,
    customer_contact: session.customerContact,
    contact_channel: 'telegram',
    telegram_chat_id: String(chatId),
    product_id: prod.id || null,
    product_name: prod.name,
    duration: prod.duration,
    vendor_price: prod.vendor_price,
    sale_price: prod.sale_price,
    profit: prod.profit_margin || (prod.sale_price - prod.vendor_price),
    vendor_id: prod.vendor_id || null,
    payment_status: 'pending',
    payment_method: 'bkash',
    delivery_status: 'pending',
    source_channel: 'telegram',
    created_at: new Date().toISOString()
  };

  let savedId = null;
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_orders').insert([payload]).select().maybeSingle();
    if (!error && data) savedId = data.id;
  }

  session.orderId = savedId;
  session.orderNumber = orderNumber;
  userSessions.set(chatId, session);

  // Send Invoice to Customer
  let text = `${t(chatId, 'orderSuccess')}\n\n`;
  text += `📋 *${t(chatId, 'orderRef')}:* \`${orderNumber}\`\n`;
  text += `📦 *Product:* ${prod.name} (${prod.duration})\n`;
  text += `💰 *Amount Due:* ৳${prod.sale_price.toLocaleString()}\n\n`;
  text += t(chatId, 'payInstructions')
    .replace('%BKASH%', PAYMENT_CONFIG.bkash)
    .replace('%NAGAD%', PAYMENT_CONFIG.nagad);

  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });

  // Broadcast to Admin & Team Bot
  broadcast('digistore_order_created', payload);

  try {
    const teamBot = getTeamBot();
    if (teamBot && process.env.TELEGRAM_TEAM_GROUP_ID) {
      const tgMsg = `🛒 *New DigiVault Bot Order — ${orderNumber}*\n\n` +
        `📦 *Product:* ${prod.name} (${prod.duration})\n` +
        `👤 *Customer:* ${session.customerName} (Telegram)\n` +
        `💰 *Sale Price:* ৳${prod.sale_price.toLocaleString()} | *Profit:* ৳${payload.profit.toLocaleString()}\n` +
        `💳 *Status:* Awaiting Payment Screenshot\n\n` +
        `_Action: Verify in Admin Panel once proof arrives._`;
      teamBot.sendMessage(process.env.TELEGRAM_TEAM_GROUP_ID, tgMsg, { parse_mode: 'Markdown' }).catch(() => {});
    }
  } catch (e) {}
}

async function handlePaymentPhoto(bot, chatId, order, msg) {
  const photo = msg.photo[msg.photo.length - 1]; // Highest resolution
  let fileUrl = null;

  try {
    fileUrl = await bot.getFileLink(photo.file_id);

    // Save proof URL to Supabase
    if (isSupabaseConfigured() && order.id) {
      await supabase.from('digi_orders').update({
        payment_proof_url: fileUrl,
        updated_at: new Date().toISOString()
      }).eq('id', order.id);
    }
  } catch (err) {
    console.warn('[DigiVault Bot Photo Fetch Note]:', err.message);
  }

  const text = t(chatId, 'screenshotReceived').replace('%ORDER%', order.order_number || '');
  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });

  // Notify Team Bot
  try {
    const teamBot = getTeamBot();
    if (teamBot && process.env.TELEGRAM_TEAM_GROUP_ID) {
      const tgMsg = `📎 *Payment Screenshot Received — ${order.order_number}*\n\n` +
        `📦 *Product:* ${order.product_name}\n` +
        `🖼️ *Proof:* [View Photo](${fileUrl || '#'})\n\n` +
        `_Action: Check and click Verify in Admin Panel._`;
      teamBot.sendMessage(process.env.TELEGRAM_TEAM_GROUP_ID, tgMsg, { parse_mode: 'Markdown' }).catch(() => {});
    }
  } catch (e) {}

  userSessions.delete(chatId);
}

async function handlePaymentProofSubmission(bot, chatId, session, photoUrl = null, trxId = null) {
  if (isSupabaseConfigured() && session.orderId) {
    await supabase.from('digi_orders').update({
      payment_ref: trxId || '',
      payment_proof_url: photoUrl,
      updated_at: new Date().toISOString()
    }).eq('id', session.orderId);
  }

  const text = t(chatId, 'screenshotReceived').replace('%ORDER%', session.orderNumber || '');
  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  userSessions.delete(chatId);
}

async function handleOrderTracking(bot, chatId, ref) {
  let order = null;

  if (isSupabaseConfigured()) {
    const { data } = await supabase.from('digi_orders').select('*').eq('order_number', ref.toUpperCase()).maybeSingle();
    order = data;
  }

  if (!order) {
    return bot.sendMessage(chatId, t(chatId, 'orderNotFound'));
  }

  const lang = getLang(chatId);
  const payStatus = order.payment_status === 'verified' ? '✅ Verified' : order.payment_status === 'rejected' ? '❌ Rejected' : '⏳ Pending Verification';
  const delivStatus = order.delivery_status === 'delivered' ? '🔑 Delivered' : '⏳ Processing';

  let text = `📋 *Order Status: \`${order.order_number}\`*\n\n`;
  text += `📦 *Product:* ${order.product_name} (${order.duration})\n`;
  text += `💰 *Amount:* ৳${Number(order.sale_price).toLocaleString()}\n`;
  text += `💳 *Payment:* ${payStatus}\n`;
  text += `🚚 *Delivery:* ${delivStatus}\n`;

  if (order.activation_date) text += `📅 *Activated:* ${order.activation_date}\n`;
  if (order.expiry_date) text += `⏳ *Valid Until:* ${order.expiry_date}\n`;

  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

async function findLatestPendingOrder(chatId) {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase
    .from('digi_orders')
    .select('*')
    .eq('telegram_chat_id', String(chatId))
    .eq('delivery_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTERNAL DELIVERY DISPATCH HELPER
// ─────────────────────────────────────────────────────────────────────────────

async function sendTelegramOrderDelivery(chatId, order, credentialData = {}) {
  const bot = getDigiVaultBot();
  if (!bot || !chatId) return false;

  let credsText = '';
  if (credentialData.email) credsText += `📧 *Email/ID:* \`${credentialData.email}\`\n`;
  if (credentialData.password) credsText += `🔒 *Password/PIN:* \`${credentialData.password}\`\n`;
  if (credentialData.link) credsText += `🔗 *Redeem Link:* ${credentialData.link}\n`;
  if (credentialData.notes) credsText += `📝 *Notes:* ${credentialData.notes}\n`;

  if (!credsText) credsText = 'Credentials verified and active.';

  const lang = getLang(chatId);
  const text = t(chatId, 'credentialsDelivered')
    .replace('%PRODUCT%', order.product_name || order.productName)
    .replace('%DURATION%', order.duration || '1 Month')
    .replace('%CREDS%', credsText)
    .replace('%EXPIRY%', order.expiry_date || order.expiryDate || 'N/A');

  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    return true;
  } catch (err) {
    console.error('[DigiVault Bot Delivery Error]:', err.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK UPDATE PROCESSOR (FOR SERVERLESS / VERCEL)
// ─────────────────────────────────────────────────────────────────────────────

async function processDigiVaultWebhook(update) {
  const bot = getDigiVaultBot();
  if (!bot) return;
  bot.processUpdate(update);
}

module.exports = {
  initDigiVaultBot,
  getDigiVaultBot,
  sendTelegramOrderDelivery,
  processDigiVaultWebhook
};
