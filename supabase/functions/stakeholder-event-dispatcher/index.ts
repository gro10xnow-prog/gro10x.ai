/**
 * Supabase Edge Function: stakeholder-event-dispatcher
 * ─────────────────────────────────────────────────────────────────────────────
 * Deno runtime edge dispatcher for database webhook events.
 * Listens to postgres change events on change_orders, tickets, invoices, disputes
 * and fans out authenticated webhooks to subscribed endpoints.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
}

async function computeHmacSha256(secret: string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(body));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WebhookPayload = await req.json();
    const { table, record, type } = payload;

    // Map table changes to canonical stakeholder events
    let eventName = `${table}.${type.toLowerCase()}`;
    if (table === "change_orders") {
      eventName = record.status === "Approved" ? "change_order.approved" : "change_order.created";
    } else if (table === "invoices" && record.status === "Paid") {
      eventName = "invoice.paid";
    } else if (table === "project_disputes") {
      eventName = record.status === "Resolved" ? "warranty.dispute_resolved" : "warranty.dispute_raised";
    } else if (table === "sla_holdbacks") {
      eventName = "ticket.sla_breach_holdback";
    }

    // Query active webhook subscriptions matching this event
    const { data: subscriptions } = await supabase
      .from("webhook_subscriptions")
      .select("*")
      .eq("is_active", true);

    const matching = (subscriptions || []).filter((sub: any) => {
      const events: string[] = Array.isArray(sub.events) ? sub.events : [];
      return events.includes("*") || events.includes(eventName);
    });

    const dispatchPromises = matching.map(async (sub: any) => {
      const deliveryId = `DELIV-${crypto.randomUUID()}`;
      const payloadString = JSON.stringify({
        id: deliveryId,
        event: eventName,
        timestamp: new Date().toISOString(),
        data: record,
      });

      const signature = await computeHmacSha256(sub.secret, payloadString);

      let statusCode = 0;
      let responseBody = "";
      let deliveryStatus = "pending";

      try {
        const response = await fetch(sub.target_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-GRO10X-Signature": signature,
            "X-GRO10X-Event": eventName,
            "X-GRO10X-Delivery": deliveryId,
          },
          body: payloadString,
        });
        statusCode = response.status;
        responseBody = await response.text();
        deliveryStatus = response.ok ? "success" : "failed";
      } catch (err: any) {
        responseBody = err.message;
        deliveryStatus = "failed";
      }

      await supabase.from("webhook_deliveries").insert([{
        id: deliveryId,
        subscription_id: sub.id,
        event: eventName,
        payload: { event: eventName, data: record },
        response_status: statusCode,
        response_body: responseBody.slice(0, 1000),
        status: deliveryStatus,
        delivered_at: new Date().toISOString(),
      }]);
    });

    await Promise.all(dispatchPromises);

    return new Response(JSON.stringify({ success: true, dispatched: matching.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
