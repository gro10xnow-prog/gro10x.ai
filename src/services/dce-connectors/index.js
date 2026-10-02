/**
 * src/services/dce-connectors/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central Connector Registry & Order Ingestion Engine for GRO10X DCE
 * 
 * Supports: GUMROAD, ETSY, AMAZON, DARAZ, DIRECT
 * Implements: Idempotent order ingestion, customer identity resolution,
 * SKU matching, and event log tracking.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const gumroad = require('./gumroad');
const etsy = require('./etsy');
const amazon = require('./amazon');
const daraz = require('./daraz');
const direct = require('./direct');
const { supabase, isSupabaseConfigured } = require('../supabase');

const CONNECTORS = {
  GUMROAD: gumroad,
  ETSY: etsy,
  AMAZON: amazon,
  DARAZ: daraz,
  DIRECT: direct
};

/**
 * Retrieve connector instance by channel code
 * @param {string} channelCode 
 * @returns {Object|null}
 */
function getConnector(channelCode) {
  if (!channelCode) return null;
  return CONNECTORS[channelCode.toUpperCase()] || null;
}

/**
 * Identity Resolution: Matches existing customer by email or creates new record
 * @param {Object} customerData 
 * @returns {Promise<string|null>} customer ID
 */
async function resolveCustomer(customerData) {
  if (!customerData || (!customerData.email && !customerData.phone)) {
    return null;
  }

  const email = (customerData.email || '').toLowerCase().trim();
  const phone = customerData.phone || '';
  const fullName = customerData.full_name || 'Anonymous Customer';

  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('dce_customers').select('id, channel_identities, total_orders_count, total_spend_usd');
      if (email) {
        query = query.eq('email', email);
      } else if (phone) {
        query = query.eq('phone', phone);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        // Merge channel identities
        const mergedIdentities = { ...(existing.channel_identities || {}) };
        if (customerData.channel_identity) {
          mergedIdentities[customerData.channel_identity.channel.toLowerCase()] = customerData.channel_identity.identifier;
        }

        await supabase.from('dce_customers').update({
          channel_identities: mergedIdentities,
          total_orders_count: (existing.total_orders_count || 0) + 1,
          updated_at: new Date().toISOString()
        }).eq('id', existing.id);

        return existing.id;
      }

      // Create new customer
      const identities = {};
      if (customerData.channel_identity) {
        identities[customerData.channel_identity.channel.toLowerCase()] = customerData.channel_identity.identifier;
      }

      const { data: created, error } = await supabase.from('dce_customers').insert([{
        email: email || null,
        phone: phone || null,
        full_name: fullName,
        country_code: customerData.country_code || 'US',
        channel_identities: identities,
        total_orders_count: 1,
        total_spend_usd: 0.00
      }]).select('id').single();

      if (!error && created) return created.id;
    } catch (err) {
      console.warn('[DCE Customer Resolution Error]:', err.message);
    }
  }

  return null;
}

/**
 * Resolve external listing ref to a canonical DCE SKU record
 * @param {string} channelCode 
 * @param {string} externalRef 
 * @returns {Promise<Object|null>}
 */
async function resolveSKU(channelCode, externalRef) {
  if (!externalRef) return null;

  if (isSupabaseConfigured()) {
    try {
      // 1. Try matching channel_listing_id
      let { data } = await supabase
        .from('dce_skus')
        .select('id, sku, product_id, price, dce_products(brand_id)')
        .eq('channel_code', channelCode.toUpperCase())
        .eq('channel_listing_id', externalRef)
        .maybeSingle();

      if (data) return data;

      // 2. Try matching raw SKU code
      let { data: byCode } = await supabase
        .from('dce_skus')
        .select('id, sku, product_id, price, dce_products(brand_id)')
        .eq('sku', externalRef)
        .maybeSingle();

      if (byCode) return byCode;
    } catch (e) {}
  }
  return null;
}

/**
 * Primary Canonical Ingestion Pipeline: Takes normalized order and persists it
 * @param {Object} normalizedOrder 
 * @param {Object} [rawPayload={}] 
 * @returns {Promise<Object>}
 */
async function ingestCanonicalOrder(normalizedOrder, rawPayload = {}) {
  const {
    channel_code,
    external_order_id,
    customer,
    total_amount,
    currency = 'USD',
    channel_fee = 0.00,
    net_amount,
    status = 'CONFIRMED',
    fulfillment_type = 'DIGITAL',
    placed_at = new Date().toISOString(),
    items = []
  } = normalizedOrder;

  if (!channel_code || !external_order_id) {
    throw new Error('channel_code and external_order_id are strictly required');
  }

  // 1. Identity Resolution
  const customerId = await resolveCustomer(customer);

  // 2. Resolve default Brand ID if not provided
  let brandId = normalizedOrder.brand_id || null;
  if (!brandId && isSupabaseConfigured()) {
    try {
      const { data: defaultBrand } = await supabase
        .from('dce_brands')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (defaultBrand) brandId = defaultBrand.id;
    } catch (e) {}
  }

  // 3. Insert into dce_orders (with Idempotency Guard)
  const orderRecord = {
    channel_code: channel_code.toUpperCase(),
    external_order_id: String(external_order_id),
    customer_id: customerId,
    brand_id: brandId,
    total_amount: Number(total_amount),
    currency: currency.toUpperCase(),
    channel_fee: Number(channel_fee),
    net_amount: Number(net_amount !== undefined ? net_amount : (total_amount - channel_fee)),
    status,
    fulfillment_type,
    placed_at,
    raw_payload: rawPayload || {},
    synced_at: new Date().toISOString()
  };

  // Dual-store / Memory Idempotency Guard
  try {
    const dceOrders = require('../../routes/dce-orders');
    if (typeof dceOrders.getDCEOrdersStore === 'function') {
      const memOrders = await dceOrders.getDCEOrdersStore();
      const existingMem = memOrders.find(o =>
        String(o.channel_code).toUpperCase() === orderRecord.channel_code &&
        String(o.external_order_id) === orderRecord.external_order_id
      );
      if (existingMem) {
        return {
          success: true,
          idempotent: true,
          message: 'Order already ingested',
          orderId: existingMem.id
        };
      }
    }
  } catch (_) {}

  let savedOrderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  if (isSupabaseConfigured() && brandId) {
    try {
      const { data, error } = await supabase
        .from('dce_orders')
        .insert([orderRecord])
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') {
          // Idempotency check: unique constraint violation
          const { data: existing } = await supabase
            .from('dce_orders')
            .select('id, status')
            .eq('channel_code', orderRecord.channel_code)
            .eq('external_order_id', orderRecord.external_order_id)
            .single();

          return {
            success: true,
            idempotent: true,
            message: 'Order already ingested',
            orderId: existing?.id
          };
        }
        throw error;
      }
      if (data) savedOrderId = data.id;
    } catch (err) {
      console.warn('[DCE Ingest Order DB Note]:', err.message);
    }
  }

  // Persist to dual-store / memory
  try {
    const dceOrders = require('../../routes/dce-orders');
    if (typeof dceOrders.persistDCEOrder === 'function') {
      await dceOrders.persistDCEOrder({
        id: savedOrderId,
        channel_code: orderRecord.channel_code,
        external_order_id: orderRecord.external_order_id,
        customer_id: customerId,
        customer_name: customer?.name || customer?.full_name || 'Customer',
        customer_email: customer?.email || '',
        brand_id: brandId,
        brand_name: rawPayload?.brand_name || 'PlannerQueen',
        total_amount: Number(total_amount),
        currency: currency.toUpperCase(),
        channel_fee: Number(channel_fee),
        net_amount: Number(net_amount !== undefined ? net_amount : (total_amount - channel_fee)),
        status,
        fulfillment_type,
        placed_at,
        items
      });
    }
  } catch (_) {}

  // 4. Ingest line items & SKU matching
  for (const item of items) {
    let matchedSku = null;
    if (item.external_sku_ref) {
      matchedSku = await resolveSKU(channel_code, item.external_sku_ref);
    }

    const itemRecord = {
      order_id: savedOrderId,
      sku_id: matchedSku ? matchedSku.id : null,
      external_sku_ref: item.external_sku_ref || '',
      title: item.title || 'Order Item',
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      line_total: Number(item.line_total) || 0
    };

    if (isSupabaseConfigured() && savedOrderId.length === 36) {
      try {
        await supabase.from('dce_order_items').insert([itemRecord]);
      } catch (e) {}
    }
  }

  // 5. Append initial event to dce_order_events
  if (isSupabaseConfigured() && savedOrderId.length === 36) {
    try {
      await supabase.from('dce_order_events').insert([{
        order_id: savedOrderId,
        event_type: 'ORDER_INGESTED',
        new_status: status,
        source: 'connector',
        payload: { channel: channel_code, external_id: external_order_id }
      }]);
    } catch (e) {}
  }

  // 6. Growth Hook: Attribute Affiliate Referrals if utm/ref present
  try {
    const { attributeOrderToAffiliate } = require('../dce-affiliates');
    const refCode = rawPayload?.ref || rawPayload?.affiliate || rawPayload?.utm_data?.ref;
    if (refCode) {
      attributeOrderToAffiliate({
        orderId: savedOrderId,
        orderAmount: total_amount,
        refCode,
        utmData: rawPayload?.utm_data || {}
      }).catch(() => {});
    }
  } catch (e) {}

  // 7. Growth Hook: Record Coupon Redemption if coupon applied
  try {
    const { recordCouponRedemption } = require('../dce-promo');
    const couponId = rawPayload?.coupon_id || rawPayload?.couponId;
    if (couponId) {
      recordCouponRedemption(couponId).catch(() => {});
    }
  } catch (e) {}

  // 8. Mobile Telegram Alert: Multi-Channel Live Sale Chime
  try {
    const { getTeamBot } = require('../bot');
    const { sendSaleAlertNotification } = require('../bot/handlers/dce-ops');
    const bot = getTeamBot();
    if (bot) {
      sendSaleAlertNotification(bot, {
        channelCode: channel_code,
        orderId: savedOrderId,
        externalOrderId: external_order_id,
        totalAmount: total_amount,
        netAmount: net_amount !== undefined ? net_amount : (total_amount - channel_fee),
        currency: currency,
        customerName: customer?.name || customer?.email || 'Customer',
        brandName: rawPayload?.brand_name || 'PlannerQueen',
        fulfillmentType: fulfillment_type
      }).catch(() => {});
    }
  } catch (e) {}

  // 9. Real-time Multi-Instance SSE Broadcast
  try {
    const { broadcast } = require('../sse');
    broadcast('dce_order_received', {
      orderId: savedOrderId,
      channelCode: channel_code,
      externalOrderId: external_order_id,
      totalAmount: total_amount,
      currency
    });
    broadcast({
      type: 'DCE_ORDER_RECEIVED',
      orderId: savedOrderId,
      channelCode: channel_code,
      externalOrderId: external_order_id,
      totalAmount: total_amount,
      currency
    });
  } catch (_) {}

  return {
    success: true,
    orderId: savedOrderId,
    channelCode: channel_code,
    externalOrderId: external_order_id,
    status
  };
}

module.exports = {
  CONNECTORS,
  getConnector,
  resolveCustomer,
  resolveSKU,
  ingestCanonicalOrder
};
