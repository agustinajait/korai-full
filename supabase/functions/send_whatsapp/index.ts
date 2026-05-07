import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const TWILIO_AUTH_TOKEN  = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
const TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886"; // sandbox

function jsonHeaders(): HeadersInit {
  return { ...corsHeaders, "Content-Type": "application/json" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const headers = jsonHeaders();

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ status: "error", error: "Method not allowed" }),
        { status: 405, headers }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const telefono = body?.telefono as string | undefined;
    const mensaje  = body?.mensaje  as string | undefined;

    if (!telefono || !mensaje) {
      return new Response(
        JSON.stringify({ status: "error", error: "telefono y mensaje son requeridos" }),
        { status: 400, headers }
      );
    }

    // Normalizar número argentino → +54XXXXXXXXXX
    const digits = telefono.replace(/\D/g, "");
    const numero = digits.startsWith("54") ? `+${digits}` : `+54${digits}`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const params = new URLSearchParams({
      From: TWILIO_WHATSAPP_FROM,
      To:   `whatsapp:${numero}`,
      Body: mensaje,
    });

    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok) {
      console.error("Twilio error:", twilioData);
      return new Response(
        JSON.stringify({ status: "error", error: twilioData?.message || "Error de Twilio" }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({ status: "ok", sid: twilioData.sid }),
      { status: 200, headers }
    );

  } catch (err) {
    console.error("send_whatsapp error:", err);
    return new Response(
      JSON.stringify({
        status: "error",
        error: "Unexpected server error",
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers }
    );
  }
});
