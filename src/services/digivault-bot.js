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
const userSessions = new Map(); // Fast in-memory cache: chatId -> { lang, step, selectedProduct, orderId, ... }

/**
 * Persistent Session Manager (In-Memory Cache + Supabase Backup)
 */
async function getSession(chatId) {
  const cId = String(chatId);
  if (userSessions.has(cId)) {
    return userSessions.get(cId);
  }
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('digi_bot_sessions').select('*').eq('chat_id', cId).maybeSingle();
      if (data && data.session_data) {
        const sess = {
          lang: data.lang || 'bn',
          step: data.step || 'idle',
          ...(typeof data.session_data === 'object' ? data.session_data : {})
        };
        userSessions.set(cId, sess);
        return sess;
      }
    } catch (e) {}
  }
  const defaultSess = { lang: 'bn', step: 'idle' };
  userSessions.set(cId, defaultSess);
  return defaultSess;
}

async function saveSession(chatId, sessionData) {
  const cId = String(chatId);
  userSessions.set(cId, sessionData);
  if (isSupabaseConfigured()) {
    try {
      const payload = {
        chat_id: cId,
        lang: sessionData.lang || 'bn',
        step: sessionData.step || 'idle',
        session_data: sessionData,
        updated_at: new Date().toISOString()
      };
      await supabase.from('digi_bot_sessions').upsert(payload, { onConflict: 'chat_id' });
    } catch (e) {}
  }
}

async function clearSession(chatId) {
  const cId = String(chatId);
  userSessions.delete(cId);
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('digi_bot_sessions').delete().eq('chat_id', cId);
    } catch (e) {}
  }
}

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
    askContact: '📱 Please enter your *Mobile Number*:',
    askWhatsapp: '💬 Please enter your *WhatsApp Number* (for delivery link & warranty alerts):',
    orderSuccess: '🧾 *Order Placed Successfully!*',
    orderRef: 'Order Reference',
    payInstructions: '💳 *Payment Instructions:*\nPlease send exact amount via *Send Money* to:\n\n📱 *bKash (Personal):* `%BKASH%`\n📱 *Nagad (Personal):* `%NAGAD%`\n\n📸 *Next Step:* Send a *Screenshot* of your payment or Transaction ID right here in this chat.',
    screenshotReceived: '✅ *Payment Proof Received!*\n\nOur team is verifying your payment. Your credentials or activation link will be delivered *right here in this chat* within 15–30 minutes.\n\nTrack anytime with `/myorder %ORDER%`',
    trackPrompt: '🔍 To track your order, send `/myorder DIGI-XXXXXX`',
    orderNotFound: '❌ Order not found. Please check your order reference number.',
    contactText: '📞 *Customer Support:*\nWhatsApp: `%PHONE%`\nWeb: https://gro10x-ai.vercel.app/digivault',
    credentialsDelivered: '🎉 *Your DigiVault Order is Ready!*\n\n📦 *Product:* %PRODUCT%\n⏱️ *Duration:* %DURATION%\n\n🔑 *Access Details:*\n%CREDS%\n\n⏳ *Expiry Date:* `%EXPIRY%`\n\nThank you for choosing DigiVault! Please confirm once verified below:',
    orderConfirmed: '🎉 *Awesome! Your activation confirmation is recorded.*\n\nThank you for choosing DigiVault! 🙏\n👉 Share with friends: https://gro10x-ai.vercel.app/digivault',
    orderReviewPrompt: '📋 *Order Review (Please Verify):*\n\n📦 *Product:* %PRODUCT% (%DURATION%)\n💰 *Amount Due:* ৳%PRICE% BDT\n👤 *Name:* %NAME%\n📱 *Mobile:* %PHONE%\n💬 *WhatsApp:* %WHATSAPP%\n\nIf all details are correct, tap *Confirm Order* below:',
    btnConfirmCheckout: '✅ Confirm & Place Order',
    btnEditCheckout: '✏️ Edit / Restart',
    btnHelp: '❓ Help',
    helpText: '📖 *DigiVault Bot Commands:*\n\n• `/start` — Main Menu & Hot Deals\n• `/catalog` — Browse All Digital Subscriptions\n• `/myorder <REF>` — Track Your Order Status\n• `/lang` — Switch between বাংলা / English\n• `/contact` — Customer Support WhatsApp\n• `/help` — View this Command Guide\n\nNeed assistance? Contact our team: `%PHONE%`',
    renewalReminder: '🔔 *Subscription Renewal Alert*\n\nSalam %NAME%! Your *%PRODUCT%* subscription expires in *%DAYS% days* (Expiry: `%EXPIRY%`).\n\nTo ensure uninterrupted service, tap below to renew seamlessly:',
    btnRenewNow: '🔄 Renew Now ৳%PRICE%'
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
    askContact: '📱 আপনার *মোবাইল নম্বর* লিখুন:',
    askWhatsapp: '💬 আপনার *WhatsApp নম্বর* লিখুন (ডেলিভারি লিংক ও ওয়ারেন্টি আপডেটের জন্য):',
    orderSuccess: '🧾 *অর্ডার সফলভাবে তৈরি হয়েছে!*',
    orderRef: 'অর্ডার রেফারেন্স',
    payInstructions: '💳 *পেমেন্ট নির্দেশিকা:*\nঅনুগ্রহ করে *Send Money* করুন:\n\n📱 *বিকাশ (Personal):* `%BKASH%`\n📱 *নগদ (Personal):* `%NAGAD%`\n\n📸 *পরবর্তী ধাপ:* টাকা পাঠিয়ে পেমেন্টের *স্ক্রিনশট* বা TrxID এই চ্যাটে পাঠিয়ে দিন।',
    screenshotReceived: '✅ *পেমেন্ট স্ক্রিনশট পাওয়া গেছে!*\n\nআমাদের টিম পেমেন্ট ভেরিফাই করছে। পরবর্তী ১৫-৩০ মিনিটের মধ্যে আপনার অ্যাক্টিভেশন লিংক বা লগইন ডিটেইলস *সরাসরি এই চ্যাটে* দেওয়া হবে।\n\nঅর্ডার চেক করতে লিখুন: `/myorder %ORDER%`',
    trackPrompt: '🔍 আপনার অর্ডার চেক করতে লিখুন: `/myorder DIGI-XXXXXX`',
    orderNotFound: '❌ অর্ডার খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক রেফারেন্স নম্বর দিন।',
    contactText: '📞 *কাস্টমার সাপোর্ট:*\nWhatsApp: `%PHONE%`\nWeb: https://gro10x-ai.vercel.app/digivault',
    credentialsDelivered: '🎉 *আপনার ডিজিভল্ট অর্ডার সম্পন্ন হয়েছে!*\n\n📦 *প্রোডাক্ট:* %PRODUCT%\n⏱️ *মেয়াদ:* %DURATION%\n\n🔑 *লগইন ডিটেইলস:*\n%CREDS%\n\n⏳ *মেয়াদ শেষ:* `%EXPIRY%`\n\nডিজিভল্ট ব্যবহারের জন্য ধন্যবাদ! একাউন্ট চেক করে নিচে কনফার্ম করুন:',
    orderConfirmed: '🎉 *দারুণ! আপনার অ্যাক্টিভেশন সফলভাবে কনফার্ম হয়েছে।*\n\nআমাদের সাথে থাকার জন্য অনেক ধন্যবাদ! 🙏\n👉 বন্ধুদের সাথে শেয়ার করতে পারেন: https://gro10x-ai.vercel.app/digivault',
    orderReviewPrompt: '📋 *অর্ডার তথ্য যাচাই (Order Review):*\n\n📦 *প্রোডাক্ট:* %PRODUCT% (%DURATION%)\n💰 *প্রদেয় মূল্য:* ৳%PRICE% টাকা\n👤 *নাম:* %NAME%\n📱 *মোবাইল:* %PHONE%\n💬 *WhatsApp:* %WHATSAPP%\n\nসব তথ্য সঠিক থাকলে নিচে *অর্ডার কনফার্ম করুন* বাটনে চাপুন:',
    btnConfirmCheckout: '✅ অর্ডার কনফার্ম করুন',
    btnEditCheckout: '✏️ তথ্য পরিবর্তন / রিস্টার্ট',
    btnHelp: '❓ সাহায্য',
    helpText: '📖 *ডিজিভল্ট বট কমান্ড তালিকা:*\n\n• `/start` — মেইন মেনু ও সেরা অফার\n• `/catalog` — সম্পূর্ণ সাবস্ক্রিপশন ক্যাটালগ\n• `/myorder <REF>` — অর্ডার স্ট্যাটাস চেক\n• `/lang` — ভাষা পরিবর্তন (বাংলা / English)\n• `/contact` — কাস্টমার সাপোর্ট WhatsApp\n• `/help` — কমান্ড নির্দেশিকা\n\nকোনো সহায়তার প্রয়োজন হলে যোগাযোগ করুন: `%PHONE%`',
    renewalReminder: '🔔 *সাবস্ক্রিপশন মেয়াদ শেষ হচ্ছে (Renewal Alert)*\n\nসালাম %NAME%! আপনার *%PRODUCT%* সাবস্ক্রিপশনের মেয়াদ আর *%DAYS% দিন* বাকি আছে (মেয়াদ শেষ: `%EXPIRY%`)।\n\nনির্বিঘ্নে সার্ভিস চালু রাখতে নিচের বাটনে চাপ দিয়ে এখনই রিনিউ করুন:',
    btnRenewNow: '🔄 এখনই রিনিউ করুন ৳%PRICE%'
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
  const session = userSessions.get(String(chatId));
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
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await saveSession(chatId, { lang: 'bn', step: 'idle' });
    sendWelcomeMenu(bot, chatId);
  });

  // Command: /lang
  bot.onText(/\/lang/, async (msg) => {
    const chatId = msg.chat.id;
    const sess = await getSession(chatId);
    const newLang = sess.lang === 'bn' ? 'en' : 'bn';
    await saveSession(chatId, { ...sess, lang: newLang });
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

  // Command: /help
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    sendHelpMessage(bot, chatId);
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
      if (data === 'menu_help') {
        return sendHelpMessage(bot, chatId, query.message.message_id);
      }
      if (data === 'toggle_lang') {
        const sess = await getSession(chatId);
        const next = sess.lang === 'bn' ? 'en' : 'bn';
        await saveSession(chatId, { ...sess, lang: next });
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
      if (data === 'checkout_confirm') {
        const sess = await getSession(chatId);
        if (sess && sess.selectedProduct) {
          return completeOrderCreation(bot, chatId, sess);
        }
      }
      if (data === 'checkout_restart') {
        const sess = await getSession(chatId);
        if (sess && sess.selectedProduct) {
          return startOrderFlow(bot, chatId, sess.selectedProduct.slug);
        }
      }
      if (data === 'track_order') {
        return bot.sendMessage(chatId, t(chatId, 'trackPrompt'), { parse_mode: 'Markdown' });
      }
      if (data === 'contact_support') {
        const text = t(chatId, 'contactText').replace('%PHONE%', PAYMENT_CONFIG.supportPhone);
        return bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      }
      if (data.startsWith('confirm_order:')) {
        const orderId = data.replace('confirm_order:', '');
        const now = new Date().toISOString();
        if (isSupabaseConfigured() && orderId) {
          try {
            await supabase.from('digi_orders').update({
              customer_confirmed_at: now,
              order_stage: 'confirmed_closed',
              order_closed_at: now,
              updated_at: now
            }).eq('id', orderId);

            await supabase.from('digi_order_timeline').insert([{
              order_id: orderId,
              stage: 'confirmed_closed',
              actor: 'customer',
              note: 'Customer confirmed activation via Telegram Bot button',
              created_at: now
            }]);
          } catch (e) {}
        }
        return bot.sendMessage(chatId, t(chatId, 'orderConfirmed'), { parse_mode: 'Markdown' });
      }
      if (data.startsWith('renew_order:')) {
        const orderId = data.replace('renew_order:', '');
        let order = null;
        if (isSupabaseConfigured() && orderId) {
          const { data: dbOrder } = await supabase.from('digi_orders').select('*').eq('id', orderId).maybeSingle();
          order = dbOrder;
        }
        if (!order) {
          return bot.sendMessage(chatId, t(chatId, 'orderNotFound'), { parse_mode: 'Markdown' });
        }
        const prod = PRODUCTS.find(p => p.slug === order.product_slug) || {
          name: order.product_name,
          slug: order.product_slug || 'gemini-pro-18m-veo-3',
          duration: order.product_duration || 'Renewal',
          sale_price: Number(order.sale_price) || 2000,
          vendor_price: Number(order.vendor_price) || 170,
          vendor_id: order.vendor_id
        };

        const session = {
          lang: getLang(chatId),
          step: 'awaiting_confirmation',
          selectedProduct: prod,
          customerName: order.customer_name,
          customerContact: order.customer_contact,
          customerWhatsapp: order.customer_whatsapp || order.customer_contact,
          isRenewal: true,
          parentOrderId: order.id
        };

        await saveSession(chatId, session);
        return sendOrderConfirmationPrompt(bot, chatId, session);
      }
    } catch (err) {
      console.error('[DigiVault Bot Callback Error]:', err.message);
    }
  });

  // Text Input Handler (Name, Mobile & WhatsApp step)
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    const chatId = msg.chat.id;
    const session = await getSession(chatId);
    if (!session || session.step === 'idle') return;

    if (session.step === 'awaiting_name') {
      session.customerName = msg.text.trim();
      session.step = 'awaiting_contact';
      await saveSession(chatId, session);
      return bot.sendMessage(chatId, t(chatId, 'askContact'), { parse_mode: 'Markdown' });
    }

    if (session.step === 'awaiting_contact') {
      session.customerContact = msg.text.trim();
      session.step = 'awaiting_whatsapp';
      await saveSession(chatId, session);
      return bot.sendMessage(chatId, t(chatId, 'askWhatsapp'), { parse_mode: 'Markdown' });
    }

    if (session.step === 'awaiting_whatsapp') {
      session.customerWhatsapp = msg.text.trim();
      session.step = 'awaiting_confirmation';
      await saveSession(chatId, session);
      return sendOrderConfirmationPrompt(bot, chatId, session);
    }

    if (session.step === 'awaiting_payment') {
      // User sent TrxID as text
      session.trxId = msg.text.trim();
      await saveSession(chatId, session);
      return handlePaymentProofSubmission(bot, chatId, session, null, msg.text.trim());
    }
  });

  // Photo / Screenshot Handler
  bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const session = await getSession(chatId);
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
      { text: lang === 'bn' ? '🔍 ট্র্যাক' : '🔍 Track', callback_data: 'track_order' },
      { text: t(chatId, 'btnHelp'), callback_data: 'menu_help' },
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

function sendHelpMessage(bot, chatId, messageId = null) {
  const text = t(chatId, 'helpText').replace('%PHONE%', PAYMENT_CONFIG.supportPhone);
  const keyboard = [
    [
      { text: t(chatId, 'back'), callback_data: 'menu_main' },
      { text: '💬 WhatsApp Support', callback_data: 'contact_support' }
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

function sendOrderConfirmationPrompt(bot, chatId, session) {
  const prod = session.selectedProduct;
  const prompt = t(chatId, 'orderReviewPrompt')
    .replace('%PRODUCT%', prod.name)
    .replace('%DURATION%', prod.duration)
    .replace('%PRICE%', prod.sale_price.toLocaleString())
    .replace('%NAME%', session.customerName || 'N/A')
    .replace('%PHONE%', session.customerContact || 'N/A')
    .replace('%WHATSAPP%', session.customerWhatsapp || session.customerContact || 'N/A');

  const keyboard = [
    [{ text: t(chatId, 'btnConfirmCheckout'), callback_data: 'checkout_confirm' }],
    [{ text: t(chatId, 'btnEditCheckout'), callback_data: 'checkout_restart' }]
  ];

  bot.sendMessage(chatId, prompt, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
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
  await saveSession(chatId, {
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
    customer_whatsapp: session.customerWhatsapp || session.customerContact,
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
    order_stage: 'pending_payment',
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
  await saveSession(chatId, session);

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
    // Direct Admin Chat Alert (if DIGIVAULT_ADMIN_CHAT_ID or ADMIN_TELEGRAM_CHAT_ID configured)
    const adminChatId = process.env.DIGIVAULT_ADMIN_CHAT_ID || process.env.ADMIN_TELEGRAM_CHAT_ID;
    if (adminChatId) {
      const adminMsg = `🛒 *New DigiVault Order — ${orderNumber}*\n\n` +
        `📦 *Product:* ${prod.name} (${prod.duration})\n` +
        `👤 *Customer:* ${session.customerName} (${session.customerContact})\n` +
        `💬 *WhatsApp:* ${session.customerWhatsapp || 'N/A'}\n` +
        `💰 *Sale Price:* ৳${prod.sale_price.toLocaleString()} | *Profit:* +৳${payload.profit.toLocaleString()}\n` +
        `💳 *Status:* Awaiting Payment Screenshot\n\n` +
        `_Action: Check Admin Panel once proof arrives._`;
      bot.sendMessage(adminChatId, adminMsg, { parse_mode: 'Markdown' }).catch(() => {});
    }

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

  // Direct Admin Alert & Team Bot Alert
  try {
    const adminChatId = process.env.DIGIVAULT_ADMIN_CHAT_ID || process.env.ADMIN_TELEGRAM_CHAT_ID;
    if (adminChatId) {
      const adminMsg = `📎 *Payment Screenshot Received — ${order.order_number}*\n\n` +
        `📦 *Product:* ${order.product_name}\n` +
        `🖼️ *Proof:* [View Screenshot](${fileUrl || '#'})\n\n` +
        `_Action: Check and click Verify in Admin Panel._`;
      bot.sendMessage(adminChatId, adminMsg, { parse_mode: 'Markdown' }).catch(() => {});
    }

    const teamBot = getTeamBot();
    if (teamBot && process.env.TELEGRAM_TEAM_GROUP_ID) {
      const tgMsg = `📎 *Payment Screenshot Received — ${order.order_number}*\n\n` +
        `📦 *Product:* ${order.product_name}\n` +
        `🖼️ *Proof:* [View Photo](${fileUrl || '#'})\n\n` +
        `_Action: Check and click Verify in Admin Panel._`;
      teamBot.sendMessage(process.env.TELEGRAM_TEAM_GROUP_ID, tgMsg, { parse_mode: 'Markdown' }).catch(() => {});
    }
  } catch (e) {}

  await clearSession(chatId);
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

  await clearSession(chatId);
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

async function sendTelegramActivationDelivery(chatId, order, activationLink) {
  const bot = getDigiVaultBot();
  if (!bot || !chatId || !activationLink) return false;

  const prodName = order.product_name || order.productName || 'Gemini Pro 18 Months';
  const duration = order.duration || '18 Months';
  const orderId = order.id || '';

  const text = `🎉 *আপনার ${prodName} (${duration}) অ্যাক্টিভেশন লিংক তৈরি!*\n\n` +
    `🔗 *অ্যাক্টিভেশন লিংক:*\n${activationLink}\n\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `📋 *৬টি সহজ স্টেপ অনুসরণ করুন:*\n\n` +
    `1️⃣ পেমেন্ট ইতিমধ্যে কনফার্ম হয়েছে ✅\n` +
    `2️⃣ উপরের লিংকটি কপি করুন\n` +
    `3️⃣ Google Chrome-এ নতুন Profile তৈরি করুন\n` +
    `4️⃣ সেই Profile-এ একটি Clean Gmail দিয়ে login করুন (যেখানে আগে কোনো paid subscription ছিল না)\n` +
    `5️⃣ New Chrome Profile-এ লিংকটি paste করে open করুন\n` +
    `6️⃣ "FREE ACTIVATION" বাটনে ক্লিক করুন ➔ BOOM! Done! 🎉\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `⚠️ *গুরুত্বপূর্ণ:* শুধুমাত্র NEW Chrome Profile ও clean Gmail-এ কাজ করবে।\n` +
    `💬 কোনো সমস্যা হলে WhatsApp সাপোর্ট: wa.me/8801889825025`;

  const opts = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ অ্যাক্টিভেশন সম্পন্ন! কনফার্ম করুন', callback_data: `confirm_order:${orderId}` }],
        [{ text: '💬 WhatsApp সাপোর্ট', url: 'https://wa.me/8801889825025' }]
      ]
    }
  };

  try {
    await bot.sendMessage(chatId, text, opts);
    return true;
  } catch (err) {
    console.error('[DigiVault Bot Activation Delivery Error]:', err.message);
    return false;
  }
}

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

  const orderId = order.id || '';
  const opts = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: lang === 'bn' ? '✅ একাউন্ট চেক করেছি! কনফার্ম' : '✅ Verified & Activated!', callback_data: `confirm_order:${orderId}` }],
        [{ text: '💬 WhatsApp Support', url: 'https://wa.me/8801889825025' }]
      ]
    }
  };

  try {
    await bot.sendMessage(chatId, text, opts);
    return true;
  } catch (err) {
    console.error('[DigiVault Bot Delivery Error]:', err.message);
    return false;
  }
}

async function sendTelegramPaymentRejection(chatId, order, reason = 'Payment verification failed') {
  const bot = getDigiVaultBot();
  if (!bot || !chatId) return false;

  const lang = getLang(chatId);
  const ref = order.order_number || order.orderNumber || 'DIGI-REF';
  const prodName = order.product_name || order.productName || 'Subscription';

  const text = lang === 'bn'
    ? `❌ *আপনার পেমেন্ট ভেরিফাই করা সম্ভব হয়নি*\n\n` +
      `📋 *অর্ডার রেফারেন্স:* \`${ref}\`\n` +
      `📦 *প্রোডাক্ট:* ${prodName}\n` +
      `⚠️ *বাতিলের কারণ:* ${reason}\n\n` +
      `💳 অনুগ্রহ করে সঠিক নম্বরে (*${PAYMENT_CONFIG.bkash}*) Send Money করে ট্রানজেকশনের স্ক্রিনশট বা TrxID এই চ্যাটে আবার পাঠান।\n\n` +
      `💬 কোনো সাহায্যের প্রয়োজন হলে WhatsApp-এ নক দিন:`
    : `❌ *Payment Verification Rejected*\n\n` +
      `📋 *Order Ref:* \`${ref}\`\n` +
      `📦 *Product:* ${prodName}\n` +
      `⚠️ *Reason:* ${reason}\n\n` +
      `💳 Please Send Money to *${PAYMENT_CONFIG.bkash}* (bKash/Nagad Personal) and send your payment screenshot or TrxID here.\n\n` +
      `💬 For assistance, reach our WhatsApp support:`;

  const opts = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '💬 WhatsApp Support (01889825025)', url: 'https://wa.me/8801889825025' }]
      ]
    }
  };

  try {
    await bot.sendMessage(chatId, text, opts);
    return true;
  } catch (err) {
    console.error('[DigiVault Bot Payment Rejection Error]:', err.message);
    return false;
  }
}

async function sendRenewalReminder(bot, chatId, order, daysRemaining = 3) {
  if (!bot || !chatId) return false;

  const daysText = daysRemaining <= 0 ? (getLang(chatId) === 'bn' ? 'আজই' : 'today') : `${daysRemaining}`;
  const price = (Number(order.sale_price) || 0).toLocaleString();
  const expiryFormatted = order.expiry_date ? new Date(order.expiry_date).toLocaleDateString('en-GB') : 'N/A';

  const text = t(chatId, 'renewalReminder')
    .replace('%NAME%', order.customer_name || 'Customer')
    .replace('%PRODUCT%', order.product_name)
    .replace('%DAYS%', daysText)
    .replace('%EXPIRY%', expiryFormatted);

  const btnText = t(chatId, 'btnRenewNow').replace('%PRICE%', price);
  const keyboard = [
    [{ text: btnText, callback_data: `renew_order:${order.id}` }],
    [{ text: t(chatId, 'btnHelp'), callback_data: 'menu_help' }]
  ];

  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
    return true;
  } catch (err) {
    console.error('[DigiVault Bot Renewal Reminder Error]:', err.message);
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
  getSession,
  saveSession,
  clearSession,
  sendRenewalReminder,
  sendTelegramPaymentRejection,
  sendTelegramOrderDelivery,
  sendTelegramActivationDelivery,
  processDigiVaultWebhook
};
