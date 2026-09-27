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

    // Optional Telegram Bot Notification
    try {
      const teamBot = getTeamBot();
      const teamChatId = process.env.TELEGRAM_TEAM_CHAT_ID;
      if (teamBot && teamChatId) {
        teamBot.sendMessage(
          teamChatId,
          `🎉 *Digital Customer Activated!*\n\n` +
          `👤 *Name:* ${customerName}\n` +
          `📧 *Email:* ${cleanEmail}\n` +
          `📦 *Product:* ${sku}\n` +
          `⚡ *GroCredits:* ${state.wallets[customerId].balance}\n` +
          `🏷️ *Code Used:* \`${cleanCode}\``,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
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
      status: 'redeemable',
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

    // Attempt Live Gemini Call if GEMINI_API_KEY is available
    if (process.env.GEMINI_API_KEY) {
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
