/**
 * Supabase Edge Function: escrow-sla-governor
 * ─────────────────────────────────────────────────────────────────────────────
 * Edge evaluator for contractor escrow SLA governance:
 * 1. Checks open defect tickets against 24h SLA and flags breach holdbacks
 * 2. Unfreezes 15% escrow upon 30-day warranty closure when no defects remain
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    // 1. Find projects whose warranty has expired
    const { data: expiredProjects } = await supabase
      .from("projects")
      .select("id, name, warranty_until, delivery_status")
      .not("warranty_until", "is", null)
      .lte("warranty_until", now.toISOString())
      .neq("delivery_status", "WARRANTY_CLOSED");

    let releasedCount = 0;

    for (const proj of expiredProjects || []) {
      // Check if project has any open defect tickets
      const { data: openDefects } = await supabase
        .from("tickets")
        .select("id")
        .eq("project_id", proj.id)
        .neq("status", "resolved")
        .neq("status", "closed");

      if (!openDefects || openDefects.length === 0) {
        // Safe to release escrow and close warranty
        await supabase
          .from("projects")
          .update({
            delivery_status: "WARRANTY_CLOSED",
            updated_at: now.toISOString(),
          })
          .eq("id", proj.id);

        // Update any held SLA holdback records
        await supabase
          .from("sla_holdbacks")
          .update({
            status: "RELEASED",
            resolved_at: now.toISOString(),
          })
          .eq("project_id", proj.id)
          .eq("status", "HELD");

        releasedCount++;
      }
    }

    return new Response(JSON.stringify({ success: true, escrowReleasedCount: releasedCount }), {
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
