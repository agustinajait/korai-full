import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN") ?? "";
const PHONE_NUMBER_ID = "1084874668047061"; // ID del número Korai en Meta
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function jsonHeaders(): HeadersInit {
  return { ...corsHeaders, "Content-Type": "application/json" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const headers = jsonHeaders();

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ status: "error", error: "Method not allowed" }), { status: 405, headers });
    }

    const body = await req.json() as Record<string, unknown>;
    const telefono   = body?.telefono   as string | undefined;
    const mensaje    = body?.mensaje    as string | undefined;
    const responseId = body?.responseId as string | undefined;

    if (!telefono || !mensaje) {
      return new Response(JSON.stringify({ status: "error", error: "telefono y mensaje requeridos" }), { status: 400, headers });
    }

    // Normalizar número: quitar todo excepto dígitos, agregar 54 si no lo tiene
    const digits = telefono.replace(/\D/g, "");
    const numero = digits.startsWith("54") ? digits : `54${digits}`;

    // Enviar via Meta WhatsApp Business API
    const waRes = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numero,
        type: "text",
        text: { body: mensaje },
      }),
    });

    const waData = await waRes.json();

    if (!waRes.ok) {
      console.error("WhatsApp API error:", JSON.stringify(waData));
      return new Response(JSON.stringify({ status: "error", error: waData?.error?.message || "Error de WhatsApp" }), { status: 500, headers });
    }

    // Guardar como nota saliente en el historial si se pasa responseId
    if (responseId) {
      await fetch(`${SUPABASE_URL}/rest/v1/case_notes`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_SERVICE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ response_id: responseId, texto: mensaje, tipo: "saliente", estado: "contactado" }),
      });
      await fetch(`${SUPABASE_URL}/rest/v1/responses?id=eq.${responseId}`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_SERVICE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ ultimo_contacto: new Date().toISOString(), ultimo_estado: "contactado" }),
      });
    }

    return new Response(JSON.stringify({ status: "ok", wa_message_id: waData?.messages?.[0]?.id }), { status: 200, headers });

  } catch (err) {
    console.error("send_whatsapp error:", err);
    return new Response(
      JSON.stringify({ status: "error", error: "Unexpected server error", details: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers }
    );
  }
});
