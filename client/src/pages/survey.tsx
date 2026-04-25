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
import { queryClient } from "@/lib/queryClient";
import { Loader2, ArrowRight, Target, ChevronRight } from "lucide-react";
import { generatePlanDesdeScores, getPrioridadesBloqueantes, calcularScores } from "@/lib/korai-logic";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4";
const CAMPAIGN_ID = "53813f5a-3613-4faf-8ca1-b369e4e908cb";

async function submitToSupabase(payload: {
  dni: string;
  answers: Record<string, string>;
  territorio: { ciudad: string; barrio: string };
  texto_abierto: string;
  profundizacion?: Record<string, any>;
}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/dsubmit_response`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      campaign_id: CAMPAIGN_ID,
      dni: payload.dni,
      answers: payload.answers,
      territorio: payload.territorio,
      perfil_contextual: JSON.stringify({
        comentario: payload.texto_abierto || "",
        profundizacion: payload.profundizacion || {},
      }),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Error ${res.status}`);
  }
  return res.json();
}

// ─── Preguntas de profundización por dimensión ────────────────────────────────
type OpcionPregunta = { value: string; label: string };
type Pregunta = {
  id: string;
  texto: string;
  tipo: "single" | "multi" | "abierta";
  opciones?: OpcionPregunta[];
  opcional?: boolean;
};

const PROFUNDIZACION: Record<string, Pregunta[]> = {
  empleo: [
    {
      id: "emp_experiencia",
      texto: "¿Trabajaste alguna vez?",
      tipo: "single",
      opciones: [
        { value: "dependencia", label: "Sí, en relación de dependencia" },
        { value: "informal", label: "Sí, de manera informal" },
        { value: "nunca", label: "No, nunca trabajé" },
      ],
    },
    {
      id: "emp_tareas",
      texto: "¿En qué tipo de tareas tenés experiencia?",
      tipo: "multi",
      opciones: [
        { value: "limpieza", label: "Limpieza" },
        { value: "cuidado", label: "Cuidado de personas" },
        { value: "cocina", label: "Cocina" },
        { value: "ventas", label: "Ventas" },
        { value: "oficios", label: "Oficios / Construcción" },
        { value: "otro", label: "Otro" },
      ],
    },
    {
      id: "emp_disponibilidad",
      texto: "¿Podés empezar a trabajar ahora?",
      tipo: "single",
      opciones: [
        { value: "si_completo", label: "Sí, jornada completa" },
        { value: "si_medio", label: "Sí, media jornada" },
        { value: "si_horas", label: "Sí, por horas" },
        { value: "no", label: "No por el momento" },
      ],
    },
  ],
  educacion: [
    {
      id: "edu_secundario",
      texto: "¿Completaste el secundario?",
      tipo: "single",
      opciones: [
        { value: "si", label: "Sí, lo completé" },
        { value: "no", label: "No, no lo terminé" },
        { value: "curso", label: "Estoy cursando" },
      ],
    },
    {
      id: "edu_retomar",
      texto: "¿Te gustaría terminarlo o capacitarte en algún oficio?",
      tipo: "single",
      opciones: [
        { value: "si_secundario", label: "Sí, quiero terminar el secundario" },
        { value: "si_oficio", label: "Sí, quiero capacitarme en un oficio" },
        { value: "ambos", label: "Ambas cosas" },
        { value: "no", label: "No por ahora" },
      ],
    },
    {
      id: "edu_disponibilidad",
      texto: "¿Tenés disponibilidad para estudiar?",
      tipo: "single",
      opciones: [
        { value: "si", label: "Sí, tengo tiempo disponible" },
        { value: "limitada", label: "Poco tiempo, necesito horarios flexibles" },
        { value: "no", label: "No tengo disponibilidad ahora" },
      ],
    },
  ],
  salud: [
    {
      id: "sal_problema",
      texto: "¿Tenés algún problema de salud sin tratar?",
      tipo: "single",
      opciones: [
        { value: "si", label: "Sí" },
        { value: "no", label: "No" },
      ],
    },
    {
      id: "sal_tipo",
      texto: "¿Qué tipo de problema de salud tenés?",
      tipo: "multi",
      opciones: [
        { value: "cronica", label: "Enfermedad crónica" },
        { value: "mental", label: "Salud mental" },
        { value: "materna", label: "Embarazo / Salud materna" },
        { value: "consumo", label: "Consumo problemático" },
        { value: "discapacidad", label: "Discapacidad" },
        { value: "otro", label: "Otro" },
      ],
    },
    {
      id: "sal_cobertura",
      texto: "¿Tenés cobertura médica?",
      tipo: "single",
      opciones: [
        { value: "si", label: "Sí tengo (obra social, PAMI u otra)" },
        { value: "no", label: "No tengo cobertura" },
      ],
    },
    {
      id: "sal_acceso",
      texto: "¿Podés acercarte a un centro de salud?",
      tipo: "single",
      opciones: [
        { value: "si", label: "Sí, puedo ir" },
        { value: "no", label: "No, tengo dificultades para ir" },
      ],
    },
  ],
  vivienda: [
    {
      id: "viv_situacion",
      texto: "¿Dónde estás viviendo actualmente?",
      tipo: "single",
      opciones: [
        { value: "propia", label: "Vivienda propia" },
        { value: "alquiler", label: "Alquiler" },
        { value: "prestado", label: "Prestado / cedido" },
        { value: "inestable", label: "Situación inestable" },
      ],
    },
    {
      id: "viv_riesgo",
      texto: "¿Tenés riesgo de perder ese lugar?",
      tipo: "single",
      opciones: [
        { value: "si", label: "Sí, estoy en riesgo" },
        { value: "no", label: "No, estoy estable" },
      ],
    },
    {
      id: "viv_personas",
      texto: "¿Cuántas personas viven con vos?",
      tipo: "single",
      opciones: [
        { value: "1-2", label: "1 a 2 personas" },
        { value: "3-4", label: "3 a 4 personas" },
        { value: "5+", label: "5 o más personas" },
      ],
    },
    {
      id: "viv_servicios",
      texto: "¿Tenés acceso a servicios básicos?",
      tipo: "single",
      opciones: [
        { value: "todos", label: "Sí, todos (agua, luz, gas)" },
        { value: "algunos", label: "Algunos servicios" },
        { value: "ninguno", label: "Ninguno" },
      ],
    },
  ],
  ingresos: [
    {
      id: "ing_tiene",
      texto: "¿Tenés ingresos actualmente?",
      tipo: "single",
      opciones: [
        { value: "si", label: "Sí" },
        { value: "no", label: "No" },
      ],
    },
    {
      id: "ing_estables",
      texto: "¿Esos ingresos son estables?",
      tipo: "single",
      opciones: [
        { value: "si", label: "Sí, son regulares" },
        { value: "no", label: "No, son irregulares" },
      ],
    },
    {
      id: "ing_programa",
      texto: "¿Recibís algún programa o ayuda del Estado?",
      tipo: "single",
      opciones: [
        { value: "si", label: "Sí" },
        { value: "no", label: "No" },
      ],
    },
    {
      id: "ing_alcanza",
      texto: "¿Tus ingresos alcanzan para cubrir los gastos básicos?",
      tipo: "single",
      opciones: [
        { value: "si", label: "Sí, me alcanzan" },
        { value: "justo", label: "Justo, con dificultad" },
        { value: "no", label: "No, no me alcanzan" },
      ],
    },
  ],
  red: [
    {
      id: "red_urgencia",
      texto: "¿Tenés alguien que pueda ayudarte en una urgencia?",
      tipo: "single",
      opciones: [
        { value: "si", label: "Sí, tengo red de apoyo" },
        { value: "poco", label: "Poco, muy limitado" },
        { value: "no", label: "No, estoy solo/a" },
      ],
    },
    {
      id: "red_trabajo",
      texto: "¿Tenés alguien que te pueda recomendar para un trabajo?",
      tipo: "single",
      opciones: [
        { value: "si", label: "Sí" },
        { value: "no", label: "No" },
      ],
    },
    {
      id: "red_comunidad",
      texto: "¿Participás en algún espacio comunitario?",
      tipo: "single",
      opciones: [
        { value: "si", label: "Sí, participo" },
        { value: "no", label: "No, no participo" },
        { value: "quiero", label: "No, pero me gustaría" },
      ],
    },
  ],
};

// ─── Pantalla de profundización ───────────────────────────────────────────────
function ProfundizacionScreen({
  dimensiones,
  onComplete,
}: {
  dimensiones: string[];
  onComplete: (respuestas: Record<string, any>) => void;
}) {
  const [respuestas, setRespuestas] = useState<Record<string, any>>({});
  const [dimIdx, setDimIdx] = useState(0);
  const [pregIdx, setPregIdx] = useState(0);

  const dimActual = dimensiones[dimIdx];
  const preguntas = PROFUNDIZACION[dimActual] || [];
  const preguntaActual = preguntas[pregIdx];
  const dimInfo = INSTRUMENT.dimensions.find(d => d.id === dimActual);
  const totalPregs = dimensiones.reduce((acc, d) => acc + (PROFUNDIZACION[d]?.length || 0), 0);
  const pregActualNum = dimensiones.slice(0, dimIdx).reduce((acc, d) => acc + (PROFUNDIZACION[d]?.length || 0), 0) + pregIdx + 1;

  const handleRespuesta = (pregId: string, value: string, tipo: string) => {
    if (tipo === "multi") {
      const actual = respuestas[pregId] || [];
      const nuevo = actual.includes(value)
        ? actual.filter((v: string) => v !== value)
        : [...actual, value];
      setRespuestas(prev => ({ ...prev, [pregId]: nuevo }));
    } else {
      setRespuestas(prev => ({ ...prev, [pregId]: value }));
      // Auto-avanzar en single
      setTimeout(() => avanzar(pregId, value), 300);
    }
  };

  const avanzar = (pregId?: string, value?: string) => {
    const nextPregIdx = pregIdx + 1;
    if (nextPregIdx < preguntas.length) {
      setPregIdx(nextPregIdx);
    } else {
      const nextDimIdx = dimIdx + 1;
      if (nextDimIdx < dimensiones.length) {
        setDimIdx(nextDimIdx);
        setPregIdx(0);
      } else {
        onComplete(respuestas);
      }
    }
  };

  if (!preguntaActual) { onComplete(respuestas); return null; }

  const valorActual = respuestas[preguntaActual.id];
  const esMultiConSeleccion = preguntaActual.tipo === "multi" && valorActual?.length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto">
      {/* Progress */}
      <div className="w-full mb-8">
        <div className="flex items-center justify-between text-xs text-white/40 mb-2">
          <span>Profundización — {dimInfo?.emoji} {dimInfo?.name}</span>
          <span>{pregActualNum} de {totalPregs}</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(pregActualNum / totalPregs) * 100}%` }}
          />
        </div>
      </div>

      {/* Intro card */}
      {pregIdx === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20"
        >
          <div className="text-sm font-black text-primary">
            {dimInfo?.emoji} Profundizando en {dimInfo?.name}
          </div>
          <p className="text-xs text-white/50 mt-1">
            Necesitamos un poco más de información para conectarte con los recursos correctos.
          </p>
        </motion.div>
      )}

      {/* Pregunta */}
      <motion.div
        key={preguntaActual.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full space-y-5"
      >
        <h2 className="text-xl font-black text-white leading-snug">
          {preguntaActual.texto}
        </h2>

        {preguntaActual.tipo !== "abierta" && (
          <div className="space-y-2.5">
            {preguntaActual.opciones?.map(op => {
              const seleccionado = preguntaActual.tipo === "multi"
                ? (valorActual || []).includes(op.value)
                : valorActual === op.value;
              return (
                <motion.button
                  key={op.value}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleRespuesta(preguntaActual.id, op.value, preguntaActual.tipo)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    seleccionado
                      ? "bg-primary/20 border-primary text-white font-bold"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      seleccionado ? "border-primary bg-primary" : "border-white/30"
                    }`}>
                      {seleccionado && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-sm">{op.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Botón continuar para multi */}
        {preguntaActual.tipo === "multi" && esMultiConSeleccion && (
          <Button
            onClick={() => avanzar()}
            className="w-full h-12 font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center gap-2"
          >
            Continuar <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        {/* Opcional: saltear */}
        {preguntaActual.opcional && (
          <button
            onClick={() => avanzar()}
            className="w-full text-xs text-white/30 hover:text-white/50 transition-colors py-2"
          >
            Saltar esta pregunta
          </button>
        )}
      </motion.div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Survey() {
  const [_, setLocation] = useLocation();
  const savedAnswers = (() => { try { const a = localStorage.getItem("korai_user_answers"); return a ? JSON.parse(a) : {}; } catch { return {}; } })();
  const hasSavedAnswers = Object.keys(savedAnswers).length > 0;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers);
  const [comment, setComment] = useState("");
  const [showCommentScreen, setShowCommentScreen] = useState(false);
  const [showProfundizacion, setShowProfundizacion] = useState(false);
  const [profundizacionDims, setProfundizacionDims] = useState<string[]>([]);
  const [profundizacionRespuestas, setProfundizacionRespuestas] = useState<Record<string, any>>({});
  const [showResultsScreen, setShowResultsScreen] = useState(hasSavedAnswers);
  const [showLevelUp, setShowLevelUp] = useState<{show: boolean, dimension: string}>({show: false, dimension: ""});
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const context = JSON.parse(localStorage.getItem("korai_context") || "{}");

  useEffect(() => {
    if (!context.city && !hasSavedAnswers) setLocation("/");
  }, [context, setLocation]);

  const indicators = INSTRUMENT.indicators;
  const currentIndicator = indicators[currentIdx];
  const dimension = INSTRUMENT.dimensions.find(d => d.id === currentIndicator?.dimension);

  const results = useMemo(() => {
    if (!showResultsScreen) return null;
    const perDim: Record<string, any> = {};
    INSTRUMENT.dimensions.forEach(d => {
      const dimInds = indicators.filter(i => i.dimension === d.id);
      const dimAnswers = dimInds.map(i => ({ id: i.id, label: i.label, value: answers[i.id] }));
      const r = dimAnswers.filter(ans => ans.value === 'rojo').length;
      const a = dimAnswers.filter(ans => ans.value === 'amarillo').length;
      const v = dimAnswers.filter(ans => ans.value === 'verde').length;
      const n = dimAnswers.length;
      const color = (r / n >= 0.5) ? 'rojo' : (a / n >= 0.5 || (r+a)/n >= 0.5) ? 'amarillo' : 'verde';
      const severity = Math.round(((r * 1 + a * 0.5) / n) * 100);
      const worstInd = dimAnswers.find(a => a.value === 'rojo') || dimAnswers.find(a => a.value === 'amarillo');
      let explanation = "";
      if (color === 'rojo') explanation = `Estado Crítico: el ${Math.round((r/n)*100)}% de los indicadores reporta riesgo alto.`;
      else if (color === 'amarillo') explanation = `Riesgo Moderado: se detectan alertas en un ${Math.round(((r+a)/n)*100)}% del área.`;
      else explanation = `Estado Óptimo: el ${Math.round((v/n)*100)}% de las respuestas son positivas.`;
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
    } catch (e) { console.warn("Audio Context blocked", e); }
  };

  const handleAnswer = (value: "rojo" | "amarillo" | "verde") => {
    playBip(value);
    const newAnswers = { ...answers, [currentIndicator.id]: value };
    setAnswers(newAnswers);
    const nextIdx = currentIdx + 1;
    if (nextIdx < indicators.length) {
      const nextInd = indicators[nextIdx];
      if (nextInd.dimension !== currentIndicator.dimension) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#7c5cff', '#22c55e', '#f59e0b'] });
        setShowLevelUp({ show: true, dimension: dimension?.name || "" });
        setTimeout(() => { setShowLevelUp({ show: false, dimension: "" }); setCurrentIdx(nextIdx); }, 2000);
      } else {
        setTimeout(() => setCurrentIdx(nextIdx), 250);
      }
    } else {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      setShowCommentScreen(true);
    }
  };

  // Después del comentario: detectar áreas rojas y activar profundización
  const handleAfterComment = () => {
    const scores = calcularScores(answers);
    const prioritarias = getPrioridadesBloqueantes(scores);

    if (prioritarias.length > 0) {
      // Hay áreas bloqueantes: activar profundización
      setProfundizacionDims(prioritarias.map(p => p.dimensionId));
      setShowCommentScreen(false);
      setShowProfundizacion(true);
    } else {
      // Sin áreas críticas: ir directo al submit
      handleSubmit({});
    }
  };

  const handleProfundizacionComplete = (respuestas: Record<string, any>) => {
    setProfundizacionRespuestas(respuestas);
    setShowProfundizacion(false);
    handleSubmit(respuestas);
  };

  const handleSubmit = async (profundizacion: Record<string, any>) => {
    setIsPending(true);
    setSubmitError(null);
    try {
      const dni = context.dni || `anonimo-${Date.now()}`;
      await submitToSupabase({
        dni,
        answers,
        territorio: { ciudad: context.city || "Desconocida", barrio: context.neighborhood || "" },
        texto_abierto: comment,
        profundizacion,
      });
      localStorage.setItem("korai_user_answers", JSON.stringify(answers));
      localStorage.setItem("korai_profundizacion", JSON.stringify(profundizacion));
      localStorage.removeItem("korai_user_plan_v1");
      const plan = generatePlanDesdeScores(answers);
      localStorage.setItem("korai_user_plan_v1", JSON.stringify(plan));
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setShowResultsScreen(true);
    } catch (err: any) {
      console.error("Error al guardar en Supabase:", err);
      setSubmitError(err?.message || "Error al guardar. Intentá de nuevo.");
      setShowProfundizacion(false);
      setShowCommentScreen(true);
    } finally {
      setIsPending(false);
    }
  };

  // ─── Pantalla de profundización ─────────────────────────────────────────────
  if (showProfundizacion) {
    return (
      <ProfundizacionScreen
        dimensiones={profundizacionDims}
        onComplete={handleProfundizacionComplete}
      />
    );
  }

  // ─── Pantalla de resultados ──────────────────────────────────────────────────
  if (showResultsScreen && results) {
    return (
      <div className="min-h-screen pt-20 pb-10 px-4 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <header className="space-y-2">
              <h1 className="text-4xl font-black">Tu Diagnóstico</h1>
              <p className="text-muted-foreground text-lg">
                Este es el resultado de tu autodiagnóstico. Tu mirada es fundamental para entender tu realidad.
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
                      }`}>{s.color}</div>
                    </div>
                    <div className="flex h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div style={{ width: `${(s.v / s.n) * 100}%` }} className="bg-[#22c55e]" />
                      <div style={{ width: `${(s.a / s.n) * 100}%` }} className="bg-[#f59e0b]" />
                      <div style={{ width: `${(s.r / s.n) * 100}%` }} className="bg-[#ef4444]" />
                    </div>
                    <p className="text-[11px] leading-relaxed text-white/70 italic bg-white/5 p-3 rounded-xl border border-white/5">
                      {s.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-full md:w-80 space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-5 space-y-3">
              <div className="text-sm font-black text-white leading-snug">
                Identificamos qué está bloqueando tu bienestar.
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Tu plan de acción personalizado tiene los pasos concretos y los recursos disponibles para ayudarte a avanzar hoy.
              </p>
              <Button
                onClick={() => setLocation("/prioridades")}
                className="w-full h-12 font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                data-testid="button-go-prioridades"
              >
                <Target className="w-5 h-5" /> Ver mi plan de acción
              </Button>
            </div>
            <Button
              onClick={() => { localStorage.removeItem("korai_user_answers"); localStorage.removeItem("korai_user_plan_v1"); localStorage.removeItem("korai_user_sello_v1"); localStorage.removeItem("korai_context"); localStorage.removeItem("korai_profundizacion"); setLocation("/"); }}
              variant="outline"
              className="w-full h-10 border-red-500/20 bg-red-500/5 text-red-400 font-bold rounded-xl hover:bg-red-500/10 text-sm"
            >
              Salir
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Pantalla de comentario ──────────────────────────────────────────────────
  if (showCommentScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-lg mx-auto space-y-6">
        <div className="text-5xl">🎉</div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black">¡Diagnóstico completado!</h2>
          <p className="text-muted-foreground text-sm">Antes de terminar, ¿querés dejar algún comentario adicional sobre tu barrio?</p>
        </div>

        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Escribe aquí tus observaciones, reclamos o sugerencias..."
          className="w-full h-32 resize-none rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-primary/50"
        />

        {submitError && (
          <div className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {submitError}
          </div>
        )}

        <Button
          onClick={handleAfterComment}
          disabled={isPending}
          className="w-full h-12 font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
          ) : (
            <><ArrowRight className="w-4 h-4" /> Ver mi diagnóstico</>
          )}
        </Button>

        <button
          onClick={() => { setComment(""); handleAfterComment(); }}
          className="text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          Saltar comentario
        </button>
      </div>
    );
  }

  // ─── Pantalla del survey ──────────────────────────────────────────────────────
  const progress = currentIdx / indicators.length;
  const prevDimension = currentIdx > 0 ? INSTRUMENT.dimensions.find(d => d.id === indicators[currentIdx - 1]?.dimension) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-lg mx-auto">
      <ProgressHeader progress={progress} currentDimension={dimension?.name || ""} emoji={dimension?.emoji || ""} />

      <AnimatePresence mode="wait">
        {showLevelUp.show ? (
          <motion.div key="levelup" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="text-center space-y-3 p-8">
            <div className="text-6xl">{prevDimension?.emoji}</div>
            <div className="text-2xl font-black text-primary">¡{prevDimension?.name} completado!</div>
            <div className="text-white/50 text-sm">Pasando a la siguiente dimensión...</div>
          </motion.div>
        ) : (
          <motion.div key={currentIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="w-full space-y-8 mt-8">
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{dimension?.emoji}</span>
                <span className="font-bold uppercase tracking-wider">{dimension?.name}</span>
                <span className="ml-auto">{currentIdx + 1} / {indicators.length}</span>
              </div>
              <h2 className="text-xl font-black text-white leading-snug">{currentIndicator?.label}</h2>
            </GlassCard>

            <div className="grid grid-cols-3 gap-3">
              {(["verde", "amarillo", "rojo"] as const).map(color => (
                <TrafficLightButton
                  key={color}
                  color={color}
                  selected={answers[currentIndicator?.id] === color}
                  onClick={() => handleAnswer(color)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
