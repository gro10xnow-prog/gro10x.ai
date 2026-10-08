import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface TriageAlertPayload {
  conversationId: string;
  clientName: string;
  channel: string;
  projectId?: string;
  issue?: string;
  lastMessage?: string;
}

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
      }
    });
  }

  try {
    const payload: TriageAlertPayload = await req.json();
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN_TEAM") || Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID") || "7754769807";

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing TELEGRAM_BOT_TOKEN" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const message = `🚨 *ENGINE 1: SUPABASE EDGE TRIAGE ALERT*\n\n` +
      `• *Client:* ${payload.clientName || 'Visitor'}\n` +
      `• *Thread ID:* \`${payload.conversationId}\`\n` +
      `• *Channel:* ${(payload.channel || 'web').toUpperCase()}\n` +
      `• *Project Ref:* ${payload.projectId || 'General'}\n` +
      `• *Issue:* ${payload.issue || 'Client requesting human operator takeover'}\n` +
      (payload.lastMessage ? `• *Last Message:* "${payload.lastMessage}"\n\n` : '\n') +
      `[⚡ Open Engine 1 Cockpit](https://gro10x-ai.vercel.app/app#engine1)`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: "⚡ Intervene in Engine 1 Desk", url: "https://gro10x-ai.vercel.app/app#engine1" }
        ]
      ]
    };

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
        reply_markup: inlineKeyboard
      })
    });

    const tgData = await tgRes.json();

    return new Response(JSON.stringify({ ok: true, telegram: tgData }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
});
