import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          status: "error",
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: jsonHeaders,
        }
      );
    }

    const body = await req.json();
    const { campaign_id } = body ?? {};

    if (!campaign_id) {
      return new Response(
        JSON.stringify({
          status: "error",
          error: "campaign_id is required",
        }),
        {
          status: 400,
          headers: jsonHeaders,
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          status: "error",
          error: "Missing Supabase environment variables",
        }),
        {
          status: 500,
          headers: jsonHeaders,
        }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, tenant_id, instrument_id")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      console.error("campaign read error:", campaignError);

      return new Response(
        JSON.stringify({
          status: "error",
          error: "Campaign not found",
          details: campaignError?.message ?? null,
        }),
        {
          status: 404,
          headers: jsonHeaders,
        }
      );
    }

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, settings, branding")
      .eq("id", campaign.tenant_id)
      .single();

    if (tenantError || !tenant) {
      console.error("tenant read error:", tenantError);

      return new Response(
        JSON.stringify({
          status: "error",
          error: "Failed to read tenant",
          details: tenantError?.message ?? null,
        }),
        {
          status: 500,
          headers: jsonHeaders,
        }
      );
    }

    const { data: instrument, error: instrumentError } = await supabase
      .from("instruments")
      .select("id, name")
      .eq("id", campaign.instrument_id)
      .single();

    if (instrumentError || !instrument) {
      console.error("instrument read error:", instrumentError);

      return new Response(
        JSON.stringify({
          status: "error",
          error: "Failed to read instrument",
          details: instrumentError?.message ?? null,
        }),
        {
          status: 500,
          headers: jsonHeaders,
        }
      );
    }

    const { data: questions, error: questionsError } = await supabase
      .from("instrument_questions")
      .select(`
        id,
        instrument_id,
        question_code,
        question_text,
        question_type,
        question_order,
        category,
        dimension,
        options,
        is_required,
        is_active,
        metadata,
        created_at,
        updated_at
      `)
      .eq("instrument_id", instrument.id)
      .eq("is_active", true)
      .order("question_order", { ascending: true });

    if (questionsError) {
      console.error("instrument_questions read error:", questionsError);

      return new Response(
        JSON.stringify({
          status: "error",
          error: "Failed to read instrument questions",
          details: questionsError.message,
        }),
        {
          status: 500,
          headers: jsonHeaders,
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        tenant,
        campaign,
        instrument,
        questions: questions ?? [],
      }),
      {
        status: 200,
        headers: jsonHeaders,
      }
    );
  } catch (err) {
    console.error("Unhandled get_campaign_diagnostic_config error:", err);

    return new Response(
      JSON.stringify({
        status: "error",
        error: "Unexpected server error",
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: jsonHeaders,
      }
    );
  }
});