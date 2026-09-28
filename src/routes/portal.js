/**
 * src/routes/portal.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal Customer Portal & Credit Wallet Router
 * Powers digital product activations, GroCredits ledger, and Gemini AI Coach.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { signToken, verifyToken } = require('../services/jwt');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { getTeamBot } = require('../services/bot');
const sse = require('../services/sse');
const broadcast = (...args) => (sse && typeof sse.broadcast === 'function' ? sse.broadcast(...args) : null);
let botNotifications = null;
try {
  botNotifications = require('../services/bot/notifications');
} catch (_) {
  try { botNotifications = require('../services/bot'); } catch (__) {}
}

// Local-first persistent state file for testing and offline resilience
const PORTAL_STATE_FILE = path.join(__dirname, '../../data/portal_state.json');

function loadPortalState() {
  try {
    if (fs.existsSync(PORTAL_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(PORTAL_STATE_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('[Portal State] Read fallback note:', e.message);
  }
  return {
    customers: {},
    wallets: {},
    transactions: {},
    states: {}
  };
}

function savePortalState(state) {
  try {
    const dir = path.dirname(PORTAL_STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PORTAL_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Portal State] Write fallback note:', e.message);
  }
}

// Helper: Extract & verify customer token
function requireCustomerAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  } else if (req.headers.cookie) {
    const cookies = Object.fromEntries(
      req.headers.cookie.split('; ').map(c => c.split('='))
    );
    token = cookies['gro10x_customer_token'];
  }

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Customer session token required. Please activate or sign in.' });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.customerId) {
    return res.status(401).json({ ok: false, error: 'Invalid or expired customer session token.' });
  }

  req.customer = decoded;
  next();
}

/**
 * 1. POST /api/portal/activate
 * Activates digital product license with order code, captures email, seeds GroCredits
 */
router.post('/activate', async (req, res) => {
  try {
    const { code, email, name } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ ok: false, error: 'A valid email address is required to activate your digital companion.' });
    }

    const cleanCode = (code || 'PLA14-DEMO-2026').trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const customerName = (name || cleanEmail.split('@')[0]).trim();

    // Standard SKU association: defaults to PLA-14
    let sku = 'PLA-14';
    if (cleanCode.includes('PLA15') || cleanCode.includes('PLA-15')) sku = 'PLA-15';
    if (cleanCode.includes('PLA16') || cleanCode.includes('PLA-16')) sku = 'PLA-16';

    const state = loadPortalState();

    // Find or create customer
    let customerId = Object.keys(state.customers).find(id => state.customers[id].email === cleanEmail);
    let isNewCustomer = false;

    if (!customerId) {
      isNewCustomer = true;
      customerId = 'CUST-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      state.customers[customerId] = {
        id: customerId,
        email: cleanEmail,
        name: customerName,
        createdAt: new Date().toISOString(),
        unlockedSkus: [sku]
      };
      // Seed wallet with +200 GroCredits welcome balance
      state.wallets[customerId] = {
        balance: 200,
        tier: 'VIP Creator',
        lifetimeEarned: 200
      };
      state.transactions[customerId] = [
        {
          id: 'TXN-' + Date.now(),
          amount: 200,
          type: 'credit',
          reason: `Welcome Bonus (${sku} Purchase Unlock)`,
          timestamp: new Date().toISOString()
        }
      ];
    } else {
      // Existing customer: ensure SKU is unlocked
      if (!state.customers[customerId].unlockedSkus.includes(sku)) {
        state.customers[customerId].unlockedSkus.push(sku);
        // Bonus 100 credits for additional product unlock
        state.wallets[customerId].balance += 100;
        state.wallets[customerId].lifetimeEarned += 100;
        state.transactions[customerId].unshift({
          id: 'TXN-' + Date.now(),
          amount: 100,
          type: 'credit',
          reason: `Bonus Unlock (${sku} Companion Added)`,
          timestamp: new Date().toISOString()
        });
      }
    }

    savePortalState(state);

    // Issue customer JWT session token (valid for 30 days)
    const token = signToken({
      customerId,
      email: cleanEmail,
      name: customerName,
      role: 'customer'
    }, 30 * 24 * 60 * 60);

    // Broadcast Real-Time SSE
    try {
      broadcast('customer_activated', {
        customerId,
        email: cleanEmail,
        name: customerName,
        sku,
        isNewCustomer,
        credits: state.wallets[customerId].balance
      });
    } catch (_) {}

    // Background Supabase Sync
    if (isSupabaseConfigured && supabase) {
      try {
        supabase.from('customer_vault').upsert({
          customer_id: customerId,
          email: cleanEmail,
          name: customerName,
          unlocked_skus: state.customers[customerId].unlockedSkus,
          gro_credits_balance: state.wallets[customerId].balance,
          updated_at: new Date().toISOString()
        }).catch(() => {});
      } catch (_) {}
    }

    // Optional Telegram Bot Notification
    try {
      const teamBot = getTeamBot();
      const teamChatId = process.env.TELEGRAM_TEAM_CHAT_ID;
      const alertMsg =
        `🎉 *Digital Customer Activated!*\n\n` +
        `👤 *Name:* ${customerName}\n` +
        `📧 *Email:* ${cleanEmail}\n` +
        `📦 *Product:* ${sku}\n` +
        `⚡ *GroCredits:* ${state.wallets[customerId].balance}\n` +
        `🏷️ *Code Used:* \`${cleanCode}\``;

      if (teamBot && teamChatId) {
        teamBot.sendMessage(teamChatId, alertMsg, { parse_mode: 'Markdown' }).catch(() => {});
      } else if (botNotifications && botNotifications.sendTelegramNotification) {
        botNotifications.sendTelegramNotification(
          process.env.TELEGRAM_ADMIN_CHAT_ID || '7754769807',
          alertMsg,
          null,
          true
        );
      }
    } catch (_) {}

    return res.json({
      ok: true,
      token,
      customer: state.customers[customerId],
      wallet: state.wallets[customerId],
      unlockedSkus: state.customers[customerId].unlockedSkus,
      isNewCustomer
    });

  } catch (err) {
    console.error('Portal activation error:', err);
    return res.status(500).json({ ok: false, error: 'Internal activation error: ' + err.message });
  }
});

/**
 * 2. GET /api/portal/me
 * Returns authenticated customer profile, wallet, and unlocked products
 */
router.get('/me', requireCustomerAuth, (req, res) => {
  const state = loadPortalState();
  const { customerId } = req.customer;

  const customer = state.customers[customerId] || {
    id: customerId,
    email: req.customer.email,
    name: req.customer.name,
    unlockedSkus: ['PLA-14']
  };

  const wallet = state.wallets[customerId] || {
    balance: 200,
    tier: 'VIP Creator',
    lifetimeEarned: 200
  };

  const transactions = state.transactions[customerId] || [];

  // Product metadata for the catalog shelf
  const products = [
    {
      sku: 'PLA-14',
      name: 'Daily & Weekly Planners #1',
      brand: 'PlannerQueenGro',
      status: customer.unlockedSkus.includes('PLA-14') ? 'unlocked' : 'locked',
      interactiveUrl: '/planner/',
      pdfDownloadUrl: '/dist/PLA-14_PlannerQueenGro_Complete_16_Spreads.pdf',
      canvaTemplateUrl: 'https://www.canva.com/design/DAGMockup14/view',
      creditsCost: 0
    },
    {
      sku: 'PLA-15',
      name: 'ADHD Low-Dopamine & Low-Friction Daily Task Planner',
      brand: 'PlannerQueenGro',
      status: customer.unlockedSkus.includes('PLA-15') ? 'unlocked' : 'locked',
      interactiveUrl: '/planner/?sku=PLA-15',
      pdfDownloadUrl: '#',
      canvaTemplateUrl: '#',
      creditsCost: 150
    },
    {
      sku: 'MERCH-01',
      name: 'Custom Organic Cotton Planner Queen T-Shirt ($10 Voucher)',
      brand: 'PlannerQueenGro Apparel',
      status: customer.unlockedSkus.includes('MERCH-01') ? 'unlocked' : 'redeemable',
      creditsCost: 100
    }
  ];

  return res.json({
    ok: true,
    customer,
    wallet,
    transactions,
    products
  });
});

/**
 * 2b. POST /api/portal/redeem
 * Redeems GroCredits for companion digital product unlocks (e.g., PLA-15) or merchandise vouchers
 */
router.post('/redeem', requireCustomerAuth, async (req, res) => {
  try {
    const { sku, creditsCost, name } = req.body;
    const { customerId } = req.customer;

    if (!sku) {
      return res.status(400).json({ ok: false, error: 'Product SKU is required for redemption.' });
    }

    const state = loadPortalState();
    let customer = state.customers[customerId];
    if (!customer) {
      customer = {
        id: customerId,
        email: req.customer.email,
        name: req.customer.name,
        unlockedSkus: ['PLA-14']
      };
      state.customers[customerId] = customer;
    }

    let wallet = state.wallets[customerId];
    if (!wallet) {
      wallet = { balance: 200, lifetimeEarned: 200, tier: 'VIP Creator' };
      state.wallets[customerId] = wallet;
    }

    // Default cost resolution
    let cost = typeof creditsCost === 'number' ? creditsCost : parseInt(creditsCost, 10);
    if (isNaN(cost) || cost <= 0) {
      if (sku === 'PLA-15') cost = 150;
      else if (sku === 'MERCH-01') cost = 100;
      else cost = 100;
    }

    // Prevent double-unlock for digital companion SKUs
    if (customer.unlockedSkus && customer.unlockedSkus.includes(sku) && sku.startsWith('PLA-')) {
      return res.status(400).json({
        ok: false,
        error: `SKU ${sku} is already unlocked in your vault.`,
        unlockedSkus: customer.unlockedSkus,
        balance: wallet.balance
      });
    }

    // Credit Gate: Check balance
    if (wallet.balance < cost) {
      return res.status(402).json({
        ok: false,
        error: `Insufficient GroCredits. You have ${wallet.balance} credits, but unlocking ${name || sku} requires ${cost} credits.`,
        balance: wallet.balance,
        required: cost
      });
    }

    // Deduct credits
    wallet.balance -= cost;
    state.wallets[customerId] = wallet;

    // Unlock digital SKU
    if (!customer.unlockedSkus) customer.unlockedSkus = [];
    if (!customer.unlockedSkus.includes(sku)) {
      customer.unlockedSkus.push(sku);
    }
    state.customers[customerId] = customer;

    // Record Transaction Ledger Entry
    const txnId = 'TXN-RED-' + Date.now();
    const txn = {
      id: txnId,
      amount: -cost,
      type: 'debit',
      reason: `Unlocked Companion: ${name || sku} (${sku})`,
      timestamp: new Date().toISOString()
    };
    if (!state.transactions[customerId]) state.transactions[customerId] = [];
    state.transactions[customerId].unshift(txn);

    savePortalState(state);

    // Sync to Supabase in background
    if (isSupabaseConfigured && supabase) {
      try {
        supabase.from('customer_vault').upsert({
          customer_id: customerId,
          email: customer.email,
          name: customer.name,
          unlocked_skus: customer.unlockedSkus,
          gro_credits_balance: wallet.balance,
          updated_at: new Date().toISOString()
        }).catch(() => {});
      } catch (_) {}
    }

    // Broadcast Real-Time SSE
    try {
      broadcast('vault_redeemed', {
        customerId,
        sku,
        name: name || sku,
        cost,
        balance: wallet.balance
      });
    } catch (_) {}

    // Dispatch Telegram Bot Alert
    try {
      const teamBot = getTeamBot();
      const teamChatId = process.env.TELEGRAM_TEAM_CHAT_ID;
      const alertMsg =
        `🎁 *Digital Product Vault: Perk Redeemed!*\n\n` +
        `👤 *Customer:* ${customer.name || 'Creator'} (\`${customer.email}\`)\n` +
        `📦 *Unlocked:* ${name || sku} (\`${sku}\`)\n` +
        `⚡ *Credits Spent:* -${cost} (New Balance: ${wallet.balance})\n` +
        `🔖 *Txn ID:* \`${txnId}\``;

      if (teamBot && teamChatId) {
        teamBot.sendMessage(teamChatId, alertMsg, { parse_mode: 'Markdown' }).catch(() => {});
      } else if (botNotifications && botNotifications.sendTelegramNotification) {
        botNotifications.sendTelegramNotification(
          process.env.TELEGRAM_ADMIN_CHAT_ID || '7754769807',
          alertMsg,
          null,
          true
        );
      }
    } catch (_) {}

    return res.json({
      ok: true,
      message: `Successfully unlocked ${name || sku}!`,
      unlockedSkus: customer.unlockedSkus,
      newBalance: wallet.balance,
      wallet,
      transaction: txn
    });

  } catch (err) {
    console.error('Portal redeem error:', err);
    return res.status(500).json({ ok: false, error: 'Internal redemption error: ' + err.message });
  }
});

/**
 * 3. POST /api/portal/ai-assist
 * Consumes 10 GroCredits and calls Gemini API for daily focus briefing
 */
router.post('/ai-assist', requireCustomerAuth, async (req, res) => {
  try {
    const state = loadPortalState();
    const { customerId } = req.customer;
    const wallet = state.wallets[customerId] || { balance: 0 };

    // Credit Gate: Requires 10 GroCredits
    const COST = 10;
    if (wallet.balance < COST) {
      return res.status(402).json({
        ok: false,
        error: `Insufficient GroCredits. You have ${wallet.balance} credits, but the AI Focus Coach requires ${COST} credits.`,
        balance: wallet.balance,
        required: COST
      });
    }

    const { date, intention, priorities, schedule, energy } = req.body;

    let coachingText = '';

    // Attempt Live Gemini Call if GEMINI_API_KEY is available (skipped during testing for deterministic speed)
    if (process.env.GEMINI_API_KEY && process.env.NODE_ENV !== 'test') {
      try {
        const { GoogleGenAI } = require('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `
You are the luxury, empowering executive life coach for PlannerQueenGro (Daily & Weekly Planners #1).
A customer using our interactive planner has submitted their day's blueprint:
- Date: ${date || 'Today'}
- Daily Focus Intention: ${intention || 'Flow, high impact, and peace'}
- Top 3 Priorities: ${JSON.stringify(priorities || ['Deep work sprint', 'Strategic client outreach', 'Physical movement'])}
- Energy Spectrum: Level ${energy || 4} out of 5

Deliver a concise, elegant Morning Briefing in 3 structured sections:
1. ⚡ FOCUS ARCHITECTURE: Tell them exactly when and how to execute their #1 Must-Do task with zero procrastination.
2. 🛡️ FRICTION BUSTER: One practical strategy to protect their boundary and preserve high energy.
3. 🌿 BOTANICAL MANTRA: One inspiring, empowering closing sentence in the warm, refined PlannerQueenGro voice.
Keep the response crisp, practical, and under 180 words.`;

        const candidateModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];
        for (const model of candidateModels) {
          try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 4000));
            const callPromise = ai.models.generateContent({
              model,
              contents: prompt
            });
            const response = await Promise.race([callPromise, timeoutPromise]);
            if (response && response.text) {
              coachingText = response.text;
              break;
            }
          } catch (mErr) {
            // try next model candidate
          }
        }
      } catch (geminiErr) {
        console.warn('[Gemini AI Coach] SDK call warning, using luxury fallback:', geminiErr.message);
      }
    }

    // High-quality aesthetic fallback if Gemini call is offline or key missing
    if (!coachingText) {
      coachingText = `
**⚡ Focus Architecture:** Tackle your primary needle-mover during your first 90-minute morning window before checking notifications. Protect this time block fiercely.

**🛡️ Friction Buster:** Pair your medium-impact tasks with an environmental anchor—a clean workspace, fresh herbal tea, and 25-minute Pomodoro intervals.

**🌿 Botanical Mantra:** *"Consistency is not about perfection; it is the quiet grace of showing up for your intentions one focused hour at a time."*
      `.trim();
    }

    // Deduct credits and log transaction
    wallet.balance -= COST;
    state.wallets[customerId] = wallet;

    if (!state.transactions[customerId]) state.transactions[customerId] = [];
    state.transactions[customerId].unshift({
      id: 'TXN-' + Date.now(),
      amount: -COST,
      type: 'debit',
      reason: 'AI Focus Coach Morning Briefing',
      timestamp: new Date().toISOString()
    });

    savePortalState(state);

    // Broadcast Real-Time SSE
    try {
      broadcast('ai_coach_invoked', {
        customerId,
        cost: COST,
        newBalance: wallet.balance
      });
    } catch (_) {}

    return res.json({
      ok: true,
      coaching: coachingText,
      newBalance: wallet.balance,
      deducted: COST
    });

  } catch (err) {
    console.error('AI Assist error:', err);
    return res.status(500).json({ ok: false, error: 'AI Coach service error: ' + err.message });
  }
});

/**
 * 4. PUT /api/portal/sync-state
 * Persists planner state to cloud
 */
router.put('/sync-state', requireCustomerAuth, (req, res) => {
  try {
    const { sku, plannerData } = req.body;
    const { customerId } = req.customer;
    const state = loadPortalState();

    if (!state.states[customerId]) state.states[customerId] = {};
    state.states[customerId][sku || 'PLA-14'] = {
      data: plannerData,
      updatedAt: new Date().toISOString()
    };

    savePortalState(state);
    return res.json({ ok: true, syncedAt: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * 5. GET /api/portal/sync-state
 * Retrieves cloud synced planner state
 */
router.get('/sync-state', requireCustomerAuth, (req, res) => {
  const { sku } = req.query;
  const { customerId } = req.customer;
  const state = loadPortalState();

  const saved = state.states[customerId] && state.states[customerId][sku || 'PLA-14'];
  return res.json({
    ok: true,
    data: saved ? saved.data : null,
    updatedAt: saved ? saved.updatedAt : null
  });
});

module.exports = router;
