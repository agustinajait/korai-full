import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { TrafficLightButton } from "@/components/ui/traffic-light-button";
import { ProgressHeader } from "@/components/layout/progress-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { INSTRUMENT } from "@/lib/instrument";
import { useCreateReport } from "@/hooks/use-reports";
import { queryClient } from "@/lib/queryClient";
import { Loader2, ArrowRight, CheckCircle2, Trophy, Gift, QrCode, Target, Calendar } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { generarSello, generatePlanDesdeScores, type Sello } from "@/lib/korai-logic";

export default function Survey() {
  const [_, setLocation] = useLocation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");
  const [showCommentScreen, setShowCommentScreen] = useState(false);
  const [showResultsScreen, setShowResultsScreen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<string | null>(null);
  const [showLevelUp, setShowLevelUp] = useState<{show: boolean, dimension: string}>({show: false, dimension: ""});
  const [sello, setSello] = useState<Sello | null>(null);

  const { mutate: submitReport, isPending } = useCreateReport();

  const context = JSON.parse(localStorage.getItem("korai_context") || "{}");
  
  // Redirect if no context
  useEffect(() => {
    if (!context.city) setLocation("/");
  }, [context, setLocation]);

  const indicators = INSTRUMENT.indicators;
  const currentIndicator = indicators[currentIdx];
  const dimension = INSTRUMENT.dimensions.find(d => d.id === currentIndicator?.dimension);

  const results = useMemo(() => {
    if (!showResultsScreen) return null;
    const perDim: Record<string, any> = {};
    INSTRUMENT.dimensions.forEach(d => {
      const dimInds = indicators.filter(i => i.dimension === d.id);
      const dimAnswers = dimInds.map(i => ({ 
        id: i.id, 
        label: i.label, 
        value: answers[i.id] 
      }));
      
      const r = dimAnswers.filter(ans => ans.value === 'rojo').length;
      const a = dimAnswers.filter(ans => ans.value === 'amarillo').length;
      const v = dimAnswers.filter(ans => ans.value === 'verde').length;
      const n = dimAnswers.length;
      
      // Lógica de severidad: si > 50% es rojo, es crítico.
      const color = (r / n >= 0.5) ? 'rojo' : (a / n >= 0.5 || (r+a)/n >= 0.5) ? 'amarillo' : 'verde';
      
      // Calcular severidad (0-100)
      // Representa qué tan cerca está de "empeorar" o el peso del riesgo
      const severity = Math.round(((r * 1 + a * 0.5) / n) * 100);
      
      // Encontrar el indicador más problemático para la explicación
      const worstInd = dimAnswers.find(a => a.value === 'rojo') || dimAnswers.find(a => a.value === 'amarillo');
      
      let explanation = "";
      if (color === 'rojo') {
        explanation = `Estado Crítico: El ${Math.round((r/n)*100)}% de los indicadores reporta niveles de riesgo alto, especialmente en "${worstInd?.label || 'acceso básico'}", lo que arrastra la dimensión a Rojo.`;
      } else if (color === 'amarillo') {
        explanation = `Riesgo Moderado: Se detectan alertas en un ${Math.round(((r+a)/n)*100)}% del área. La situación de "${worstInd?.label || 'ciertos servicios'}" requiere atención para evitar una transición a rojo.`;
      } else {
        explanation = `Estado Óptimo: La dimensión se mantiene en niveles saludables. El ${Math.round((v/n)*100)}% de las respuestas son positivas, reflejando estabilidad general.`;
      }

      perDim[d.id] = { r, a, v, n, color, severity, explanation };
    });

    const totalR = Object.values(perDim).reduce((acc, d) => acc + d.r, 0);
    const totalA = Object.values(perDim).reduce((acc, d) => acc + d.a, 0);
    const totalV = Object.values(perDim).reduce((acc, d) => acc + d.v, 0);
    const totalN = Object.values(perDim).reduce((acc, d) => acc + d.n, 0);
    
    const communityColor = (totalR / totalN >= 0.33) ? 'rojo' : (totalA / totalN >= 0.33) ? 'amarillo' : 'verde';

    return { perDim, overallColor: communityColor, totalR, totalA, totalV, totalN };
  }, [showResultsScreen, answers, indicators]);

  const playBip = (color: string) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const freq = color === 'verde' ? 760 : color === 'amarillo' ? 560 : 360;
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio Context not supported or blocked", e);
    }
  };

  const handleAnswer = (value: "rojo" | "amarillo" | "verde") => {
    playBip(value);
    const newAnswers = { ...answers, [currentIndicator.id]: value };
    setAnswers(newAnswers);

    const nextIdx = currentIdx + 1;
    if (nextIdx < indicators.length) {
      const nextInd = indicators[nextIdx];
      if (nextInd.dimension !== currentIndicator.dimension) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#7c5cff', '#22c55e', '#f59e0b']
        });
        setShowLevelUp({ show: true, dimension: dimension?.name || "" });
        
        setTimeout(() => {
          setShowLevelUp({ show: false, dimension: "" });
          setCurrentIdx(nextIdx);
        }, 2000);
      } else {
        setTimeout(() => setCurrentIdx(nextIdx), 250);
      }
    } else {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      setShowCommentScreen(true);
    }
  };

  const handleSubmit = () => {
    submitReport({
      city: context.city || "Unknown",
      neighborhood: context.neighborhood || "",
      answers,
      openText: comment,
      demographics: context.demographics || {}
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/reports"] });

        localStorage.setItem("korai_user_answers", JSON.stringify(answers));

        localStorage.removeItem("korai_user_plan_v1");

        const plan = generatePlanDesdeScores(answers);
        localStorage.setItem("korai_user_plan_v1", JSON.stringify(plan));

        const newSello = generarSello(context.city || undefined);
        localStorage.setItem("korai_user_sello_v1", JSON.stringify(newSello));
        setSello(newSello);

        setShowResultsScreen(true);
      }
    });
  };

  if (showResultsScreen && results) {
    return (
      <div className="min-h-screen pt-20 pb-10 px-4 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <header className="space-y-2">
              <h1 className="text-4xl font-black">Tu Diagnóstico</h1>
              <p className="text-muted-foreground text-lg">
                Este es el resultado de tu autodiagnóstico. Tu mirada es fundamental para entender la realidad de tu barrio.
              </p>
            </header>

            <div className="grid sm:grid-cols-2 gap-4">
              {INSTRUMENT.dimensions.map(d => {
                const s = results.perDim[d.id];
                return (
                  <div key={d.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-xl space-y-4 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{d.emoji}</span>
                        <div>
                          <div className="font-bold text-base">{d.name}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Nivel: {s.color}</div>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        s.color === 'rojo' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                        s.color === 'amarillo' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                        'bg-green-500/20 text-green-400 border-green-500/30'
                      }`}>
                        {s.color}
                      </div>
                    </div>

                    <div className="flex h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div style={{ width: `${(s.v / s.n) * 100}%` }} className="bg-[#22c55e]" />
                      <div style={{ width: `${(s.a / s.n) * 100}%` }} className="bg-[#f59e0b]" />
                      <div style={{ width: `${(s.r / s.n) * 100}%` }} className="bg-[#ef4444]" />
                    </div>

                    <div className="pt-2">
                      <p className="text-[11px] leading-relaxed text-white/70 italic bg-white/5 p-3 rounded-xl border border-white/5">
                        {s.color === 'rojo' ? 'Se detectan áreas de mejora urgente.' : s.color === 'amarillo' ? 'Existen aspectos que requieren atención.' : 'La situación es mayormente positiva.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="w-full md:w-80 space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="bg-gradient-to-br from-primary/30 via-primary/10 to-transparent border border-primary/40 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(124,92,255,0.3)] relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -z-10 group-hover:bg-primary/40 transition-colors" />
              
              <div className="flex flex-col items-center text-center space-y-4">
                <motion.div 
                  initial={{ rotate: -15, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className="w-24 h-24 rounded-[30%] bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-5xl shadow-[0_10px_30px_rgba(245,158,11,0.4)] border-4 border-white/20"
                >
                  🎖️
                </motion.div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white tracking-tight italic uppercase" data-testid="text-sello-title">
                    {sello?.texto || sello?.municipio || "Sello de Distinción"}
                  </h3>
                  <div className="text-primary font-black text-lg tracking-widest uppercase">Colaborador Comunitario</div>
                </div>
                <p className="text-sm text-[#A9B3DA] leading-relaxed max-w-[240px]">
                  {sello ? `ID: ${sello.idParticipacion} | ${sello.fecha}` : "Tu participación activa fortalece la inteligencia colectiva de tu barrio."}
                </p>
              </div>
            </motion.div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Tu Recompensa</h3>
                  <p className="text-xs text-[#A9B3DA]">Selecciona un beneficio local para canjear</p>
                </div>
              </div>
              
              <div className="grid gap-3">
                {[
                  { id: 'discount', icon: '🛍️', title: '10% OFF Comercios', desc: 'Válido en tiendas adheridas', color: 'from-blue-500/20' },
                  { id: 'coffee', icon: '☕', title: 'Merienda Especial', desc: 'Café + medialuna de regalo', color: 'from-orange-500/20' },
                  { id: 'raffle', icon: '🎟️', title: 'Sorteo Mensual', desc: 'Participación automática', color: 'from-purple-500/20' }
                ].map(b => (
                  <button 
                    key={b.id}
                    onClick={() => {
                      setSelectedBenefit(b.id);
                      playBip('verde');
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                      selectedBenefit === b.id 
                        ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(124,92,255,0.2)]' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${b.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className="relative flex items-center gap-4">
                      <span className="text-3xl group-hover:scale-110 transition-transform">{b.icon}</span>
                      <div className="flex-1">
                        <div className="font-black text-sm uppercase tracking-tight">{b.title}</div>
                        <div className="text-[10px] text-[#A9B3DA] font-medium">{b.desc}</div>
                      </div>
                      {selectedBenefit === b.id && (
                        <motion.div 
                          layoutId="active-check"
                          className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {selectedBenefit && (
                  <motion.div 
                    key={selectedBenefit}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="mt-8 pt-8 border-t border-white/10 text-center space-y-4"
                  >
                    <div className="relative inline-block">
                      <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                      <div className="bg-white p-6 rounded-3xl relative shadow-2xl">
                        <QRCodeSVG value={`KORAI-REWARD-${selectedBenefit}-${Date.now()}`} size={160} level="H" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                        <QrCode className="w-4 h-4" /> Código de Canje Activo
                      </div>
                      <p className="text-[10px] text-[#A9B3DA] font-medium">Presenta este código en el comercio seleccionado</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => setLocation("/prioridades")}
                className="w-full h-12 font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                data-testid="button-go-prioridades"
              >
                <Target className="w-5 h-5" /> Tu Plan
              </Button>
              <Button 
                onClick={() => setLocation("/metas")}
                className="w-full h-12 font-bold rounded-xl bg-gradient-to-r from-green-600 to-green-500 shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
                data-testid="button-go-metas"
              >
                <Calendar className="w-5 h-5" /> Mis Metas
              </Button>
              <Button 
                onClick={() => setLocation("/dashboard")}
                variant="outline"
                className="w-full h-12 border-white/10 bg-white/5 font-bold rounded-xl"
                data-testid="button-go-dashboard"
              >
                Ir al Dashboard Admin
              </Button>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (!currentIndicator && !showCommentScreen) return null;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 flex flex-col items-center max-w-xl mx-auto">
      <AnimatePresence>
        {showLevelUp.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-24 left-0 right-0 mx-auto w-max z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 text-lg">
              <span>⭐</span> Nivel Completado: {showLevelUp.dimension}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showCommentScreen ? (
        <>
          <ProgressHeader 
            currentStep={currentIdx + 1} 
            totalSteps={indicators.length} 
            currentDimensionId={currentIndicator.dimension} 
          />

          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full space-y-6 mt-4"
          >
            <div className="space-y-2">
               <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded">
                 {dimension?.name}
               </span>
               <h2 className="text-3xl font-display font-bold leading-tight">
                 {currentIndicator.label}
               </h2>
               <p className="text-muted-foreground text-lg">
                 Selecciona la opción que mejor represente tu situación.
               </p>
            </div>

            <div className="grid gap-4 mt-8">
              <TrafficLightButton 
                color="verde" 
                label="Sí / Suficiente" 
                subLabel="Estamos bien en este aspecto"
                onClick={() => handleAnswer("verde")}
                selected={answers[currentIndicator.id] === "verde"}
              />
              <TrafficLightButton 
                color="amarillo" 
                label="Parcial / Inestable" 
                subLabel="Podría mejorar / A veces sí, a veces no"
                onClick={() => handleAnswer("amarillo")}
                selected={answers[currentIndicator.id] === "amarillo"}
              />
              <TrafficLightButton 
                color="rojo" 
                label="No / Insuficiente" 
                subLabel="Tenemos problemas graves aquí"
                onClick={() => handleAnswer("rojo")}
                selected={answers[currentIndicator.id] === "rojo"}
              />
            </div>

            <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/5">
              <Button
                variant="ghost"
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="text-muted-foreground hover:text-white"
              >
                Anterior
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentIdx(Math.min(indicators.length - 1, currentIdx + 1))}
                disabled={currentIdx === indicators.length - 1 || !answers[currentIndicator.id]}
                className="text-muted-foreground hover:text-white"
              >
                Siguiente
              </Button>
            </div>
          </motion.div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full space-y-8 mt-8"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 mb-4">
              <motion.span 
                initial={{ rotate: -45, scale: 0 }} 
                animate={{ rotate: 0, scale: 1 }} 
                className="text-3xl"
              >
                🎉
              </motion.span>
            </div>
            <h2 className="text-3xl font-display font-bold">¡Diagnóstico completado!</h2>
            <p className="text-muted-foreground">
              Antes de terminar, ¿quieres dejar algún comentario adicional sobre tu barrio?
            </p>
          </div>

          <GlassCard className="p-6">
            <Textarea 
              placeholder="Escribe aquí tus observaciones, reclamos o sugerencias..."
              className="min-h-[150px] bg-black/20 border-white/10 text-lg resize-none focus:ring-primary/50"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </GlassCard>

          <Button 
            onClick={handleSubmit} 
            disabled={isPending}
            className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:to-primary shadow-lg shadow-primary/25"
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Guardando...</>
            ) : (
              <>Ver Resultados <ArrowRight className="ml-2 h-5 w-5" /></>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
