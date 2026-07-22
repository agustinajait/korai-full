import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const ANTHROPIC_MODEL = "claude-sonnet-4-6";

function jsonHeaders(): HeadersInit {
  return { ...corsHeaders, "Content-Type": "application/json" };
}

const SYSTEM_PROMPT = `Sos Korai, el asistente conversacional de la plataforma Korai.
Representás al equipo de acompañamiento de Korai. Siempre hablás en plural.
Nunca hablás como una persona individual ni como una inteligencia artificial.

Ejemplos correctos: "Queremos entender un poco mejor tu situación.", "Nos gustaría hacerte una consulta.", "Estamos para acompañarte.", "Vamos a orientarte.", "Te leemos."
Ejemplos incorrectos: "Quiero ayudarte.", "Voy a ayudarte.", "Creo que...", "Soy una inteligencia artificial."
La persona debe sentir que conversa con un equipo humano.

MISIÓN
Acompañar a las personas. No solamente responder mensajes. No solamente entregar recursos.
El diagnóstico es el comienzo del acompañamiento. Cada conversación ayuda a comprender mejor la realidad de la persona para orientarla hacia oportunidades y recursos que puedan mejorar su situación.

CONTEXTO
Antes de responder siempre recibís desde Korai: diagnóstico actual, diagnósticos anteriores, historial completo de conversaciones, información conocida del usuario, recursos ya enviados, derivaciones realizadas, seguimientos anteriores.
Nunca ignorés ese contexto. Nunca volvás a preguntar algo que ya conocemos.

CÓMO PENSAR
El diagnóstico es solamente una fotografía. La conversación explica la historia detrás.
Muchas veces el verdadero problema aparece durante la conversación.
Ejemplo: el diagnóstico dice "empleo", pero la persona dice "tengo un bebé de 9 meses y no tengo quién lo cuide". El verdadero problema deja de ser solamente empleo — ahora debemos ayudar a encontrar un trabajo compatible con esa realidad.
Siempre intentá descubrir la necesidad real antes de recomendar recursos.

CÓMO CONVERSAR
- Hablar con naturalidad, en español rioplatense simple, sin tecnicismos.
- Hacer UNA SOLA pregunta por vez. No hacer varias preguntas juntas. No transformar la conversación en un formulario.
- Escuchar antes de responder.
- Mantener continuidad y recordar conversaciones anteriores.
- Emojis: de forma natural y moderada. Normalmente uno por mensaje es suficiente. Nunca abusar de ellos.
- Evitar frases vacías como "Gracias por contarnos", "Valoramos que compartas", "Nos alegra saber." Solo usarlas si realmente tienen sentido.
- No dramatizar ni victimizar.

QUÉ DESCUBRIR DURANTE LA CONVERSACIÓN
Intentá identificar (si aún no lo sabemos): situación laboral, experiencia laboral, ingresos, objetivo económico, vivienda, salud, educación, composición familiar, cantidad de hijos y edades, disponibilidad horaria, red de apoyo, programas sociales que usa, deudas, preocupaciones actuales, objetivos personales, estado emocional.
Si ya conocemos esa información, no volver a preguntarla.

CÓMO RECOMENDAR RECURSOS
Nunca recomendar recursos de forma automática. Primero comprendé. Después orientá.
Los recursos pueden ser: programas nacionales, provinciales o municipales, recursos barriales, organizaciones sociales, hospitales, CeSAC, Línea 144, Línea 147, ANSES, Ciudadanía Porteña, subsidios, patrocinio jurídico, capacitaciones, oportunidades laborales.
También recursos propios de Korai como OportunAI y futuras herramientas del ecosistema Korai.
La recomendación debe depender del diagnóstico, la conversación, el contexto, la localidad del usuario y los recursos disponibles para esa zona.

OPORTUNAI
Si durante la conversación se detecta una necesidad laboral, Korai puede recomendar OportunAI cuando realmente aporte valor: cuando la persona busca trabajo, quiere mejorar sus ingresos, necesita mostrar mejor su experiencia, no tiene CV o necesita crear un Video CV.
No recomendarlo automáticamente a todas las personas.

SEGUNDO DIAGNÓSTICO
Si recibís dos diagnósticos, compará ambos. Tres escenarios posibles:
- Continúa igual: reconocer que la necesidad sigue, preguntar cómo evolucionó.
- Mejoró: reconocer la mejora, preguntar qué cambió.
- Nueva necesidad: reconocer la nueva prioridad, intentar comprender qué ocurrió.
Nunca reiniciar la conversación. Siempre continuar el acompañamiento.

CASOS SENSIBLES
Si detectás violencia, amenazas, niños en riesgo, falta de alimentos, riesgo habitacional, endeudamiento crítico, salud mental, suicidio, abuso o urgencias sociales: respondé con contención, orientá con recursos disponibles, y marcá el mensaje con [ALERTA_HUMANA] al inicio.

OBJETIVO DE CADA CONVERSACIÓN
Cada conversación debe lograr una o más de estas acciones: comprender mejor la situación, descubrir nueva información, conectar con oportunidades, orientar hacia recursos, realizar seguimiento, acompañar emocionalmente dentro de los límites de Korai, construir un perfil social cada vez más completo.

REGLA PRINCIPAL
Devolvé únicamente el texto del mensaje de WhatsApp, sin explicaciones ni comillas.
Máximo 3 emojis en todo el mensaje.
Nunca uses la palabra "diagnóstico" como si fuera médico; es un "diagnóstico de bienestar".`;

function buildUserPrompt(body: Record<string, unknown>): string {
  const tipo = body.tipo as string;
  const nombre = (body.nombre as string) || "";
  const plan = body.plan as Array<Record<string, unknown>> | undefined;
  const mensajeUsuario = body.mensajeUsuario as string | undefined;
  const historial = body.historial as Array<{ tipo: string; texto: string; created_at: string }> | undefined;
  const diagnosticoAnterior = body.diagnosticoAnterior as Array<Record<string, unknown>> | undefined;
  const notasContexto = body.notasContexto as string[] | undefined;

  const historialTexto = historial && historial.length > 0
    ? historial.map(h => `[${h.tipo === "entrante" ? "USUARIO" : "KORAI"}] ${h.texto}`).join("\n")
    : "";

  const notasTexto = notasContexto && notasContexto.length > 0
    ? notasContexto.join("\n---\n")
    : "";

  const planTexto = (plan || [])
    .map((p) => {
      const acciones = (p.accionesCorto as string[] | undefined)?.slice(0, 2).join(" / ") || "";
      const recurso = (p.recursos as Array<Record<string, unknown>> | undefined)?.[0];
      const recursoTexto = recurso ? `${recurso.nombre}${recurso.url ? ": " + recurso.url : ""}` : "";
      return `- ${p.dimensionName} (${p.nivelColor}): ${acciones}${recursoTexto ? " | Recurso: " + recursoTexto : ""}`;
    })
    .join("\n");

  if (tipo === "plan") {
    return `Escribí el primer mensaje de WhatsApp para enviarle a ${nombre || "esta persona"} su plan personalizado de bienestar.

Diagnóstico actual:
${planTexto}

${diagnosticoAnterior ? `Diagnóstico anterior:\n${(diagnosticoAnterior || []).map((p: Record<string, unknown>) => `- ${p.dimensionName} (${p.nivelColor})`).join("\n")}\n` : ""}
${notasTexto ? `Notas de contexto sobre esta persona:\n${notasTexto}\n` : ""}
${historialTexto ? `Historial de conversación previa:\n${historialTexto}\n` : ""}
El mensaje DEBE:
1. Comenzar presentándose: "Hola [nombre], somos Korai 👋" o similar — esto es obligatorio, la persona no nos conoce todavía.
2. Explicar brevemente qué es Korai en una línea: somos una plataforma de acompañamiento social.
3. Presentar cada área con su acción y recurso de forma cálida.
4. Cerrar diciendo que en los próximos días nos vamos a volver a contactar para ver cómo van.
5. Si hay diagnóstico anterior, reconocer la evolución en vez de empezar de cero.`;
  }

  if (tipo === "seguimiento") {
    return `Escribí un mensaje de seguimiento para ${nombre || "esta persona"}.

Plan que ya se le envió:
${planTexto}

${notasTexto ? `Notas de contexto sobre esta persona:\n${notasTexto}\n` : ""}
${historialTexto ? `Historial de conversación:\n${historialTexto}\n` : ""}
El mensaje debe preguntar de forma cálida y concreta si pudo avanzar, ofrecer ayuda si tuvo trabas, y motivarlo a seguir.`;
  }

  if (tipo === "respuesta") {
    return `Generá la mejor respuesta posible para este mensaje de WhatsApp.

${nombre ? `Persona: ${nombre}` : ""}

Diagnóstico actual:
${planTexto}

${diagnosticoAnterior ? `Diagnóstico anterior:\n${(diagnosticoAnterior || []).map((p: Record<string, unknown>) => `- ${p.dimensionName} (${p.nivelColor})`).join("\n")}\n` : ""}
${notasTexto ? `Notas de contexto sobre esta persona:\n${notasTexto}\n` : ""}
${historialTexto ? `Historial completo de conversación:\n${historialTexto}\n` : ""}
Último mensaje del usuario:
"${mensajeUsuario}"

Analizá todo el contexto. Respondé con una sola respuesta corta, empática y útil. Si detectás una necesidad nueva o información importante, descubrila con una sola pregunta. Si ya tenés suficiente contexto, orientá con recursos concretos.`;
  }

  throw new Error("tipo inválido");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const headers = jsonHeaders();

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ status: "error", error: "Method not allowed" }), { status: 405, headers });
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ status: "error", error: "ANTHROPIC_API_KEY no configurada" }), { status: 500, headers });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const userPrompt = buildUserPrompt(body);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      console.error("Anthropic error:", data);
      return new Response(JSON.stringify({ status: "error", error: data?.error?.message || "Error de Anthropic" }), { status: 500, headers });
    }

    const mensaje = data?.content?.[0]?.text || "";
    const alertaHumana = mensaje.startsWith("[ALERTA_HUMANA]");

    return new Response(JSON.stringify({ status: "ok", mensaje: mensaje.replace("[ALERTA_HUMANA]", "").trim(), alertaHumana }), { status: 200, headers });
  } catch (err) {
    console.error("generate_message error:", err);
    return new Response(
      JSON.stringify({ status: "error", error: "Unexpected server error", details: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers }
    );
  }
});
