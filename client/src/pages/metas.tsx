import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, AlertTriangle, ExternalLink, ChevronRight, Clock, Milestone, Trophy } from "lucide-react";
import { generateMetasDesdeScores, type Meta } from "@/lib/korai-logic";

export default function Metas() {
  const [_, setLocation] = useLocation();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [expandedDim, setExpandedDim] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("korai_user_metas_v1");
    if (cached) {
      setMetas(JSON.parse(cached));
    } else {
      const answersRaw = localStorage.getItem("korai_user_answers");
      if (answersRaw) {
        const answers = JSON.parse(answersRaw);
        const generated = generateMetasDesdeScores(answers);
        setMetas(generated);
        localStorage.setItem("korai_user_metas_v1", JSON.stringify(generated));
      }
    }
  }, []);

  const colorBorder = (c: string) =>
    c === "rojo" ? "border-red-500/30" : c === "amarillo" ? "border-yellow-500/30" : "border-green-500/30";
  const colorBg = (c: string) =>
    c === "rojo" ? "bg-red-500/10" : c === "amarillo" ? "bg-yellow-500/10" : "bg-green-500/10";
  const colorText = (c: string) =>
    c === "rojo" ? "text-red-400" : c === "amarillo" ? "text-yellow-400" : "text-green-400";
  const colorBadgeBg = (c: string) =>
    c === "rojo" ? "bg-red-500/20" : c === "amarillo" ? "bg-yellow-500/20" : "bg-green-500/20";

  if (metas.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4">
        <AlertTriangle className="w-12 h-12 text-yellow-400" />
        <h2 className="text-xl font-bold text-center" data-testid="text-no-metas">Necesitas completar el diagn&oacute;stico primero</h2>
        <p className="text-muted-foreground text-center text-sm">Completa la encuesta para ver tus metas personalizadas.</p>
        <Button onClick={() => setLocation("/")} data-testid="button-go-home">
          Ir al Inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-10 px-4 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/survey")} data-testid="button-back-results">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black" data-testid="text-metas-title">Mis Metas</h1>
            <p className="text-xs text-muted-foreground">Plan de acci&oacute;n personalizado por dimensi&oacute;n</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {metas.map((m, i) => {
          const isExpanded = expandedDim === m.dimensionId;
          return (
            <motion.div
              key={m.dimensionId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-2xl border ${colorBorder(m.color)} overflow-hidden`}
              data-testid={`card-meta-${m.dimensionId}`}
            >
              <button
                className={`w-full text-left p-4 flex items-center justify-between gap-3 ${colorBg(m.color)} transition-colors`}
                onClick={() => setExpandedDim(isExpanded ? null : m.dimensionId)}
                data-testid={`button-toggle-${m.dimensionId}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.emoji}</span>
                  <div>
                    <div className="font-bold text-base">{m.dimensionName}</div>
                    <div className={`text-[10px] font-black uppercase ${colorText(m.color)}`}>Nivel: {m.color}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${colorBadgeBg(m.color)} ${colorText(m.color)} ${colorBorder(m.color)}`}>
                    {m.color}
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="p-4 space-y-4 border-t border-white/5"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="p-1.5 rounded-lg bg-green-500/20 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-black uppercase text-green-400 tracking-wider">Corto plazo</div>
                        <p className="text-sm text-white/80 mt-1">{m.corto}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="p-1.5 rounded-lg bg-yellow-500/20 mt-0.5">
                        <Milestone className="w-3.5 h-3.5 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-black uppercase text-yellow-400 tracking-wider">Mediano plazo (1-3 a&ntilde;os)</div>
                        <p className="text-sm text-white/80 mt-1">{m.mediano}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="p-1.5 rounded-lg bg-primary/20 mt-0.5">
                        <Trophy className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-black uppercase text-primary tracking-wider">Largo plazo (5-10 a&ntilde;os)</div>
                        <p className="text-sm text-white/80 mt-1">{m.largo}</p>
                      </div>
                    </div>
                  </div>

                  {m.recursos.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Programas y Recursos</div>
                      <div className="space-y-1.5">
                        {m.recursos.map((r, ri) => (
                          <div key={ri} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                            {r.url ? (
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline flex-1"
                                data-testid={`link-recurso-${m.dimensionId}-${ri}`}
                              >
                                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                {r.nombre}
                              </a>
                            ) : (
                              <span className="text-sm text-white/70 flex-1">{r.nombre}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-3 pt-4 flex-wrap">
        <Button
          onClick={() => setLocation("/prioridades")}
          variant="outline"
          className="flex-1 h-12 border-white/10 bg-white/5 font-bold rounded-xl"
          data-testid="button-go-prioridades"
        >
          Ver Prioridades
        </Button>
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          className="h-12 border-white/10 bg-white/5"
          data-testid="button-go-inicio"
        >
          Inicio
        </Button>
      </div>
    </div>
  );
}
