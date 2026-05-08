import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Clock, AlertTriangle, CheckCircle2, ChevronRight, ChevronDown, ExternalLink, MessageCircle } from "lucide-react";
import { generatePlanDesdeScores, type PlanItem, type Sello } from "@/lib/korai-logic";

// Programas reales por dimensión para el mensaje de WhatsApp
const PROGRAMAS_WA: Record<string, { nombre: string; detalle: string }[]> = {
  empleo: [
    { nombre: "Portal Empleo", detalle: "portalempleo.gob.ar" },
    { nombre: "Oportunai", detalle: "Creá tu CV y video CV · oportunai.com" },
    { nombre: "Potenciar Trabajo", detalle: "argentina.gob.ar/desarrollosocial/potenciartrabajo" },
  ],
  educacion: [
    { nombre: "Plan FinEs", detalle: "Terminá el secundario gratis · argentina.gob.ar/educacion/fines" },
    { nombre: "Becas Progresar", detalle: "Apoyo económico · argentina.gob.ar/educacion/progresar" },
  ],
  salud: [
    { nombre: "CAPS (Centro de Salud gratuito)", detalle: "0800-222-5462 · buenosaires.gob.ar/salud/caps" },
    { nombre: "Programa SUMAR", detalle: "Cobertura gratuita · argentina.gob.ar/salud/sumar" },
  ],
  vivienda: [
    { nombre: "Subsidio Habitacional 690", detalle: "Para familias en riesgo · buenosaires.gob.ar" },
    { nombre: "PROMEBA", detalle: "Mejoramiento de barrios · argentina.gob.ar/habitat/promeba" },
  ],
  ingresos: [
    { nombre: "ANSES", detalle: "AUH y prestaciones · anses.gob.ar · Tel: 130" },
    { nombre: "Portal Empleo", detalle: "Oportunidades laborales · portalempleo.gob.ar" },
  ],
  red: [
    { nombre: "Centros Culturales Barriales", detalle: "Actividades gratuitas · buenosaires.gob.ar/cultura" },
    { nombre: "Puntos de Cultura", detalle: "argentina.gob.ar/cultura" },
  ],
};

const DIM_NOMBRES: Record<string, string> = {
  empleo: "Empleo",
  educacion: "Educación",
  salud: "Salud",
  vivienda: "Vivienda",
  ingresos: "Ingresos",
  red: "Red / Vínculos",
};

const SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4";

// ─── MENSAJE 1: Bienvenida + áreas críticas + link de confirmación ─────────
function generarMensaje1(plan: PlanItem[]): string {
  const context = (() => { try { return JSON.parse(localStorage.getItem("korai_context") || "{}"); } catch { return {}; } })();
  const nombre = context.nombre ? context.nombre : "";
  const criticas = plan.filter(p => p.nivelColor === "rojo").slice(0, 2);
  const areas = criticas.length > 0 ? criticas : plan.slice(0, 2);
  const areasTexto = areas.map(p => p.dimensionName).join(" y ");

  // Link de confirmación — lleva a korai-full.vercel.app/confirmar?dni=HASH
  const dniHash = localStorage.getItem("korai_user_dni_hash_v1") || "";
  const linkConfirmar = `https://korai-full.vercel.app/confirmar?h=${dniHash}`;

  let msg = `Hola${nombre ? ` ${nombre}` : ""} 👋 Soy Korai, tu asistente de bienestar.\n\n`;
  msg += `Terminaste tu diagnóstico y detectamos que hoy podrías necesitar apoyo principalmente en *${areasTexto}*.\n\n`;
  msg += `Tenemos un plan concreto con pasos para estas próximas dos semanas que puede ayudarte.\n\n`;
  msg += `¿Querés que te lo compartamos?\n\n`;
  msg += `👉 Tocá acá para decir que sí:\n${linkConfirmar}\n\n`;
  msg += `_Tu información es confidencial y está protegida._ 🔒`;
  return msg;
}

// ─── MENSAJE 2: Plan de las próximas 2 semanas ────────────────────────────
function generarMensaje2(plan: PlanItem[]): string {
  const context = (() => { try { return JSON.parse(localStorage.getItem("korai_context") || "{}"); } catch { return {}; } })();
  const profundizacion = (() => { try { return JSON.parse(localStorage.getItem("korai_profundizacion") || "{}"); } catch { return {}; } })();
  const nombre = context.nombre ? context.nombre : "";
  const criticas = plan.filter(p => p.nivelColor === "rojo").slice(0, 2);
  const areas = criticas.length > 0 ? criticas : plan.slice(0, 2);

  let msg = `Perfecto${nombre ? ` ${nombre}` : ""} 🙌 Acá está tu plan para las próximas 2 semanas:\n\n`;

  areas.forEach(p => {
    msg += `${p.emoji} *${p.dimensionName}*\n`;
    p.accionesCorto.slice(0, 2).forEach((a, i) => {
      msg += `${i + 1}. ${a}\n`;
    });
    // Recurso más relevante
    const r = p.recursos[0];
    if (r) {
      if (r.telefono) msg += `📞 ${r.nombre}: ${r.telefono}\n`;
      else if (r.url) msg += `🔗 ${r.nombre}: ${r.url}\n`;
    }
    // Personalización según profundización
    if (p.dimensionId === "empleo" && profundizacion.emp_disponibilidad !== "no") {
      msg += `🔗 Sacá turno en el CIL: buenosaires.gob.ar/tramites/centro-de-integracion-laboral\n`;
    }
    if (p.dimensionId === "salud" && profundizacion.sal_cobertura === "no") {
      msg += `📞 SUMAR (sin obra social): 0800-222-5462\n`;
    }
    msg += "\n";
  });

  msg += `---\nEn 7 días te vamos a preguntar cómo te fue 💪\n`;
  msg += `_Korai — korai-full.vercel.app_`;
  return msg;
}

// ─── Handler: Mensaje 1 ───────────────────────────────────────────────────
function usarWhatsAppMensaje1(plan: PlanItem[]) {
  const context = (() => { try { return JSON.parse(localStorage.getItem("korai_context") || "{}"); } catch { return {}; } })();
  const profundizacion = (() => { try { return JSON.parse(localStorage.getItem("korai_profundizacion") || "{}"); } catch { return {}; } })();
  const nombre = context.nombre || "";
  const criticas = plan.filter(p => p.nivelColor === "rojo").slice(0, 2);
  const areas = criticas.length > 0 ? criticas : plan.slice(0, 2);
  const areasTexto = areas.map(p => p.dimensionName).join(" y ");

  let msg = `Hola${nombre ? ` ${nombre}` : ""} 👋 Soy Korai, tu asistente de bienestar.\n\n`;
  msg += `Terminaste tu diagnóstico y detectamos que hoy podrías necesitar apoyo en *${areasTexto}*.\n\n`;
  msg += `🗓️ *Tu plan para las próximas 2 semanas:*\n\n`;

  areas.forEach(p => {
    msg += `${p.emoji} *${p.dimensionName}*\n`;
    p.accionesCorto.slice(0, 2).forEach((a, i) => {
      msg += `${i + 1}. ${a}\n`;
    });
    const r = p.recursos?.[0];
    if (r?.telefono) msg += `📞 ${r.nombre}: ${r.telefono}\n`;
    else if (r?.url) msg += `🔗 ${r.nombre}: ${r.url}\n`;

    if (p.dimensionId === "empleo" && profundizacion?.emp_disponibilidad !== "no") {
      msg += `🔗 Turno CIL: buenosaires.gob.ar/tramites/centro-de-integracion-laboral\n`;
    }
    if (p.dimensionId === "salud" && profundizacion?.sal_cobertura === "no") {
      msg += `📞 SUMAR (sin obra social): 0800-222-5462\n`;
    }
    msg += "\n";
  });

  msg += `En 7 días te vamos a preguntar cómo te fue 💪\n`;
  msg += `_Korai — korai-full.vercel.app_`;

  const encoded = encodeURIComponent(msg);
  const telefono = context.telefono?.replace(/\D/g, "");
  let url = `https://wa.me/?text=${encoded}`;
  if (telefono && telefono.length >= 8) {
    const numero = telefono.startsWith("54") ? telefono : `54${telefono}`;
    url = `https://wa.me/${numero}?text=${encoded}`;
  }
  window.open(url, "_blank");
}

// ─── Handler: Mensaje 2 (se llama desde /confirmar) ──────────────────────
function usarWhatsAppMensaje2(plan: PlanItem[]) {
  const context = (() => { try { return JSON.parse(localStorage.getItem("korai_context") || "{}"); } catch { return {}; } })();
  const mensaje = generarMensaje2(plan);
  const encoded = encodeURIComponent(mensaje);
  const telefono = context.telefono?.replace(/\D/g, "");
  let url: string;
  if (telefono && telefono.length >= 8) {
    const numero = telefono.startsWith("54") ? telefono : `54${telefono}`;
    url = `https://wa.me/${numero}?text=${encoded}`;
  } else {
    url = `https://wa.me/?text=${encoded}`;
  }
  window.open(url, "_blank");
}

// Mantener compatibilidad con código existente
function generarMensajeWhatsApp(plan: PlanItem[]): string {
  return generarMensaje1(plan);
}

export default function Prioridades() {
  const [_, setLocation] = useLocation();
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [sello, setSello] = useState<Sello | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showWhatsAppBanner, setShowWhatsAppBanner] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem("korai_user_plan_v1");
    if (cached) {
      setPlan(JSON.parse(cached));
    } else {
      const answersRaw = localStorage.getItem("korai_user_answers");
      if (answersRaw) {
        const answers = JSON.parse(answersRaw);
        const generated = generatePlanDesdeScores(answers);
        setPlan(generated);
        localStorage.setItem("korai_user_plan_v1", JSON.stringify(generated));
      }
    }

    const selloRaw = localStorage.getItem("korai_user_sello_v1");
    if (selloRaw) setSello(JSON.parse(selloRaw));

    // Mostrar banner de WhatsApp después de 1.5 segundos
    const timer = setTimeout(() => setShowWhatsAppBanner(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleWhatsApp = async () => {
    const dniHash = localStorage.getItem("korai_user_dni_hash_v1") || "";
    const context = (() => { try { return JSON.parse(localStorage.getItem("korai_context") || "{}"); } catch { return {}; } })();
    const telefono = context.telefono?.replace(/\D/g, "");
  
    // 1. Registrar aceptación en Supabase
    if (dniHash) {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/responses?campaign_id=eq.53813f5a-3613-4faf-8ca1-b369e4e908cb&dni_hash=eq.${dniHash}&order=submitted_at.desc&limit=1`,
          { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        const data = await res.json();
        if (data && data.length > 0) {
          await fetch(`${SUPABASE_URL}/rest/v1/responses?id=eq.${data[0].id}`, {
            method: "PATCH",
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({ acepto_seguimiento: true, fecha_aceptacion: new Date().toISOString() }),
          });
        }
      } catch (e) {
        console.warn("No se pudo registrar aceptación:", e);
      }
    }
  
    // 2. Llamar Edge Function send_whatsapp
    if (!telefono || telefono.length < 8) {
      usarWhatsAppMensaje1(plan); // fallback si no hay teléfono
      return;
    }
  
    try {
      const mensaje = generarMensaje1(plan);
  
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send_whatsapp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ telefono, mensaje }), // ← parámetros exactos que espera la función
      });
  
      const result = await res.json();
      console.log("send_whatsapp result:", result);
  
      if (!res.ok) {
        throw new Error(result.error || "Error en Edge Function");
      }
  
      alert("¡Mensaje enviado por WhatsApp! 📲");
  
    } catch (e) {
      console.error("Error llamando send_whatsapp:", e);
      usarWhatsAppMensaje1(plan); // fallback a wa.me
    }
  };
  const toggleExpanded = (dimId: string) => {
    setExpandedItems(prev => ({ ...prev, [dimId]: !prev[dimId] }));
  };

  const colorBorder = (c: string) =>
    c === "rojo" ? "border-red-300" : c === "amarillo" ? "border-yellow-300" : "border-green-500/30";
  const colorBg = (c: string) =>
    c === "rojo" ? "bg-red-50" : c === "amarillo" ? "bg-yellow-50" : "bg-green-50";
  const colorText = (c: string) =>
    c === "rojo" ? "text-red-600" : c === "amarillo" ? "text-yellow-700" : "text-green-700";
  const colorBadgeBg = (c: string) =>
    c === "rojo" ? "bg-red-500/20" : c === "amarillo" ? "bg-yellow-500/20" : "bg-green-500/20";

  if (plan.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4 bg-[#F4F0FF]">
        <AlertTriangle className="w-12 h-12 text-yellow-700" />
        <h2 className="text-xl font-bold text-center" data-testid="text-no-prioridades">Necesitás completar el diagnóstico primero</h2>
        <p className="text-[#6B5FA0] text-center text-sm">Completá la encuesta para ver tu plan personalizado.</p>
        <Button onClick={() => setLocation("/")} data-testid="button-go-home">
          Ir al Inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-10 px-4 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 bg-[#F4F0FF]">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/survey")} data-testid="button-back-results">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <Target className="w-6 h-6 text-[#5B21B6]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1E1040]" data-testid="text-prioridades-title">TU PLAN</h1>
            <p className="text-xs text-[#6B5FA0]">Qué podés hacer esta semana y tu camino para este año</p>
          </div>
        </div>
      </div>

      {/* Sello */}
      {sello && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-2xl bg-[#EDE9FE] border border-[#C4B5FD]"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-lg border-2 border-white/20">
            <CheckCircle2 className="w-5 h-5 text-[#1E1040]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-[#5B21B6] uppercase tracking-wider">{sello.texto || sello.municipio}</div>
            <div className="text-[10px] text-[#6B5FA0]">ID: {sello.idParticipacion} | {sello.fecha}</div>
          </div>
        </motion.div>
      )}

      {/* Banner WhatsApp */}
      {showWhatsAppBanner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="p-5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#1E1040]">Recibí tu plan por WhatsApp</div>
              <div className="text-xs text-[#6B5FA0]">Con los recursos y programas disponibles para vos en CABA</div>
            </div>
          </div>
          <Button
            onClick={handleWhatsApp}
            className="bg-[#25D366] hover:bg-[#20c45a] text-[#1E1040] font-bold rounded-xl h-11 px-5 flex-shrink-0 w-full sm:w-auto"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Enviar a mi WhatsApp
          </Button>
        </motion.div>
      )}

      {/* Plan items */}
      <div className="space-y-4">
        {plan.map((p, i) => {
          const isExpanded = !!expandedItems[p.dimensionId];
          return (
            <motion.div
              key={p.dimensionId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border ${colorBorder(p.nivelColor)} ${colorBg(p.nivelColor)} overflow-hidden`}
              data-testid={`card-prioridad-${p.rank}`}
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${colorBadgeBg(p.nivelColor)} ${colorText(p.nivelColor)}`}>
                      #{p.rank}
                    </div>
                    <div>
                      <div className="font-bold text-base text-[#1E1040] flex items-center gap-2 flex-wrap">
                        <span>{p.emoji}</span>
                        <span>{p.titulo}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${colorBadgeBg(p.nivelColor)} ${colorText(p.nivelColor)} ${colorBorder(p.nivelColor)}`}>
                      {p.nivelColor}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className={`w-3 h-3 ${colorText(p.nivelColor)}`} />
                      <span className={`text-[10px] font-bold ${colorText(p.nivelColor)}`}>{p.cuando}</span>
                    </div>
                  </div>
                </div>

                {/* Esta semana */}
                <div className="p-4 rounded-xl bg-white border-2 border-[#5B21B6]/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📌</span>
                    <div className="text-xs font-black uppercase text-[#5B21B6] tracking-wider">Qué podés hacer esta semana</div>
                  </div>
                  <div className="space-y-2 pt-1">
                    {p.accionesCorto.slice(0, 2).map((a, ai) => (
                      <div key={ai} className="flex items-start gap-2 p-2 rounded-lg bg-[#F4F0FF]">
                        <span className="text-[#5B21B6] font-black text-sm mt-0.5">{ai + 1}.</span>
                        <p className="text-sm text-[#1E1040] font-medium">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recursos */}
                {p.recursos.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🔗</span>
                      <div className="text-xs font-black uppercase text-[#6B5FA0] tracking-wider">Dónde ir o a quién llamar</div>
                    </div>
                    <div className="space-y-2">
                      {p.recursos.slice(0, 2).map((r, ri) => (
                        <div key={ri} className="p-3 rounded-xl bg-white border border-[#DDD6FE] space-y-1.5">
                          <div className="font-bold text-sm text-[#1E1040]">{r.nombre}</div>
                          {r.descripcionCorta && <p className="text-xs text-[#6B5FA0]">{r.descripcionCorta}</p>}
                          <div className="flex gap-2 flex-wrap pt-0.5">
                            {r.url && (
                              <a href={r.url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B21B6] bg-[#EDE9FE] px-3 py-1.5 rounded-lg hover:bg-[#DDD6FE] transition-colors"
                                data-testid={`link-recurso-${p.dimensionId}-${ri}`}>
                                <ExternalLink className="w-3 h-3" />
                                {r.accion || "Ver más"}
                              </a>
                            )}
                            {r.telefono && (
                              <a href={`tel:${r.telefono}`}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                                📞 Llamar al {r.telefono}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => toggleExpanded(p.dimensionId)}
                  className="flex items-center gap-1.5 text-xs text-[#6B5FA0] hover:text-[#1E1040] transition-colors pt-1"
                  data-testid={`button-expand-${p.dimensionId}`}
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  {isExpanded ? "Ocultar el camino anual" : "📅 Ver el camino para este año"}
                </button>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-3 border-t border-[#EDE9FE] pt-4 bg-[#FAF8FF]">
                  <div className="text-xs font-black text-[#6B5FA0] uppercase tracking-wider mb-3">Tu camino para los próximos meses</div>
                  <div className="p-3 rounded-xl bg-white border border-[#DDD6FE]">
                    <div className="flex items-center gap-2 mb-1">
                      <span>📅</span>
                      <div className="text-[10px] font-black uppercase text-yellow-700 tracking-wider">Este mes</div>
                    </div>
                    <p className="text-sm text-[#1E1040]">{p.metaCorto}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#DDD6FE]">
                    <div className="flex items-center gap-2 mb-1">
                      <span>🎯</span>
                      <div className="text-[10px] font-black uppercase text-[#5B21B6] tracking-wider">Dónde querés estar en un año</div>
                    </div>
                    <p className="text-sm text-[#1E1040]">{p.metaMediano}</p>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Botones finales */}
      <div className="flex gap-3 pt-4 flex-wrap">
        <Button
          onClick={handleWhatsApp}
          className="flex-1 h-12 bg-[#25D366] hover:bg-[#20c45a] text-[#1E1040] font-bold rounded-xl"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Recibir por WhatsApp
        </Button>
        <Button
          onClick={() => setLocation("/metas")}
          className="flex-1 h-12 bg-[#5B21B6] font-bold rounded-xl"
          data-testid="button-go-metas"
        >
          Ver mis Metas <ChevronRight className="ml-1 w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setLocation("/survey")}
          className="flex-1 h-11 border-[#DDD6FE] bg-white/80"
        >
          Ver mi diagnóstico
        </Button>
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          className="flex-1 h-11 border-[#DDD6FE] bg-white/80"
          data-testid="button-go-inicio"
        >
          Inicio
        </Button>
        <Button
          variant="outline"
          onClick={() => { localStorage.removeItem("korai_user_answers"); localStorage.removeItem("korai_user_plan_v1"); localStorage.removeItem("korai_user_sello_v1"); localStorage.removeItem("korai_context"); setLocation("/"); }}
          className="flex-1 h-11 border-red-500/20 bg-red-500/5 text-red-600 hover:bg-red-50"
        >
          Salir
        </Button>
      </div>
    </div>
  );
}
