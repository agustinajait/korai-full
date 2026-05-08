import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
const TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const from = params.get("From") ?? "";

  if (!from.startsWith("whatsapp:")) {
    return new Response("ok", { status: 200 });
  }

  const numero = from.replace("whatsapp:", "");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  await supabase
    .from("whatsapp_joins")
    .upsert(
      { telefono: numero, joined_at: new Date().toISOString() },
      { onConflict: "telefono" }
    );

  const mensaje = "Hola! Bienvenido/a a KORAI.\n\nEmpeza aca:\nhttps://app.korai.lat\n\nAl terminar, tu plan personalizado te va a llegar por este WhatsApp.";

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const twilioParams = new URLSearchParams({
    From: TWILIO_WHATSAPP_FROM,
    To: `whatsapp:${numero}`,
    Body: mensaje,
  });

  await fetch(twilioUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: twilioParams.toString(),
  });

  return new Response("ok", { status: 200 });
});