/**
 * src/routes/affiliates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X B2B Partner & Affiliate Referral Growth API
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibilities:
 * 1. GET  /api/affiliates/me           — Profile, referral link, conversion telemetry
 * 2. GET  /api/affiliates/track/:ref   — Track clicks, 30-day cookie attribution
 * 3. POST /api/affiliates/payout       — Commission payout request (৳5,000 min threshold)
 * 4. POST /api/affiliates/calculate    — Commission calculation (10% sprint / 15% retainer)
 * 5. GET  /api/affiliates/list         — Admin/Manager global affiliate ledger
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { readDB } = require('../services/db');

const MIN_PAYOUT_THRESHOLD_BDT = 5000; // ৳5,000 BDT ($50 USD equivalent)
const SPRINT_COMMISSION_RATE = 0.10;   // 10% on closed fixed-scope sprints
const RETAINER_COMMISSION_RATE = 0.15; // 15% on recurring monthly retainers

// In-memory fallback affiliate store
const memoryAffiliates = new Map();

const SEED_AFFILIATE = {
  id: 'AFF-TANVIR',
  refCode: 'AFF-TANVIR',
  name: 'Tanvir Ahmed',
  email: 'tanvir@partner.gro10x.ai',
  phone: '+8801712250049',
  sprintRate: SPRINT_COMMISSION_RATE,
  retainerRate: RETAINER_COMMISSION_RATE,
  clicks: 142,
  leadsQualified: 8,
  dealsClosed: 3,
  totalEarnedBDT: 32500,
  paidOutBDT: 15000,
  pendingBalanceBDT: 17500,
  minPayoutThresholdBDT: MIN_PAYOUT_THRESHOLD_BDT,
  settlementAccount: {
    type: 'BRAC Bank Limited',
    bankName: 'BRAC Bank Limited',
    accountName: 'Neoncore Tech Solution',
    accountNumber: '2081636480001',
    branch: 'Mohakhali Branch, Dhaka',
    routing: '060263290'
  },
  conversions: [
    {
      id: 'CONV-001',
      projectName: 'AI SaaS MVP Sprint',
      client: 'FinTech Hub',
      contractValueBDT: 150000,
      dealType: 'sprint',
      commissionRate: 0.10,
      commissionEarnedBDT: 15000,
      status: 'Disbursed',
      date: '2026-08-15'
    },
    {
      id: 'CONV-002',
      projectName: 'Agency OS Retainer (Month 1)',
      client: 'Rob D2C',
      contractValueBDT: 35000,
      dealType: 'retainer',
      commissionRate: 0.15,
      commissionEarnedBDT: 5250,
      status: 'Pending Payout',
      date: '2026-09-01'
    },
    {
      id: 'CONV-003',
      projectName: 'Enterprise Automation Pod Sprint',
      client: 'Transcom Logistics',
      contractValueBDT: 122500,
      dealType: 'sprint',
      commissionRate: 0.10,
      commissionEarnedBDT: 12250,
      status: 'Pending Payout',
      date: '2026-09-10'
    }
  ]
};

memoryAffiliates.set('AFF-TANVIR', { ...SEED_AFFILIATE });

async function getAffiliateRecord(identifier) {
  if (!identifier) return memoryAffiliates.get('AFF-TANVIR');

  const clean = String(identifier).trim().toUpperCase();
  for (const aff of memoryAffiliates.values()) {
    if (aff.refCode?.toUpperCase() === clean || aff.id?.toUpperCase() === clean || aff.email?.toLowerCase() === identifier.toLowerCase()) {
      return aff;
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('affiliates')
        .select('*')
        .or(`ref_code.eq.${clean},id.eq.${clean},email.ilike.${identifier}`)
        .maybeSingle();
      if (data) {
        const mapped = {
          id: data.id,
          refCode: data.ref_code,
          name: data.name,
          email: data.email,
          phone: data.phone,
          sprintRate: Number(data.sprint_rate || SPRINT_COMMISSION_RATE),
          retainerRate: Number(data.retainer_rate || RETAINER_COMMISSION_RATE),
          clicks: Number(data.clicks || 0),
          leadsQualified: Number(data.leads_qualified || 0),
          dealsClosed: Number(data.deals_closed || 0),
          totalEarnedBDT: Number(data.total_earned_bdt || 0),
          paidOutBDT: Number(data.paid_out_bdt || 0),
          pendingBalanceBDT: Number(data.pending_balance_bdt || 0),
          minPayoutThresholdBDT: Number(data.min_payout_threshold_bdt || MIN_PAYOUT_THRESHOLD_BDT),
          settlementAccount: data.settlement_account || {
            type: 'BRAC Bank Limited',
            bankName: 'BRAC Bank Limited',
            accountName: 'Neoncore Tech Solution',
            accountNumber: '2081636480001',
            branch: 'Mohakhali Branch, Dhaka',
            routing: '060263290'
          },
          conversions: []
        };
        try {
          const { data: convs } = await supabase.from('affiliate_conversions').select('*').eq('affiliate_id', data.id);
          if (convs && convs.length > 0) {
            mapped.conversions = convs.map(c => ({
              id: c.id,
              invoiceId: c.invoice_id,
              dealType: c.deal_type,
              contractValueBDT: Number(c.contract_value_bdt),
              commissionRate: Number(c.commission_rate),
              commissionEarnedBDT: Number(c.commission_earned_bdt),
              status: c.status,
              date: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
            }));
          }
        } catch (_) {}
        memoryAffiliates.set(mapped.id, mapped);
        if (mapped.refCode) memoryAffiliates.set(mapped.refCode, mapped);
        return mapped;
      }
    } catch (_) {}
  }

  // Generate dynamic affiliate profile if user is authenticated
  const dynamicAff = {
    id: clean.startsWith('AFF-') ? clean : `AFF-${clean.slice(0, 8)}`,
    refCode: clean.startsWith('AFF-') ? clean : `AFF-${clean.slice(0, 8)}`,
    name: identifier,
    email: identifier.includes('@') ? identifier : `${identifier}@partner.gro10x.ai`,
    phone: '+8801708459008',
    sprintRate: SPRINT_COMMISSION_RATE,
    retainerRate: RETAINER_COMMISSION_RATE,
    clicks: 12,
    leadsQualified: 1,
    dealsClosed: 0,
    totalEarnedBDT: 0,
    paidOutBDT: 0,
    pendingBalanceBDT: 0,
    minPayoutThresholdBDT: MIN_PAYOUT_THRESHOLD_BDT,
    settlementAccount: {
      type: 'BRAC Bank Limited',
      bankName: 'BRAC Bank Limited',
      accountName: 'Neoncore Tech Solution',
      accountNumber: '2081636480001',
      branch: 'Mohakhali Branch, Dhaka',
      routing: '060263290'
    },
    conversions: []
  };
  memoryAffiliates.set(dynamicAff.id, dynamicAff);
  if (dynamicAff.refCode) memoryAffiliates.set(dynamicAff.refCode, dynamicAff);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('affiliates').upsert({
        id: dynamicAff.id,
        ref_code: dynamicAff.refCode,
        name: dynamicAff.name,
        email: dynamicAff.email,
        phone: dynamicAff.phone,
        sprint_rate: dynamicAff.sprintRate,
        retainer_rate: dynamicAff.retainerRate,
        clicks: dynamicAff.clicks,
        leads_qualified: dynamicAff.leadsQualified,
        deals_closed: dynamicAff.dealsClosed,
        total_earned_bdt: dynamicAff.totalEarnedBDT,
        paid_out_bdt: dynamicAff.paidOutBDT,
        pending_balance_bdt: dynamicAff.pendingBalanceBDT,
        min_payout_threshold_bdt: dynamicAff.minPayoutThresholdBDT,
        settlement_account: dynamicAff.settlementAccount
      });
    } catch (_) {}
  }

  return dynamicAff;
}

function calculatePartnerTier(affiliate) {
  const volume = Number(affiliate.totalEarnedBDT || 0);
  if (volume >= 200000) {
    return {
      tier: 'Gold',
      badge: '🥇 Gold Enterprise Partner',
      sprintRate: 0.15,
      retainerRate: 0.20,
      ratePercent: 15.0,
      nextTierThresholdBDT: null,
      toNextTierBDT: 0
    };
  } else if (volume >= 50000) {
    return {
      tier: 'Silver',
      badge: '🥈 Silver Growth Partner',
      sprintRate: 0.125,
      retainerRate: 0.175,
      ratePercent: 12.5,
      nextTierThresholdBDT: 200000,
      toNextTierBDT: 200000 - volume
    };
  } else {
    return {
      tier: 'Bronze',
      badge: '🥉 Bronze Partner',
      sprintRate: 0.10,
      retainerRate: 0.15,
      ratePercent: 10.0,
      nextTierThresholdBDT: 50000,
      toNextTierBDT: Math.max(0, 50000 - volume)
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/affiliates/me — Authenticated Affiliate Cockpit Telemetry
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', (req, res, next) => {
  if (req.headers.authorization) {
    return requireAuth(req, res, next);
  }
  next();
}, async (req, res) => {
  try {
    const user = req.user || {};
    const identifier = user.refCode || user.ref_code || user.userId || user.id || user.email || user.name || req.query.ref || 'AFF-TANVIR';
    const affiliate = await getAffiliateRecord(identifier);
    const tierInfo = calculatePartnerTier(affiliate);

    const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
    const referralLink = `${baseUrl}/?ref=${encodeURIComponent(affiliate.refCode)}`;

    return res.json({
      ok: true,
      success: true,
      affiliate: {
        ...affiliate,
        ...tierInfo,
        tierBadge: tierInfo.badge,
        commissionRatePercent: tierInfo.ratePercent,
        referralLink,
        whiteLabelPortalUrl: `${baseUrl}/portal/${encodeURIComponent(affiliate.refCode)}`,
        isWhiteLabelEligible: tierInfo.tier === 'Gold' || Boolean(affiliate.isWhiteLabelEligible),
        conversionRatePercent: affiliate.clicks > 0
          ? Number(((affiliate.dealsClosed / affiliate.clicks) * 100).toFixed(1))
          : 0,
        policy: {
          sprintCommissionRate: tierInfo.sprintRate,
          retainerCommissionRate: tierInfo.retainerRate,
          minPayoutThresholdBDT: MIN_PAYOUT_THRESHOLD_BDT,
          cookieWindowDays: 30
        }
      }
    });
  } catch (err) {
    console.error('Affiliate /me GET error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/affiliates/track/:refCode — Public Referral Link Click Tracker
// ─────────────────────────────────────────────────────────────────────────────
router.get('/track/:refCode', async (req, res) => {
  try {
    const { refCode } = req.params;
    const cleanRef = (refCode || '').trim().toUpperCase();

    const affiliate = await getAffiliateRecord(cleanRef);
    if (affiliate) {
      affiliate.clicks = (affiliate.clicks || 0) + 1;
      memoryAffiliates.set(affiliate.id || cleanRef, affiliate);
      if (isSupabaseConfigured() && affiliate.id) {
        try {
          supabase.from('affiliates').update({ clicks: affiliate.clicks }).eq('id', affiliate.id).then?.(() => {}).catch?.(() => {});
        } catch (_) {}
      }
      broadcast('affiliate_click', { refCode: cleanRef, totalClicks: affiliate.clicks });
    }

    // Set 30-day attribution cookie
    res.cookie('gro10x_aff_ref', cleanRef, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'lax',
      path: '/'
    });

    if (req.query.redirect) {
      return res.redirect(req.query.redirect);
    }

    return res.json({
      ok: true,
      success: true,
      tracked: true,
      refCode: cleanRef,
      attributed: true,
      cookieWindowDays: 30,
      clicks: affiliate ? affiliate.clicks : 1,
      totalClicks: affiliate ? affiliate.clicks : 1
    });
  } catch (err) {
    console.error('Affiliate track error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/affiliates/payout — Request Commission Payout
// ─────────────────────────────────────────────────────────────────────────────
router.post('/payout', async (req, res) => {
  try {
    const { amount, paymentMethod, notes } = req.body;
    const requestedAmount = Number(amount) || 0;

    const user = req.user || {};
    const identifier = req.body.affiliateId || req.body.affiliate_id || user.refCode || req.body.refCode || req.body.affiliateCode || req.body.affiliate_code || req.body.code || user.email || user.name || 'AFF-TANVIR';
    const affiliate = await getAffiliateRecord(identifier);

    if (requestedAmount < MIN_PAYOUT_THRESHOLD_BDT) {
      return res.status(400).json({
        ok: false,
        error: `Minimum payout request threshold is ৳${MIN_PAYOUT_THRESHOLD_BDT.toLocaleString()} BDT ($50 USD equivalent). Your request of ৳${requestedAmount.toLocaleString()} BDT is below the minimum.`
      });
    }

    if (requestedAmount > (affiliate.pendingBalanceBDT || 0)) {
      return res.status(400).json({
        ok: false,
        error: `Requested payout of ৳${requestedAmount.toLocaleString()} BDT exceeds current pending balance of ৳${(affiliate.pendingBalanceBDT || 0).toLocaleString()} BDT.`
      });
    }

    // Deduct pending balance and increment paidOut
    affiliate.pendingBalanceBDT -= requestedAmount;
    affiliate.paidOutBDT = (affiliate.paidOutBDT || 0) + requestedAmount;

    const payoutRecord = {
      id: `PAYOUT-${Date.now().toString(36).toUpperCase()}`,
      affiliateId: affiliate.id,
      affiliateName: affiliate.name,
      amountBDT: requestedAmount,
      paymentMethod: paymentMethod || affiliate.settlementAccount?.type || 'BRAC Bank Corporate',
      settlementAccount: affiliate.settlementAccount,
      status: 'Processing',
      notes: notes || '',
      requestedAt: new Date().toISOString()
    };

    affiliate.payoutHistory = affiliate.payoutHistory || [];
    affiliate.payoutHistory.push(payoutRecord);
    memoryAffiliates.set(affiliate.id, affiliate);
    if (affiliate.refCode) memoryAffiliates.set(affiliate.refCode, affiliate);

    if (isSupabaseConfigured() && affiliate.id) {
      try {
        await supabase.from('affiliate_payouts').insert([{
          id: payoutRecord.id,
          affiliate_id: affiliate.id,
          amount_bdt: requestedAmount,
          status: 'Disbursed',
          settlement_rail: payoutRecord.paymentMethod,
          notes: notes || '',
          requested_at: payoutRecord.requestedAt,
          disbursed_at: payoutRecord.requestedAt
        }]);
        await supabase.from('affiliates').update({
          pending_balance_bdt: affiliate.pendingBalanceBDT,
          paid_out_bdt: affiliate.paidOutBDT,
          updated_at: new Date().toISOString()
        }).eq('id', affiliate.id);
      } catch (_) {}
    }

    // Alert Finance & Admin Team via Telegram
    try {
      const { getTeamBot } = require('../services/bot');
      const teamBot = getTeamBot();
      const financeChatId = process.env.FINANCE_TELEGRAM_CHAT_ID || process.env.TELEGRAM_TEAM_GROUP_ID;
      if (teamBot && financeChatId) {
        const msg = `💸 *New Partner Commission Payout Request*\n\n` +
          `👤 *Affiliate:* ${affiliate.name} (\`${affiliate.refCode}\`)\n` +
          `💰 *Amount:* ৳${requestedAmount.toLocaleString()} BDT\n` +
          `🏦 *Settlement Rail:* ${payoutRecord.paymentMethod}\n` +
          `📄 *A/C:* \`${affiliate.settlementAccount?.accountNumber || '2081636480001'}\`\n` +
          `⏳ *Remaining Balance:* ৳${affiliate.pendingBalanceBDT.toLocaleString()} BDT\n\n` +
          `_Action: Verify via Finance Dashboard and initiate institutional bank transfer._`;
        teamBot.sendMessage(financeChatId, msg, { parse_mode: 'Markdown' }).catch(() => {});
      }
    } catch (_) {}

    broadcast('affiliate_payout_requested', { affiliateId: affiliate.id, payout: payoutRecord });

    try {
      const { emitStakeholderEvent } = require('../services/stakeholder-events');
      emitStakeholderEvent('affiliate.payout_requested', {
        payout: payoutRecord,
        affiliate,
        requestedAmount
      }, {
        stakeholderId: affiliate.id,
        stakeholderType: 'affiliate'
      }).catch?.(() => {});
    } catch (_) {}

    return res.status(201).json({
      ok: true,
      success: true,
      payout: payoutRecord,
      payoutId: payoutRecord.id,
      remainingBalance: affiliate.pendingBalanceBDT,
      remainingBalanceBDT: affiliate.pendingBalanceBDT,
      totalPaidOutBDT: affiliate.paidOutBDT
    });
  } catch (err) {
    console.error('Affiliate payout error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /api/affiliates/calculate — Commission Calculator
// ─────────────────────────────────────────────────────────────────────────────
router.post('/calculate', (req, res) => {
  const { dealType = 'sprint', contractValueBDT = 0, dealValue = 0 } = req.body;
  const value = Number(contractValueBDT || dealValue) || 0;
  const isRetainer = String(dealType).toLowerCase().includes('retainer');
  const rate = isRetainer ? RETAINER_COMMISSION_RATE : SPRINT_COMMISSION_RATE;
  const commission = Math.round(value * rate);

  return res.json({
    ok: true,
    dealType: isRetainer ? 'recurring_retainer' : 'closed_sprint',
    ratePercent: rate * 100,
    commissionPercent: rate * 100,
    contractValueBDT: value,
    dealValue: value,
    commissionAmount: commission,
    estimatedCommissionBDT: commission
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET /api/affiliates/list — Global Affiliate Network (Admin/Manager)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/list', requireAuth, requireManager, async (req, res) => {
  let dbList = [];
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('affiliates').select('*');
      if (data && data.length > 0) {
        dbList = data.map(d => ({
          id: d.id,
          refCode: d.ref_code,
          name: d.name,
          email: d.email,
          phone: d.phone,
          sprintRate: Number(d.sprint_rate || 0.10),
          retainerRate: Number(d.retainer_rate || 0.15),
          clicks: Number(d.clicks || 0),
          leadsQualified: Number(d.leads_qualified || 0),
          dealsClosed: Number(d.deals_closed || 0),
          totalEarnedBDT: Number(d.total_earned_bdt || 0),
          paidOutBDT: Number(d.paid_out_bdt || 0),
          pendingBalanceBDT: Number(d.pending_balance_bdt || 0),
          minPayoutThresholdBDT: Number(d.min_payout_threshold_bdt || 5000),
          settlementAccount: d.settlement_account
        }));
      }
    } catch (_) {}
  }
  const map = new Map();
  for (const a of dbList) map.set(a.id, a);
  for (const a of memoryAffiliates.values()) map.set(a.id, a);
  const list = Array.from(map.values());
  return res.json({
    ok: true,
    success: true,
    totalAffiliates: list.length,
    affiliates: list
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. POST /api/affiliates/payouts/:id/disburse — Finance Approval & Settlement
// ─────────────────────────────────────────────────────────────────────────────
router.post('/payouts/:id/disburse', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { txRef, paymentRail = 'BRAC Bank Corporate Wire' } = req.body;

    let targetPayout = null;
    let targetAffiliate = null;

    for (const aff of memoryAffiliates.values()) {
      if (Array.isArray(aff.payoutHistory)) {
        const p = aff.payoutHistory.find(item => item.id === id);
        if (p) {
          targetPayout = p;
          targetAffiliate = aff;
          break;
        }
      }
    }

    if (!targetPayout) {
      return res.status(404).json({ ok: false, error: `Payout record '${id}' not found` });
    }

    targetPayout.status = 'Disbursed';
    targetPayout.disbursedAt = new Date().toISOString();
    targetPayout.txRef = txRef || `BRAC-TXN-${Date.now().toString(36).toUpperCase()}`;
    targetPayout.paymentRail = paymentRail;

    broadcast('affiliate_payout_disbursed', { affiliateId: targetAffiliate.id, payout: targetPayout });

    return res.json({
      ok: true,
      success: true,
      payout: targetPayout
    });
  } catch (err) {
    console.error('Payout disburse error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET /api/affiliates/payouts/export-brac — BRAC Bank Batch Disbursement CSV
// ─────────────────────────────────────────────────────────────────────────────
router.get('/payouts/export-brac', requireAuth, requireManager, (req, res) => {
  try {
    const rows = [
      ['Beneficiary Name', 'Account Number', 'Bank Name', 'Branch', 'Amount BDT', 'Payment Reference', 'Status']
    ];

    for (const aff of memoryAffiliates.values()) {
      if (Array.isArray(aff.payoutHistory)) {
        for (const p of aff.payoutHistory) {
          const acc = p.settlementAccount || aff.settlementAccount || {};
          rows.push([
            `"${p.affiliateName || aff.name}"`,
            `"${acc.accountNumber || '2081636480001'}"`,
            `"${acc.bankName || 'BRAC Bank Limited'}"`,
            `"${acc.branch || 'Corporate Mohakhali'}"`,
            Number(p.amountBDT || 0).toFixed(2),
            `"${p.txRef || p.id}"`,
            `"${p.status}"`
          ]);
        }
      }
    }

    const csvContent = rows.map(r => r.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="brac_bank_disbursement_schedule.csv"');
    return res.send(csvContent);
  } catch (err) {
    console.error('Export BRAC CSV error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. POST /api/affiliates/attribute-order — Cross-Engine Commerce Attribution
// ─────────────────────────────────────────────────────────────────────────────
router.post('/attribute-order', async (req, res) => {
  try {
    const { refCode, orderId, orderType = 'engine3_digivault', orderAmountBDT = 0, customerName = 'Customer' } = req.body;
    const cleanRef = String(refCode || '').trim().toUpperCase();
    if (!cleanRef) {
      return res.status(400).json({ ok: false, error: 'refCode is required' });
    }

    const affiliate = await getAffiliateRecord(cleanRef);
    if (!affiliate) {
      return res.status(404).json({ ok: false, error: `Affiliate '${cleanRef}' not found` });
    }

    const tierInfo = calculatePartnerTier(affiliate);
    const amt = Number(orderAmountBDT) || 0;
    const rate = tierInfo.sprintRate || 0.10;
    const commission = Math.round(amt * rate);

    const conversionRecord = {
      id: `CONV-CE-${Date.now().toString(36).toUpperCase()}`,
      orderId: orderId || `ORD-${Date.now()}`,
      orderType,
      customerName,
      contractValueBDT: amt,
      dealType: orderType,
      commissionRate: rate,
      commissionEarnedBDT: commission,
      status: 'Accrued',
      date: new Date().toISOString().split('T')[0]
    };

    affiliate.conversions = affiliate.conversions || [];
    affiliate.conversions.push(conversionRecord);
    affiliate.dealsClosed = (affiliate.dealsClosed || 0) + 1;
    affiliate.totalEarnedBDT = (affiliate.totalEarnedBDT || 0) + commission;
    affiliate.pendingBalanceBDT = (affiliate.pendingBalanceBDT || 0) + commission;

    memoryAffiliates.set(affiliate.id, affiliate);
    broadcast('affiliate_conversion', { affiliateId: affiliate.id, conversion: conversionRecord });

    return res.status(201).json({
      ok: true,
      success: true,
      attributed: true,
      affiliateId: affiliate.id,
      refCode: affiliate.refCode,
      tier: tierInfo.tier,
      badge: tierInfo.badge,
      ratePercent: tierInfo.ratePercent,
      commissionRate: rate,
      commissionEarnedBDT: commission,
      newPendingBalanceBDT: affiliate.pendingBalanceBDT
    });
  } catch (err) {
    console.error('Attribute order error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. GET /api/affiliates/portal/:refCode — Co-Branded White-Label Intake Portal Configuration
// ─────────────────────────────────────────────────────────────────────────────
router.get('/portal/:refCode', async (req, res) => {
  try {
    const { refCode } = req.params;
    const affiliate = await getAffiliateRecord(refCode);
    if (!affiliate) return res.status(404).json({ ok: false, error: `Partner '${refCode}' not found` });

    const tierInfo = calculatePartnerTier(affiliate);
    const isGold = tierInfo.tier === 'Gold' || Number(affiliate.totalEarnedBDT || 0) >= 200000;

    const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
    const intakeUrl = `${baseUrl}/partner-intake.html?partner=${encodeURIComponent(affiliate.refCode)}`;

    return res.json({
      ok: true,
      success: true,
      refCode: affiliate.refCode,
      partnerName: affiliate.name,
      partnerCompany: affiliate.settlementAccount?.accountName || affiliate.name || 'Studio Partner',
      tier: tierInfo.tier,
      isGoldWhiteLabelEligible: isGold,
      branding: {
        coBrandedTitle: `${affiliate.name} × GRO10X AI Architecture`,
        tagline: 'Enterprise Rapid Solution Sprints & Custom AI Agent Development',
        intakeUrl,
        partnerCommissionRatePercent: tierInfo.ratePercent
      }
    });
  } catch (err) {
    console.error('Portal config GET error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. GET /api/affiliates/:refCode — Direct Profile & Tier Lookup
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:refCode', async (req, res) => {
  try {
    const { refCode } = req.params;
    const affiliate = await getAffiliateRecord(refCode);
    if (!affiliate) return res.status(404).json({ ok: false, error: 'Affiliate not found' });
    const tierInfo = calculatePartnerTier(affiliate);
    return res.json({
      ok: true,
      success: true,
      affiliate: {
        ...affiliate,
        ...tierInfo
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Cross-Module Commission Accrual Helper
// ─────────────────────────────────────────────────────────────────────────────
async function creditAffiliateCommission(refOrId, details = {}) {
  if (!refOrId) return null;
  const affiliate = await getAffiliateRecord(refOrId);
  if (!affiliate) return null;

  const {
    amount = 0,
    invoiceId = null,
    projectId = null,
    projectName = 'AI Client Sprint',
    dealType = 'sprint'
  } = details;

  const numAmount = Number(amount) || 0;
  if (numAmount <= 0) return null;

  const isRetainer = String(dealType).toLowerCase().includes('retainer');
  const volume = Number(affiliate.totalEarnedBDT || 0);
  let commRate;
  if (isRetainer) {
    commRate = volume >= 200000 ? 0.20 : volume >= 50000 ? 0.175 : 0.15;
  } else {
    commRate = volume >= 200000 ? 0.15 : volume >= 50000 ? 0.125 : 0.10;
  }

  const commissionEarned = Math.round(numAmount * commRate);
  affiliate.pendingBalanceBDT = (Number(affiliate.pendingBalanceBDT) || 0) + commissionEarned;
  affiliate.totalEarnedBDT = (Number(affiliate.totalEarnedBDT) || 0) + commissionEarned;
  affiliate.dealsClosed = (Number(affiliate.dealsClosed) || 0) + 1;

  const convRecord = {
    id: `CONV-${Date.now().toString(36).toUpperCase()}`,
    affiliateId: affiliate.id,
    invoiceId,
    projectId,
    projectName,
    dealType: isRetainer ? 'monthly_retainer_recurring' : 'sprint_closed',
    contractValueBDT: numAmount,
    commissionRate: commRate,
    commissionEarnedBDT: commissionEarned,
    status: 'Accrued',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };

  affiliate.conversions = affiliate.conversions || [];
  affiliate.conversions.push(convRecord);
  memoryAffiliates.set(affiliate.id, affiliate);
  if (affiliate.refCode) memoryAffiliates.set(affiliate.refCode, affiliate);

  if (isSupabaseConfigured() && affiliate.id) {
    try {
      await supabase.from('affiliate_conversions').insert([{
        id: convRecord.id,
        affiliate_id: affiliate.id,
        invoice_id: invoiceId,
        project_id: projectId,
        deal_type: convRecord.dealType,
        contract_value_bdt: numAmount,
        commission_rate: commRate,
        commission_earned_bdt: commissionEarned,
        status: 'Accrued',
        created_at: convRecord.createdAt
      }]);
      await supabase.from('affiliates').update({
        pending_balance_bdt: affiliate.pendingBalanceBDT,
        total_earned_bdt: affiliate.totalEarnedBDT,
        deals_closed: affiliate.dealsClosed,
        updated_at: new Date().toISOString()
      }).eq('id', affiliate.id);
    } catch (_) {}
  }

  broadcast(isRetainer ? 'affiliate_recurring_commission' : 'affiliate_commission_accrued', {
    affiliateId: affiliate.id,
    amount: commissionEarned,
    conversion: convRecord
  });

  try {
    const { emitStakeholderEvent } = require('../services/stakeholder-events');
    emitStakeholderEvent('affiliate.conversion_accrued', {
      conversion: convRecord,
      affiliate,
      commissionEarned
    }, {
      stakeholderId: affiliate.id,
      stakeholderType: 'affiliate'
    }).catch?.(() => {});
  } catch (_) {}

  return { affiliate, conversion: convRecord, commissionEarned };
}

router.memoryAffiliates = memoryAffiliates;
module.exports = router;
module.exports.memoryAffiliates = memoryAffiliates;
module.exports.getAffiliateRecord = getAffiliateRecord;
module.exports.creditAffiliateCommission = creditAffiliateCommission;
module.exports.calculatePartnerTier = calculatePartnerTier;
