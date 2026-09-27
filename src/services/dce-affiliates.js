/**
 * src/services/dce-affiliates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Commerce Engine — Affiliate & Referral Network Service
 * Handles affiliate partners, trackable short codes, clicks, and conversion attribution
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase, isSupabaseConfigured } = require('./supabase');

// In-Memory Fallback
let memAffiliates = [
  {
    id: 'aff-alex-01',
    name: 'Alex Creator & Co.',
    email: 'alex.creator@example.com',
    phone: '+8801700000000',
    payout_channel: 'BKASH',
    default_rate: 0.2000,
    status: 'ACTIVE',
    total_earned: 12.50,
    total_paid: 0.00,
    links: [
      {
        id: 'link-01',
        short_code: 'pq-alex',
        destination_url: 'https://gro10x-ai.vercel.app/dce',
        brand_name: 'PlannerQueen',
        click_count: 52,
        conversion_count: 3,
        commission_rate: 0.2000
      }
    ]
  }
];

let memConversions = [
  {
    id: 'conv-01',
    affiliate_id: 'aff-alex-01',
    affiliate_name: 'Alex Creator & Co.',
    order_id: 'ord-etsy-01',
    order_amount: 9.99,
    commission_rate: 0.20,
    commission_earned: 2.00,
    payout_status: 'PENDING',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

/**
 * List all affiliates with performance metrics
 */
async function getAffiliates() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_affiliates')
        .select(`
          *,
          dce_referral_links(*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(a => ({
          ...a,
          links: a.dce_referral_links || []
        }));
      }
    } catch (e) {}
  }
  return memAffiliates;
}

/**
 * Onboard a new affiliate partner
 */
async function createAffiliate({ name, email, phone, payout_channel = 'BKASH', default_rate = 0.1500, payout_details = {} }) {
  if (!name || !email) throw new Error('name and email are required');

  const affRecord = {
    name,
    email: email.toLowerCase().trim(),
    phone: phone || null,
    payout_channel,
    payout_details,
    default_rate: Number(default_rate),
    status: 'ACTIVE'
  };

  if (isSupabaseConfigured()) {
    try {
      const { data: created, error } = await supabase
        .from('dce_affiliates')
        .insert([affRecord])
        .select()
        .single();
      if (!error && created) return { ...created, links: [] };
    } catch (e) {}
  }

  const newAff = {
    id: `aff-${Date.now()}`,
    ...affRecord,
    total_earned: 0.00,
    total_paid: 0.00,
    links: [],
    created_at: new Date().toISOString()
  };
  memAffiliates.unshift(newAff);
  return newAff;
}

/**
 * Create trackable referral link
 */
async function createReferralLink({ affiliateId, brandId, skuId, shortCode, destinationUrl, commissionRate }) {
  if (!affiliateId || !shortCode || !destinationUrl) {
    throw new Error('affiliateId, shortCode, and destinationUrl are required');
  }

  const normalizedCode = shortCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

  const linkRecord = {
    affiliate_id: affiliateId,
    brand_id: brandId || null,
    sku_id: skuId || null,
    short_code: normalizedCode,
    destination_url: destinationUrl,
    commission_rate: commissionRate ? Number(commissionRate) : null,
    click_count: 0,
    conversion_count: 0
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_referral_links')
        .insert([linkRecord])
        .select('*, dce_brands(name)')
        .single();
      if (!error && data) return data;
    } catch (e) {}
  }

  const newLink = {
    id: `link-${Date.now()}`,
    ...linkRecord,
    created_at: new Date().toISOString()
  };

  const aff = memAffiliates.find(a => a.id === affiliateId);
  if (aff) {
    aff.links = aff.links || [];
    aff.links.push(newLink);
  }
  return newLink;
}

/**
 * Record click on referral short code and return destination URL
 */
async function recordClickAndResolve(shortCode) {
  if (!shortCode) return null;
  const code = shortCode.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_referral_links')
        .select('*')
        .eq('short_code', code)
        .maybeSingle();

      if (!error && data) {
        // Increment click count
        await supabase
          .from('dce_referral_links')
          .update({ click_count: (data.click_count || 0) + 1, updated_at: new Date().toISOString() })
          .eq('id', data.id);

        return {
          destinationUrl: data.destination_url,
          affiliateId: data.affiliate_id,
          linkId: data.id,
          shortCode: data.short_code
        };
      }
    } catch (e) {}
  }

  // Memory fallback
  for (const aff of memAffiliates) {
    const l = (aff.links || []).find(link => link.short_code === code);
    if (l) {
      l.click_count = (l.click_count || 0) + 1;
      return {
        destinationUrl: l.destination_url,
        affiliateId: aff.id,
        linkId: l.id,
        shortCode: l.short_code
      };
    }
  }

  return null;
}

/**
 * Attributes an order to an affiliate partner based on ref short code or utm_data
 * Called inside order ingestion pipeline
 */
async function attributeOrderToAffiliate({ orderId, orderAmount, refCode, utmData = {} }) {
  if (!orderId || !orderAmount) return null;
  const targetCode = (refCode || utmData.ref || utmData.affiliate || '').trim().toLowerCase();
  if (!targetCode) return null;

  let affiliate = null;
  let link = null;

  if (isSupabaseConfigured()) {
    try {
      const { data: linkData } = await supabase
        .from('dce_referral_links')
        .select('*, dce_affiliates(*)')
        .eq('short_code', targetCode)
        .maybeSingle();

      if (linkData && linkData.dce_affiliates) {
        link = linkData;
        affiliate = linkData.dce_affiliates;
      }
    } catch (e) {}
  }

  if (!affiliate) {
    for (const a of memAffiliates) {
      const l = (a.links || []).find(x => x.short_code === targetCode);
      if (l) {
        affiliate = a;
        link = l;
        break;
      }
    }
  }

  if (!affiliate) return null;

  const commissionRate = Number(link?.commission_rate || affiliate.default_rate || 0.15);
  const commissionEarned = Math.round((Number(orderAmount) * commissionRate) * 100) / 100;

  const convRecord = {
    link_id: link ? link.id : null,
    affiliate_id: affiliate.id,
    order_id: orderId,
    order_amount: Number(orderAmount),
    commission_rate: commissionRate,
    commission_earned: commissionEarned,
    payout_status: 'PENDING'
  };

  if (isSupabaseConfigured() && orderId.length === 36) {
    try {
      await supabase.from('dce_referral_conversions').insert([convRecord]);
      // Update aggregate affiliate stats
      await supabase.from('dce_affiliates').update({
        total_earned: Number(affiliate.total_earned || 0) + commissionEarned,
        updated_at: new Date().toISOString()
      }).eq('id', affiliate.id);

      if (link) {
        await supabase.from('dce_referral_links').update({
          conversion_count: Number(link.conversion_count || 0) + 1,
          updated_at: new Date().toISOString()
        }).eq('id', link.id);
      }
    } catch (e) {}
  }

  const newConv = {
    id: `conv-${Date.now()}`,
    ...convRecord,
    affiliate_name: affiliate.name,
    created_at: new Date().toISOString()
  };
  memConversions.unshift(newConv);

  return newConv;
}

/**
 * List all conversions
 */
async function getConversions() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_referral_conversions')
        .select(`
          *,
          dce_affiliates(name, email),
          dce_orders(external_order_id, channel_code)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(c => ({
          ...c,
          affiliate_name: c.dce_affiliates?.name,
          order_ref: c.dce_orders?.external_order_id,
          channel_code: c.dce_orders?.channel_code
        }));
      }
    } catch (e) {}
  }
  return memConversions;
}

module.exports = {
  getAffiliates,
  createAffiliate,
  createReferralLink,
  recordClickAndResolve,
  attributeOrderToAffiliate,
  getConversions
};
