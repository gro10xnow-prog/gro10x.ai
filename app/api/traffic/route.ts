import { NextRequest, NextResponse } from 'next/server';

/**
 * app/api/traffic/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Next.js App Router (Vercel Serverless) Endpoint
 * - Receives Facebook traffic group posts from GRO10X Traffic Sentinel Extension.
 * - Authenticates request with process.env.API_SECRET_KEY.
 * - Evaluates post validity and extracts location/severity using Google Gemini AI.
 * - Dispatches real-time structured traffic alerts to Telegram.
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface TrafficPayload {
  postId: string;
  text: string;
  postUrl: string;
  author?: string;
  timestamp?: string;
  groupUrl?: string;
  chatId?: string;
}

interface GeminiTrafficAnalysis {
  isTrafficReport: boolean;
  location: string | null;
  direction: string | null;
  severity: 'HIGH' | 'MODERATE' | 'LOW' | 'CLEAR';
  incidentType: 'ACCIDENT' | 'GRIDLOCK' | 'VIP_MOVEMENT' | 'ROAD_BLOCKED' | 'WATERLOGGING' | 'CLEAR_ROUTE' | 'OTHER';
  summary: string;
}

const serverProcessedPosts = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const apiKeyHeader = req.headers.get('x-api-key');
    const expectedKey = process.env.API_SECRET_KEY;

    if (expectedKey && apiKeyHeader !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid x-api-key header' },
        { status: 401 }
      );
    }

    // 2. Parse Incoming Payload
    const body: TrafficPayload = await req.json();
    const { postId, text, postUrl, author = 'Facebook User', chatId } = body;

    if (!text || text.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Bad Request: Post text must be at least 10 characters' },
        { status: 400 }
      );
    }

    // 2.5 Server-Side Deduplication Check
    if (postId && serverProcessedPosts.has(postId)) {
      console.log(`[Traffic API] 🛑 Duplicate post skipped: ${postId}`);
      return NextResponse.json({
        success: true,
        duplicate: true,
        filtered: true,
        postId,
        message: 'Post already processed; skipped to prevent duplicate alert.'
      });
    }

    if (postId) {
      serverProcessedPosts.set(postId, Date.now());
      if (serverProcessedPosts.size > 1500) {
        const cutoff = Date.now() - DEDUPLICATION_WINDOW_MS;
        for (const [id, time] of serverProcessedPosts.entries()) {
          if (time < cutoff) serverProcessedPosts.delete(id);
        }
      }
    }

    console.log(`[Traffic API] Processing post ${postId} by "${author}"...`);

    // 3. Evaluate with Gemini AI
    const geminiKey = process.env.GEMINI_API_KEY;
    let analysis: GeminiTrafficAnalysis | null = null;

    if (geminiKey) {
      analysis = await analyzeTrafficPostWithGemini(text, author, geminiKey);
    } else {
      console.warn('[Traffic API] No GEMINI_API_KEY found, bypassing AI classification.');
      analysis = {
        isTrafficReport: true,
        location: 'Reported Area',
        direction: null,
        severity: 'MODERATE',
        incidentType: 'OTHER',
        summary: text.slice(0, 150)
      };
    }

    // 4. Filter Non-Traffic Chatter / Questions / Spam
    if (analysis && !analysis.isTrafficReport) {
      console.log(`[Traffic API] 🛑 Post ${postId} filtered: Not an actionable traffic report.`);
      return NextResponse.json({
        success: true,
        filtered: true,
        postId,
        reason: 'Post classified as non-actionable traffic content'
      });
    }

    // 4.5 Filter posts with No Specific Location (e.g. "Unknown", null, "Reported Area")
    const locLower = (analysis?.location || '').toLowerCase().trim();
    if (!locLower || locLower === 'unknown' || locLower === 'null' || locLower === 'n/a') {
      console.log(`[Traffic API] 🛑 Post ${postId} filtered out (missing specific location/road name).`);
      return NextResponse.json({
        success: true,
        filtered: true,
        postId,
        reason: 'Post filtered out because no specific road or location was mentioned'
      });
    }

    // 5. Dispatch Alert to Telegram
    const botToken = process.env.TRAFFIC_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const targetChatId = chatId || process.env.TRAFFIC_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !targetChatId) {
      console.warn('[Traffic API] Missing bot token or TELEGRAM_CHAT_ID');
      return NextResponse.json({
        success: true,
        filtered: false,
        postId,
        analysis,
        warning: 'Telegram dispatch skipped: Missing bot credentials'
      });
    }

    const telegramMessage = formatTelegramTrafficAlert(author, text, postUrl, analysis);
    const telegramRes = await sendTelegramAlert(botToken, targetChatId, telegramMessage);

    return NextResponse.json({
      success: true,
      filtered: false,
      postId,
      analysis,
      telegramDelivered: telegramRes.ok
    });

  } catch (err: any) {
    console.error('[Traffic API Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI AI EVALUATION
// ─────────────────────────────────────────────────────────────────────────────

async function analyzeTrafficPostWithGemini(text: string, author: string, apiKey: string): Promise<GeminiTrafficAnalysis> {
  const systemInstruction = `
You are an expert AI traffic intelligence filter for real-time city and highway road reports in Bangladesh.
Analyze the provided Facebook community post and determine if it contains an ACTUAL TRAFFIC REPORT or road condition update.

Actionable reports include: vehicle accidents, severe gridlock, slow/crawling traffic, travel duration delays between cities/districts (e.g. Comilla to Dhaka taking 5 hours due to traffic), road closures, VIP protocols/movement, police blockades, waterlogging/flooding, broken-down vehicles blocking lanes, or verified clear route status.

Return isTrafficReport = false ONLY for:
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
  let lastError: Error | null = null;

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

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini ${modelName} error (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Traffic Analysis] Model ${modelName} failed:`, err.message);
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

// ─────────────────────────────────────────────────────────────────────────────
// TELEGRAM ALERT FORMATTER & SENDER
// ─────────────────────────────────────────────────────────────────────────────

function formatTelegramTrafficAlert(
  author: string,
  rawText: string,
  postUrl: string,
  analysis: GeminiTrafficAnalysis | null
): string {
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

async function sendTelegramAlert(botToken: string, chatId: string, htmlMessage: string) {
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

  return res;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
