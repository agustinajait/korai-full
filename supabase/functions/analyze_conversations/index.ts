import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const CAMPAIGN_ID = "53813f5a-3613-4faf-8ca1-b369e4e908cb";

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

    const body = await req.json().catch(() => ({}));
    const dias = Number(body?.dias) || 30;
    const periodoFin = new Date();
    const periodoInicio = new Date(periodoFin.getTime() - dias * 24 * 60 * 60 * 1000);

    // 1. Traer todos los responses de la campaña
    const respRes = await fetch(
      `${SUPABASE_URL}/rest/v1/responses?campaign_id=eq.${CAMPAIGN_ID}&submitted_at=gte.${periodoInicio.toISOString()}&select=id,answers,territorio,perfil_contextual,diagnostic_type,days_since_last`,
      { headers: { "apikey": SUPABASE_SERVICE_KEY, "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    const responses = await respRes.json();
    if (!Array.isArray(responses) || responses.length === 0) {
      return new Response(JSON.stringify({ status: "error", error: "Sin datos en el período" }), { status: 404, headers });
    }

    const responseIds = responses.map((r: any) => r.id);

    // 2. Traer todos los mensajes de esos responses
    const notesChunks: any[] = [];
    const chunkSize = 50;
    for (let i = 0; i < responseIds.length; i += chunkSize) {
      const chunk = responseIds.slice(i, i + chunkSize);
      const filter = chunk.map((id: string) => `response_id=eq.${id}`).join(",");
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/case_notes?or=(${filter})&tipo=in.(entrante,saliente)&order=created_at.asc`,
        { headers: { "apikey": SUPABASE_SERVICE_KEY, "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` } }
      );
      const data = await res.json();
      if (Array.isArray(data)) notesChunks.push(...data);
    }

    // 3. Agrupar mensajes por usuario y barrio
    const mensajesPorResponse: Record<string, string[]> = {};
    for (const note of notesChunks) {
      if (!mensajesPorResponse[note.response_id]) mensajesPorResponse[note.response_id] = [];
      if (note.tipo === "entrante") mensajesPorResponse[note.response_id].push(note.texto);
    }

    // 4. Diagnósticos por dimensión
    const DIMENSIONES: Record<string, string> = {
      empleo: "Empleo", prevision: "Ingresos", vivienda: "Vivienda",
      salud: "Salud", educacion: "Educación", red: "Red de apoyo",
    };
    const conteosDimension: Record<string, { critico: number; alerta: number; estable: number }> = {};
    for (const dim of Object.keys(DIMENSIONES)) {
      conteosDimension[dim] = { critico: 0, alerta: 0, estable: 0 };
    }
    const barrioConteo: Record<string, number> = {};
    const barrioCriticos: Record<string, number> = {};

    for (const r of responses) {
      const answers = r.answers || {};
      const barrio = r.territorio?.barrio || "Sin barrio";
      barrioConteo[barrio] = (barrioConteo[barrio] || 0) + 1;
      let esCritico = false;
      for (const [prefix] of Object.entries(DIMENSIONES)) {
        const items = Object.entries(answers).filter(([k]) => k.startsWith(prefix + "_"));
        if (!items.length) continue;
        const rojos = items.filter(([, v]) => v === "rojo").length;
        const amarillos = items.filter(([, v]) => v === "amarillo").length;
        const ratio = rojos / items.length;
        if (ratio >= 0.5) { conteosDimension[prefix].critico++; esCritico = true; }
        else if ((rojos + amarillos) / items.length >= 0.4) conteosDimension[prefix].alerta++;
        else conteosDimension[prefix].estable++;
      }
      if (esCritico) barrioCriticos[barrio] = (barrioCriticos[barrio] || 0) + 1;
    }

    // 5. Preparar muestra de conversaciones para la IA (máx 80 usuarios, 5 msgs c/u)
    const muestraConversaciones = Object.entries(mensajesPorResponse)
      .filter(([, msgs]) => msgs.length > 0)
      .slice(0, 80)
      .map(([, msgs]) => msgs.slice(0, 5).join(" | "))
      .join("\n---\n");

    const totalMensajes = notesChunks.length;
    const totalConversaciones = Object.keys(mensajesPorResponse).filter(id => mensajesPorResponse[id].length > 0).length;

    // 6. Análisis IA
    const prompt = `Sos un analista de política social. Analizás conversaciones de WhatsApp entre ciudadanos y Korai, un asistente de bienestar social.

Período: últimos ${dias} días
Total de personas: ${responses.length}
Personas con conversación activa: ${totalConversaciones}
Total de mensajes: ${totalMensajes}

Diagnósticos por dimensión (crítico/alerta/estable):
${Object.entries(DIMENSIONES).map(([k, nombre]) => {
  const c = conteosDimension[k];
  return `- ${nombre}: ${c.critico} críticos, ${c.alerta} en alerta, ${c.estable} estables`;
}).join("\n")}

Muestra de mensajes enviados por ciudadanos (texto real, anonimizado):
${muestraConversaciones || "(Sin conversaciones registradas aún)"}

Generá un análisis en JSON con EXACTAMENTE esta estructura:
{
  "temas": [
    { "tema": "string", "frecuencia": "alta|media|baja", "descripcion": "1 oración", "ejemplos": ["frase1", "frase2"] }
  ],
  "palabras_clave": [
    { "palabra": "string", "categoria": "empleo|vivienda|salud|ingresos|familia|violencia|educacion|otro", "peso": 1-10 }
  ],
  "alertas_territoriales": [
    { "tipo": "string", "descripcion": "1 oración", "urgencia": "alta|media|baja" }
  ],
  "correlaciones": [
    { "diagnostico": "string", "patron_conversacion": "string", "implicancia": "string" }
  ],
  "resumen_ejecutivo": "3-4 oraciones para tomadores de decisiones. Qué necesitan los ciudadanos, qué es urgente, qué acción recomendás."
}

Devolvé SOLO el JSON, sin markdown, sin explicaciones.`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const aiData = await aiRes.json();
    const rawText = aiData?.content?.[0]?.text || "{}";

    let parsed: any = {};
    try { parsed = JSON.parse(rawText); } catch {
      // intentar extraer JSON del texto
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) { try { parsed = JSON.parse(match[0]); } catch {} }
    }

    // Enriquecer alertas territoriales con datos reales
    const alertasTerritoriales = [
      ...Object.entries(barrioCriticos)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([barrio, count]) => ({
          barrio,
          total: barrioConteo[barrio] || 0,
          criticos: count,
          porcentaje: Math.round(((count as number) / (barrioConteo[barrio] || 1)) * 100),
        })),
      ...(parsed.alertas_territoriales || []),
    ];

    // 7. Guardar en conversation_insights
    const insight = {
      periodo_inicio: periodoInicio.toISOString(),
      periodo_fin: periodoFin.toISOString(),
      total_conversaciones: totalConversaciones,
      total_mensajes: totalMensajes,
      temas: parsed.temas || [],
      palabras_clave: parsed.palabras_clave || [],
      alertas_territoriales: alertasTerritoriales,
      correlaciones: parsed.correlaciones || [],
      resumen_ejecutivo: parsed.resumen_ejecutivo || "",
    };

    const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/conversation_insights`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify(insight),
    });
    const saved = await saveRes.json();
    const savedId = Array.isArray(saved) ? saved[0]?.id : null;

    return new Response(JSON.stringify({ status: "ok", id: savedId, ...insight }), { status: 200, headers });
  } catch (err) {
    console.error("analyze_conversations error:", err);
    return new Response(
      JSON.stringify({ status: "error", error: "Error inesperado", details: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers }
    );
  }
});
