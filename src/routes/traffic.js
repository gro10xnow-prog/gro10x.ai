/**
 * src/routes/traffic.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Traffic Sentinel Backend API
 * Receives Facebook traffic group posts from Chrome Extension,
 * evaluates validity & severity via Google Gemini AI,
 * and pushes structured real-time alerts to Telegram.
 * 
 * Mounted at: /api/traffic
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();

/**
 * In-Memory Server Deduplication Cache
 * Prevents identical Facebook posts from ever triggering duplicate Gemini calls or Telegram alerts.
 */
const serverProcessedPosts = new Map();
const DEDUPLICATION_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Helper: Escape HTML for Telegram
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Gemini AI Post Evaluation
 */
async function analyzeTrafficPostWithGemini(text, author, apiKey) {
  const systemInstruction = `
You are an expert AI traffic intelligence filter for real-time city and highway road reports in Bangladesh.
Analyze the provided Facebook community post and determine if it contains an ACTUAL, ACTIONABLE TRAFFIC REPORT or road condition update.

Actionable reports include: vehicle accidents, severe gridlock, slow/crawling traffic, travel duration delays between cities/districts (e.g. Comilla to Dhaka taking 5 hours), road closures, VIP protocols/movement, police blockades, waterlogging/flooding, broken-down vehicles blocking lanes, or verified clear route status on a SPECIFIC road.

CRITICAL: Return isTrafficReport = false for:
- Posts without a specific road, highway, intersection, or city/district location (e.g. "Rasta faka", "All clear", "Just arrived", "একদম ই ফাঁকা")
- Pure questions with no traffic information (e.g. "How is the road?", "Flyover open?", "Rasta kemon?")
- Commercial advertisements, buy/sell posts, rental cars, or car parts
- Completely off-topic chat unrelated to road traffic conditions

Return a valid JSON object strictly matching this schema with no markdown code fences:
{
  "isTrafficReport": boolean,
  "location": "Road, Highway, Intersection, or City/District route (e.g. Dhaka-Chittagong Highway, Comilla to Dhaka, Mohakhali, Banani)",
  "direction": "Direction of travel e.g. Dhaka-bound, Northbound, or null",
  "severity": "HIGH" | "MODERATE" | "LOW" | "CLEAR",
  "incidentType": "ACCIDENT" | "GRIDLOCK" | "VIP_MOVEMENT" | "ROAD_BLOCKED" | "WATERLOGGING" | "CLEAR_ROUTE" | "OTHER",
  "summary": "Concise 1-sentence English summary of the situation"
}
`;

  const prompt = `Post Author: ${author}\nPost Content:\n"${text}"`;
  const models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-flash-latest'];
  let lastError = null;

  for (const modelName of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              { text: systemInstruction + '\n\n' + prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini ${modelName} error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Traffic Analysis] Model ${modelName} failed, attempting fallback:`, err.message);
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

/**
 * Telegram Message Formatter
 */
function formatTelegramTrafficAlert(author, rawText, postUrl, analysis) {
  const severityEmoji = {
    HIGH: '🔴 HIGH SEVERITY',
    MODERATE: '🟡 MODERATE',
    LOW: '🟢 MINOR / CLEARING',
    CLEAR: '✅ CLEAR ROUTE'
  }[analysis?.severity || 'MODERATE'];

  const typeEmoji = {
    ACCIDENT: '💥 Accident',
    GRIDLOCK: '🚗 Heavy Gridlock',
    VIP_MOVEMENT: '🚔 VIP Movement / Protocol',
    ROAD_BLOCKED: '🚧 Road Blocked',
    WATERLOGGING: '🌊 Waterlogging',
    CLEAR_ROUTE: '🟢 Clear Flow',
    OTHER: '⚠️ Traffic Incident'
  }[analysis?.incidentType || 'OTHER'];

  const locationStr = [analysis?.location, analysis?.direction ? `(${analysis.direction})` : '']
    .filter(Boolean)
    .join(' ');

  const snippet = rawText.length > 250 ? rawText.slice(0, 250) + '...' : rawText;

  return [
    `🚨 <b>TRAFFIC ALERT</b> | ${severityEmoji}`,
    '',
    locationStr ? `📍 <b>Location:</b> ${escapeHtml(locationStr)}` : '',
    `⚠️ <b>Type:</b> ${typeEmoji}`,
    analysis?.summary ? `💡 <b>Summary:</b> ${escapeHtml(analysis.summary)}` : '',
    '',
    `📝 <b>Report:</b> <i>"${escapeHtml(snippet)}"</i>`,
    `👤 <b>Source:</b> ${escapeHtml(author)}`,
    '',
    postUrl ? `🔗 <a href="${postUrl}">View Original Post on Facebook</a>` : ''
  ].filter(line => line !== '').join('\n');
}

/**
 * Send alert via Telegram Bot API
 */
async function sendTelegramAlert(botToken, chatId, htmlMessage) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: htmlMessage,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    })
  });

  const body = await res.json();
  return { ok: res.ok, body };
}

/**
 * GET /api/traffic/status
 * Health check & configuration status
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'GRO10X Traffic Sentinel API',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasTelegramToken: Boolean(process.env.TELEGRAM_BOT_TOKEN || process.env.TRAFFIC_BOT_TOKEN),
    hasDefaultChatId: Boolean(process.env.TELEGRAM_CHAT_ID || process.env.TRAFFIC_CHAT_ID),
    hasApiSecret: Boolean(process.env.API_SECRET_KEY),
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/traffic/test-ping
 * Send a fast verification message to Telegram bot
 */
router.post('/test-ping', async (req, res) => {
  try {
    const botToken = process.env.TRAFFIC_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const targetChatId = req.body?.chatId || process.env.TRAFFIC_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !targetChatId) {
      return res.status(400).json({ success: false, error: 'Missing bot token or chatId' });
    }

    const testMessage = [
      `🤖 <b>GRO10X Traffic Sentinel — Bot Connected!</b>`,
      ``,
      `✅ <b>Connection Status:</b> Active & Verified`,
      `🕒 <b>Server Time:</b> ${new Date().toLocaleTimeString()} (Dhaka)`,
      `🎯 <b>Target Chat ID:</b> <code>${escapeHtml(String(targetChatId))}</code>`,
      ``,
      `<i>Real-time traffic incident alerts will be forwarded directly here.</i>`
    ].join('\n');

    const result = await sendTelegramAlert(botToken, targetChatId, testMessage);
    res.json({ success: result.ok, result: result.body });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/traffic
 * Main ingest endpoint for Chrome Extension
 */
router.post('/', async (req, res) => {
  try {
    // 1. Validate API Key
    const expectedKey = process.env.API_SECRET_KEY;
    const clientKey = req.headers['x-api-key'];

    if (expectedKey && clientKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid x-api-key header'
      });
    }

    // 2. Validate payload
    const { postId, text, postUrl, author = 'Facebook User', chatId } = req.body;

    if (!text || text.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request: Post text must be at least 10 characters'
      });
    }

    // 2.5 SERVER-LEVEL DEDUPLICATION
    if (postId && serverProcessedPosts.has(postId)) {
      const firstSeen = serverProcessedPosts.get(postId);
      console.log(`[Traffic Ingest] 🛑 Duplicate post skipped: ${postId} (originally processed at ${new Date(firstSeen).toLocaleTimeString()})`);
      return res.json({
        success: true,
        duplicate: true,
        filtered: true,
        postId,
        message: 'Post already processed; skipped to prevent duplicate alert.'
      });
    }

    // Register postId immediately in server cache
    if (postId) {
      serverProcessedPosts.set(postId, Date.now());
      if (serverProcessedPosts.size > 1500) {
        const cutoff = Date.now() - DEDUPLICATION_WINDOW_MS;
        for (const [id, time] of serverProcessedPosts.entries()) {
          if (time < cutoff) serverProcessedPosts.delete(id);
        }
      }
    }

    console.log(`[Traffic Ingest] Received post ${postId} from "${author}" (${text.slice(0, 50)}...)`);

    // 3. AI Evaluation with Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    let analysis = null;

    if (geminiKey) {
      try {
        analysis = await analyzeTrafficPostWithGemini(text, author, geminiKey);
      } catch (geminiErr) {
        console.warn('[Traffic Ingest] Gemini evaluation failed, falling back to manual bypass:', geminiErr.message);
        analysis = {
          isTrafficReport: true,
          location: 'Reported Area',
          direction: null,
          severity: 'MODERATE',
          incidentType: 'OTHER',
          summary: text.slice(0, 150)
        };
      }
    } else {
      analysis = {
        isTrafficReport: true,
        location: 'Reported Area',
        direction: null,
        severity: 'MODERATE',
        incidentType: 'OTHER',
        summary: text.slice(0, 150)
      };
    }

    // 4. Check if classified as traffic report
    if (analysis && !analysis.isTrafficReport) {
      console.log(`[Traffic Ingest] 🛑 Post ${postId} filtered out (non-traffic content).`);
      return res.json({
        success: true,
        filtered: true,
        postId,
        reason: 'Post classified as non-actionable traffic content'
      });
    }

    // 4.5 Filter posts with No Specific Location (e.g. "Unknown", null, "Reported Area")
    const locLower = (analysis?.location || '').toLowerCase().trim();
    if (!locLower || locLower === 'unknown' || locLower === 'null' || locLower === 'n/a') {
      console.log(`[Traffic Ingest] 🛑 Post ${postId} filtered out (missing specific location/road name).`);
      return res.json({
        success: true,
        filtered: true,
        postId,
        reason: 'Post filtered out because no specific road or location was mentioned'
      });
    }

    // 5. Dispatch Telegram Alert
    const botToken = process.env.TRAFFIC_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const targetChatId = chatId || process.env.TRAFFIC_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

    let telegramStatus = null;
    if (botToken && targetChatId) {
      const htmlMsg = formatTelegramTrafficAlert(author, text, postUrl, analysis);
      telegramStatus = await sendTelegramAlert(botToken, targetChatId, htmlMsg);
      console.log(`[Traffic Ingest] 📢 Alert dispatched to Telegram chat ${targetChatId}. Status:`, telegramStatus.ok);
    } else {
      console.warn('[Traffic Ingest] Telegram alert skipped: Missing bot token or TELEGRAM_CHAT_ID.');
    }

    return res.json({
      success: true,
      filtered: false,
      postId,
      analysis,
      telegramDelivered: telegramStatus?.ok || false,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('[Traffic Ingest Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error'
    });
  }
});

module.exports = router;
