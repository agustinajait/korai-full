import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Clock, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { generatePrioridadesDesdeRespuestas, type Prioridad, type Sello } from "@/lib/korai-logic";

export default function Prioridades() {
  const [_, setLocation] = useLocation();
  const [prioridades, setPrioridades] = useState<Prioridad[]>([]);
  const [sello, setSello] = useState<Sello | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("korai_user_prioridades_v1");
    if (cached) {
      setPrioridades(JSON.parse(cached));
    } else {
      const answersRaw = localStorage.getItem("korai_user_answers");
      if (answersRaw) {
        const answers = JSON.parse(answersRaw);
        const generated = generatePrioridadesDesdeRespuestas(answers);
        setPrioridades(generated);
        localStorage.setItem("korai_user_prioridades_v1", JSON.stringify(generated));
      }
    }

    const selloRaw = localStorage.getItem("korai_user_sello_v1");
    if (selloRaw) setSello(JSON.parse(selloRaw));
  }, []);

  const colorBorder = (c: string) =>
    c === "rojo" ? "border-red-500/30" : c === "amarillo" ? "border-yellow-500/30" : "border-green-500/30";
  const colorBg = (c: string) =>
    c === "rojo" ? "bg-red-500/10" : c === "amarillo" ? "bg-yellow-500/10" : "bg-green-500/10";
  const colorText = (c: string) =>
    c === "rojo" ? "text-red-400" : c === "amarillo" ? "text-yellow-400" : "text-green-400";
  const colorBadgeBg = (c: string) =>
    c === "rojo" ? "bg-red-500/20" : c === "amarillo" ? "bg-yellow-500/20" : "bg-green-500/20";

  if (prioridades.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4">
        <AlertTriangle className="w-12 h-12 text-yellow-400" />
        <h2 className="text-xl font-bold text-center" data-testid="text-no-prioridades">Necesitas completar el diagn&oacute;stico primero</h2>
        <p className="text-muted-foreground text-center text-sm">Completa la encuesta para ver tus prioridades personalizadas.</p>
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
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black" data-testid="text-prioridades-title">Mis Prioridades</h1>
            <p className="text-xs text-muted-foreground">Basadas en tu diagn&oacute;stico real</p>
          </div>
        </div>
      </div>

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
            <div className="text-xs font-black text-primary uppercase tracking-wider" data-testid="text-sello-municipio">{sello.municipio}</div>
            <div className="text-[10px] text-muted-foreground">ID: {sello.idParticipacion} | {sello.fecha}</div>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {prioridades.map((p, i) => (
          <motion.div
            key={p.dimensionId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-5 rounded-2xl border ${colorBorder(p.color)} ${colorBg(p.color)} space-y-3`}
            data-testid={`card-prioridad-${p.rank}`}
          >
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${colorBadgeBg(p.color)} ${colorText(p.color)}`}>
                  #{p.rank}
                </div>
                <div>
                  <div className="font-bold text-base flex items-center gap-2 flex-wrap">
                    <span>{p.emoji}</span>
                    <span>{p.titulo}</span>
                  </div>
                </div>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${colorBadgeBg(p.color)} ${colorText(p.color)} ${colorBorder(p.color)}`}>
                {p.color}
              </div>
            </div>

            <p className="text-sm text-white/70">{p.necesidad}</p>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-white/80">{p.accion}</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className={`w-3.5 h-3.5 ${colorText(p.color)} flex-shrink-0`} />
                <span className={`text-xs font-bold ${colorText(p.color)}`}>{p.cuando}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-3 pt-4 flex-wrap">
        <Button
          onClick={() => setLocation("/metas")}
          className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 font-bold rounded-xl"
          data-testid="button-go-metas"
        >
          Ver Mis Metas <ChevronRight className="ml-1 w-4 h-4" />
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
