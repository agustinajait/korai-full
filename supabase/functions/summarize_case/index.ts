import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonHeaders(): HeadersInit {
  return { ...corsHeaders, "Content-Type": "application/json" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const headers = jsonHeaders();

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ status: "error", error: "Method not allowed" }), { status: 405, headers });
    }

    const { response_id, area_nombre } = await req.json() as { response_id: string; area_nombre?: string };

    if (!response_id) {
      return new Response(JSON.stringify({ status: "error", error: "response_id requerido" }), { status: 400, headers });
    }

    // Leer el caso
    const caseRes = await fetch(`${SUPABASE_URL}/rest/v1/responses?id=eq.${response_id}`, {
      headers: { "apikey": SUPABASE_SERVICE_KEY, "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
    });
    const cases = await caseRes.json();
    const caso = Array.isArray(cases) ? cases[0] : null;
    if (!caso) {
      return new Response(JSON.stringify({ status: "error", error: "Caso no encontrado" }), { status: 404, headers });
    }

    // Leer historial de conversación
    const notesRes = await fetch(`${SUPABASE_URL}/rest/v1/case_notes?response_id=eq.${response_id}&order=created_at.asc`, {
      headers: { "apikey": SUPABASE_SERVICE_KEY, "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
    });
    const notes = await notesRes.json();

    // Datos del perfil
    const raw = caso.perfil_contextual;
    const perfil = (() => { try { return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); } catch { return {}; } })();
    const nombre = perfil?.nombre || perfil?.demographics?.nombre || "la persona";
    const telefono = perfil?.telefono || "";
    const barrio = caso.territorio?.barrio || "";

    // Diagnóstico
    const answers = caso.answers || {};
    const DIMENSIONES: Record<string, string> = {
      empleo: "Empleo", prevision: "Ingresos", vivienda: "Vivienda",
      salud: "Salud", educacion: "Educación", red: "Red de apoyo",
    };
    const diagnostico = Object.entries(DIMENSIONES).map(([prefix, nombre_dim]) => {
      const items = Object.entries(answers).filter(([k]) => k.startsWith(prefix + "_"));
      if (!items.length) return null;
      const rojos = items.filter(([, v]) => v === "rojo").length;
      const amarillos = items.filter(([, v]) => v === "amarillo").length;
      const nivel = rojos / items.length >= 0.5 ? "crítico" : (rojos + amarillos) / items.length >= 0.4 ? "alerta" : "estable";
      return `${nombre_dim}: ${nivel}`;
    }).filter(Boolean).join(", ") || "Sin diagnóstico";

    // Conversación
    const conversacion = (Array.isArray(notes) ? notes : [])
      .filter(n => n.tipo === "entrante" || n.tipo === "saliente")
      .map(n => `[${n.tipo === "entrante" ? "PERSONA" : "KORAI"}] ${n.texto}`)
      .join("\n");

    const prompt = `Sos un asistente de trabajo social. Generá un informe de derivación claro y profesional para el equipo de ${area_nombre || "derivación"}.

Datos del caso:
- Nombre: ${nombre}
- Teléfono: ${telefono}${barrio ? "\n- Barrio: " + barrio : ""}
- Diagnóstico de bienestar: ${diagnostico}
- Días desde diagnóstico: ${caso.days_since_last || 0}

Conversación con Korai:
${conversacion || "(Sin conversación registrada)"}

Escribí un informe de derivación con estas secciones:
1. **Situación actual** — resumen breve de la situación de la persona (2-3 oraciones)
2. **Necesidad principal** — cuál es la necesidad que motiva la derivación
3. **Contexto relevante** — información clave surgida en la conversación (familia, trabajo, vivienda, etc.)
4. **Sugerencia de acción** — qué podría hacer el área para ayudar

Sé concreto y empático. Usá lenguaje de trabajo social, no técnico. Máximo 200 palabras.`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const aiData = await aiRes.json();
    const resumen = aiData?.content?.[0]?.text || "";

    if (!resumen) {
      return new Response(JSON.stringify({ status: "error", error: "No se pudo generar el resumen" }), { status: 500, headers });
    }

    // Guardar como nota de tipo "informe_derivacion"
    await fetch(`${SUPABASE_URL}/rest/v1/case_notes`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        response_id,
        texto: `📋 INFORME DE DERIVACIÓN${area_nombre ? " — " + area_nombre : ""}\n\n${resumen}`,
        tipo: "informe_derivacion",
        estado: "en_proceso",
      }),
    });

    return new Response(JSON.stringify({ status: "ok", resumen }), { status: 200, headers });
  } catch (err) {
    console.error("summarize_case error:", err);
    return new Response(
      JSON.stringify({ status: "error", error: "Error inesperado", details: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers }
    );
  }
});
