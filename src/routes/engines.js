/**
 * src/routes/engines.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 5-Engine Operations & Financial Intelligence API v1.0
 * Computes live multi-engine growth analytics from invoices, payments & expenses.
 * Mounted at: /api/engines
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { readDB } = require('../services/db');

// Engine Targets definition ($100k ARR target breakdown)
const ENGINE_TARGETS = {
  engine1: { id: 'engine1', name: 'Freelance & Enterprise AI Scale', target: 35000, share: '35%' },
  engine2: { id: 'engine2', name: 'Dedicated Client Retainers', target: 25000, share: '25%' },
  engine3: { id: 'engine3', name: 'Digital AI Products & Templates', target: 20000, share: '20%' },
  engine4: { id: 'engine4', name: 'Affiliate & Partnership Ecosystem', target: 15000, share: '15%' },
  engine5: { id: 'engine5', name: 'Studio & Micro Media Lab', target: 5000, share: '5%' }
};

/**
 * GET /api/engines/summary
 * Returns aggregated live revenue metrics per engine & master ARR progress
 */
router.get('/summary', requireAuth, async (req, res) => {
  try {
    let invoices = [];
    let expenses = [];
    let customLogs = {};

    if (isSupabaseConfigured()) {
      const [invRes, expRes, setRes] = await Promise.all([
        supabase.from('invoices').select('id, amount, currency, status, engine_tag, paid_at, issue_date'),
        supabase.from('expenses').select('id, amount, currency, status, category, engine_tag'),
        supabase.from('app_settings').select('value').eq('key', 'engine_custom_logs').maybeSingle()
      ]);

      invoices = invRes.data || [];
      expenses = expRes.data || [];
      customLogs = (setRes.data && setRes.data.value) ? setRes.data.value : {};
    } else {
      const db = await readDB();
      invoices = db.invoices || [];
      expenses = db.expenses || [];
    }

    // Tally revenue per engine
    const engineTotals = {
      engine1: 0,
      engine2: 0,
      engine3: 0,
      engine4: 0,
      engine5: 0
    };

    let totalPaidRevenueUSD = 0;
    const USD_BDT_RATE = 120; // Internal standard conversion

    invoices.forEach(inv => {
      const isPaid = (inv.status || '').toLowerCase() === 'paid';
      let amtUSD = Number(inv.amount || 0);
      if ((inv.currency || '').toUpperCase() === 'BDT') {
        amtUSD = amtUSD / USD_BDT_RATE;
      }

      if (isPaid) {
        totalPaidRevenueUSD += amtUSD;
        const tag = (inv.engine_tag || 'engine2').toLowerCase();
        if (engineTotals[tag] !== undefined) {
          engineTotals[tag] += amtUSD;
        } else {
          engineTotals['engine2'] += amtUSD; // default retainers
        }
      }
    });

    // Merge custom logs (e.g. Etsy / Upwork / YouTube logged earnings)
    Object.keys(customLogs).forEach(engKey => {
      if (engineTotals[engKey] !== undefined && typeof customLogs[engKey] === 'number') {
        engineTotals[engKey] += customLogs[engKey];
        totalPaidRevenueUSD += customLogs[engKey];
      }
    });

    // Tally total expenses
    let totalExpensesUSD = 0;
    expenses.forEach(exp => {
      let expUSD = Number(exp.amount || 0);
      if ((exp.currency || '').toUpperCase() === 'BDT') {
        expUSD = expUSD / USD_BDT_RATE;
      }
      totalExpensesUSD += expUSD;
    });

    const masterTarget = 100000;
    const netMarginUSD = totalPaidRevenueUSD - totalExpensesUSD;
    const netMarginPercent = totalPaidRevenueUSD > 0 ? Math.round((netMarginUSD / totalPaidRevenueUSD) * 100) : 0;

    const responseData = {
      success: true,
      masterARR: {
        current: Math.round(totalPaidRevenueUSD),
        target: masterTarget,
        percent: Math.min(100, Math.round((totalPaidRevenueUSD / masterTarget) * 100)),
        netMarginUSD: Math.round(netMarginUSD),
        netMarginPercent,
        totalExpensesUSD: Math.round(totalExpensesUSD)
      },
      engines: {
        engine1: {
          ...ENGINE_TARGETS.engine1,
          current: Math.round(engineTotals.engine1),
          percent: Math.min(100, Math.round((engineTotals.engine1 / ENGINE_TARGETS.engine1.target) * 100))
        },
        engine2: {
          ...ENGINE_TARGETS.engine2,
          current: Math.round(engineTotals.engine2),
          percent: Math.min(100, Math.round((engineTotals.engine2 / ENGINE_TARGETS.engine2.target) * 100))
        },
        engine3: {
          ...ENGINE_TARGETS.engine3,
          current: Math.round(engineTotals.engine3),
          percent: Math.min(100, Math.round((engineTotals.engine3 / ENGINE_TARGETS.engine3.target) * 100))
        },
        engine4: {
          ...ENGINE_TARGETS.engine4,
          current: Math.round(engineTotals.engine4),
          percent: Math.min(100, Math.round((engineTotals.engine4 / ENGINE_TARGETS.engine4.target) * 100))
        },
        engine5: {
          ...ENGINE_TARGETS.engine5,
          current: Math.round(engineTotals.engine5),
          percent: Math.min(100, Math.round((engineTotals.engine5 / ENGINE_TARGETS.engine5.target) * 100))
        }
      },
      source: isSupabaseConfigured() ? 'live_supabase' : 'offline_fallback',
      timestamp: new Date().toISOString()
    };

    res.json(responseData);
  } catch (err) {
    console.error('[Engines API Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/engines/log
 * Manager+ — Logs manual or external engine milestones (e.g. YouTube, Etsy, Upwork earnings)
 */
router.post('/log', requireAuth, requireManager, async (req, res) => {
  try {
    const { engineId, amount, note } = req.body;
    if (!engineId || !amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Valid engineId and numeric amount are required' });
    }

    const engKey = engineId.toLowerCase();
    if (!ENGINE_TARGETS[engKey]) {
      return res.status(400).json({ error: 'Invalid engineId. Must be one of: engine1, engine2, engine3, engine4, engine5' });
    }

    if (isSupabaseConfigured()) {
      const { data: curData } = await supabase.from('app_settings').select('value').eq('key', 'engine_custom_logs').maybeSingle();
      const currentLogs = (curData && curData.value) ? curData.value : {};
      currentLogs[engKey] = (Number(currentLogs[engKey]) || 0) + Number(amount);

      await supabase.from('app_settings').upsert({
        key: 'engine_custom_logs',
        value: currentLogs,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

      return res.json({ success: true, engineId: engKey, loggedTotal: currentLogs[engKey], note });
    }

    res.json({ success: true, engineId: engKey, loggedAmount: Number(amount), note, mode: 'local' });
  } catch (err) {
    console.error('[Engines Log Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
