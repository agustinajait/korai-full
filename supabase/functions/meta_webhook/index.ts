import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERIFY_TOKEN = "korai_webhook_2026";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  // Verificación del webhook (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // Recibir mensajes (POST)
  if (req.method === "POST") {
    const body = await req.json();
    console.log("Meta webhook:", JSON.stringify(body));

    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (message) {
      const from = message.from; // número del usuario
      const text = message.text?.body || "";

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await supabase.from("whatsapp_joins").upsert(
        { telefono: `+${from}`, joined_at: new Date().toISOString() },
        { onConflict: "telefono" }
      );

      console.log(`Mensaje de +${from}: ${text}`);
    }

    return new Response("ok", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
});