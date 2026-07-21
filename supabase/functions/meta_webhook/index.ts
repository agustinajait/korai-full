import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const VERIFY_TOKEN = "Camilo2016#";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN") ?? "";
const CAMPAIGN_ID = "53813f5a-3613-4faf-8ca1-b369e4e908cb";
const OPERADOR_TELEFONO = "5491161266433"; // número del operador con código de país

// ─── System prompt idéntico al de generate_message ───────────────────────────
const SYSTEM_PROMPT = `Sos Korai, el asistente conversacional de la plataforma Korai.
Representás al equipo de acompañamiento de Korai. Siempre hablás en plural.
Nunca hablás como una persona individual ni como una inteligencia artificial.

Ejemplos correctos: "Queremos entender mejor tu situación.", "Nos gustaría preguntarte algo.", "Estamos para acompañarte.", "Te leemos."
Ejemplos incorrectos: "Quiero ayudarte.", "Voy a ayudarte.", "Creo que...", "Soy una inteligencia artificial."

La persona debe sentir que conversa con un equipo humano.

MISIÓN
Acompañar a las personas, no solamente responder mensajes ni entregar recursos.
El diagnóstico es el comienzo del acompañamiento. Cada conversación ayuda a comprender mejor la realidad de la persona para orientarla hacia oportunidades y recursos.

CÓMO CONVERSAR
- Hablar con naturalidad, en español rioplatense simple, sin tecnicismos.
- Hacer UNA SOLA pregunta por vez.
- Escuchar antes de responder.
- Recordar todo lo que ya se sabe del usuario: nunca preguntar algo que ya conocemos.
- Mantener continuidad con conversaciones anteriores.
- Emojis: de forma natural y moderada. Normalmente uno por mensaje es suficiente.
- Evitar frases vacías como "Gracias por contarnos", "Valoramos que compartas". Solo usarlas si realmente tienen sentido.
- No dramatizar ni victimizar.

CÓMO PENSAR
El diagnóstico es una fotografía. La conversación explica la historia detrás.
El verdadero problema muchas veces aparece durante la conversación.
Siempre intentá descubrir la necesidad real antes de recomendar recursos.

CASOS SENSIBLES
Si detectás violencia, amenazas, niños en riesgo, falta de alimentos, riesgo habitacional, endeudamiento crítico, salud mental, suicidio, abuso o urgencias sociales: respondé con contención, orientá con recursos disponibles, y marcá el mensaje con [ALERTA_HUMANA] al inicio.

REGLA PRINCIPAL
Devolvé únicamente el texto del mensaje de WhatsApp, sin explicaciones ni comillas.
Máximo 3 emojis en todo el mensaje.`;

// ─── Helpers de Supabase ──────────────────────────────────────────────────────

async function buscarUsuarioPorTelefono(telefono: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/responses?campaign_id=eq.${CAMPAIGN_ID}&order=submitted_at.desc`,
    { headers: { "apikey": SUPABASE_SERVICE_KEY, "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` } }
  );
  const responses = await res.json();
  const clean = (t: string) => t.replace(/\D/g, "").slice(-10);
  const telLimpio = clean(telefono);
  for (const r of responses) {
    try {
      const raw = r.perfil_contextual;
      const p = typeof raw === "string" ? JSON.parse(raw) : (raw || {});
      const telGuardado = clean(p?.telefono || "");
      if (telGuardado && telGuardado === telLimpio) return r;
    } catch {}
  }
  return null;
}

async function fetchHistorial(responseId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/case_notes?response_id=eq.${responseId}&order=created_at.asc`,
    { headers: { "apikey": SUPABASE_SERVICE_KEY, "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` } }
  );
  return res.json();
}

// Verifica si el message_id de WhatsApp ya fue procesado (deduplicación)
async function mensajeYaProcesado(responseId: string, waMessageId: string): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/case_notes?response_id=eq.${responseId}&wa_message_id=eq.${waMessageId}&limit=1`,
    { headers: { "apikey": SUPABASE_SERVICE_KEY, "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` } }
  );
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0;
}

async function guardarNota(responseId: string, texto: string, tipo: string, estado: string, waMessageId?: string) {
  const body: Record<string, string> = { response_id: responseId, texto, tipo, estado };
  if (waMessageId) body.wa_message_id = waMessageId;

  await fetch(`${SUPABASE_URL}/rest/v1/case_notes`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  await fetch(`${SUPABASE_URL}/rest/v1/responses?id=eq.${responseId}`, {
    method: "PATCH",
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({ ultimo_contacto: new Date().toISOString(), ultimo_estado: estado }),
  });
}

async function pausarBot(responseId: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/responses?id=eq.${responseId}`, {
    method: "PATCH",
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({ bot_pausado: true }),
  });
  return res.ok;
}

// ─── IA ──────────────────────────────────────────────────────────────────────

async function generarRespuestaIA(usuario: any, mensajeUsuario: string, historial: any[]): Promise<string> {
  const raw = usuario.perfil_contextual;
  const perfil = (() => { try { return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); } catch { return {}; } })();
  const nombre = perfil?.nombre || perfil?.demographics?.nombre || "";

  // Plan: dimensiones con nivel de alerta
  const answers = usuario.answers || {};
  const DIMENSIONES: Record<string, string> = {
    empleo: "Empleo", prevision: "Ingresos", vivienda: "Vivienda",
    salud: "Salud", educacion: "Educación", red: "Red de apoyo",
  };
  const planTexto = Object.entries(DIMENSIONES).map(([prefix, nombre]) => {
    const items = Object.entries(answers).filter(([k]) => k.startsWith(prefix + "_"));
    if (!items.length) return null;
    const rojos = items.filter(([, v]) => v === "rojo").length;
    const amarillos = items.filter(([, v]) => v === "amarillo").length;
    const nivel = rojos / items.length >= 0.5 ? "crítico 🔴" : (rojos + amarillos) / items.length >= 0.4 ? "alerta 🟡" : "estable 🟢";
    return `- ${nombre}: ${nivel}`;
  }).filter(Boolean).join("\n") || "Sin datos de diagnóstico";

  // Historial de conversación (últimos 20 mensajes)
  const historialTexto = historial
    .filter(n => n.tipo === "entrante" || n.tipo === "saliente")
    .slice(-20)
    .map(n => `[${n.tipo === "entrante" ? "USUARIO" : "KORAI"}] ${n.texto}`)
    .join("\n");

  // Notas de contexto (resúmenes cargados por el equipo)
  const notasTexto = historial
    .filter(n => !n.tipo || n.tipo === "nota")
    .map(n => n.texto)
    .join("\n---\n");

  const userPrompt = `Generá la mejor respuesta posible para este mensaje de WhatsApp.

${nombre ? `Persona: ${nombre}` : ""}

Diagnóstico actual:
${planTexto}

${notasTexto ? `Notas de contexto:\n${notasTexto}\n` : ""}
${historialTexto ? `Historial de conversación:\n${historialTexto}\n` : ""}
Último mensaje del usuario:
"${mensajeUsuario}"

Analizá todo el contexto. Respondé con una sola respuesta corta, empática y útil.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001", // Haiku: mismo resultado, 5x más barato que Sonnet
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  return data?.content?.[0]?.text || "";
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

async function enviarWhatsApp(telefono: string, mensaje: string, wabaId: string) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/messages`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: telefono, type: "text", text: { body: mensaje } }),
  });
  const data = await res.json();
  console.log("WhatsApp send:", JSON.stringify(data));
  return data;
}

// ─── Servidor ─────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");

  // Verificación del webhook de Meta
  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === VERIFY_TOKEN) {
      return new Response(url.searchParams.get("hub.challenge"), { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const body = await req.json();

    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const messages = value?.messages;
    if (!messages?.length) return new Response("ok", { status: 200 });

    const message = messages[0];
    const telefonoUsuario = message.from;
    const textoMensaje = message?.text?.body || "";
    const waMessageId = message.id;
    const wabaId = value?.metadata?.phone_number_id;

    if (!textoMensaje) return new Response("ok", { status: 200 });

    console.log(`Mensaje de ${telefonoUsuario}: ${textoMensaje}`);

    // Buscar usuario registrado
    const usuario = await buscarUsuarioPorTelefono(telefonoUsuario);
    if (!usuario) {
      console.log("Usuario no registrado:", telefonoUsuario);
      return new Response("ok", { status: 200 });
    }

    // ── C: Deduplicación ── evitar que Meta reintente y se duplique
    const duplicado = await mensajeYaProcesado(usuario.id, waMessageId);
    if (duplicado) {
      console.log("Mensaje duplicado, ignorando:", waMessageId);
      return new Response("ok", { status: 200 });
    }

    // Guardar mensaje entrante con el ID de WhatsApp
    await guardarNota(usuario.id, textoMensaje, "entrante", "contactado", waMessageId);

    // ── Bot pausado: operador está manejando el caso manualmente ──
    if (usuario.bot_pausado) {
      console.log("Bot pausado para usuario:", usuario.id, "— operador atiende");
      return new Response("ok", { status: 200 });
    }

    // Generar respuesta IA
    const historial = await fetchHistorial(usuario.id);
    const respuesta = await generarRespuestaIA(usuario, textoMensaje, historial);

    const alertaHumana = respuesta.startsWith("[ALERTA_HUMANA]");
    const mensajeLimpio = respuesta.replace("[ALERTA_HUMANA]", "").trim();

    if (alertaHumana) {
      // ── D: Alerta humana ──────────────────────────────────────────────────

      // 1. Guardar alerta en el historial del caso
      await guardarNota(usuario.id, "⚠️ ALERTA HUMANA — el bot pausó la respuesta automática. Mensaje del usuario: " + textoMensaje, "nota", "con_dificultades");

      // 2. Pausar el bot para este usuario
      await pausarBot(usuario.id);

      // 3. Enviar mensaje de contención al usuario (no dejarlo en silencio)
      const perfil = (() => { try { const r = usuario.perfil_contextual; return typeof r === "string" ? JSON.parse(r) : (r || {}); } catch { return {}; } })();
      const nombre = perfil?.nombre || "amig@";
      const mensajeContencion = `${nombre}, te leemos 🤝\nEntendemos que estás pasando por algo difícil. Uno de nuestros acompañantes va a comunicarse con vos en breve para estar presentes.\nCualquier urgencia: Línea 144 (violencia) o 911.`;
      await enviarWhatsApp(telefonoUsuario, mensajeContencion, wabaId);
      await guardarNota(usuario.id, mensajeContencion, "saliente", "con_dificultades");

      // 4. Notificar al operador por WhatsApp con contexto del caso
      const linkAdmin = `app.korai.lat/superadmin`;
      const notifOperador = `⚠️ *ALERTA KORAI*\n\n*Caso:* ${nombre}\n*Teléfono:* ${telefonoUsuario}\n*Mensaje:* "${textoMensaje}"\n\nEl bot está pausado. Respondé directamente desde esta app al número del usuario.\n\nVer caso completo: ${linkAdmin}`;
      await enviarWhatsApp(OPERADOR_TELEFONO, notifOperador, wabaId);

      console.log("ALERTA HUMANA procesada para usuario:", usuario.id);
      return new Response("ok", { status: 200 });
    }

    // ── Respuesta normal ──────────────────────────────────────────────────────
    await enviarWhatsApp(telefonoUsuario, mensajeLimpio, wabaId);
    await guardarNota(usuario.id, mensajeLimpio, "saliente", "contactado");

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Error en meta_webhook:", err);
    return new Response("ok", { status: 200 }); // siempre 200 para que Meta no reintente
  }
});
