import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Clock, AlertTriangle, CheckCircle2, ChevronRight, ChevronDown, ExternalLink, MessageCircle } from "lucide-react";
import { generatePlanDesdeScores, type PlanItem, type Sello } from "@/lib/korai-logic";

// Programas reales de CABA por dimensión para el mensaje de WhatsApp
const PROGRAMAS_WA: Record<string, { nombre: string; detalle: string }[]> = {
  salud: [
    { nombre: "CAPS (Centro de Salud gratuito)", detalle: "0800-222-5462 · buenosaires.gob.ar/salud/caps" },
    { nombre: "Programa SUMAR", detalle: "Cobertura gratuita · argentina.gob.ar/salud/sumar" },
  ],
  educacion: [
    { nombre: "Plan FinEs", detalle: "Terminá el secundario gratis · argentina.gob.ar/educacion/fines" },
    { nombre: "Becas Progresar", detalle: "Apoyo económico para estudiar · argentina.gob.ar/educacion/progresar" },
  ],
  trabajo: [
    { nombre: "Portal Empleo", detalle: "Bolsa de trabajo · portalempleo.gob.ar" },
    { nombre: "Fomento al Empleo CABA", detalle: "Subsidios para empleadores · buenosaires.gob.ar/trabajo" },
  ],
  vivienda: [
    { nombre: "Subsidio Habitacional 690", detalle: "Para familias en riesgo · atencioninmediata@buenosaires.gob.ar" },
    { nombre: "Programa Nuestras Familias", detalle: "Acompañamiento habitacional · nuestrasfamilias@buenosaires.gob.ar" },
  ],
  prevision: [
    { nombre: "ANSES", detalle: "AUH y prestaciones · anses.gob.ar · Tel: 130" },
    { nombre: "Potenciar Trabajo", detalle: "Empleo y capacitación · argentina.gob.ar/desarrollosocial" },
  ],
  cultura: [
    { nombre: "Centros Culturales Barriales", detalle: "Actividades gratuitas · buenosaires.gob.ar/cultura" },
  ],
};

const DIM_NOMBRES: Record<string, string> = {
  salud: "Salud",
  educacion: "Educación",
  trabajo: "Trabajo",
  vivienda: "Vivienda",
  prevision: "Previsión",
  cultura: "Cultura",
};

function generarMensajeWhatsApp(plan: PlanItem[]): string {
  const criticas = plan.filter(p => p.nivelColor === "rojo" || p.nivelColor === "amarillo").slice(0, 3);

  let msg = "🌱 *Mi diagnóstico KORAI*\n\n";
  msg += "Completé mi diagnóstico de bienestar comunitario. Estas son mis áreas prioritarias:\n\n";

  criticas.forEach((p, i) => {
    msg += `${i + 1}. ${p.emoji} *${p.dimensionName}* — ${p.nivelColor === "rojo" ? "🔴 Crítico" : "🟡 Alerta"}\n`;
    msg += `   ${p.metaCorto}\n\n`;
  });

  msg += "📋 *Recursos disponibles para mí en CABA:*\n\n";

  criticas.forEach(p => {
    const programas = PROGRAMAS_WA[p.dimensionId];
    if (programas) {
      msg += `${p.emoji} *${DIM_NOMBRES[p.dimensionId]}*\n`;
      programas.forEach(prog => {
        msg += `• ${prog.nombre}\n  ${prog.detalle}\n`;
      });
      msg += "\n";
    }
  });

  msg += "---\n";
  msg += "🔗 Hacé tu diagnóstico en: korai-full.vercel.app";

  return msg;
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

  const handleWhatsApp = () => {
    const mensaje = generarMensajeWhatsApp(plan);
    const encoded = encodeURIComponent(mensaje);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const toggleExpanded = (dimId: string) => {
    setExpandedItems(prev => ({ ...prev, [dimId]: !prev[dimId] }));
  };

  const colorBorder = (c: string) =>
    c === "rojo" ? "border-red-500/30" : c === "amarillo" ? "border-yellow-500/30" : "border-green-500/30";
  const colorBg = (c: string) =>
    c === "rojo" ? "bg-red-500/10" : c === "amarillo" ? "bg-yellow-500/10" : "bg-green-500/10";
  const colorText = (c: string) =>
    c === "rojo" ? "text-red-400" : c === "amarillo" ? "text-yellow-400" : "text-green-400";
  const colorBadgeBg = (c: string) =>
    c === "rojo" ? "bg-red-500/20" : c === "amarillo" ? "bg-yellow-500/20" : "bg-green-500/20";

  if (plan.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4">
        <AlertTriangle className="w-12 h-12 text-yellow-400" />
        <h2 className="text-xl font-bold text-center" data-testid="text-no-prioridades">Necesitás completar el diagnóstico primero</h2>
        <p className="text-muted-foreground text-center text-sm">Completá la encuesta para ver tu plan personalizado.</p>
        <Button onClick={() => setLocation("/")} data-testid="button-go-home">
          Ir al Inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-10 px-4 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/survey")} data-testid="button-back-results">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black" data-testid="text-prioridades-title">TU PLAN</h1>
            <p className="text-xs text-muted-foreground">Prioridades y metas basadas en tu diagnóstico</p>
          </div>
        </div>
      </div>

      {/* Sello */}
      {sello && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-2xl bg-primary/10 border border-primary/20"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-lg border-2 border-white/20">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-primary uppercase tracking-wider">{sello.texto || sello.municipio}</div>
            <div className="text-[10px] text-muted-foreground">ID: {sello.idParticipacion} | {sello.fecha}</div>
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
              <div className="font-bold text-sm text-white">Recibí tu plan por WhatsApp</div>
              <div className="text-xs text-white/50">Con los recursos y programas disponibles para vos en CABA</div>
            </div>
          </div>
          <Button
            onClick={handleWhatsApp}
            className="bg-[#25D366] hover:bg-[#20c45a] text-white font-bold rounded-xl h-11 px-5 flex-shrink-0 w-full sm:w-auto"
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
                      <div className="font-bold text-base flex items-center gap-2 flex-wrap">
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

                <p className="text-sm text-white/70">{p.motivo}</p>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="text-[10px] font-black uppercase text-green-400 tracking-wider">Meta corto plazo</div>
                  <p className="text-sm text-white/80">{p.metaCorto}</p>
                  <div className="space-y-1 pt-1">
                    {p.accionesCorto.map((a, ai) => (
                      <div key={ai} className="flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-white/70">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {p.recursos.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Recursos</div>
                    <div className="flex flex-wrap gap-2">
                      {p.recursos.map((r, ri) => (
                        r.url ? (
                          <a
                            key={ri}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5"
                            data-testid={`link-recurso-${p.dimensionId}-${ri}`}
                          >
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            {r.nombre}
                          </a>
                        ) : (
                          <span key={ri} className="inline-flex items-center text-xs text-white/60 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                            {r.nombre}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => toggleExpanded(p.dimensionId)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors pt-1"
                  data-testid={`button-expand-${p.dimensionId}`}
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  {isExpanded ? "Ocultar metas mediano/largo" : "Ver metas mediano/largo plazo"}
                </button>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-[10px] font-black uppercase text-yellow-400 tracking-wider">Mediano plazo (1-3 años)</div>
                    <p className="text-sm text-white/80 mt-1">{p.metaMediano}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-[10px] font-black uppercase text-primary tracking-wider">Largo plazo (5-10 años)</div>
                    <p className="text-sm text-white/80 mt-1">{p.metaLargo}</p>
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
          className="flex-1 h-12 bg-[#25D366] hover:bg-[#20c45a] text-white font-bold rounded-xl"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Recibir por WhatsApp
        </Button>
        <Button
          onClick={() => setLocation("/metas")}
          className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 font-bold rounded-xl"
          data-testid="button-go-metas"
        >
          Ver mis Metas <ChevronRight className="ml-1 w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setLocation("/survey")}
          className="flex-1 h-11 border-white/10 bg-white/5"
        >
          Ver mi diagnóstico
        </Button>
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          className="flex-1 h-11 border-white/10 bg-white/5"
          data-testid="button-go-inicio"
        >
          Inicio
        </Button>
        <Button
          variant="outline"
          onClick={() => { localStorage.removeItem("korai_user_answers"); localStorage.removeItem("korai_user_plan_v1"); localStorage.removeItem("korai_user_sello_v1"); localStorage.removeItem("korai_context"); setLocation("/"); }}
          className="flex-1 h-11 border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10"
        >
          Salir
        </Button>
      </div>
    </div>
  );
}
