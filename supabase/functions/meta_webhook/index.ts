import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERIFY_TOKEN = "korai_webhook_2026";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const META_TOKEN = Deno.env.get("META_TOKEN") ?? "";
const META_PHONE_ID = Deno.env.get("META_PHONE_ID") ?? "";

async function enviarMensaje(to: string, mensaje: string) {
  await fetch(`https://graph.facebook.com/v19.0/${META_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${META_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: mensaje },
    }),
  });
}

function generarPlanTexto(response: any): string {
  const answers = response.answers || {};
  const nombre = response.nombre || "";

  let msg = `Hola${nombre ? ` ${nombre}` : ""} 👋 Acá está tu plan Korai:\n\n`;
  msg += `Tu diagnóstico fue completado. Para ver tu plan detallado entrá a:\n`;
  msg += `https://app.korai.lat\n\n`;
  msg += `_Korai — app.korai.lat_`;
  return msg;
}

serve(async (req) => {
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

  if (req.method === "POST") {
    const body = await req.json();
    console.log("Meta webhook:", JSON.stringify(body));

    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = (message.text?.body || "").trim();

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Guardar numero
      await supabase.from("whatsapp_joins").upsert(
        { telefono: `+${from}`, joined_at: new Date().toISOString() },
        { onConflict: "telefono" }
      );

      // Si el mensaje empieza con "plan:" buscar el diagnostico
      if (text.startsWith("plan:")) {
        const dniHash = text.replace("plan:", "").trim();

        const { data } = await supabase
          .from("responses")
          .select("*")
          .eq("dni_hash", dniHash)
          .order("submitted_at", { ascending: false })
          .limit(1)
          .single();

        if (data) {
          const plan = generarPlanTexto(data);
          await enviarMensaje(from, plan);
        } else {
          await enviarMensaje(from, "No encontramos tu diagnóstico. Por favor completá el formulario en app.korai.lat");
        }
      }
    }

    return new Response("ok", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
});