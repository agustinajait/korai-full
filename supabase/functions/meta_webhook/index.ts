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
      const text = (message.text?.body || "").toLowerCase().trim();
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Guardar número
      await supabase.from("whatsapp_joins").upsert(
        { telefono: `+${from}`, joined_at: new Date().toISOString() },
        { onConflict: "telefono" }
      );

      // Detectar mensaje de inicio del usuario
      const esInicio = text.includes("hola korai") || text.includes("terminé mi diagnóstico") || text.includes("termine mi diagnostico") || text.includes("plan de acción") || text.includes("plan de accion");

      // También responder a "plan:DNI_HASH" (compatibilidad)
      const esPlan = text.startsWith("plan:");

      if (esInicio || esPlan) {
        let response = null;

        if (esPlan) {
          // Buscar por hash
          const dniHash = text.replace("plan:", "").trim();
          const { data } = await supabase
            .from("responses")
            .select("*")
            .eq("dni_hash", dniHash)
            .order("submitted_at", { ascending: false })
            .limit(1)
            .single();
          response = data;
        } else {
          // Buscar por número de teléfono (más reciente)
          const telefonoNormalizado = from.startsWith("549") ? from : `549${from}`;
          const { data } = await supabase
            .from("responses")
            .select("*")
            .or(`telefono.eq.${telefonoNormalizado},telefono.eq.+${telefonoNormalizado},telefono.eq.${from}`)
            .order("submitted_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          response = data;
        }

        if (response) {
          const plan = generarMensajeKorai(response);
          await enviarMensaje(from, plan);
        } else {
          await enviarMensaje(from, "Hola 👋 Soy Korai. No encontramos tu diagnóstico. Por favor completá el formulario en app.korai.lat");
        }
      }
    }

    return new Response("ok", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
});
