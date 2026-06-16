import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const ANTHROPIC_MODEL = "claude-sonnet-4-6";

function jsonHeaders(): HeadersInit {
  return { ...corsHeaders, "Content-Type": "application/json" };
}

const SYSTEM_PROMPT = `Eres Korai, un asistente de bienestar social que acompaña a personas en situación de vulnerabilidad en Buenos Aires.

Reglas estrictas:
- NUNCA inventes ni modifiques el plan, las acciones o los recursos: ya vienen calculados por la plataforma y deben transcribirse tal cual te los pasan.
- Tu única tarea es redactar el TEXTO del mensaje de WhatsApp: cálido, claro, breve, en español rioplatense simple, sin tecnicismos.
- No uses emojis en exceso (máximo 2-3 en todo el mensaje).
- No prometas nada que no esté en los datos que te dan.
- Nunca uses la palabra "diagnóstico" como si fuera médico; es un "diagnóstico de bienestar social".
- El mensaje debe sonar como si lo escribiera una persona del equipo de Korai, no un bot.
- Devolvé únicamente el texto del mensaje, sin explicaciones ni comillas.`;

function buildUserPrompt(body: Record<string, unknown>): string {
  const tipo = body.tipo as string;
  const nombre = (body.nombre as string) || "";
  const plan = body.plan as Array<Record<string, unknown>> | undefined;
  const mensajeUsuario = body.mensajeUsuario as string | undefined;
  const historial = body.historial as string | undefined;

  if (tipo === "plan") {
    const planTexto = (plan || [])
      .map((p) => {
        const acciones = (p.accionesCorto as string[] | undefined)?.slice(0, 2).join(" / ") || "";
        const recurso = p.recursos as Array<Record<string, unknown>> | undefined;
        const r = recurso?.[0];
        const recursoTexto = r ? `${r.nombre}${r.url ? ": " + r.url : ""}${r.telefono ? ": " + r.telefono : ""}` : "";
        return `- ${p.dimensionName} (${p.nivelColor}): ${acciones}${recursoTexto ? "\n  Recurso: " + recursoTexto : ""}`;
      })
      .join("\n");

    return `Escribí el mensaje de WhatsApp para enviarle a ${nombre || "esta persona"} su plan personalizado de bienestar.

Datos del plan (NO los modifiques, solo redactá el texto que los presenta):
${planTexto}

El mensaje debe: saludar, decir que ya tienen el plan armado según lo que respondieron, presentar cada área con su acción y recurso, y cerrar ofreciendo acompañamiento y mencionando que en 7 días vuelven a contactarlo.`;
  }

  if (tipo === "seguimiento") {
    return `Escribí un mensaje de WhatsApp de seguimiento para ${nombre || "esta persona"}.

Plan que ya se le envió:
${(plan || []).map((p) => `- ${p.dimensionName}: ${(p.accionesCorto as string[] | undefined)?.[0] || ""}`).join("\n")}

El mensaje debe preguntar de forma cálida y concreta si pudo avanzar con los trámites/acciones que se le compartieron, ofrecer ayuda si tuvo trabas, y motivarlo a seguir.`;
  }

  if (tipo === "respuesta") {
    return `${nombre ? `La persona se llama ${nombre}.` : ""}
${historial ? `Contexto previo de la conversación:\n${historial}\n` : ""}
Plan que ya se le compartió:
${(plan || []).map((p) => `- ${p.dimensionName}: ${(p.accionesCorto as string[] | undefined)?.[0] || ""}`).join("\n")}

La persona escribió este mensaje por WhatsApp:
"${mensajeUsuario}"

Redactá una respuesta breve, empática y útil, considerando su plan y lo que escribió.`;
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
        max_tokens: 600,
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

    return new Response(JSON.stringify({ status: "ok", mensaje }), { status: 200, headers });
  } catch (err) {
    console.error("generate_message error:", err);
    return new Response(
      JSON.stringify({ status: "error", error: "Unexpected server error", details: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers }
    );
  }
});
