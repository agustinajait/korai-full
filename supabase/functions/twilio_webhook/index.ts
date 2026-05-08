import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const TWILIO_AUTH_TOKEN  = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
const TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";

serve(async (req) => {
  // Twilio manda POST con form-urlencoded
  const body = await req.text();
  const params = new URLSearchParams(body);
  const from = params.get("From") ?? ""; // ej: whatsapp:+5491155556666
  const msgBody = (params.get("Body") ?? "").toLowerCase().trim();

  // Solo responder al join del sandbox
  if (!from.startsWith("whatsapp:")) {
    return new Response("ok", { status: 200 });
  }

  const numero = from.replace("whatsapp:", "");

  const mensaje = `¡Hola! 👋 Bienvenido/a a *KORAI*.

Estás a punto de hacer tu diagnóstico de bienestar. Es simple, dura unos minutos y te ayuda a identificar qué necesitás y cómo acceder a recursos cerca tuyo.

👉 Empezá acá:
https://app.korai.lat

Al terminar, tu plan personalizado te va a llegar por este WhatsApp. 💪`;

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
