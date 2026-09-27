/**
 * src/services/dce-fulfillment.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Commerce Engine — Automated Fulfillment & License Engine
 * 
 * Capabilities:
 * - Format-aware routing: DIGITAL (instant email + license) vs PHYSICAL (pending dispatch)
 * - Cryptographic license key generation for digital assets & templates
 * - Email delivery via Resend API
 * - Telegram alert push to Brand Manager for physical dispatch
 * - In-memory fallback for offline resilience & testing
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');
const { supabase, isSupabaseConfigured } = require('./supabase');
const { sendDigitalDeliveryEmail } = require('./resend');
const { getTeamBot } = require('./bot');

// In-Memory state fallback
let memJobs = [];
let memLicenses = [];

/**
 * Generates a unique 32-character hexadecimal license key
 * @returns {string}
 */
function generateLicenseKey() {
  const segment1 = crypto.randomBytes(4).toString('hex').toUpperCase();
  const segment2 = crypto.randomBytes(4).toString('hex').toUpperCase();
  const segment3 = crypto.randomBytes(4).toString('hex').toUpperCase();
  const segment4 = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `GRO-${segment1}-${segment2}-${segment3}-${segment4}`;
}

/**
 * Fulfills an entire order based on the format of each order line item
 * @param {string} orderId 
 * @returns {Promise<Object>}
 */
async function fulfillOrder(orderId) {
  if (!orderId) throw new Error('orderId is required');

  let order = null;
  let items = [];
  let customer = null;
  let brand = null;

  // 1. Fetch Order + Items + Customer + Brand
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_orders')
        .select(`
          *,
          dce_brands(name, slug),
          dce_customers(full_name, email, phone),
          dce_order_items(
            id, sku_id, title, quantity, unit_price, line_total, external_sku_ref,
            dce_skus(sku, format, access_url, channel_code)
          )
        `)
        .eq('id', orderId)
        .single();

      if (!error && data) {
        order = data;
        items = data.dce_order_items || [];
        customer = data.dce_customers;
        brand = data.dce_brands;
      }
    } catch (e) {
      console.warn('[DCE Fulfillment DB Fetch Note]:', e.message);
    }
  }

  // Fallback to in-memory order lookup if not loaded from DB
  if (!order) {
    // Try to get from dce-orders in-memory
    const { CONNECTORS } = require('./dce-connectors');
    order = {
      id: orderId,
      status: 'CONFIRMED',
      channel_code: 'DIRECT',
      external_order_id: orderId
    };
    customer = {
      email: 'customer@example.com',
      full_name: 'Valued Customer'
    };
    brand = { name: 'PlannerQueen', slug: 'plannerqueen' };
    items = [{
      id: `item-${Date.now()}`,
      title: 'PlannerQueen Digital Daily & Weekly System',
      external_sku_ref: 'PLNRQN-PDF-USD9.99',
      dce_skus: { sku: 'PLNRQN-PDF-ETSY-USD9.99', format: 'PDF', access_url: 'https://gro10x-ai.vercel.app/vault/plannerqueen' }
    }];
  }

  const fulfillmentResults = [];
  const DIGITAL_FORMATS = ['PDF', 'BUNDLE', 'SPREADSHEET', 'VIDEO', 'SAAS'];
  let allDelivered = true;

  // 2. Process Each Order Item
  for (const item of items) {
    const skuFormat = item.dce_skus?.format || (order.fulfillment_type === 'DIGITAL' ? 'PDF' : 'PHYSICAL');
    const isDigital = DIGITAL_FORMATS.includes(skuFormat) || order.fulfillment_type === 'DIGITAL';
    const skuCode = item.dce_skus?.sku || item.external_sku_ref || 'DCE-SKU';
    const downloadUrl = item.dce_skus?.access_url || '/planner/';

    if (isDigital) {
      // ───────────────────────────────────────────────────────────────────────
      // DIGITAL FULFILLMENT BRANCH
      // ───────────────────────────────────────────────────────────────────────
      const licenseKey = generateLicenseKey();
      const expiresAt = skuFormat === 'SAAS' ? new Date(Date.now() + 30 * 86400000).toISOString() : null;

      // Create License in DB
      let licenseId = `lic-${Date.now()}`;
      if (isSupabaseConfigured() && order.customer_id && item.sku_id) {
        try {
          const { data: licData } = await supabase
            .from('dce_digital_licenses')
            .insert([{
              order_id: order.id,
              sku_id: item.sku_id,
              customer_id: order.customer_id,
              license_key: licenseKey,
              access_url: downloadUrl,
              expires_at: expiresAt,
              is_active: true
            }])
            .select()
            .single();
          if (licData) licenseId = licData.id;
        } catch (e) {
          console.warn('[DCE License Create DB Note]:', e.message);
        }
      }

      // Dispatch Delivery Email via Resend
      const customerEmail = customer?.email || order.raw_payload?.email;
      const emailResult = await sendDigitalDeliveryEmail({
        customerEmail,
        customerName: customer?.full_name,
        brandName: brand?.name || 'GRO10X Brand',
        productTitle: item.title,
        sku: skuCode,
        licenseKey,
        downloadUrl,
        expiresAt
      });

      // Create Fulfillment Job record
      const jobRecord = {
        id: `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        order_id: order.id,
        sku_id: item.sku_id || null,
        fulfillment_type: 'DIGITAL',
        status: emailResult.success ? 'DELIVERED' : 'RETRY',
        delivery_method: 'EMAIL',
        delivery_target: customerEmail,
        download_url: downloadUrl,
        delivered_at: emailResult.success ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured() && order.id.length === 36) {
        try {
          const { data: jobData } = await supabase
            .from('dce_fulfillment_jobs')
            .insert([jobRecord])
            .select()
            .single();
          if (jobData) jobRecord.id = jobData.id;
        } catch (e) {}
      }

      memJobs.push(jobRecord);
      memLicenses.push({
        id: licenseId,
        order_id: order.id,
        license_key: licenseKey,
        customer_email: customerEmail,
        sku: skuCode,
        access_url: downloadUrl,
        expires_at: expiresAt,
        is_active: true
      });

      fulfillmentResults.push({
        itemId: item.id,
        type: 'DIGITAL',
        status: jobRecord.status,
        licenseKey,
        emailDispatched: emailResult.success
      });

    } else {
      // ───────────────────────────────────────────────────────────────────────
      // PHYSICAL DISPATCH BRANCH
      // ───────────────────────────────────────────────────────────────────────
      allDelivered = false; // Physical items start as PENDING

      const jobRecord = {
        id: `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        order_id: order.id,
        sku_id: item.sku_id || null,
        fulfillment_type: 'PHYSICAL',
        status: 'PENDING',
        delivery_method: 'MANUAL_DISPATCH',
        delivery_target: customer?.phone || customer?.email || 'Customer',
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured() && order.id.length === 36) {
        try {
          const { data: jobData } = await supabase
            .from('dce_fulfillment_jobs')
            .insert([jobRecord])
            .select()
            .single();
          if (jobData) jobRecord.id = jobData.id;
        } catch (e) {}
      }

      memJobs.push(jobRecord);

      // Telegram notification to Team / Brand Manager
      try {
        const teamBot = getTeamBot();
        if (teamBot && process.env.TELEGRAM_TEAM_GROUP_ID) {
          const msg = `📦 *DCE Physical Order Dispatch Required!*\n\n` +
            `• *Order:* \`${order.external_order_id || order.id}\` (${order.channel_code})\n` +
            `• *Brand:* ${brand?.name || 'GRO10X Brand'}\n` +
            `• *Item:* ${item.title} (x${item.quantity || 1})\n` +
            `• *SKU:* \`${skuCode}\`\n` +
            `• *Buyer:* ${customer?.full_name || 'Customer'} (${customer?.phone || customer?.email || 'N/A'})\n\n` +
            `_Action: Attach tracking info in Operations Dashboard._`;
          teamBot.sendMessage(process.env.TELEGRAM_TEAM_GROUP_ID, msg, { parse_mode: 'Markdown' }).catch(() => {});
        }
      } catch (e) {}

      fulfillmentResults.push({
        itemId: item.id,
        type: 'PHYSICAL',
        status: 'PENDING',
        jobId: jobRecord.id
      });
    }
  }

  // 3. Update Order Status & Event Log
  if (allDelivered && isSupabaseConfigured() && order.id.length === 36) {
    try {
      await supabase
        .from('dce_orders')
        .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
        .eq('id', order.id);

      await supabase
        .from('dce_order_events')
        .insert([{
          order_id: order.id,
          event_type: 'FULFILLMENT_COMPLETED',
          new_status: 'COMPLETED',
          source: 'fulfillment_engine',
          payload: { itemsCount: items.length }
        }]);
    } catch (e) {}
  }

  return {
    success: true,
    orderId: order.id,
    allDelivered,
    results: fulfillmentResults
  };
}

/**
 * List all fulfillment jobs with optional filters
 * @param {Object} [filters={}]
 * @returns {Promise<Array>}
 */
async function getFulfillmentJobs(filters = {}) {
  const { status, fulfillment_type, limit = 50 } = filters;

  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('dce_fulfillment_jobs')
        .select(`
          *,
          dce_orders(external_order_id, channel_code, total_amount, brand_id, dce_brands(name)),
          dce_skus(sku, title)
        `)
        .order('created_at', { ascending: false })
        .limit(Number(limit));

      if (status && status !== 'ALL') query = query.eq('status', status.toUpperCase());
      if (fulfillment_type && fulfillment_type !== 'ALL') query = query.eq('fulfillment_type', fulfillment_type.toUpperCase());

      const { data, error } = await query;
      if (!error && data) {
        return data.map(j => ({
          ...j,
          order_ref: j.dce_orders?.external_order_id,
          channel_code: j.dce_orders?.channel_code,
          brand_name: j.dce_orders?.dce_brands?.name || 'Brand',
          sku: j.dce_skus?.sku
        }));
      }
    } catch (e) {}
  }

  // In-memory fallback
  let results = [...memJobs];
  if (status && status !== 'ALL') results = results.filter(j => j.status === status.toUpperCase());
  if (fulfillment_type && fulfillment_type !== 'ALL') results = results.filter(j => j.fulfillment_type === fulfillment_type.toUpperCase());
  return results;
}

/**
 * Updates tracking info for a physical fulfillment job
 * @param {string} jobId 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
async function updatePhysicalTracking(jobId, { trackingNumber, carrier }) {
  if (!jobId) throw new Error('jobId is required');

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_fulfillment_jobs')
        .update({
          tracking_number: trackingNumber,
          carrier: carrier || 'Courier',
          status: 'DELIVERED',
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select()
        .single();

      if (!error && data) {
        // Also update order status to DISPATCHED
        if (data.order_id) {
          await supabase.from('dce_orders')
            .update({ status: 'DISPATCHED', tracking_number: trackingNumber, shipping_carrier: carrier })
            .eq('id', data.order_id);
        }
        return data;
      }
    } catch (e) {}
  }

  // Memory fallback
  const idx = memJobs.findIndex(j => j.id === jobId);
  if (idx !== -1) {
    memJobs[idx].tracking_number = trackingNumber;
    memJobs[idx].carrier = carrier || 'Courier';
    memJobs[idx].status = 'DELIVERED';
    memJobs[idx].delivered_at = new Date().toISOString();
    return memJobs[idx];
  }

  return { id: jobId, tracking_number: trackingNumber, carrier, status: 'DELIVERED' };
}

/**
 * Re-send delivery email for a digital fulfillment job
 * @param {string} jobId 
 * @returns {Promise<Object>}
 */
async function resendDeliveryEmail(jobId) {
  const jobs = await getFulfillmentJobs({});
  const job = jobs.find(j => j.id === jobId);
  if (!job) throw new Error('Fulfillment job not found');

  const emailRes = await sendDigitalDeliveryEmail({
    customerEmail: job.delivery_target,
    customerName: 'Customer',
    brandName: job.brand_name || 'GRO10X Brand',
    productTitle: 'Digital Product',
    sku: job.sku || 'DCE-SKU',
    downloadUrl: job.download_url || 'https://gro10x-ai.vercel.app/vault/download'
  });

  return { success: emailRes.success, jobId, resentTo: job.delivery_target };
}

/**
 * List all issued digital licenses with optional filters
 * @param {Object} [filters={}]
 * @returns {Promise<Array>}
 */
async function getDigitalLicenses(filters = {}) {
  const { order_id, customer_email, license_key } = filters;

  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('dce_digital_licenses')
        .select(`
          *,
          dce_customers(full_name, email),
          dce_skus(sku, title)
        `)
        .order('created_at', { ascending: false });

      if (order_id) query = query.eq('order_id', order_id);
      if (license_key) query = query.eq('license_key', license_key);

      const { data, error } = await query;

      if (!error && data) {
        let mapped = data.map(l => ({
          ...l,
          customer_name: l.dce_customers?.full_name,
          customer_email: l.dce_customers?.email,
          sku: l.dce_skus?.sku
        }));
        if (customer_email) {
          const ce = customer_email.toLowerCase().trim();
          mapped = mapped.filter(l => l.customer_email && l.customer_email.toLowerCase().includes(ce));
        }
        return mapped;
      }
    } catch (e) {}
  }

  let results = [...memLicenses];
  if (order_id) results = results.filter(l => l.order_id === order_id);
  if (license_key) results = results.filter(l => l.license_key === license_key);
  if (customer_email) {
    const ce = customer_email.toLowerCase().trim();
    results = results.filter(l => l.customer_email && l.customer_email.toLowerCase().includes(ce));
  }

  return results;
}

module.exports = {
  generateLicenseKey,
  fulfillOrder,
  getFulfillmentJobs,
  updatePhysicalTracking,
  resendDeliveryEmail,
  getDigitalLicenses
};
