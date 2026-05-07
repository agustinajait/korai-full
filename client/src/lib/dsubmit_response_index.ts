import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type DiagnosticType =
  | "baseline"
  | "redundant"
  | "follow_up_early"
  | "follow_up_valid";

function jsonHeaders(): HeadersInit {
  return { ...corsHeaders, "Content-Type": "application/json" };
}

async function hashDniSha256(dni: string): Promise<string> {
  const normalized = String(dni).trim();
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const DEFAULT_MIN_DAYS = 90;
const DEFAULT_REDUNDANT_HOURS = 24;

interface RetestConfig {
  minDaysBetweenFollowups: number;
  redundantIfWithinHours: number;
}

function getRetestConfig(settings: unknown): RetestConfig {
  const defaults: RetestConfig = {
    minDaysBetweenFollowups: DEFAULT_MIN_DAYS,
    redundantIfWithinHours: DEFAULT_REDUNDANT_HOURS,
  };
  if (settings === null || settings === undefined) return defaults;
  let root: Record<string, unknown>;
  if (typeof settings === "string") {
    try {
      const parsed = JSON.parse(settings) as unknown;
      if (typeof parsed !== "object" || parsed === null) return defaults;
      root = parsed as Record<string, unknown>;
    } catch { return defaults; }
  } else if (typeof settings === "object") {
    root = settings as Record<string, unknown>;
  } else { return defaults; }
  const nested =
    (root.diagnostic_retest as Record<string, unknown> | undefined) ??
    (root.diagnostic as Record<string, unknown> | undefined) ??
    (root.retest as Record<string, unknown> | undefined);
  const src = nested && typeof nested === "object" ? nested : root;
  const minRaw = src.min_days_between_followups ?? src.retest_min_days ?? src.minDaysBetweenFollowups ?? src.min_days;
  const redH = src.redundant_if_within_hours ?? src.redundant_window_hours ?? src.redundantIfWithinHours ?? src.redundant_hours;
  const minDays = Number(minRaw);
  const redundantHours = Number(redH);
  return {
    minDaysBetweenFollowups: Number.isFinite(minDays) && minDays > 0 ? minDays : defaults.minDaysBetweenFollowups,
    redundantIfWithinHours: Number.isFinite(redundantHours) && redundantHours >= 0 ? redundantHours : defaults.redundantIfWithinHours,
  };
}

function computeDiagnostic(lastSubmittedAt: string | null, now: Date, cfg: RetestConfig): { type: DiagnosticType; daysSinceLast: number } {
  if (!lastSubmittedAt) return { type: "baseline", daysSinceLast: 0 };
  const last = new Date(lastSubmittedAt);
  const ms = now.getTime() - last.getTime();
  if (!Number.isFinite(ms) || ms < 0) return { type: "baseline", daysSinceLast: 0 };
  const hoursSince = ms / (1000 * 60 * 60);
  const daysSinceLast = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (hoursSince < cfg.redundantIfWithinHours) return { type: "redundant", daysSinceLast };
  if (daysSinceLast < cfg.minDaysBetweenFollowups) return { type: "follow_up_early", daysSinceLast };
  return { type: "follow_up_valid", daysSinceLast };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const headers = jsonHeaders();

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ status: "error", error: "Method not allowed" }), { status: 405, headers });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const campaign_id = body?.campaign_id;
    const dni = body?.dni;
    const answers = body?.answers;
    // ── NUEVO: teléfono del usuario ──────────────────────────────────────────
    const telefono = typeof body?.telefono === "string" ? body.telefono.replace(/\D/g, "") : null;

    const territorioRaw = body?.territorio;
    let territorio: unknown = null;
    if (territorioRaw !== null && territorioRaw !== undefined) {
      if (typeof territorioRaw === "string") {
        try { territorio = JSON.parse(territorioRaw); } catch { territorio = territorioRaw; }
      } else if (typeof territorioRaw === "object") {
        territorio = territorioRaw;
      }
    }
    const perfil_contextual =
      body?.perfil_contextual == null ? null
      : typeof body.perfil_contextual === "string" ? body.perfil_contextual
      : JSON.stringify(body.perfil_contextual);

    if (!campaign_id || typeof campaign_id !== "string" || !campaign_id.trim()) {
      return new Response(JSON.stringify({ status: "error", error: "campaign_id is required" }), { status: 400, headers });
    }
    if (typeof dni !== "string" || !dni.trim()) {
      return new Response(JSON.stringify({ status: "error", error: "dni is required" }), { status: 400, headers });
    }
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return new Response(JSON.stringify({ status: "error", error: "answers must be a JSON object" }), { status: 400, headers });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ status: "error", error: "Missing Supabase environment variables" }), { status: 500, headers });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns").select("id, tenant_id, instrument_id").eq("id", campaign_id.trim()).maybeSingle();
    if (campaignError) return new Response(JSON.stringify({ status: "error", error: "Failed to read campaign", details: campaignError.message }), { status: 500, headers });
    if (!campaign) return new Response(JSON.stringify({ status: "error", error: "Campaign not found" }), { status: 404, headers });

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants").select("id, settings").eq("id", campaign.tenant_id).maybeSingle();
    if (tenantError) return new Response(JSON.stringify({ status: "error", error: "Failed to read tenant settings", details: tenantError.message }), { status: 500, headers });
    if (!tenant) return new Response(JSON.stringify({ status: "error", error: "Tenant not found" }), { status: 404, headers });

    const retestCfg = getRetestConfig(tenant.settings);
    const dni_hash = await hashDniSha256(dni);

    const { data: prevRow, error: prevError } = await supabase
      .from("responses").select("id, submitted_at").eq("tenant_id", campaign.tenant_id)
      .eq("campaign_id", campaign.id).eq("dni_hash", dni_hash)
      .order("submitted_at", { ascending: false }).limit(1).maybeSingle();
    if (prevError) return new Response(JSON.stringify({ status: "error", error: "Failed to read previous responses", details: prevError.message }), { status: 500, headers });

    const now = new Date();
    const computed = computeDiagnostic(prevRow?.submitted_at ?? null, now, retestCfg);
    const diagnostic_type: DiagnosticType = computed.type;
    const days_since_last = computed.daysSinceLast;
    const prev_response_id = prevRow && typeof prevRow.id === "string" ? prevRow.id : null;

    const insertPayload: Record<string, unknown> = {
      tenant_id: campaign.tenant_id,
      campaign_id: campaign.id,
      instrument_id: campaign.instrument_id,
      dni_hash,
      dni_real: dni.trim(),
      answers,
      territorio,
      perfil_contextual: perfil_contextual ?? "",
      submitted_at: now.toISOString(),
      diagnostic_type,
      days_since_last,
      prev_response_id,
    };

    // ── NUEVO: guardar teléfono si viene ────────────────────────────────────
    if (telefono && telefono.length >= 8) {
      insertPayload.telefono = telefono.startsWith("54") ? telefono : `54${telefono}`;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("responses").insert(insertPayload).select("id").maybeSingle();
    if (insertError) {
      console.error("responses insert error:", insertError);
      return new Response(JSON.stringify({ status: "error", error: "Failed to save response", details: insertError.message }), { status: 500, headers });
    }

    const response_id = inserted && typeof (inserted as { id?: string }).id === "string"
      ? (inserted as { id: string }).id : undefined;

    const out: Record<string, unknown> = { status: "ok", diagnostic_type, days_since_last };
    if (response_id) out.response_id = response_id;

    return new Response(JSON.stringify(out), { status: 200, headers });

  } catch (err) {
    console.error("dsubmit_response error:", err);
    return new Response(
      JSON.stringify({ status: "error", error: "Unexpected server error", details: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers }
    );
  }
});
