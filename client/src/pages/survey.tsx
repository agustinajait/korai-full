import { useState, useEffect } from "react";
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
import { Loader2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Survey() {
  const [_, setLocation] = useLocation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");
  const [showCommentScreen, setShowCommentScreen] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState<{show: boolean, dimension: string}>({show: false, dimension: ""});

  const { mutate: submitReport, isPending } = useCreateReport();

  const context = JSON.parse(localStorage.getItem("korai_context") || "{}");
  
  // Redirect if no context
  useEffect(() => {
    if (!context.city) setLocation("/");
  }, [context, setLocation]);

  const indicators = INSTRUMENT.indicators;
  const currentIndicator = indicators[currentIdx];
  const dimension = INSTRUMENT.dimensions.find(d => d.id === currentIndicator?.dimension);
  
  // Check for level up (end of dimension)
  const handleAnswer = (value: "rojo" | "amarillo" | "verde") => {
    const newAnswers = { ...answers, [currentIndicator.id]: value };
    setAnswers(newAnswers);

    // Check if next indicator is new dimension
    const nextIdx = currentIdx + 1;
    if (nextIdx < indicators.length) {
      const nextInd = indicators[nextIdx];
      if (nextInd.dimension !== currentIndicator.dimension) {
        // Dimension change -> Celebration!
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
        setTimeout(() => setCurrentIdx(nextIdx), 250); // Small delay for visual feedback
      }
    } else {
      // End of survey
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
      demographics: {} // Simplified for this demo
    }, {
      onSuccess: () => {
        setLocation("/dashboard");
      }
    });
  };

  if (!currentIndicator && !showCommentScreen) return null;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 flex flex-col items-center max-w-xl mx-auto">
      {/* Level Up Toast */}
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
