# GRO10X Traffic Sentinel — Setup & Deployment Guide

An automated real-time traffic alert intelligence pipeline:
**Facebook Traffic Group (Chrome Extension) ➔ Gemini AI Classification ➔ Telegram Bot Alerts**

---

## 1. System Architecture

```
[ Facebook Traffic Group (Chrome Tab) ]
                 │
                 ▼ (MutationObserver + ARIA Semantic Selectors)
[ GRO10X Traffic Sentinel Chrome Extension ]
                 │
                 ▼ (HTTP POST with x-api-key)
[ Traffic API Route (Next.js on Vercel OR Local Express) ]
                 │
                 ▼ (Prompt & Strict Schema Evaluation)
[ Google Gemini 1.5 Flash AI Filter ]
                 │ (Is it genuine traffic? Extract Location, Direction, Severity)
                 ▼
[ Telegram Bot API (Formatted HTML Alert) ]
                 │
                 ▼
[ Your Telegram Phone / Commuter Channel ]
```

---

## 2. Environment Variables Setup

### For Vercel (Next.js App Router: `app/api/traffic/route.ts`)
Add the following in your Vercel Project Settings $\rightarrow$ Environment Variables (or `.env.local`):

| Variable | Description | Example |
| :--- | :--- | :--- |
| `API_SECRET_KEY` | Secret token to authenticate Chrome extension requests | `traffic_sec_987654321` |
| `GEMINI_API_KEY` | Google AI Studio Gemini API Key | `AIzaSy...` |
| `TELEGRAM_BOT_TOKEN` | BotFather API Token | `7123456789:AAH...` |
| `TELEGRAM_CHAT_ID` | Telegram User ID or Channel ID where alerts arrive | `-100123456789` or `123456789` |

### For Local Express Server (`Gro10x.ai`)
The route is already active at: `http://localhost:3000/api/traffic`
It uses your existing `.env` file variables (`TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY`).
Optionally add `API_SECRET_KEY` and `TELEGRAM_CHAT_ID` to your `.env`:
```bash
API_SECRET_KEY=traffic_sec_987654321
TELEGRAM_CHAT_ID=YOUR_TELEGRAM_ID
```

> **How to find your Telegram Chat ID:**
> 1. Open Telegram and search for `@userinfobot`.
> 2. Tap **Start**. It will immediately reply with your numeric `Id` (e.g. `123456789`).
> 3. If sending to a private channel/group: Add your bot as Administrator to the channel, forward any message from that channel to `@userinfobot`, and it will give you the channel ID (usually starts with `-100...`).

---

## 3. Loading the Chrome Extension

1. Open Google Chrome.
2. Go to:
   ```text
   chrome://extensions
   ```
3. Enable **Developer mode** toggle in the top right corner.
4. Click **Load unpacked** (top left).
5. Browse and select the directory:
   ```text
   c:\Users\LeNoVo\Documents\GRO10X Business\Gro10x.ai\extension\gro10x-traffic-sentinel
   ```
6. The extension **GRO10X Traffic Sentinel** (`v1.0.0`) will appear in your extensions bar. Pin it for easy access.

---

## 4. Configuring the Extension

1. Click the 🚦 **Traffic Sentinel** icon in your Chrome toolbar.
2. Click **Edit** in the Backend Configuration section:
   - **Backend API Route:**
     - For Local Testing: `http://localhost:3000/api/traffic`
     - For Vercel Production: `https://your-domain.vercel.app/api/traffic`
   - **API Secret Key:** Enter the same key set in `API_SECRET_KEY` (e.g. `traffic_sec_987654321`).
   - **Target Telegram Chat ID:** (Optional) Enter your Chat ID if you want to override the server default.
3. Click **Save Settings**.

---

## 5. Running the Automation on Facebook

1. Navigate to your target Facebook traffic updates group (e.g., Traffic Alert, City Traffic updates).
2. **CRITICAL PRO-TIP:** To receive live, real-time alerts instead of 2-day-old popular posts, ensure the group is sorted by **New Posts**:
   - If the popup shows: `⚠️ Switch to "New Posts" (?sorting_setting=CHRONOLOGICAL)`, click the **"Fix URL"** button directly in the popup!
   - It will reload the tab with `?sorting_setting=CHRONOLOGICAL`.
3. Flip the **Live Feed Monitoring** switch to **ON**.
4. That's it! As new posts are published in the group:
   - The extension detects the new DOM node.
   - Cleans the text and extracts the author and direct permalink.
   - Sends it to the backend.
   - Gemini evaluates: If it's general talk or questions, it's quietly ignored. If it's a real traffic incident (accident, gridlock, VIP protocol, flood), your Telegram immediately buzzes with a clean, structured alert!

---

## 6. Testing the Pipeline Manually (cURL)

You can simulate a live Facebook post directly via terminal:

```bash
curl -X POST http://localhost:3000/api/traffic \
  -H "Content-Type: application/json" \
  -H "x-api-key: traffic_sec_987654321" \
  -d '{
    "postId": "test_post_99",
    "text": "Severe gridlock on Mohakhali flyover towards Banani. A bus broke down blocking 2 lanes. Police diverting traffic.",
    "postUrl": "https://facebook.com/groups/traffic/posts/99",
    "author": "Commuter Alert"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "filtered": false,
  "postId": "test_post_99",
  "analysis": {
    "isTrafficReport": true,
    "location": "Mohakhali Flyover",
    "direction": "Towards Banani",
    "severity": "HIGH",
    "incidentType": "GRIDLOCK",
    "summary": "Severe gridlock due to broken down bus blocking two lanes with police diversions in effect."
  },
  "telegramDelivered": true
}
```
