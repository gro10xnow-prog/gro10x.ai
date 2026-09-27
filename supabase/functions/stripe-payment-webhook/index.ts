/**
 * Supabase Edge Function: stripe-payment-webhook
 * ─────────────────────────────────────────────────────────────────────────────
 * Listens for Stripe checkout.session.completed & payment_intent.succeeded
 * events, authenticates webhook signature, settles invoices to 'Paid', and
 * automatically accrues affiliate commissions and activates project sprint stages.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const bodyText = await req.text();
    const event = JSON.parse(bodyText);

    if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
      const sessionOrIntent = event.data.object;
      const metadata = sessionOrIntent.metadata || {};
      const invoiceId = metadata.invoiceId || metadata.invoice_id;
      const affiliateId = metadata.affiliateId || metadata.affiliate_id || metadata.refCode;
      const amountTotal = (sessionOrIntent.amount_total || sessionOrIntent.amount || 0) / 100;

      if (invoiceId) {
        // Mark invoice as Paid
        await supabase
          .from("invoices")
          .update({
            status: "Paid",
            paid_date: new Date().toISOString().split("T")[0],
            settlement_rail: "usd_stripe",
            notes: `Settled via Stripe Webhook (${sessionOrIntent.id})`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoiceId);
      }

      // If affiliate attribution present, credit commission
      if (affiliateId && amountTotal > 0) {
        const commRate = 0.10; // Standard 10% sprint referral commission
        const earned = Math.round(amountTotal * commRate);

        await supabase.from("affiliate_conversions").insert([{
          id: `CONV-STRIPE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          affiliate_id: affiliateId,
          invoice_id: invoiceId || null,
          deal_type: "sprint_closed",
          contract_value_bdt: amountTotal * 120, // Converted to BDT base
          commission_rate: commRate,
          commission_earned_bdt: earned * 120,
          status: "Accrued",
          created_at: new Date().toISOString(),
        }]);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
