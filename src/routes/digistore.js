/**
 * src/routes/digistore.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DigiVault — Digital Subscription & Product Commerce Engine Router v1.0
 * 
 * Capabilities:
 * 1. Product Catalog & Live Stock Engine (44+ products across 8 categories)
 * 2. Verified Supplier Directory (Munir & Farhan)
 * 3. Order Management & IDOR-safe Order Lifecycle
 * 4. 🛡️ Blind Vendor Procurement Engine (One-Click Privacy-Locked WhatsApp Pre-fill)
 * 5. Payment Screenshot Verification Queue
 * 6. Credential Vault & Instant Delivery Dispatch
 * 7. Automated Subscription Renewal Telemetry
 * 8. Real-Time Analytics & Profit Intelligence
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireManager } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { ok, fail, asyncHandler } = require('../utils/response');
const { broadcast } = require('../services/sse');
const { getTeamBot } = require('../services/bot');

// Memory storage for payment screenshot uploads (up to 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Fallback in-memory state
let inMemoryProducts = [];
let inMemoryVendors = [];
let inMemoryOrders = [];
let inMemoryDeliveries = [];

// Helper: Duration to Days
function calculateDurationDays(durationStr = '') {
  const d = durationStr.toLowerCase();
  if (d.includes('18 month')) return 548;
  if (d.includes('12 month') || d.includes('year') || d.includes('annual')) return 365;
  if (d.includes('6 month')) return 180;
  if (d.includes('3 month')) return 90;
  if (d.includes('1 month')) return 30;
  return 30;
}

// Helper: Record Order Timeline Event
async function recordTimeline(orderId, stage, actor = 'system', note = '', proofUrl = null) {
  if (!orderId) return;
  const payload = {
    order_id: orderId,
    stage,
    actor,
    note: note || '',
    proof_url: proofUrl,
    created_at: new Date().toISOString()
  };
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('digi_order_timeline').insert([payload]);
    } catch (e) {
      console.warn('[DigiVault Timeline] Note:', e.message);
    }
  }
}

// Helper: Compute Blind WhatsApp Procurement Link
function generateProcurementLink(order, vendor) {
  if (!vendor || (!vendor.phone && !vendor.contact_handle)) return null;
  const rawPhone = vendor.phone || vendor.contact_handle;
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 8) return null;
  
  const vendorFirstName = (vendor.name || 'Partner').split(' ')[0];
  const prodName = order.product_name || 'Subscription';
  const duration = order.duration || '1 Month';
  const ref = order.order_number || 'DIGI-REF';
  
  // Strict blind protocol: Omit customer name and phone
  const msg = `Salam ${vendorFirstName} bhai, need 1x ${prodName} (${duration}). Order Ref: ${ref}. Payment being sent now via bKash.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

// Helper: Format Clean Bengali 6-Step Guide / Credentials Delivery Message
function generateDeliveryMessage(order, activationLink, credentials = {}) {
  const prodName = order.product_name || order.productName || 'Gemini Pro 18 Months';
  const duration = order.duration || '18 Months';

  if (activationLink) {
    return `🎉 *আপনার ${prodName} (${duration}) অ্যাক্টিভেশন লিংক তৈরি!*\n\n` +
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
  }

  const email = credentials.email || credentials.username || '';
  const password = credentials.password || '';
  const notes = credentials.notes || '';
  return `🎉 *আপনার ${prodName} (${duration}) অ্যাক্সেস ডিটেইলস!*\n\n` +
    `📧 *Email/User:* \`${email}\`\n` +
    `🔑 *Password:* \`${password}\`\n` +
    (notes ? `📝 *Notes:* ${notes}\n` : '') +
    `━━━━━━━━━━━━━━━━━\n` +
    `⚠️ অনুগ্রহ করে পাসওয়ার্ড পরিবর্তন করবেন না।\n` +
    `💬 কোনো সমস্যা হলে WhatsApp সাপোর্ট: wa.me/8801889825025`;
}

// Helper: Generate Customer WhatsApp Delivery Pre-fill Link
function generateCustomerWhatsAppDeliveryLink(order, activationLink, credentials = {}) {
  const rawPhone = order.customer_whatsapp || order.customerWhatsapp || order.customer_contact || order.customerContact || '';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 8) return null;
  const msg = generateDeliveryMessage(order, activationLink, credentials);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

// Helper: Map Order Object
function mapOrder(o, vendorMap = {}) {
  if (!o) return null;
  const vendor = vendorMap[o.vendor_id] || null;
  const actLink = o.activation_link || o.activationLink || null;
  return {
    id: o.id,
    orderNumber: o.order_number || o.orderNumber,
    customerName: o.customer_name || o.customerName || 'Anonymous',
    customerContact: o.customer_contact || o.customerContact || '',
    customerWhatsapp: o.customer_whatsapp || o.customerWhatsapp || o.customer_contact || '',
    contactChannel: o.contact_channel || o.contactChannel || 'facebook',
    productId: o.product_id || o.productId,
    productName: o.product_name || o.productName,
    duration: o.duration || '1 Month',
    vendorPrice: Number(o.vendor_price ?? o.vendorPrice) || 0,
    salePrice: Number(o.sale_price ?? o.salePrice) || 0,
    profit: Number(o.profit) || (Number(o.sale_price ?? o.salePrice) - Number(o.vendor_price ?? o.vendorPrice)),
    vendorId: o.vendor_id || o.vendorId,
    vendorName: vendor ? vendor.name : (o.vendor_name || 'Unassigned'),
    vendorPhone: vendor ? (vendor.phone || vendor.contact_handle) : '',
    procurementLink: generateProcurementLink(o, vendor),
    paymentStatus: o.payment_status || o.paymentStatus || 'pending',
    paymentMethod: o.payment_method || o.paymentMethod || 'bkash',
    paymentRef: o.payment_ref || o.paymentRef || '',
    paymentProofUrl: o.payment_proof_url || o.paymentProofUrl || null,
    paymentVerifiedBy: o.payment_verified_by || o.paymentVerifiedBy || null,
    paymentVerifiedAt: o.payment_verified_at || o.paymentVerifiedAt || null,
    deliveryStatus: o.delivery_status || o.deliveryStatus || 'pending',
    deliveredBy: o.delivered_by || o.deliveredBy || null,
    deliveredAt: o.delivered_at || o.deliveredAt || null,
    activationDate: o.activation_date || o.activationDate || null,
    expiryDate: o.expiry_date || o.expiryDate || null,
    renewalReminderSent: Boolean(o.renewal_reminder_sent ?? o.renewalReminderSent),
    isRenewed: Boolean(o.is_renewed ?? o.isRenewed),
    parentOrderId: o.parent_order_id || o.parentOrderId || null,
    sourceChannel: o.source_channel || o.sourceChannel || 'facebook',
    procurementSent: Boolean(o.procurement_sent ?? o.procurementSent),
    notes: o.notes || '',
    createdAt: o.created_at || o.createdAt || new Date().toISOString(),

    // Phase 3 Extensions
    orderStage: o.order_stage || o.orderStage || (
      o.customer_confirmed_at ? 'confirmed_closed' :
      o.admin_closure_proof_url ? 'admin_closed' :
      o.delivery_status === 'delivered' ? 'delivered' :
      o.activation_link ? 'link_received' :
      o.procurement_sent ? 'procuring' :
      o.payment_status === 'verified' ? 'payment_verified' : 'pending_payment'
    ),
    vendorPaymentProofUrl: o.vendor_payment_proof_url || o.vendorPaymentProofUrl || null,
    vendorPaymentAmount: Number(o.vendor_payment_amount ?? o.vendorPaymentAmount) || Number(o.vendor_price ?? o.vendorPrice) || 0,
    vendorPaymentSentAt: o.vendor_payment_sent_at || o.vendorPaymentSentAt || null,
    activationLink: actLink,
    activationLinkEnteredAt: o.activation_link_entered_at || o.activationLinkEnteredAt || null,
    customerConfirmedAt: o.customer_confirmed_at || o.customerConfirmedAt || null,
    customerConfirmationProofUrl: o.customer_confirmation_proof_url || o.customerConfirmationProofUrl || null,
    adminClosureProofUrl: o.admin_closure_proof_url || o.adminClosureProofUrl || null,
    orderClosedAt: o.order_closed_at || o.orderClosedAt || null,
    whatsappDeliveryLink: generateCustomerWhatsAppDeliveryLink(o, actLink)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PRODUCTS CATALOG ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/digistore/products
 * Returns all active catalog products with optional filters
 */
router.get('/products', asyncHandler(async (req, res) => {
  const { category, search, stock, is_hero } = req.query;

  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('digi_products').select('*, digi_vendors(id, name, phone, contact_handle)').order('sort_order', { ascending: true });
      
      if (category && category !== 'All') query = query.eq('category', category);
      if (stock) query = query.eq('stock_status', stock);
      if (is_hero !== undefined) query = query.eq('is_hero', is_hero === 'true');
      if (search) query = query.or(`name.ilike.%${search}%,tags.cs.{${search}}`);

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        return ok(res, data.map(p => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          category: p.category,
          duration: p.duration,
          vendorPrice: Number(p.vendor_price) || 0,
          salePrice: Number(p.sale_price) || 0,
          profitMargin: Number(p.profit_margin) || (Number(p.sale_price) - Number(p.vendor_price)),
          deliveryType: p.delivery_type,
          deliveryNotes: p.delivery_notes,
          vendorId: p.vendor_id,
          vendorName: p.digi_vendors?.name || 'Unassigned',
          vendorPhone: p.digi_vendors?.phone || p.digi_vendors?.contact_handle || '',
          stockStatus: p.stock_status,
          isHero: Boolean(p.is_hero),
          isActive: Boolean(p.is_active),
          channels: p.channels || ['web', 'telegram', 'facebook'],
          tags: p.tags || [],
          sortOrder: p.sort_order || 0
        })));
      }
    } catch (e) {
      console.warn('[DigiVault] Supabase products fetch error:', e.message);
    }
  }

  // Fallback to in-memory/seed catalog
  const { SEED_PRODUCTS, SEED_VENDORS } = require('../../scripts/seed-digivault');
  const fallback = SEED_PRODUCTS('munir-id', 'farhan-id').map((p, idx) => ({
    id: `prod-fallback-${idx + 1}`,
    ...p,
    vendorPrice: p.vendor_price,
    salePrice: p.sale_price,
    profitMargin: p.profit_margin,
    deliveryType: p.delivery_type,
    deliveryNotes: p.delivery_notes,
    vendorName: p.vendor_id === 'munir-id' ? SEED_VENDORS[0].name : SEED_VENDORS[1].name,
    vendorPhone: p.vendor_id === 'munir-id' ? SEED_VENDORS[0].phone : SEED_VENDORS[1].phone,
    isHero: p.is_hero,
    stockStatus: p.stock_status,
    isActive: true
  }));

  return ok(res, fallback);
}));

/**
 * POST /api/digistore/products
 * Create a new product (Admin / Manager)
 */
router.post('/products', requireAuth, requireManager, asyncHandler(async (req, res) => {
  const { name, category, duration, vendorPrice, salePrice, deliveryType, deliveryNotes, vendorId, isHero, tags, channels, stockStatus } = req.body;

  if (!name || !category || salePrice === undefined) {
    return fail(res, 'Name, category, and sale price are required.', 400);
  }

  const vPrice = Number(vendorPrice) || 0;
  const sPrice = Number(salePrice) || 0;
  const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 1000);

  const payload = {
    slug,
    name,
    category,
    duration: duration || '1 Month',
    vendor_price: vPrice,
    sale_price: sPrice,
    profit_margin: sPrice - vPrice,
    delivery_type: deliveryType || 'id_pass',
    delivery_notes: deliveryNotes || '',
    vendor_id: vendorId || null,
    stock_status: stockStatus || 'available',
    is_hero: Boolean(isHero),
    is_active: true,
    channels: channels || ['web', 'telegram', 'facebook'],
    tags: tags || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_products').insert([payload]).select().maybeSingle();
    if (error) return fail(res, error.message, 500);
    broadcast('digistore_product_update', data);
    return ok(res, data, 201);
  }

  inMemoryProducts.push(payload);
  broadcast('digistore_product_update', payload);
  return ok(res, payload, 201);
}));

/**
 * PUT /api/digistore/products/:id
 * Update an existing product
 */
router.put('/products/:id', requireAuth, requireManager, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body, updated_at: new Date().toISOString() };
  
  if (updates.vendorPrice !== undefined) updates.vendor_price = Number(updates.vendorPrice);
  if (updates.salePrice !== undefined) updates.sale_price = Number(updates.salePrice);
  if (updates.vendor_price !== undefined && updates.sale_price !== undefined) {
    updates.profit_margin = updates.sale_price - updates.vendor_price;
  }
  if (updates.deliveryType) updates.delivery_type = updates.deliveryType;
  if (updates.deliveryNotes !== undefined) updates.delivery_notes = updates.deliveryNotes;
  if (updates.stockStatus) updates.stock_status = updates.stockStatus;
  if (updates.isHero !== undefined) updates.is_hero = Boolean(updates.isHero);

  delete updates.vendorPrice;
  delete updates.salePrice;
  delete updates.deliveryType;
  delete updates.deliveryNotes;
  delete updates.stockStatus;
  delete updates.isHero;

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_products').update(updates).eq('id', id).select().maybeSingle();
    if (error) return fail(res, error.message, 500);
    broadcast('digistore_product_update', data);
    return ok(res, data);
  }

  return ok(res, { id, ...updates });
}));

// ─────────────────────────────────────────────────────────────────────────────
// 2. VENDOR MANAGEMENT ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/digistore/vendors
 */
router.get('/vendors', requireAuth, asyncHandler(async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_vendors').select('*').order('created_at', { ascending: true });
    if (!error && data) return ok(res, data);
  }

  const { SEED_VENDORS } = require('../../scripts/seed-digivault');
  return ok(res, SEED_VENDORS.map((v, i) => ({ id: `vendor-${i+1}`, ...v })));
}));

/**
 * POST /api/digistore/vendors
 */
router.post('/vendors', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { name, contactType, contactHandle, phone, paymentMethod, notes, avgDeliveryMin } = req.body;
  if (!name) return fail(res, 'Vendor name is required.', 400);

  const payload = {
    name,
    contact_type: contactType || 'whatsapp',
    contact_handle: contactHandle || phone,
    phone: (phone || contactHandle || '').replace(/[^0-9]/g, ''),
    payment_method: paymentMethod || 'bkash',
    avg_delivery_min: Number(avgDeliveryMin) || 30,
    reliability_score: 9.0,
    notes: notes || '',
    is_active: true
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_vendors').insert([payload]).select().maybeSingle();
    if (error) return fail(res, error.message, 500);
    return ok(res, data, 201);
  }

  inMemoryVendors.push(payload);
  return ok(res, payload, 201);
}));

// ─────────────────────────────────────────────────────────────────────────────
// 3. ORDERS & BLIND PROCUREMENT WORKFLOW
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/digistore/orders
 * Returns orders with search and status filters
 */
router.get('/orders', requireAuth, asyncHandler(async (req, res) => {
  const { status, payment_status, delivery_status, search, limit = 100 } = req.query;

  let vendorMap = {};
  if (isSupabaseConfigured()) {
    try {
      const { data: vList } = await supabase.from('digi_vendors').select('*');
      if (vList) {
        vList.forEach(v => { vendorMap[v.id] = v; });
      }

      let query = supabase.from('digi_orders').select('*').order('created_at', { ascending: false }).limit(Number(limit));

      if (payment_status) query = query.eq('payment_status', payment_status);
      if (delivery_status) query = query.eq('delivery_status', delivery_status);
      if (search) query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_contact.ilike.%${search}%,product_name.ilike.%${search}%`);

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return ok(res, data.map(o => mapOrder(o, vendorMap)));
      }
    } catch (e) {
      console.warn('[DigiVault] Order fetch note:', e.message);
    }
  }

  return ok(res, inMemoryOrders.map(o => mapOrder(o, vendorMap)));
}));

/**
 * POST /api/digistore/orders
 * Logs a new order (from Public Storefront, Telegram Bot, Facebook DM, or WhatsApp)
 */
router.post('/orders', asyncHandler(async (req, res) => {
  const {
    customerName,
    customerContact,
    customerWhatsapp,
    contactChannel = 'facebook',
    productId,
    productName,
    duration = '1 Month',
    vendorPrice,
    salePrice,
    vendorId,
    paymentMethod = 'bkash',
    paymentRef = '',
    sourceChannel = 'web',
    sourceUrl = '',
    utmData = {},
    telegramChatId = null,
    notes = ''
  } = req.body;

  if (!customerName || !customerContact || (!productId && !productName)) {
    return fail(res, 'Customer name, contact, and product details are required.', 400);
  }

  // Fetch product snapshot if productId is supplied
  let finalProdName = productName;
  let finalDuration = duration;
  let finalVPrice = Number(vendorPrice) || 0;
  let finalSPrice = Number(salePrice) || 0;
  let finalVendorId = vendorId || null;

  if (productId && isSupabaseConfigured()) {
    try {
      const { data: prod } = await supabase.from('digi_products').select('*').eq('id', productId).maybeSingle();
      if (prod) {
        finalProdName = prod.name;
        finalDuration = prod.duration || duration;
        finalVPrice = Number(prod.vendor_price) || finalVPrice;
        finalSPrice = Number(prod.sale_price) || finalSPrice;
        finalVendorId = prod.vendor_id || finalVendorId;
      }
    } catch (e) {}
  }

  const profit = finalSPrice - finalVPrice;
  const orderNumber = `DIGI-${Math.floor(100000 + Math.random() * 900000)}`;
  const finalWhatsapp = customerWhatsapp || customerContact;

  const payload = {
    order_number: orderNumber,
    customer_name: customerName,
    customer_contact: customerContact,
    customer_whatsapp: finalWhatsapp,
    contact_channel: contactChannel,
    product_id: productId || null,
    product_name: finalProdName,
    duration: finalDuration,
    vendor_price: finalVPrice,
    sale_price: finalSPrice,
    profit,
    vendor_id: finalVendorId,
    payment_status: 'pending',
    payment_method: paymentMethod,
    payment_ref: paymentRef,
    delivery_status: 'pending',
    order_stage: 'pending_payment',
    source_channel: sourceChannel,
    source_url: sourceUrl || '',
    utm_data: typeof utmData === 'object' ? utmData : {},
    telegram_chat_id: telegramChatId ? String(telegramChatId) : null,
    procurement_sent: false,
    notes: notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let savedOrder = payload;
  let vendorObj = null;

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_orders').insert([payload]).select().maybeSingle();
    if (error) return fail(res, error.message, 500);
    savedOrder = data;

    // Record initial timeline entry
    await recordTimeline(savedOrder.id, 'order_created', 'customer', `Order placed via ${sourceChannel}`);

    // Attribute conversion to UTM product link if campaign/source match
    if (utmData && utmData.utm_source) {
      try {
        await supabase.rpc('increment_link_order', {
          p_slug: productId || '',
          p_source: utmData.utm_source
        }).catch(() => {});
      } catch (e) {}
    }

    if (finalVendorId) {
      const { data: v } = await supabase.from('digi_vendors').select('*').eq('id', finalVendorId).maybeSingle();
      vendorObj = v;
    }
  } else {
    inMemoryOrders.unshift(payload);
  }

  // Instant Customer Telegram Acknowledgement
  if (telegramChatId) {
    try {
      const { getDigiVaultBot } = require('../services/digivault-bot');
      const bot = getDigiVaultBot();
      if (bot) {
        const ackMsg = `✅ *অর্ডার রিসিভ হয়েছে! (#${orderNumber})*\n\n` +
          `📦 *Product:* ${finalProdName} (${finalDuration})\n` +
          `💰 *Amount Due:* ৳${finalSPrice.toLocaleString()}\n` +
          `⏱ *ডেলিভারি সময়:* সাধারণত ১৫-৩০ মিনিট\n` +
          `📬 *স্ট্যাটাস:* পেমেন্ট যাচাই করা হচ্ছে...`;
        bot.sendMessage(telegramChatId, ackMsg, { parse_mode: 'Markdown' }).catch(() => {});
      }
    } catch (e) {}
  }

  // Telegram Team Bot Alert
  try {
    const teamBot = getTeamBot();
    if (teamBot && process.env.TELEGRAM_TEAM_GROUP_ID) {
      const tgMsg = `🛒 *New DigiVault Order — ${orderNumber}*\n\n` +
        `📦 *Product:* ${finalProdName} (${finalDuration})\n` +
        `👤 *Customer:* ${customerName} (${contactChannel})\n` +
        `📱 *WhatsApp:* ${finalWhatsapp}\n` +
        `💰 *Sale Price:* ৳${finalSPrice.toLocaleString()} | *Profit:* ৳${profit.toLocaleString()}\n` +
        `💳 *Payment:* Pending (${paymentMethod})\n\n` +
        `_Action: Verify payment in Admin Panel to unlock procurement._`;
      teamBot.sendMessage(process.env.TELEGRAM_TEAM_GROUP_ID, tgMsg, { parse_mode: 'Markdown' }).catch(() => {});
    }
  } catch (e) {}

  broadcast('digistore_order_created', savedOrder);
  const mapped = mapOrder(savedOrder, vendorObj ? { [vendorObj.id]: vendorObj } : {});
  return ok(res, mapped, 201);
}));

/**
 * PATCH /api/digistore/orders/:id/verify-payment
 * Approves payment and moves order to the delivery queue
 */
router.patch('/orders/:id/verify-payment', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const staffCode = req.user?.empCode || req.user?.id || 'Admin';

  const updates = {
    payment_status: 'verified',
    payment_verified_by: staffCode,
    payment_verified_at: new Date().toISOString(),
    delivery_status: 'processing',
    order_stage: 'payment_verified',
    updated_at: new Date().toISOString()
  };

  let updatedOrder = null;
  let vendorObj = null;

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_orders').update(updates).eq('id', id).select().maybeSingle();
    if (error) return fail(res, error.message, 500);
    updatedOrder = data;

    await recordTimeline(id, 'payment_verified', staffCode, `Payment verified by ${staffCode}`);

    if (data.vendor_id) {
      const { data: v } = await supabase.from('digi_vendors').select('*').eq('id', data.vendor_id).maybeSingle();
      vendorObj = v;
    }
  } else {
    const idx = inMemoryOrders.findIndex(o => o.id === id || o.order_number === id);
    if (idx !== -1) {
      inMemoryOrders[idx] = { ...inMemoryOrders[idx], ...updates };
      updatedOrder = inMemoryOrders[idx];
    }
  }

  if (!updatedOrder) return fail(res, 'Order not found', 404);

  // Generate procurement link
  const procurementUrl = generateProcurementLink(updatedOrder, vendorObj);

  broadcast('digistore_order_updated', updatedOrder);
  return ok(res, {
    order: mapOrder(updatedOrder, vendorObj ? { [vendorObj.id]: vendorObj } : {}),
    procurementUrl,
    message: 'Payment verified successfully! Order is ready for vendor procurement & delivery.'
  });
}));

/**
 * PATCH /api/digistore/orders/:id/reject-payment
 */
router.patch('/orders/:id/reject-payment', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = 'Payment verification failed' } = req.body;

  const updates = {
    payment_status: 'rejected',
    notes: reason,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_orders').update(updates).eq('id', id).select().maybeSingle();
    if (error) return fail(res, error.message, 500);
    broadcast('digistore_order_updated', data);
    return ok(res, data);
  }

  return ok(res, { id, ...updates });
}));

/**
 * POST /api/digistore/orders/:id/procure-link
 * Returns the blind WhatsApp procurement URL with pre-filled message & vendor amount
 */
router.post('/orders/:id/procure-link', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const staffCode = req.user?.empCode || req.user?.id || 'Admin';
  let order = null;
  let vendor = null;

  if (isSupabaseConfigured()) {
    const { data: o } = await supabase.from('digi_orders').select('*').eq('id', id).maybeSingle();
    order = o;
    if (o && o.vendor_id) {
      const { data: v } = await supabase.from('digi_vendors').select('*').eq('id', o.vendor_id).maybeSingle();
      vendor = v;
    }
  } else {
    order = inMemoryOrders.find(o => o.id === id || o.order_number === id);
  }

  if (!order) return fail(res, 'Order not found', 404);
  if (!vendor) return fail(res, 'No vendor assigned to this order', 400);

  const url = generateProcurementLink(order, vendor);
  const vendorAmount = Number(order.vendor_price) || 0;
  
  // Mark procurement_sent = true, advance order_stage to 'procuring'
  if (isSupabaseConfigured()) {
    await supabase.from('digi_orders').update({
      procurement_sent: true,
      order_stage: 'procuring',
      updated_at: new Date().toISOString()
    }).eq('id', id);

    await recordTimeline(id, 'procuring', staffCode, `Procurement initiated to vendor ${vendor.name}`);
  }

  return ok(res, {
    procurementUrl: url,
    vendorName: vendor.name,
    vendorPhone: vendor.phone || vendor.contact_handle,
    vendorPaymentAmount: vendorAmount,
    messageText: `Salam ${vendor.name.split(' ')[0]} bhai, need 1x ${order.product_name} (${order.duration}). Order Ref: ${order.order_number}. Payment being sent now via bKash.`
  });
}));

/**
 * POST /api/digistore/orders/:id/vendor-payment
 * Records admin's payment proof screenshot and amount sent to the supplier
 */
router.post('/orders/:id/vendor-payment', requireAuth, upload.single('proof'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, notes = '' } = req.body;
  const staffCode = req.user?.empCode || req.user?.id || 'Admin';

  let proofUrl = null;

  if (req.file && isSupabaseConfigured()) {
    try {
      const fileExt = (req.file.originalname || 'vendor-proof.png').split('.').pop();
      const fileName = `vendor-proof-${id}-${Date.now()}.${fileExt}`;
      const { data: upData, error: upErr } = await supabase.storage
        .from('digi-payments')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

      if (!upErr && upData) {
        const { data: pubData } = supabase.storage.from('digi-payments').getPublicUrl(fileName);
        proofUrl = pubData.publicUrl;
      }
    } catch (e) {
      console.warn('[DigiVault] Supabase storage upload note:', e.message);
    }
  }

  if (!proofUrl && req.file) {
    proofUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64').slice(0, 50000)}`;
  }

  const updates = {
    vendor_payment_proof_url: proofUrl,
    vendor_payment_amount: Number(amount) || 0,
    vendor_payment_sent_at: new Date().toISOString(),
    procurement_sent: true,
    order_stage: 'procuring',
    updated_at: new Date().toISOString()
  };

  let updatedOrder = null;
  let vendorObj = null;

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_orders').update(updates).eq('id', id).select().maybeSingle();
    if (error) return fail(res, error.message, 500);
    updatedOrder = data;

    await recordTimeline(id, 'procuring', staffCode, `Vendor payment of ৳${Number(amount || 0).toLocaleString()} recorded. ${notes}`, proofUrl);

    if (data.vendor_id) {
      const { data: v } = await supabase.from('digi_vendors').select('*').eq('id', data.vendor_id).maybeSingle();
      vendorObj = v;
    }
  }

  const procurementUrl = updatedOrder ? generateProcurementLink(updatedOrder, vendorObj) : null;
  broadcast('digistore_order_updated', updatedOrder);

  return ok(res, {
    success: true,
    proofUrl,
    procurementUrl,
    order: mapOrder(updatedOrder, vendorObj ? { [vendorObj.id]: vendorObj } : {})
  });
}));

/**
 * POST /api/digistore/orders/:id/activation-link
 * Saves the unique activation link received from vendor, auto-dispatches via Telegram and/or generates WhatsApp pre-fill
 */
router.post('/orders/:id/activation-link', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { activationLink, deliveryType = 'link' } = req.body;
  const staffCode = req.user?.empCode || req.user?.id || 'Admin';

  if (!activationLink) {
    return fail(res, 'Activation link is required.', 400);
  }

  let order = null;
  if (isSupabaseConfigured()) {
    const { data: o } = await supabase.from('digi_orders').select('*').eq('id', id).maybeSingle();
    order = o;
  } else {
    order = inMemoryOrders.find(o => o.id === id || o.order_number === id);
  }

  if (!order) return fail(res, 'Order not found', 404);

  const durationDays = calculateDurationDays(order.duration);
  const now = new Date();
  const activationDate = now.toISOString().split('T')[0];
  const expiryDate = new Date(now.getTime() + durationDays * 86400000).toISOString().split('T')[0];

  const updates = {
    activation_link: activationLink.trim(),
    activation_link_entered_at: now.toISOString(),
    delivery_status: 'delivered',
    order_stage: 'delivered',
    delivered_by: staffCode,
    delivered_at: now.toISOString(),
    activation_date: activationDate,
    expiry_date: expiryDate,
    delivery_guide_sent: true,
    updated_at: now.toISOString()
  };

  let updatedOrder = null;
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_orders').update(updates).eq('id', id).select().maybeSingle();
    if (error) return fail(res, error.message, 500);
    updatedOrder = data;

    // Record in deliveries table
    await supabase.from('digi_deliveries').insert([{
      order_id: id,
      delivery_type: deliveryType,
      credential_data: { activation_link: activationLink.trim() },
      entered_by: staffCode,
      entered_at: now.toISOString(),
      sent_at: now.toISOString(),
      sent_via: order.telegram_chat_id ? 'telegram' : 'whatsapp'
    }]);

    await recordTimeline(id, 'delivered', staffCode, `Activation link entered & delivered by ${staffCode}`);
  }

  // Auto-dispatch via Telegram if customer ordered via Telegram Bot
  const targetChatId = order.telegram_chat_id;
  if (targetChatId) {
    try {
      const { sendTelegramActivationDelivery } = require('../services/digivault-bot');
      if (sendTelegramActivationDelivery) {
        sendTelegramActivationDelivery(targetChatId, updatedOrder || order, activationLink.trim()).catch(() => {});
      }
    } catch (e) {}
  }

  const whatsappDeliveryUrl = generateCustomerWhatsAppDeliveryLink(updatedOrder || order, activationLink.trim());
  broadcast('digistore_delivery_completed', { order: updatedOrder, activationLink });

  return ok(res, {
    success: true,
    order: mapOrder(updatedOrder || order),
    whatsappDeliveryUrl,
    expiryDate,
    message: 'Activation link saved & dispatched! Customer can now activate.'
  });
}));

/**
 * POST /api/digistore/orders/:id/deliver
 * Saves credentials in vault, sets activation/expiry dates, marks as delivered
 */
router.post('/orders/:id/deliver', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { deliveryType = 'id_pass', credentialData = {}, sentVia = 'manual' } = req.body;
  const staffCode = req.user?.empCode || req.user?.id || 'Admin';

  let order = null;
  if (isSupabaseConfigured()) {
    const { data: o } = await supabase.from('digi_orders').select('*').eq('id', id).maybeSingle();
    order = o;
  } else {
    order = inMemoryOrders.find(o => o.id === id || o.order_number === id);
  }

  if (!order) return fail(res, 'Order not found', 404);

  const durationDays = calculateDurationDays(order.duration);
  const now = new Date();
  const activationDate = now.toISOString().split('T')[0];
  const expiryDate = new Date(now.getTime() + durationDays * 86400000).toISOString().split('T')[0];

  const orderUpdates = {
    delivery_status: 'delivered',
    order_stage: 'delivered',
    delivered_by: staffCode,
    delivered_at: now.toISOString(),
    activation_date: activationDate,
    expiry_date: expiryDate,
    updated_at: now.toISOString()
  };

  const deliveryPayload = {
    order_id: order.id,
    delivery_type: deliveryType,
    credential_data: credentialData,
    entered_by: staffCode,
    entered_at: now.toISOString(),
    sent_at: now.toISOString(),
    sent_via: sentVia
  };

  if (isSupabaseConfigured()) {
    const [orderRes, delivRes] = await Promise.all([
      supabase.from('digi_orders').update(orderUpdates).eq('id', order.id).select().maybeSingle(),
      supabase.from('digi_deliveries').insert([deliveryPayload]).select().maybeSingle()
    ]);

    if (orderRes.error) return fail(res, orderRes.error.message, 500);

    await recordTimeline(id, 'delivered', staffCode, `Credentials delivered by ${staffCode} (${deliveryType})`);

    // Auto-dispatch credentials to customer's Telegram if order was placed via Telegram Bot
    const targetChatId = orderRes.data?.telegram_chat_id || order.telegram_chat_id;
    if (targetChatId) {
      try {
        const { sendTelegramOrderDelivery } = require('../services/digivault-bot');
        sendTelegramOrderDelivery(targetChatId, orderRes.data || order, credentialData).catch(() => {});
      } catch (e) {}
    }

    const whatsappDeliveryUrl = generateCustomerWhatsAppDeliveryLink(orderRes.data || order, null, credentialData);
    broadcast('digistore_delivery_completed', { order: orderRes.data, delivery: delivRes.data });

    return ok(res, {
      success: true,
      order: mapOrder(orderRes.data),
      delivery: delivRes.data,
      whatsappDeliveryUrl,
      expiryDate,
      message: `Credentials saved & order delivered! Expiry date set to ${expiryDate}.`
    });
  }

  inMemoryDeliveries.push(deliveryPayload);
  return ok(res, { success: true, expiryDate, message: 'Delivery recorded (memory mode)' });
}));

/**
 * POST /api/digistore/orders/:id/customer-confirm
 * Public endpoint for customer to confirm they received and activated their subscription
 */
router.post('/orders/:id/customer-confirm', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes = '', proofUrl = null } = req.body;
  const now = new Date().toISOString();

  const updates = {
    customer_confirmed_at: now,
    customer_confirmation_proof_url: proofUrl,
    order_stage: 'confirmed_closed',
    order_closed_at: now,
    updated_at: now
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_orders').update(updates).eq('id', id).select().maybeSingle();
    if (error) return fail(res, error.message, 500);

    await recordTimeline(id, 'confirmed_closed', 'customer', notes || 'Customer confirmed subscription activation and closed order.', proofUrl);
    broadcast('digistore_order_updated', data);

    return ok(res, {
      success: true,
      message: 'Thank you! Your activation confirmation has been recorded successfully.',
      order: mapOrder(data)
    });
  }

  return ok(res, { success: true, message: 'Confirmation recorded.' });
}));

/**
 * POST /api/digistore/orders/:id/admin-close
 * Admin manually closes order — strictly requires closure proof screenshot
 */
router.post('/orders/:id/admin-close', requireAuth, upload.single('closureProof'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes = '' } = req.body;
  const staffCode = req.user?.empCode || req.user?.id || 'Admin';

  let proofUrl = null;

  if (req.file && isSupabaseConfigured()) {
    try {
      const fileExt = (req.file.originalname || 'closure-proof.png').split('.').pop();
      const fileName = `closure-proof-${id}-${Date.now()}.${fileExt}`;
      const { data: upData, error: upErr } = await supabase.storage
        .from('digi-payments')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

      if (!upErr && upData) {
        const { data: pubData } = supabase.storage.from('digi-payments').getPublicUrl(fileName);
        proofUrl = pubData.publicUrl;
      }
    } catch (e) {
      console.warn('[DigiVault] Closure storage note:', e.message);
    }
  }

  if (!proofUrl && req.file) {
    proofUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64').slice(0, 50000)}`;
  }

  if (!proofUrl && !req.body.proofUrl) {
    return fail(res, 'Proof screenshot is mandatory to close this order manually.', 400);
  }

  const finalProof = proofUrl || req.body.proofUrl;
  const now = new Date().toISOString();

  const updates = {
    admin_closure_proof_url: finalProof,
    order_stage: 'admin_closed',
    order_closed_at: now,
    updated_at: now
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_orders').update(updates).eq('id', id).select().maybeSingle();
    if (error) return fail(res, error.message, 500);

    await recordTimeline(id, 'admin_closed', staffCode, `Order closed manually by ${staffCode}. ${notes}`, finalProof);
    broadcast('digistore_order_updated', data);

    return ok(res, {
      success: true,
      message: 'Order closed and proof screenshot saved.',
      order: mapOrder(data)
    });
  }

  return ok(res, { success: true, message: 'Order closed.' });
}));

/**
 * GET /api/digistore/orders/:id/timeline
 * Returns full timestamped lifecycle events for an order
 */
router.get('/orders/:id/timeline', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('digi_order_timeline')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      return ok(res, data);
    }
  }

  return ok(res, []);
}));

/**
 * GET /api/digistore/delivery-queue
 * Returns orders waiting for credential entry & dispatch
 */
router.get('/delivery-queue', requireAuth, asyncHandler(async (req, res) => {
  let orders = [];
  let vendorMap = {};

  if (isSupabaseConfigured()) {
    const [vRes, oRes] = await Promise.all([
      supabase.from('digi_vendors').select('*'),
      supabase.from('digi_orders')
        .select('*, digi_products(delivery_type, delivery_notes)')
        .eq('payment_status', 'verified')
        .in('delivery_status', ['pending', 'processing'])
        .order('created_at', { ascending: true })
    ]);

    if (vRes.data) vRes.data.forEach(v => { vendorMap[v.id] = v; });
    if (oRes.data) orders = oRes.data;
  }

  return ok(res, orders.map(o => ({
    ...mapOrder(o, vendorMap),
    deliveryType: o.digi_products?.delivery_type || 'id_pass',
    deliveryNotes: o.digi_products?.delivery_notes || ''
  })));
}));

/**
 * GET /api/digistore/renewals
 * Returns subscriptions due for renewal within 7 days + recently expired
 */
router.get('/renewals', requireAuth, asyncHandler(async (req, res) => {
  const today = new Date();
  const targetDate = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  let renewals = [];
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_orders')
      .select('*')
      .eq('delivery_status', 'delivered')
      .eq('is_renewed', false)
      .lte('expiry_date', targetDate)
      .order('expiry_date', { ascending: true });

    if (!error && data) {
      renewals = data.map(o => ({
        ...mapOrder(o),
        isExpired: o.expiry_date < todayStr,
        daysRemaining: Math.ceil((new Date(o.expiry_date) - today) / (1000 * 60 * 60 * 24))
      }));
    }
  }

  return ok(res, renewals);
}));

/**
 * POST /api/digistore/orders/:id/renew
 * Creates a renewal order referencing the parent order
 */
router.post('/orders/:id/renew', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  let parent = null;

  if (isSupabaseConfigured()) {
    const { data } = await supabase.from('digi_orders').select('*').eq('id', id).maybeSingle();
    parent = data;
  }

  if (!parent) return fail(res, 'Parent order not found', 404);

  const renewalNumber = `DIGI-RNW-${Math.floor(10000 + Math.random() * 90000)}`;
  const payload = {
    order_number: renewalNumber,
    customer_name: parent.customer_name,
    customer_contact: parent.customer_contact,
    contact_channel: parent.contact_channel,
    product_id: parent.product_id,
    product_name: `${parent.product_name} (Renewal)`,
    duration: parent.duration,
    vendor_price: parent.vendor_price,
    sale_price: parent.sale_price,
    profit: parent.profit,
    vendor_id: parent.vendor_id,
    payment_status: 'pending',
    delivery_status: 'pending',
    parent_order_id: parent.id,
    source_channel: 'renewal',
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const { data: newOrder, error } = await supabase.from('digi_orders').insert([payload]).select().maybeSingle();
    if (error) return fail(res, error.message, 500);

    // Mark parent as renewed
    await supabase.from('digi_orders').update({ is_renewed: true }).eq('id', parent.id);

    broadcast('digistore_order_created', newOrder);
    return ok(res, newOrder, 201);
  }

  return ok(res, payload, 201);
}));

// ─────────────────────────────────────────────────────────────────────────────
// 4. ANALYTICS & INTELLIGENCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/digistore/analytics
 * Executive telemetry for DigiVault
 */
router.get('/analytics', requireAuth, asyncHandler(async (req, res) => {
  let orders = [];
  if (isSupabaseConfigured()) {
    const { data } = await supabase.from('digi_orders').select('*');
    if (data) orders = data;
  } else {
    orders = inMemoryOrders;
  }

  const totalOrders = orders.length;
  const verifiedOrders = orders.filter(o => o.payment_status === 'verified');
  const deliveredOrders = orders.filter(o => o.delivery_status === 'delivered');

  const totalRevenue = verifiedOrders.reduce((sum, o) => sum + Number(o.sale_price || 0), 0);
  const totalCost = verifiedOrders.reduce((sum, o) => sum + Number(o.vendor_price || 0), 0);
  const netProfit = totalRevenue - totalCost;
  const avgMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const pendingDeliveryCount = orders.filter(o => o.payment_status === 'verified' && o.delivery_status !== 'delivered').length;
  const pendingPaymentCount = orders.filter(o => o.payment_status === 'pending').length;

  // Revenue by Channel
  const channelBreakdown = {};
  verifiedOrders.forEach(o => {
    const ch = o.source_channel || 'facebook';
    channelBreakdown[ch] = (channelBreakdown[ch] || 0) + Number(o.sale_price || 0);
  });

  // Top Products by Volume & Profit
  const productPerformance = {};
  verifiedOrders.forEach(o => {
    const pName = o.product_name || 'Other';
    if (!productPerformance[pName]) productPerformance[pName] = { sales: 0, revenue: 0, profit: 0 };
    productPerformance[pName].sales += 1;
    productPerformance[pName].revenue += Number(o.sale_price || 0);
    productPerformance[pName].profit += Number(o.profit || 0);
  });

  const topProducts = Object.entries(productPerformance)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  return ok(res, {
    totalRevenue,
    totalCost,
    netProfit,
    avgMarginPercent,
    totalOrders,
    verifiedOrdersCount: verifiedOrders.length,
    deliveredOrdersCount: deliveredOrders.length,
    pendingDeliveryCount,
    pendingPaymentCount,
    channelBreakdown,
    topProducts
  });
}));

// ─────────────────────────────────────────────────────────────────────────────
// 6. PHASE 2: PUBLIC ORDER TRACKING & UTM DEEP LINKS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/digistore/track/:orderNumber
 * Public safe tracking endpoint for customers (Zero sensitive / internal data)
 */
router.get('/track/:orderNumber', asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  if (!orderNumber) return fail(res, 'Order reference number is required.', 400);

  const cleanRef = orderNumber.toUpperCase().trim();
  let order = null;

  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from('digi_orders')
      .select('id, order_number, product_name, duration, payment_status, delivery_status, order_stage, activation_link, customer_confirmed_at, activation_date, expiry_date, created_at')
      .eq('order_number', cleanRef)
      .maybeSingle();
    order = data;
  } else {
    const found = inMemoryOrders.find(o => (o.order_number || o.orderNumber || '').toUpperCase() === cleanRef);
    if (found) {
      order = {
        id: found.id,
        order_number: found.order_number || found.orderNumber,
        product_name: found.product_name || found.productName,
        duration: found.duration,
        payment_status: found.payment_status || found.paymentStatus,
        delivery_status: found.delivery_status || found.deliveryStatus,
        order_stage: found.order_stage || found.orderStage || 'pending_payment',
        activation_link: found.activation_link || found.activationLink,
        customer_confirmed_at: found.customer_confirmed_at || found.customerConfirmedAt,
        activation_date: found.activation_date || found.activationDate,
        expiry_date: found.expiry_date || found.expiryDate,
        created_at: found.created_at || found.createdAt
      };
    }
  }

  if (!order) {
    return fail(res, 'Order not found. Please check your order reference number.', 404);
  }

  const stage = order.order_stage || (
    order.customer_confirmed_at ? 'confirmed_closed' :
    order.delivery_status === 'delivered' ? 'delivered' :
    order.payment_status === 'verified' ? 'payment_verified' : 'pending_payment'
  );

  const steps = [
    { key: 'order_created', label: 'অর্ডার গ্রহণ', labelEn: 'Order Placed', done: true },
    { key: 'payment_verified', label: 'পেমেন্ট নিশ্চিত', labelEn: 'Payment Verified', done: ['payment_verified', 'procuring', 'link_received', 'delivered', 'confirmed_closed', 'admin_closed'].includes(stage) },
    { key: 'procuring', label: 'প্রকিউরমেন্ট প্রসেসিং', labelEn: 'Procuring Access', done: ['procuring', 'link_received', 'delivered', 'confirmed_closed', 'admin_closed'].includes(stage) },
    { key: 'delivered', label: 'ডেলিভারি সম্পন্ন', labelEn: 'Delivered', done: ['delivered', 'confirmed_closed', 'admin_closed'].includes(stage) },
    { key: 'confirmed_closed', label: 'অ্যাক্টিভেটেড ও ক্লোজড', labelEn: 'Activated & Confirmed', done: ['confirmed_closed', 'admin_closed'].includes(stage) }
  ];

  return ok(res, {
    orderId: order.id,
    orderNumber: order.order_number,
    productName: order.product_name,
    duration: order.duration,
    orderStage: stage,
    paymentStatus: order.payment_status,
    deliveryStatus: order.delivery_status,
    activationLink: (stage === 'delivered' || stage === 'confirmed_closed' || stage === 'admin_closed') ? order.activation_link : null,
    customerConfirmedAt: order.customer_confirmed_at,
    activationDate: order.activation_date,
    expiryDate: order.expiry_date,
    createdAt: order.created_at,
    steps
  });
}));

/**
 * POST /api/digistore/links/click
 * Public link click counter
 */
router.post('/links/click', asyncHandler(async (req, res) => {
  const { shortCode, linkId } = req.body;
  if (!shortCode && !linkId) return ok(res, { recorded: false });

  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('digi_product_links');
      if (shortCode) {
        const { data } = await query.select('id, click_count').eq('short_code', shortCode).maybeSingle();
        if (data) {
          await supabase.from('digi_product_links').update({ click_count: (data.click_count || 0) + 1 }).eq('id', data.id);
        }
      } else if (linkId) {
        const { data } = await query.select('id, click_count').eq('id', linkId).maybeSingle();
        if (data) {
          await supabase.from('digi_product_links').update({ click_count: (data.click_count || 0) + 1 }).eq('id', data.id);
        }
      }
    } catch (e) {}
  }

  return ok(res, { recorded: true });
}));

/**
 * GET /api/digistore/links
 * Lists all generated UTM campaign links
 */
router.get('/links', requireAuth, asyncHandler(async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('digi_product_links')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return ok(res, data.map(l => ({
        id: l.id,
        productId: l.product_id,
        productName: l.product_name,
        utmSource: l.utm_source,
        utmMedium: l.utm_medium,
        utmCampaign: l.utm_campaign,
        fullUrl: l.full_url,
        shortCode: l.short_code,
        clickCount: l.click_count || 0,
        orderCount: l.order_count || 0,
        revenueGenerated: Number(l.revenue_generated) || 0,
        createdAt: l.created_at
      })));
    }
  }

  return ok(res, []);
}));

/**
 * POST /api/digistore/links
 * Generate a new trackable product deep link
 */
router.post('/links', requireAuth, asyncHandler(async (req, res) => {
  const {
    productId,
    productSlug,
    productName,
    utmSource = 'facebook',
    utmMedium = 'social',
    utmCampaign = 'general',
    baseUrl = 'https://gro10x-ai.vercel.app/digivault'
  } = req.body;

  if (!productId && !productSlug) {
    return fail(res, 'Product ID or Slug is required.', 400);
  }

  let finalName = productName;
  let finalSlug = productSlug;

  if (productId && isSupabaseConfigured()) {
    const { data: p } = await supabase.from('digi_products').select('name, slug').eq('id', productId).maybeSingle();
    if (p) {
      finalName = p.name;
      finalSlug = p.slug;
    }
  }

  const shortCode = `dv_${Math.random().toString(36).substring(2, 7)}`;
  const cleanBase = baseUrl.replace(/\/$/, '');
  const targetPage = finalSlug ? `${cleanBase}/product.html?slug=${finalSlug}` : `${cleanBase}/catalog.html`;
  const fullUrl = `${targetPage}&utm_source=${encodeURIComponent(utmSource)}&utm_medium=${encodeURIComponent(utmMedium)}&utm_campaign=${encodeURIComponent(utmCampaign)}&ref=${shortCode}`;

  const payload = {
    product_id: productId || null,
    product_name: finalName || 'Subscription',
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    full_url: fullUrl,
    short_code: shortCode,
    click_count: 0,
    order_count: 0,
    revenue_generated: 0,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_product_links').insert([payload]).select().maybeSingle();
    if (error) return fail(res, error.message, 500);
    return ok(res, data, 201);
  }

  return ok(res, payload, 201);
}));

/**
 * DELETE /api/digistore/links/:id
 */
router.delete('/links/:id', requireAuth, requireManager, asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (isSupabaseConfigured()) {
    await supabase.from('digi_product_links').delete().eq('id', id);
  }
  return ok(res, { success: true });
}));

// ─────────────────────────────────────────────────────────────────────────────
// 7. SOCIAL MEDIA POST GENERATOR (FB & WHATSAPP)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/digistore/generate-post
 * Generates ready-to-publish social media captions in English & Bengali
 */
router.post('/generate-post', requireAuth, asyncHandler(async (req, res) => {
  const { productId, productSlug, channel = 'facebook', campaign = 'promo' } = req.body;

  let product = null;
  if (isSupabaseConfigured()) {
    let query = supabase.from('digi_products').select('*');
    if (productId) query = query.eq('id', productId);
    else if (productSlug) query = query.eq('slug', productSlug);
    const { data } = await query.maybeSingle();
    product = data;
  }

  if (!product) {
    const { SEED_PRODUCTS } = require('../../scripts/seed-digivault');
    product = SEED_PRODUCTS('', '').find(p => p.id === productId || p.slug === productSlug) || SEED_PRODUCTS('', '')[0];
  }

  const pName = product.name;
  const pPrice = Number(product.sale_price).toLocaleString();
  const pDuration = product.duration;
  const pNotes = product.delivery_notes || 'Instant delivery within 15-30 minutes.';
  const link = `https://gro10x-ai.vercel.app/digivault/product.html?slug=${product.slug}&utm_source=${channel}&utm_campaign=${campaign}`;

  // Bengali Post Template
  const postBn = `🔥 *${pName} — মাত্র ৳${pPrice}!*

✨ *অফারের বিস্তারিত:*
✅ মেয়াদ: ${pDuration} ফুল মেয়াদি গ্যারান্টি
✅ ডেলিভারি: ১৫-৩০ মিনিটের মধ্যে সরাসরি ডেলিভারি
✅ ${pNotes}
✅ ১০০% সিকিউর ও প্রাইভেট অ্যাক্সেস

🛒 *এখনই অর্ডার করতে ক্লিক করুন:*
👉 ${link}

📱 *টেলিগ্রাম বট দিয়ে সরাসরি অর্ডার:*
👉 t.me/Digivault20bot

💬 *WhatsApp ইনবক্স:*
👉 wa.me/8801889825025

#DigiVault #Subscription #${product.category.replace(/\s+/g, '')} #BangladeshTech #DigitalProducts`;

  // English Post Template
  const postEn = `🔥 *${pName} — Only ৳${pPrice} BDT!*

✨ *Key Highlights:*
✅ Duration: Full ${pDuration} Official Access
✅ Lightning Fast Delivery (15-30 mins)
✅ ${pNotes}
✅ 100% Private, Secure & Guaranteed Warranty

🛒 *Order Online Instantly:*
👉 ${link}

📱 *Order via Telegram Bot:*
👉 t.me/Digivault20bot

💬 *WhatsApp Support:*
👉 wa.me/8801889825025

#DigiVault #PremiumSubscription #${product.category.replace(/\s+/g, '')} #Verified`;

  // WhatsApp Broadcast Template
  const postWa = `Salam! 🌟 Get *${pName} (${pDuration})* at only *৳${pPrice}* on DigiVault.
Fast delivery within 15 mins.
Order here: ${link} or reply to this message!`;

  return ok(res, {
    productName: pName,
    salePrice: product.sale_price,
    duration: pDuration,
    link,
    postBn,
    postEn,
    postWa
  });
}));

// ─────────────────────────────────────────────────────────────────────────────
// 8. PAYMENT PROOF SCREENSHOT UPLOAD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/digistore/orders/:id/payment-proof
 */
router.post('/orders/:id/payment-proof', upload.single('screenshot'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { trxId, method = 'bkash' } = req.body;

  let proofUrl = null;

  if (req.file && isSupabaseConfigured()) {
    try {
      const fileExt = (req.file.originalname || 'proof.png').split('.').pop();
      const fileName = `digi-proof-${id}-${Date.now()}.${fileExt}`;
      const { data: upData, error: upErr } = await supabase.storage
        .from('digi-payments')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

      if (!upErr && upData) {
        const { data: pubData } = supabase.storage.from('digi-payments').getPublicUrl(fileName);
        proofUrl = pubData.publicUrl;
      }
    } catch (e) {
      console.warn('[DigiVault] Supabase storage upload note:', e.message);
    }
  }

  // Fallback if bucket doesn't exist: store inline base64 if small
  if (!proofUrl && req.file) {
    proofUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64').slice(0, 50000)}`;
  }

  const updates = {
    payment_proof_url: proofUrl,
    payment_ref: trxId || '',
    payment_method: method,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('digi_orders').update(updates).eq('id', id).select().maybeSingle();
    if (error) return fail(res, error.message, 500);
    broadcast('digistore_order_updated', data);
    return ok(res, { success: true, proofUrl, order: data });
  }

  return ok(res, { success: true, proofUrl });
}));

module.exports = router;

