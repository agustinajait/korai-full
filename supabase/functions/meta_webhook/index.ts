import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const VERIFY_TOKEN = "Camilo2016#";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN") ?? "";
const CAMPAIGN_ID = "53813f5a-3613-4faf-8ca1-b369e4e908cb";

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

async function guardarNota(responseId: string, texto: string, tipo: string, estado: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/case_notes`, {
    method: "POST",
    headers: { "apikey": SUPABASE_SERVICE_KEY, "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ response_id: responseId, texto, tipo, estado }),
  });
  await fetch(`${SUPABASE_URL}/rest/v1/responses?id=eq.${responseId}`, {
    method: "PATCH",
    headers: { "apikey": SUPABASE_SERVICE_KEY, "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
    body: JSON.stringify({ ultimo_contacto: new Date().toISOString(), ultimo_estado: estado }),
  });
}

async function generarRespuestaIA(usuario: any, mensajeUsuario: string, historial: any[]) {
  const raw = usuario.perfil_contextual;
  const perfil = (() => { try { return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); } catch { return {}; } })();
  const nombre = perfil?.nombre || perfil?.demographics?.nombre || "";
  const answers = usuario.answers || {};
  const planSimple = Object.entries(answers)
    .filter(([, v]) => v === "rojo" || v === "amarillo")
    .slice(0, 4)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n") || "Sin datos de diagnóstico";

  const historialTexto = historial
    .filter(n => n.tipo === "entrante" || n.tipo === "saliente")
    .slice(-20)
    .map(n => `[${n.tipo === "entrante" ? "USUARIO" : "KORAI"}] ${n.texto}`)
    .join("\n");

  const systemPrompt = `Sos Korai, el asistente conversacional de la plataforma Korai.
Representás al equipo de acompañamiento. Siempre hablás en plural.
Nunca decís que sos una IA. La persona debe sentir que habla con un equipo humano.
Respondé con naturalidad, en español rioplatense, una sola pregunta por vez si es necesario.
Devolvé únicamente el texto del mensaje, sin explicaciones ni comillas. Máximo 3 emojis.
Si detectás violencia, emergencia o riesgo grave, iniciá con [ALERTA_HUMANA].`;

  const userPrompt = `${nombre ? `Persona: ${nombre}` : ""}
Áreas prioritarias del diagnóstico:
${planSimple}
${historialTexto ? `\nHistorial:\n${historialTexto}\n` : ""}
Último mensaje del usuario: "${mensajeUsuario}"
Generá la mejor respuesta posible.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 600, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] }),
  });
  const data = await res.json();
  return data?.content?.[0]?.text || "";
}

async function enviarWhatsApp(telefono: string, mensaje: string, wabaId: string) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/messages`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: telefono, type: "text", text: { body: mensaje } }),
  });
  console.log("WhatsApp API:", JSON.stringify(await res.json()));
}

function generarMensajeKorai(response: any): string {
  const answers = response.answers || {};
  const perfil = (() => {
    try {
      const raw = response.perfil_contextual;
      return typeof raw === "string" ? JSON.parse(raw) : (raw || {});
    } catch { return {}; }
  })();
  const nombre = perfil.nombre || response.dni_real || "";
  const profundizacion = perfil.profundizacion || {};

  // Calcular dimensiones críticas desde answers
  const dimensiones: Record<string, { nombre: string; emoji: string; rojo: number; total: number }> = {
    empleo:    { nombre: "Empleo",        emoji: "💼", rojo: 0, total: 0 },
    prevision: { nombre: "Ingresos",      emoji: "🧾", rojo: 0, total: 0 },
    vivienda:  { nombre: "Vivienda",      emoji: "🏠", rojo: 0, total: 0 },
    salud:     { nombre: "Salud",         emoji: "🩺", rojo: 0, total: 0 },
    educacion: { nombre: "Educación",     emoji: "📚", rojo: 0, total: 0 },
    red:       { nombre: "Red/Vínculos",  emoji: "🤝", rojo: 0, total: 0 },
  };

  const prefijos: Record<string, string> = {
    empleo_: "empleo", prevision_: "prevision", vivienda_: "vivienda",
    salud_: "salud", educacion_: "educacion", red_: "red",
  };

  for (const [key, val] of Object.entries(answers)) {
    for (const [prefix, dimId] of Object.entries(prefijos)) {
      if (key.startsWith(prefix)) {
        dimensiones[dimId].total++;
        if (val === "rojo") dimensiones[dimId].rojo++;
      }
    }
  }

  // Ordenar por severidad
  const criticas = Object.entries(dimensiones)
    .filter(([_, d]) => d.total > 0)
    .sort((a, b) => (b[1].rojo / (b[1].total || 1)) - (a[1].rojo / (a[1].total || 1)))
    .slice(0, 2)
    .map(([_, d]) => d);

  if (criticas.length === 0) {
    return `Hola ${nombre} 👋\nSoy Korai, tu asistente de bienestar social.\nRecibimos tu diagnóstico. Podés ver tu plan en app.korai.lat\n\nSaludos,\nEquipo Korai`;
  }

  const areasResumen = criticas.map(d => `${d.emoji} ${d.nombre}`).join("\n");

  // Acciones por dimensión
  const acciones: Record<string, string[]> = {
    empleo:    ["Registrarte en el CIL para crear o mejorar tu CV.", "Inscribirte en TrabajoBA para acceder a búsquedas laborales activas."],
    prevision: ["Consultar en ANSES las asignaciones o prestaciones disponibles para vos.", "Armar un presupuesto mensual simple para organizar mejor tus gastos."],
    vivienda:  ["Consultar programas de mejora habitacional en tu municipio.", "Verificar el acceso a servicios básicos con tu municipio."],
    salud:     ["Sacar turno en el centro de salud más cercano.", "Consultar el programa SUMAR si no tenés obra social."],
    educacion: ["Inscribirte en el Plan FinEs para terminar el secundario.", "Buscar cursos gratuitos en el Centro de Formación Profesional de tu barrio."],
    red:       ["Contactar al centro comunitario de tu barrio.", "Acercarte a organizaciones sociales locales para apoyo."],
  };

  const recursos: Record<string, string> = {
    empleo:    "CIL – Centro de Integración Laboral\nformulario-sigeci.buenosaires.gob.ar",
    prevision: "ANSES – Turnos online\nturnos.anses.gob.ar",
    vivienda:  "Municipio – Programas habitacionales\napp.korai.lat",
    salud:     "SUMAR (sin obra social): 0800-222-5462",
    educacion: "Plan FinEs\nwww.argentina.gob.ar/educacion/fines",
    red:       "Korai – app.korai.lat",
  };

  const dimKey = (nombre: string): string => {
    const map: Record<string, string> = {
      "Empleo": "empleo", "Ingresos": "prevision", "Vivienda": "vivienda",
      "Salud": "salud", "Educación": "educacion", "Red/Vínculos": "red",
    };
    return map[nombre] || "empleo";
  };

  let msg = `Hola ${nombre} 👋\n`;
  msg += `Soy Korai, tu asistente de bienestar social.\n`;
  msg += `Analizamos tu diagnóstico y detectamos que hoy podrías necesitar apoyo principalmente en:\n`;
  msg += `${areasResumen}\n\n`;
  msg += `*📌 En 7 días vamos a volver a contactarte para acompañarte y guiarte en los próximos pasos de tu proceso.*\n\n`;
  msg += `Este es tu plan de acción personalizado para empezar esta semana:\n\n`;

  for (const dim of criticas) {
    const key = dimKey(dim.nombre);
    const acts = acciones[key] || [];
    msg += `${dim.emoji} *${dim.nombre}*\n`;
    acts.forEach((a, i) => { msg += `${i + 1}. ${a}\n`; });
    if (recursos[key]) msg += `\nRecurso útil:\n${recursos[key]}\n`;
    msg += "\n";
  }

  msg += `Saludos,\nEquipo Korai`;
  return msg;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");

  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verificado por Meta");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const body = await req.json();
    console.log("Webhook recibido:", JSON.stringify(body));

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) return new Response("ok", { status: 200 });

    const message = messages[0];
    const telefonoUsuario = message.from;
    const textoMensaje = message?.text?.body || "";
    const wabaId = value?.metadata?.phone_number_id;

    if (!textoMensaje) return new Response("ok", { status: 200 });

    console.log(`Mensaje de ${telefonoUsuario}: ${textoMensaje}`);

    const usuario = await buscarUsuarioPorTelefono(telefonoUsuario);
    if (!usuario) {
      console.log("Usuario no encontrado para:", telefonoUsuario);
      return new Response("ok", { status: 200 });
    }

    await guardarNota(usuario.id, textoMensaje, "entrante", "contactado");
    const historial = await fetchHistorial(usuario.id);
    const respuesta = await generarRespuestaIA(usuario, textoMensaje, historial);

    const alertaHumana = respuesta.startsWith("[ALERTA_HUMANA]");
    const mensajeLimpio = respuesta.replace("[ALERTA_HUMANA]", "").trim();

    if (alertaHumana) {
      await guardarNota(usuario.id, "⚠️ ALERTA: caso requiere revisión humana urgente. Mensaje: " + textoMensaje, "nota", "con_dificultades");
      console.log("ALERTA HUMANA para usuario:", usuario.id);
      return new Response("ok", { status: 200 });
    }

    await enviarWhatsApp(telefonoUsuario, mensajeLimpio, wabaId);
    await guardarNota(usuario.id, mensajeLimpio, "saliente", "contactado");

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Error en meta_webhook:", err);
    return new Response("ok", { status: 200 });
  }
});
