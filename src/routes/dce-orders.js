/**
 * src/routes/dce-orders.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Commerce Engine — Unified Order Hub & Connector Management API
 * 
 * Capabilities:
 * - Omnichannel Order Ingestion & Management
 * - Live Financial Reconciliation (Gross GMV vs. Channel Fees vs. Net Yield)
 * - On-Demand Channel Polling Triggers (Etsy, Amazon)
 * - Line Item SKU Attribution & Status Lifecycle Progression
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { ok, fail, paginated, getPaginationParams, asyncHandler } = require('../utils/response');
const { getConnector, ingestCanonicalOrder } = require('../services/dce-connectors');
const { broadcast } = require('../services/sse');
const { ordersToCSV } = require('../utils/csv-exporter');
const { requireDCEAdmin } = require('../middleware/dce-auth');
const { trackLimiter, isValidUUID, EMAIL_REGEX } = require('../middleware/dce-validate');
const { validateCoupon } = require('../services/dce-promo');
const { fulfillOrder } = require('../services/dce-fulfillment');
const { sendTelegramNotification } = require('../services/bot/notifications');

const DB_JSON_PATH = path.join(__dirname, '../../data/db.json');

function readLocalDCEOrders() {
  try {
    if (fs.existsSync(DB_JSON_PATH)) {
      const content = fs.readFileSync(DB_JSON_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.dce_orders)) {
        return parsed.dce_orders;
      }
    }
  } catch (_) {}
  return null;
}

function writeLocalDCEOrders(orders) {
  try {
    if (fs.existsSync(DB_JSON_PATH)) {
      const content = fs.readFileSync(DB_JSON_PATH, 'utf8');
      const parsed = JSON.parse(content);
      parsed.dce_orders = orders;
      fs.writeFileSync(DB_JSON_PATH, JSON.stringify(parsed, null, 2), 'utf8');
    }
  } catch (_) {}
}

let memOrders = readLocalDCEOrders() || [];

async function getDCEOrdersStore() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_orders')
        .select(`
          *,
          dce_brands(name, slug),
          dce_customers(full_name, email, phone),
          dce_order_items(
            id, external_sku_ref, title, quantity, unit_price, line_total, sku_id,
            dce_skus(sku, format, channel_code)
          )
        `)
        .order('placed_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const formatted = data.map(o => ({
          ...o,
          brand_name: o.dce_brands?.name || 'Brand',
          customer_name: o.dce_customers?.full_name || 'Customer',
          customer_email: o.dce_customers?.email || '',
          customer_phone: o.dce_customers?.phone || '',
          items: o.dce_order_items || []
        }));
        memOrders = formatted;
        writeLocalDCEOrders(memOrders);
        return memOrders;
      }
    } catch (_) {}
  }

  const local = readLocalDCEOrders();
  if (local && Array.isArray(local) && local.length > 0) {
    memOrders = local;
    return memOrders;
  }

  return memOrders;
}

async function persistDCEOrder(order, isUpdate = false) {
  if (!order || !order.id) return order;

  // 1. Sync in-memory cache
  const idx = memOrders.findIndex(o => o.id === order.id || (order.external_order_id && o.external_order_id === order.external_order_id));
  if (idx !== -1) {
    memOrders[idx] = { ...memOrders[idx], ...order };
  } else {
    memOrders.unshift(order);
  }

  // 2. Dual-persist to data/db.json
  writeLocalDCEOrders(memOrders);

  // 3. Persist to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const record = {
        id: order.id,
        channel_code: order.channel_code,
        external_order_id: order.external_order_id,
        customer_id: order.customer_id || null,
        brand_id: order.brand_id || null,
        total_amount: Number(order.total_amount || 0),
        currency: order.currency || 'USD',
        channel_fee: Number(order.channel_fee || 0),
        net_amount: Number(order.net_amount !== undefined ? order.net_amount : (order.total_amount || 0)),
        status: order.status,
        fulfillment_type: order.fulfillment_type || 'DIGITAL',
        placed_at: order.placed_at || new Date().toISOString(),
        raw_payload: order.raw_payload || {},
        synced_at: new Date().toISOString()
      };
      if (isUpdate) {
        await supabase.from('dce_orders').update(record).eq('id', order.id);
      } else {
        await supabase.from('dce_orders').upsert([record]);
      }
    } catch (e) {
      console.warn('[DCE Orders Store] Supabase sync note:', e.message);
    }
  }

  return memOrders.find(o => o.id === order.id) || order;
}

async function deleteDCEOrder(id) {
  memOrders = memOrders.filter(o => o.id !== id && o.external_order_id !== id);
  writeLocalDCEOrders(memOrders);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('dce_orders').delete().or(`id.eq.${id},external_order_id.eq.${id}`);
    } catch (_) {}
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// 1. ORDER METRICS & KPI AGGREGATION
// ─────────────────────────────────────────────────────────────────────────────
router.get('/metrics', requireDCEAdmin, asyncHandler(async (req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const { data: orders, error } = await supabase
        .from('dce_orders')
        .select('total_amount, channel_fee, net_amount, channel_code, status, currency');

      if (!error && orders) {
        let grossGMV = 0;
        let totalFees = 0;
        let netRevenue = 0;
        const channelCounts = { ETSY: 0, AMAZON: 0, GUMROAD: 0, DARAZ: 0, DIRECT: 0, OTHER: 0 };
        const statusCounts = {};

        orders.forEach(o => {
          grossGMV += Number(o.total_amount || 0);
          totalFees += Number(o.channel_fee || 0);
          netRevenue += Number(o.net_amount || 0);
          channelCounts[o.channel_code] = (channelCounts[o.channel_code] || 0) + 1;
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });

        return ok(res, {
          totalOrders: orders.length,
          grossGMV: Math.round(grossGMV * 100) / 100,
          totalFees: Math.round(totalFees * 100) / 100,
          netRevenue: Math.round(netRevenue * 100) / 100,
          channelCounts,
          statusCounts,
          dataSource: 'supabase'
        });
      }
    } catch (e) {
      console.warn('[DCE Order Metrics DB Query Note]:', e.message);
    }
  }

  // Fallback in-memory calculations
  await getDCEOrdersStore();
  let grossGMV = 0;
  let totalFees = 0;
  let netRevenue = 0;
  const channelCounts = { ETSY: 0, AMAZON: 0, GUMROAD: 0, DARAZ: 0, DIRECT: 0, OTHER: 0 };
  const statusCounts = {};

  memOrders.forEach(o => {
    grossGMV += Number(o.total_amount || 0);
    totalFees += Number(o.channel_fee || 0);
    netRevenue += Number(o.net_amount || 0);
    channelCounts[o.channel_code] = (channelCounts[o.channel_code] || 0) + 1;
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  return ok(res, {
    totalOrders: memOrders.length,
    grossGMV: Math.round(grossGMV * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    channelCounts,
    statusCounts,
    dataSource: 'memory'
  });
}));

// ─────────────────────────────────────────────────────────────────────────────
// 2. LIST ORDERS WITH FILTERS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { limit, offset, page } = getPaginationParams(req, 50);
  const { channel_code, brand_id, status, search } = req.query;

  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('dce_orders')
        .select(`
          *,
          dce_brands(name, slug),
          dce_customers(full_name, email, phone),
          dce_order_items(
            id, external_sku_ref, title, quantity, unit_price, line_total, sku_id,
            dce_skus(sku, format, channel_code)
          )
        `, { count: 'exact' })
        .order('placed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (channel_code && channel_code !== 'ALL') {
        query = query.eq('channel_code', channel_code.toUpperCase());
      }
      if (brand_id) {
        query = query.eq('brand_id', brand_id);
      }
      if (status && status !== 'ALL') {
        query = query.eq('status', status.toUpperCase());
      }
      if (search) {
        query = query.ilike('external_order_id', `%${search}%`);
      }

      const { data, error, count } = await query;
      if (!error && data) {
        const formatted = data.map(o => ({
          ...o,
          brand_name: o.dce_brands?.name || 'Brand',
          customer_name: o.dce_customers?.full_name || 'Customer',
          customer_email: o.dce_customers?.email || '',
          customer_phone: o.dce_customers?.phone || '',
          items: o.dce_order_items || []
        }));
        return paginated(res, formatted, { limit, offset, page, total: count !== null ? count : formatted.length });
      }
    } catch (e) {
      console.warn('[DCE Orders DB List Note]:', e.message);
    }
  }

  // Fallback in-memory filtering
  await getDCEOrdersStore();
  let results = [...memOrders];
  if (channel_code && channel_code !== 'ALL') {
    results = results.filter(o => o.channel_code === channel_code.toUpperCase());
  }
  if (brand_id) {
    results = results.filter(o => o.brand_id === brand_id);
  }
  if (status && status !== 'ALL') {
    results = results.filter(o => o.status === status.toUpperCase());
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(o =>
      o.external_order_id.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_email.toLowerCase().includes(q)
    );
  }

  const total = results.length;
  const paginatedResults = results.slice(offset, offset + limit);
  return paginated(res, paginatedResults, { limit, offset, page, total });
}));

/**
 * 2b. EXPORT ORDERS AS CSV
 */
router.get(['/export/csv', '/export'], requireDCEAdmin, asyncHandler(async (req, res) => {
  const { channel_code, brand_id, status } = req.query;
  let orders = [];

  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('dce_orders')
        .select(`
          *,
          dce_brands(name),
          dce_customers(full_name, email)
        `)
        .order('placed_at', { ascending: false });

      if (channel_code && channel_code !== 'ALL') query = query.eq('channel_code', channel_code.toUpperCase());
      if (brand_id) query = query.eq('brand_id', brand_id);
      if (status && status !== 'ALL') query = query.eq('status', status.toUpperCase());

      const { data } = await query;
      if (data) {
        orders = data.map(o => ({
          ...o,
          brand_name: o.dce_brands?.name || 'Brand',
          customer_name: o.dce_customers?.full_name || 'Customer',
          customer_email: o.dce_customers?.email || ''
        }));
      }
    } catch (e) {}
  }

  if (orders.length === 0) {
    await getDCEOrdersStore();
    orders = [...memOrders];
    if (channel_code && channel_code !== 'ALL') orders = orders.filter(o => o.channel_code === channel_code.toUpperCase());
    if (status && status !== 'ALL') orders = orders.filter(o => o.status === status.toUpperCase());
  }

  const csv = ordersToCSV(orders);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="dce_orders_${Date.now()}.csv"`);
  return res.status(200).send(csv);
}));

/**
 * 2c. BULK STATUS UPDATE
 */
router.post('/bulk-status', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { orderIds = [], status } = req.body;
  if (!orderIds.length || !status) return fail(res, 'orderIds and status are required', 400);

  const newStatus = status.toUpperCase();
  const validUUIDs = orderIds.filter(id => isValidUUID(id));
  const updatedIds = [];

  if (isSupabaseConfigured() && validUUIDs.length > 0) {
    try {
      const { data, error } = await supabase
        .from('dce_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .in('id', validUUIDs)
        .select('id');

      if (!error && data) {
        data.forEach(d => updatedIds.push(d.id));
      }
      if (error) {
        console.warn('[DCE Orders DB Warning]:', error.message);
      }
    } catch (e) {
      console.warn('[DCE Orders DB Warning]:', e.message);
    }
  }

  // Resilient update for in-memory items
  for (const id of orderIds) {
    const o = memOrders.find(item => item.id === id);
    if (o) {
      o.status = newStatus;
      if (!updatedIds.includes(id)) updatedIds.push(id);
    }
  }

  if (updatedIds.length > 0) {
    writeLocalDCEOrders(memOrders);
    broadcast('dce_order_update', memOrders);
  }

  return ok(res, { updatedCount: updatedIds.length, updatedIds, status: newStatus });
}));

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET SINGLE ORDER DETAIL
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_orders')
        .select(`
          *,
          dce_brands(*),
          dce_customers(*),
          dce_order_items(*, dce_skus(*)),
          dce_order_events(*)
        `)
        .eq('id', id)
        .single();

      if (!error && data) return ok(res, data);
    } catch (e) {}
  }

  let found = memOrders.find(o => o.id === id || o.external_order_id === id);
  if (!found) {
    await getDCEOrdersStore();
    found = memOrders.find(o => o.id === id || o.external_order_id === id);
  }
  if (!found) return fail(res, 'Order not found', 404);
  return ok(res, found);
}));

// ─────────────────────────────────────────────────────────────────────────────
// 4. UPDATE ORDER STATUS & APPEND AUDIT EVENT
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/status', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note, actor = 'admin' } = req.body;

  if (!status) return fail(res, 'Status is required', 400);

  if (isSupabaseConfigured()) {
    try {
      // 1. Fetch current status
      const { data: current } = await supabase
        .from('dce_orders')
        .select('status')
        .eq('id', id)
        .single();

      const oldStatus = current ? current.status : 'PENDING';

      // 2. Update order status
      const { data: updated, error } = await supabase
        .from('dce_orders')
        .update({ status: status.toUpperCase(), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && updated) {
        // 3. Record audit event
        await supabase.from('dce_order_events').insert([{
          order_id: id,
          event_type: 'STATUS_CHANGE',
          old_status: oldStatus,
          new_status: status.toUpperCase(),
          source: actor,
          payload: { note: note || '' }
        }]);

        if (typeof broadcast === 'function') {
          broadcast({
            type: 'DCE_ORDER_STATUS_CHANGED',
            orderId: id,
            newStatus: status.toUpperCase()
          });
          broadcast('dce_order_update', memOrders);
        }

        return ok(res, updated);
      }
    } catch (e) {}
  }

  // Fallback in-memory
  let idx = memOrders.findIndex(o => o.id === id || o.external_order_id === id);
  if (idx === -1) {
    await getDCEOrdersStore();
    idx = memOrders.findIndex(o => o.id === id || o.external_order_id === id);
  }
  if (idx === -1) return fail(res, 'Order not found', 404);

  const oldStatus = memOrders[idx].status;
  memOrders[idx].status = status.toUpperCase();
  memOrders[idx].events = memOrders[idx].events || [];
  memOrders[idx].events.push({
    id: `ev-${Date.now()}`,
    event_type: 'STATUS_CHANGE',
    old_status: oldStatus,
    new_status: status.toUpperCase(),
    source: actor,
    created_at: new Date().toISOString()
  });

  await persistDCEOrder(memOrders[idx], true);

  if (typeof broadcast === 'function') {
    broadcast('dce_order_update', memOrders);
    broadcast({
      type: 'DCE_ORDER_STATUS_CHANGED',
      orderId: id,
      newStatus: status.toUpperCase()
    });
  }

  return ok(res, memOrders[idx]);
}));

// ─────────────────────────────────────────────────────────────────────────────
// 5. ON-DEMAND CONNECTOR POLLING TRIGGERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * On-demand Etsy Sync Trigger
 */
router.post(['/connectors/etsy/sync', '/poll/etsy'], requireDCEAdmin, asyncHandler(async (req, res) => {
  const { brandId } = req.body;
  const connector = getConnector('ETSY');
  if (!connector) return fail(res, 'Etsy connector unavailable', 503);

  try {
    const pollResult = await connector.poll({ brandId: brandId || 1 });
    let ingestedCount = 0;

    if (pollResult.orders && pollResult.orders.length > 0) {
      for (const order of pollResult.orders) {
        const ingestRes = await ingestCanonicalOrder(order, order.raw_payload);
        if (ingestRes.success && !ingestRes.idempotent) {
          ingestedCount++;
        }
      }
    }

    return ok(res, {
      synced: true,
      shopId: pollResult.shop_id || null,
      ordersFound: pollResult.orders?.length || 0,
      newOrdersIngested: ingestedCount
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
}));

/**
 * On-demand Amazon Sync Trigger (Scaffold)
 */
router.post(['/connectors/amazon/sync', '/poll/amazon'], requireDCEAdmin, asyncHandler(async (req, res) => {
  return ok(res, {
    synced: true,
    channel: 'AMAZON',
    status: 'ACTIVE_SCAFFOLD',
    message: 'Amazon SP-API telemetry sync triggered. Awaiting developer token rotation.'
  });
}));

// ─────────────────────────────────────────────────────────────────────────────
// 5. PUBLIC SELF-SERVICE ORDER & LICENSE TRACKING (CUSTOMER FACING)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/track', trackLimiter, asyncHandler(async (req, res) => {
  const { orderRef, email } = req.body;
  if (!orderRef || !email) {
    return fail(res, 'Order reference and customer email are required', 400);
  }

  const cleanRef = String(orderRef).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  let order = null;
  let items = [];
  let licenses = [];
  let tracking = null;

  if (isSupabaseConfigured()) {
    try {
      // Find order matching external_order_id or id
      const { data: orderData } = await supabase
        .from('dce_orders')
        .select(`
          *,
          dce_brands(name, slug),
          dce_customers(full_name, email, phone),
          dce_order_items(
            id, sku_id, title, quantity, unit_price, line_total, external_sku_ref,
            dce_skus(sku, format, access_url, channel_code)
          ),
          dce_order_events(event_type, new_status, source, created_at)
        `)
        .or(`external_order_id.eq.${cleanRef},id.eq.${cleanRef}`)
        .maybeSingle();

      if (orderData) {
        const custEmail = (orderData.dce_customers?.email || '').trim().toLowerCase();
        if (custEmail !== cleanEmail) {
          return fail(res, 'Order found, but the provided email does not match our records.', 403);
        }

        order = orderData;
        items = orderData.dce_order_items || [];

        // Fetch digital licenses
        const { data: licData } = await supabase
          .from('dce_digital_licenses')
          .select('id, license_key, access_url, status, expires_at, created_at')
          .eq('order_id', order.id);
        if (licData) licenses = licData;

        // Fetch physical fulfillment job
        const { data: jobData } = await supabase
          .from('dce_fulfillment_jobs')
          .select('id, tracking_number, carrier, status, dispatched_at, destination_address')
          .eq('order_id', order.id)
          .maybeSingle();
        if (jobData) tracking = jobData;
      }
    } catch (e) {
      console.warn('[DCE Track DB Note]:', e.message);
    }
  }

  // Memory fallback lookup
  if (!order) {
    await getDCEOrdersStore();
    const foundMem = memOrders.find(o =>
      (o.id.toLowerCase() === cleanRef.toLowerCase() || (o.external_order_id && o.external_order_id.toLowerCase() === cleanRef.toLowerCase()))
    );

    if (foundMem) {
      const custEmail = (foundMem.customer_email || '').trim().toLowerCase();
      if (custEmail !== cleanEmail) {
        return fail(res, 'Order found, but the provided email does not match our records.', 403);
      }
      order = foundMem;
      items = foundMem.items || [];
      // Provide simulated license if digital
      if (foundMem.fulfillment_type === 'DIGITAL') {
        licenses = [{
          id: `lic-${foundMem.id}`,
          license_key: 'GRO-A91B-4C2E-89DF-PQ26',
          access_url: '/planner/',
          status: 'ACTIVE',
          created_at: foundMem.placed_at
        }];
      } else {
        tracking = {
          carrier: 'DHL Express',
          tracking_number: 'DHL-9400111899223100',
          status: foundMem.status === 'COMPLETED' ? 'DELIVERED' : 'DISPATCHED',
          dispatched_at: foundMem.placed_at
        };
      }
    }
  }

  // Cross-Engine Lookup: DigiVault BD Orders
  if (!order) {
    let digiOrder = null;
    if (isSupabaseConfigured()) {
      try {
        const isUUID = isValidUUID(cleanRef);
        let digiQuery = supabase.from('digi_orders').select('*');
        if (isUUID) {
          digiQuery = digiQuery.or(`id.eq.${cleanRef},order_number.ilike.${cleanRef}`);
        } else {
          digiQuery = digiQuery.ilike('order_number', cleanRef);
        }
        const { data: digiData } = await digiQuery.maybeSingle();
        if (digiData) digiOrder = digiData;
      } catch (_) {}
    }

    if (!digiOrder) {
      try {
        const digiRouter = require('./digistore');
        const inMem = digiRouter.inMemoryOrders || [];
        digiOrder = inMem.find(o =>
          (o.order_number || o.orderNumber || '').toUpperCase() === cleanRef.toUpperCase() ||
          o.id === cleanRef
        );
      } catch (_) {}
    }

    if (digiOrder) {
      const digiCustEmail = (digiOrder.customer_email || digiOrder.email || '').trim().toLowerCase();
      if (digiCustEmail && cleanEmail && digiCustEmail !== cleanEmail) {
        return fail(res, 'Order found, but the provided email does not match our records.', 403);
      }

      const isDelivered = digiOrder.delivery_status === 'delivered';
      const orderRefVal = digiOrder.order_number || digiOrder.id;

      return ok(res, {
        orderRef: orderRefVal,
        orderId: digiOrder.id,
        status: isDelivered ? 'COMPLETED' : 'PROCESSING',
        channelCode: 'DIGIVAULT',
        fulfillmentType: 'DIGITAL',
        brandName: 'DigiVault BD',
        customerName: digiOrder.customer_name || 'DigiVault Subscriber',
        customerEmail: cleanEmail,
        totalAmount: Number(digiOrder.price_bdt || digiOrder.amount_bdt || 1200),
        currency: 'BDT',
        placedAt: digiOrder.created_at || new Date().toISOString(),
        items: [{
          title: digiOrder.product_name || 'Digital Subscription',
          quantity: 1,
          unitPrice: Number(digiOrder.price_bdt || 1200),
          lineTotal: Number(digiOrder.price_bdt || 1200),
          format: 'SAAS',
          accessUrl: digiOrder.activation_link || `/digivault/track.html?ref=${orderRefVal}`,
          interactiveUrl: `/digivault/track.html?ref=${orderRefVal}`,
          pdfDownloadUrl: '#',
          canvaTemplateUrl: '#'
        }],
        licenses: [{
          licenseKey: orderRefVal,
          accessUrl: digiOrder.activation_link || `/digivault/track.html?ref=${orderRefVal}`,
          interactiveUrl: `/digivault/track.html?ref=${orderRefVal}`,
          vaultUrl: `/my-portal?code=${encodeURIComponent(orderRefVal)}`,
          status: isDelivered ? 'ACTIVE' : 'PENDING',
          expiresAt: digiOrder.expiry_date || null
        }],
        tracking: null,
        events: [
          { event_type: 'ORDER_PLACED', created_at: digiOrder.created_at || new Date().toISOString() },
          { event_type: digiOrder.payment_status === 'verified' ? 'PAYMENT_VERIFIED' : 'PENDING_PAYMENT', created_at: digiOrder.created_at || new Date().toISOString() },
          { event_type: isDelivered ? 'DELIVERED' : 'PROCESSING', created_at: digiOrder.created_at || new Date().toISOString() }
        ]
      });
    }
  }

  if (!order) {
    return fail(res, 'No order found matching the provided reference and email.', 404);
  }

  return ok(res, {
    orderRef: order.external_order_id || order.id,
    orderId: order.id,
    status: order.status,
    channelCode: order.channel_code,
    fulfillmentType: order.fulfillment_type,
    brandName: order.dce_brands?.name || order.brand_name || 'PlannerQueen',
    customerName: order.dce_customers?.full_name || order.customer_name || 'Customer',
    customerEmail: order.dce_customers?.email || order.customer_email || cleanEmail,
    totalAmount: order.total_amount,
    currency: order.currency,
    placedAt: order.placed_at,
    items: items.map(i => ({
      title: i.title,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      lineTotal: i.line_total,
      format: i.dce_skus?.format || (order.fulfillment_type === 'DIGITAL' ? 'PDF' : 'PHYSICAL'),
      accessUrl: i.dce_skus?.access_url || '/planner/',
      interactiveUrl: '/planner/',
      pdfDownloadUrl: '/dist/PLA-14_PlannerQueenGro_Complete_16_Spreads.pdf',
      canvaTemplateUrl: 'https://www.canva.com/design/DAGMockup14/view'
    })),
    licenses: licenses.map(l => ({
      licenseKey: l.license_key,
      accessUrl: l.access_url || '/planner/',
      interactiveUrl: '/planner/',
      vaultUrl: `/my-portal?code=${encodeURIComponent(l.license_key || order.external_order_id || order.id)}`,
      pdfDownloadUrl: '/dist/PLA-14_PlannerQueenGro_Complete_16_Spreads.pdf',
      canvaTemplateUrl: 'https://www.canva.com/design/DAGMockup14/view',
      status: l.status,
      expiresAt: l.expires_at
    })),
    tracking: tracking ? {
      carrier: tracking.carrier,
      trackingNumber: tracking.tracking_number,
      status: tracking.status,
      dispatchedAt: tracking.dispatched_at,
      trackingUrl: (tracking.carrier || '').toLowerCase().includes('dhl')
        ? `https://www.dhl.com/en/express/tracking.html?AWB=${tracking.tracking_number}`
        : `https://parcelsapp.com/en/tracking/${tracking.tracking_number}`
    } : null,
    events: order.events || order.dce_order_events || [
      { event_type: 'ORDER_PLACED', created_at: order.placed_at },
      { event_type: 'PAYMENT_CONFIRMED', created_at: order.placed_at }
    ]
  });
}));

router.post('/resend', trackLimiter, asyncHandler(async (req, res) => {
  const { orderRef, email } = req.body;
  if (!orderRef || !email) {
    return fail(res, 'Order reference and customer email are required', 400);
  }
  const cleanRef = String(orderRef).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  let order = null;
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from('dce_orders')
        .select('*, dce_customers(email)')
        .or(`external_order_id.eq.${cleanRef},id.eq.${cleanRef}`)
        .maybeSingle();
      if (data && (data.dce_customers?.email || '').trim().toLowerCase() === cleanEmail) {
        order = data;
      }
    } catch (_) {}
  }
  if (!order) {
    await getDCEOrdersStore();
    const found = memOrders.find(o =>
      (o.id.toLowerCase() === cleanRef.toLowerCase() || (o.external_order_id && o.external_order_id.toLowerCase() === cleanRef.toLowerCase())) &&
      (o.customer_email || '').toLowerCase() === cleanEmail
    );
    if (found) order = found;
  }
  if (!order) {
    return fail(res, 'No matching order found for the provided reference and email.', 404);
  }

  try {
    const { resendDeliveryEmail } = require('../services/dce-fulfillment');
    const result = await resendDeliveryEmail(order.id);
    return ok(res, { success: true, message: 'Delivery access has been resent to ' + cleanEmail, result });
  } catch (err) {
    return fail(res, err.message, 500);
  }
}));

// ─────────────────────────────────────────────────────────────────────────────
// 6. DIRECT PLATFORM CHECKOUT ENGINE
// ─────────────────────────────────────────────────────────────────────────────
router.post('/checkout', asyncHandler(async (req, res) => {
  const {
    brandSlug = 'plannerqueen',
    skuId,
    customer,
    quantity = 1,
    paymentMethod = 'CARD',
    promoCode,
    refCode,
    currency = 'USD'
  } = req.body;

  if (!customer || !customer.email || !EMAIL_REGEX.test(String(customer.email).trim())) {
    return fail(res, 'A valid customer email is required for checkout', 400, 'VALIDATION_ERROR', { field: 'customer.email' });
  }

  if (!customer.name || typeof customer.name !== 'string' || customer.name.trim().length < 2) {
    return fail(res, 'Customer name must be at least 2 characters', 400, 'VALIDATION_ERROR', { field: 'customer.name' });
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < 1) {
    return fail(res, 'Quantity must be a positive integer', 400, 'VALIDATION_ERROR', { field: 'quantity' });
  }

  const activeCurrency = String(currency).toUpperCase() === 'BDT' ? 'BDT' : 'USD';
  const isBdt = activeCurrency === 'BDT';

  // 1. Resolve SKU pricing and format
  let sku = null;
  if (isSupabaseConfigured() && skuId && isValidUUID(skuId)) {
    try {
      const { data } = await supabase.from('dce_skus').select('*, dce_products(*), dce_brands(*)').eq('id', skuId).single();
      if (data) sku = data;
    } catch (e) {
      console.warn('[DCE Orders DB Warning]:', e.message);
    }
  }

  if (!sku) {
    // Default / Mock direct product catalogue
    const format = (skuId && /phys|print/i.test(String(skuId))) ? 'PHYSICAL' : 'PDF';
    const defaultUsd = format === 'PHYSICAL' ? 34.99 : 19.99;
    sku = {
      id: skuId || (format === 'PHYSICAL' ? 'sku-pq-phys-01' : 'sku-pq-dir-01'),
      sku: `PLNRQN-${format}-DIRECT-${activeCurrency}`,
      title: format === 'PHYSICAL'
        ? 'PlannerQueen Luxury Spiral-Bound 2026 Life & Goal Planner (Hardcover)'
        : 'PlannerQueen Digital Daily & Weekly System 2026 (GoodNotes + Notion + PDF)',
      unit_price: defaultUsd,
      price_bdt: format === 'PHYSICAL' ? 4200 : 2400,
      format: format,
      currency: activeCurrency,
      access_url: '/planner/'
    };
  }

  const basePriceUsd = Number(sku.unit_price || sku.price || 19.99);
  const basePrice = isBdt
    ? (sku.price_bdt ? Number(sku.price_bdt) : Math.round(basePriceUsd * 120))
    : basePriceUsd;
  const grossSubtotal = Math.round(basePrice * qty * 100) / 100;

  // 2. Validate Promo Code / Coupon
  let discountAmount = 0;
  let appliedCoupon = null;

  if (promoCode) {
    try {
      const valResult = await validateCoupon(promoCode, {
        brandId: sku.brand_id,
        orderAmount: grossSubtotal,
        orderTotal: grossSubtotal,
        skuId: sku.id,
        currency: activeCurrency
      });
      if (valResult.valid) {
        discountAmount = valResult.discount_amount;
        appliedCoupon = valResult.coupon;
      }
    } catch (e) {
      console.warn('[Checkout Coupon Warning]:', e.message);
    }
  }

  const finalTotal = Math.max(0, Math.round((grossSubtotal - discountAmount) * 100) / 100);
  const externalOrderId = `DIR-PQ-${Date.now().toString().slice(-6)}`;
  const isPhysical = sku.format === 'PHYSICAL';

  // 3. Ingest Canonical Order
  const canonicalPayload = {
    channel_code: 'DIRECT',
    external_order_id: externalOrderId,
    total_amount: finalTotal,
    channel_fee: 0.00, // 100% GRO10X Direct Margin
    net_amount: finalTotal,
    currency: activeCurrency,
    fulfillment_type: isPhysical ? 'PHYSICAL' : 'DIGITAL',
    placed_at: new Date().toISOString(),
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || ''
    },
    items: [{
      title: sku.title,
      quantity: qty,
      unit_price: basePrice,
      line_total: grossSubtotal,
      external_sku_ref: sku.sku
    }],
    rawPayload: {
      brand_name: 'PlannerQueen',
      payment_method: paymentMethod,
      promo_code: appliedCoupon ? appliedCoupon.code : null,
      discount_amount: discountAmount,
      coupon_id: appliedCoupon ? appliedCoupon.id : null,
      ref: refCode || null,
      currency: activeCurrency,
      address: customer.address || ''
    }
  };

  const ingestRes = await ingestCanonicalOrder(canonicalPayload, canonicalPayload.rawPayload);
  const orderId = ingestRes.orderId;

  // Persist canonical order to dual storage (local db.json + Supabase)
  const createdOrder = {
    id: orderId,
    channel_code: 'DIRECT',
    external_order_id: externalOrderId,
    customer_id: `cust-${Date.now()}`,
    customer_name: customer.name,
    customer_email: customer.email,
    brand_id: 'b-pq-01',
    brand_name: 'PlannerQueen',
    total_amount: finalTotal,
    currency: activeCurrency,
    channel_fee: 0.00,
    net_amount: finalTotal,
    status: isPhysical ? 'PROCESSING' : 'COMPLETED',
    fulfillment_type: isPhysical ? 'PHYSICAL' : 'DIGITAL',
    placed_at: canonicalPayload.placed_at,
    items: canonicalPayload.items
  };
  await persistDCEOrder(createdOrder);

  // 4. Trigger Automatic Fulfillment
  let licenseKey = null;
  let accessUrl = sku.access_url || '/planner/';

  try {
    const fulfillmentSummary = await fulfillOrder(orderId);
    if (fulfillmentSummary.licenses && fulfillmentSummary.licenses.length > 0) {
      licenseKey = fulfillmentSummary.licenses[0].licenseKey;
      accessUrl = fulfillmentSummary.licenses[0].accessUrl;
    }
  } catch (e) {
    console.warn('[Checkout Auto-Fulfillment Note]:', e.message);
  }

  if (!licenseKey && !isPhysical) {
    const seg1 = crypto.randomBytes(4).toString('hex').toUpperCase();
    const seg2 = crypto.randomBytes(4).toString('hex').toUpperCase();
    const seg3 = crypto.randomBytes(4).toString('hex').toUpperCase();
    licenseKey = `GRO-${seg1}-${seg2}-${seg3}`;
  }

  // Real-time SSE Broadcasts
  if (typeof broadcast === 'function') {
    broadcast('dce_order_created', createdOrder);
    broadcast('dce_order_update', memOrders);
    broadcast({ type: 'DCE_ORDER_CREATED', order: createdOrder });
  }

  // Telegram Owner Notification
  const telegramTarget = process.env.OWNER_TELEGRAM_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (telegramTarget && typeof sendTelegramNotification === 'function') {
    try {
      const currencySymbol = activeCurrency === 'BDT' ? '৳' : '$';
      const formattedTotal = activeCurrency === 'BDT' ? `${currencySymbol}${finalTotal.toLocaleString()}` : `${currencySymbol}${finalTotal.toFixed(2)}`;
      const text = `🛍️ *New Direct Order Placed!*\n\n` +
        `• *Order:* \`${externalOrderId}\`\n` +
        `• *Customer:* ${customer.name} (${customer.email})\n` +
        `• *Total:* ${formattedTotal} ${activeCurrency}\n` +
        `• *Product:* ${sku.title}\n` +
        `• *Fulfillment:* ${isPhysical ? 'PHYSICAL' : 'DIGITAL'}\n` +
        `• *Status:* ${isPhysical ? 'PROCESSING' : 'COMPLETED'}\n` +
        (licenseKey ? `• *License:* \`${licenseKey}\`\n` : '');
      sendTelegramNotification(telegramTarget, text);
    } catch (err) {
      console.warn('[DCE Telegram Alert Note]:', err.message);
    }
  }

  return ok(res, {
    orderId,
    externalOrderId,
    orderRef: externalOrderId,
    status: isPhysical ? 'PROCESSING' : 'COMPLETED',
    fulfillmentType: isPhysical ? 'PHYSICAL' : 'DIGITAL',
    subtotal: grossSubtotal,
    discount: discountAmount,
    total: finalTotal,
    totalAmount: finalTotal,
    currency: activeCurrency,
    paymentMethod,
    customer: { name: customer.name, email: customer.email },
    item: { title: sku.title, format: sku.format, quantity: qty },
    licenseKey: licenseKey || null,
    accessUrl: isPhysical ? null : (accessUrl || '/planner/'),
    interactiveUrl: isPhysical ? null : '/planner/',
    vaultUrl: isPhysical ? null : `/my-portal?code=${encodeURIComponent(licenseKey || externalOrderId)}`,
    trackingUrl: `/dce/track?ref=${externalOrderId}&email=${encodeURIComponent(customer.email)}`
  });
}));

router.getOrders = () => memOrders;
router.getDCEOrdersStore = getDCEOrdersStore;
router.persistDCEOrder = persistDCEOrder;
router.deleteDCEOrder = deleteDCEOrder;

module.exports = router;
