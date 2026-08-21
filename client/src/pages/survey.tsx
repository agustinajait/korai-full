import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { TrafficLightButton } from "@/components/ui/traffic-light-button";
import { ProgressHeader } from "@/components/layout/progress-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { INSTRUMENT, getActiveIndicatorsSafe } from "@/lib/instrument";
import { queryClient } from "@/lib/queryClient";
import { Loader2, ArrowRight, Target, ChevronRight } from "lucide-react";
import { generatePlanDesdeScores, getPrioridadesBloqueantes, calcularScores } from "@/lib/korai-logic";

// ─── Configuración Supabase ───────────────────────────────────────────────────
const SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4";
const CAMPAIGN_ID = "53813f5a-3613-4faf-8ca1-b369e4e908cb";

async function submitToSupabase(payload: {
  dni: string;
  answers: Record<string, string>;
  territorio: { ciudad: string; barrio: string };
  texto_abierto: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  profundizacion?: Record<string, any>;
  demographics?: Record<string, any>;
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
      telefono: payload.telefono || "",
      perfil_contextual: JSON.stringify({
        nombre: payload.nombre || "",
        apellido: payload.apellido || "",
        telefono: payload.telefono || "",
        comentario: payload.texto_abierto || "",
        profundizacion: payload.profundizacion || {},
        demographics: payload.demographics || {},
      }),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Error ${res.status}`);
  }

  return res.json();
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Definición de preguntas de profundización ────────────────────────────────
type Pregunta = {
  id: string;
  texto: string;
  tipo: "single" | "multi";
  opciones: { value: string; label: string }[];
};

const PROFUNDIZACION: Record<string, Pregunta[]> = {
  empleo: [
    { id: "emp_experiencia", texto: "¿Trabajaste alguna vez?", tipo: "single", opciones: [
      { value: "dependencia", label: "Sí, en trabajo en blanco (con recibo de sueldo)" },
      { value: "informal", label: "Sí, de manera informal" },
      { value: "nunca", label: "No, nunca trabajé" },
    ]},
    { id: "emp_tareas", texto: "¿En qué tipo de tareas tenés experiencia?", tipo: "multi", opciones: [
      { value: "limpieza", label: "Limpieza" },
      { value: "cuidado", label: "Cuidado de personas" },
      { value: "cocina", label: "Cocina" },
      { value: "ventas", label: "Ventas" },
      { value: "oficios", label: "Oficios / Construcción" },
      { value: "otro", label: "Otro" },
    ]},
    { id: "emp_disponibilidad", texto: "¿Podés empezar a trabajar ahora?", tipo: "single", opciones: [
      { value: "si_completo", label: "Sí, jornada completa" },
      { value: "si_medio", label: "Sí, media jornada" },
      { value: "si_horas", label: "Sí, por horas" },
      { value: "no", label: "No por el momento" },
    ]},
    { id: "emp_obstaculo", texto: "¿Qué te impide empezar a trabajar ahora?", tipo: "single", opciones: [
      { value: "personas_cargo", label: "Tengo personas a cargo" },
      { value: "salud", label: "Tengo un problema de salud" },
      { value: "documentacion", label: "Me falta documentacion" },
      { value: "hijos", label: "No tengo con quien dejar a mis hijos" },
      { value: "estudiando", label: "Estoy estudiando" },
      { value: "transporte", label: "No tengo movilidad o transporte" },
      { value: "otro", label: "Otro motivo" },
    ]},
  ],
  educacion: [
    { id: "edu_secundario", texto: "¿Completaste el secundario?", tipo: "single", opciones: [
      { value: "si", label: "Sí, lo completé" },
      { value: "no", label: "No, no lo terminé" },
      { value: "curso", label: "Estoy cursando" },
    ]},
    { id: "edu_retomar", texto: "¿Te gustaría terminarlo o capacitarte en algún oficio?", tipo: "single", opciones: [
      { value: "si_secundario", label: "Sí, quiero terminar el secundario" },
      { value: "si_oficio", label: "Sí, quiero capacitarme en un oficio" },
      { value: "ambos", label: "Ambas cosas" },
      { value: "no", label: "No por ahora" },
    ]},
    { id: "edu_disponibilidad", texto: "¿Tenés disponibilidad para estudiar?", tipo: "single", opciones: [
      { value: "si", label: "Sí, tengo tiempo disponible" },
      { value: "limitada", label: "Poco tiempo, necesito horarios flexibles" },
      { value: "no", label: "No tengo disponibilidad ahora" },
    ]},
  ],
  salud: [
    { id: "sal_problema", texto: "¿Tenés algún problema de salud sin tratar?", tipo: "single", opciones: [
      { value: "si", label: "Sí" },
      { value: "no", label: "No" },
    ]},
    { id: "sal_tipo", texto: "¿Qué tipo de problema de salud tenés?", tipo: "multi", opciones: [
      { value: "cronica", label: "Enfermedad crónica" },
      { value: "mental", label: "Salud mental" },
      { value: "materna", label: "Embarazo / Salud materna" },
      { value: "consumo", label: "Consumo problemático" },
      { value: "discapacidad", label: "Discapacidad" },
      { value: "otro", label: "Otro" },
    ]},
    { id: "sal_cobertura", texto: "¿Tenés cobertura médica?", tipo: "single", opciones: [
      { value: "si", label: "Sí (obra social, PAMI u otra)" },
      { value: "no", label: "No tengo cobertura" },
    ]},
    { id: "sal_acceso", texto: "¿Podés acercarte a un centro de salud?", tipo: "single", opciones: [
      { value: "si", label: "Sí, puedo ir" },
      { value: "no", label: "No, tengo dificultades" },
    ]},
  ],
  vivienda_alquiler: [
    { id: "viv_riesgo", texto: "¿Tenés riesgo de no poder seguir pagando el alquiler?", tipo: "single", opciones: [
      { value: "si", label: "Sí, estoy en riesgo" },
      { value: "no", label: "No, estoy estable" },
    ]},
    { id: "viv_acuerdo", texto: "¿Tenés un contrato o acuerdo claro para vivir ahí?", tipo: "single", opciones: [
      { value: "si", label: "Sí, tengo contrato o acuerdo" },
      { value: "no", label: "No, es informal" },
    ]},
    { id: "viv_arreglos", texto: "¿La vivienda necesita arreglos importantes (techo, humedad, paredes)?", tipo: "single", opciones: [
      { value: "si", label: "Sí, necesita arreglos" },
      { value: "no", label: "No, está bien" },
    ]},
  ],
  vivienda_propia: [
    { id: "viv_arreglos", texto: "¿La vivienda necesita arreglos importantes (techo, humedad, paredes)?", tipo: "single", opciones: [
      { value: "si", label: "Sí, necesita arreglos" },
      { value: "no", label: "No, está bien" },
    ]},
    { id: "viv_papeles", texto: "¿Tenés algún problema con los papeles o titularidad de la vivienda?", tipo: "single", opciones: [
      { value: "si", label: "Sí, tengo problemas" },
      { value: "no", label: "No, está todo en orden" },
    ]},
  ],
  vivienda_prestada: [
    { id: "viv_riesgo", texto: "¿Tenés riesgo de tener que irte de ese lugar?", tipo: "single", opciones: [
      { value: "si", label: "Sí, estoy en riesgo" },
      { value: "no", label: "No, estoy estable" },
    ]},
    { id: "viv_alternativa", texto: "¿Tenés otro lugar donde ir si no podés seguir ahí?", tipo: "single", opciones: [
      { value: "si", label: "Sí, tengo alternativa" },
      { value: "no", label: "No tengo a donde ir" },
    ]},
  ],
  vivienda_inestable: [
    { id: "viv_seguro", texto: "¿Tenés un lugar seguro para dormir esta noche?", tipo: "single", opciones: [
      { value: "si", label: "Sí, tengo lugar" },
      { value: "no", label: "No, necesito ayuda urgente" },
    ]},
    { id: "viv_dias", texto: "¿Podés quedarte ahí los próximos días?", tipo: "single", opciones: [
      { value: "si", label: "Sí, por ahora sí" },
      { value: "no", label: "No, necesito ayuda" },
    ]},
    { id: "viv_urgente", texto: "¿Hay niños, adultos mayores o personas con discapacidad afectadas?", tipo: "single", opciones: [
      { value: "si", label: "Sí, hay personas vulnerables" },
      { value: "no", label: "No" },
    ]},
  ],
  vivienda: [
    { id: "viv_riesgo", texto: "¿Tenés riesgo de perder tu vivienda?", tipo: "single", opciones: [
      { value: "si", label: "Sí, estoy en riesgo" },
      { value: "no", label: "No, estoy estable" },
    ]},
    { id: "viv_arreglos", texto: "¿La vivienda necesita arreglos importantes (techo, humedad, paredes)?", tipo: "single", opciones: [
      { value: "si", label: "Sí, necesita arreglos" },
      { value: "no", label: "No, está bien" },
    ]},
  ],
  ingresos: [
    { id: "ing_tiene", texto: "¿Tenés ingresos actualmente?", tipo: "single", opciones: [
      { value: "si", label: "Sí" },
      { value: "no", label: "No" },
    ]},
    { id: "ing_programa", texto: "¿Recibís algún programa o ayuda del Estado?", tipo: "single", opciones: [
      { value: "si", label: "Sí" },
      { value: "no", label: "No" },
    ]},
    { id: "ing_alcanza", texto: "¿Tus ingresos alcanzan para cubrir los gastos básicos?", tipo: "single", opciones: [
      { value: "si", label: "Sí, me alcanzan" },
      { value: "justo", label: "Justo, con dificultad" },
      { value: "no", label: "No, no me alcanzan" },
    ]},
  ],
  red: [
    { id: "red_urgencia", texto: "¿Tenés alguien que pueda ayudarte en una urgencia?", tipo: "single", opciones: [
      { value: "si", label: "Sí, tengo red de apoyo" },
      { value: "poco", label: "Poco, muy limitado" },
      { value: "no", label: "No, estoy solo/a" },
    ]},
    { id: "red_comunidad", texto: "¿Participás en algún espacio comunitario?", tipo: "single", opciones: [
      { value: "si", label: "Sí, participo" },
      { value: "quiero", label: "No, pero me gustaría" },
      { value: "no", label: "No" },
    ]},
  ],
};

function ProfundizacionScreen({ dimensiones, onComplete, onBack, tipoVivienda }: { dimensiones: string[]; onComplete: (r: Record<string, any>) => void; onBack?: () => void; tipoVivienda?: string }) {
  const [respuestas, setRespuestas] = useState<Record<string, any>>({});
  const [dimIdx, setDimIdx] = useState(0);
  const [pregIdx, setPregIdx] = useState(0);
  
  const volver = () => {
    if (pregIdx > 0) {
      setPregIdx(p => p - 1);
    } else if (dimIdx > 0) {
      setDimIdx(d => d - 1);
      const prevDim = dimensiones[dimIdx - 1];
      setPregIdx((PROFUNDIZACION[prevDim]?.length || 1) - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const dimActual = dimensiones[dimIdx];
  const getPreguntasVivienda = () => {
    if (dimActual !== "vivienda") return PROFUNDIZACION[dimActual] || [];
    if (tipoVivienda === "alquiler") return PROFUNDIZACION["vivienda_alquiler"] || PROFUNDIZACION["vivienda"] || [];
    if (tipoVivienda === "propia") return PROFUNDIZACION["vivienda_propia"] || PROFUNDIZACION["vivienda"] || [];
    if (tipoVivienda === "prestada") return PROFUNDIZACION["vivienda_prestada"] || PROFUNDIZACION["vivienda"] || [];
    if (tipoVivienda === "inestable") return PROFUNDIZACION["vivienda_inestable"] || PROFUNDIZACION["vivienda"] || [];
    return PROFUNDIZACION["vivienda"] || [];
  };
  const preguntas = getPreguntasVivienda();
  const preguntaActual = preguntas[pregIdx];
  const dimInfo = INSTRUMENT.dimensions.find(d => d.id === dimActual);

  const totalPregs = dimensiones.reduce((acc, d) => acc + (PROFUNDIZACION[d]?.length || 0), 0);
  const pregActualNum = dimensiones.slice(0, dimIdx).reduce((acc, d) => acc + (PROFUNDIZACION[d]?.length || 0), 0) + pregIdx + 1;

  const avanzar = () => {
    let nextPregIdx = pregIdx + 1;

    // Saltar emp_obstaculo si la disponibilidad no es "no"
    const pregSig = preguntas[nextPregIdx];
    if (pregSig?.id === "emp_obstaculo" && respuestas["emp_disponibilidad"] !== "no") {
      nextPregIdx++;
    }

    // Saltar sal_tipo si sal_problema es "no"
    const pregSig2 = preguntas[nextPregIdx];
    if (pregSig2?.id === "sal_tipo" && respuestas["sal_problema"] !== "si") {
      nextPregIdx++;
    }

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

  const handleRespuesta = (pregId: string, value: string, tipo: string) => {
    if (tipo === "multi") {
      const actual = (respuestas[pregId] || []) as string[];
      setRespuestas(prev => ({ ...prev, [pregId]: actual.includes(value) ? actual.filter(v => v !== value) : [...actual, value] }));
    } else {
      setRespuestas(prev => ({ ...prev, [pregId]: value }));
      setTimeout(avanzar, 300);
    }
  };

  if (!preguntaActual) { onComplete(respuestas); return null; }

  const valorActual = respuestas[preguntaActual.id];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 flex flex-col items-center max-w-xl mx-auto bg-[#F4F0FF]">
      
      {/* Progress */}
      <div className="w-full mb-8">
        <div className="flex justify-between text-xs text-[#6B5FA0] mb-2">
          <span>{dimInfo?.emoji} Profundizando en {dimInfo?.name}</span>
          <span>{pregActualNum} / {totalPregs}</span>
        </div>
        <div className="h-1.5 bg-[#DDD6FE] rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(pregActualNum / totalPregs) * 100}%` }} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full mb-6 p-4 rounded-2xl bg-[#EDE9FE] border border-[#C4B5FD]"
      >
        <div className="text-sm font-black text-[#5B21B6]">{dimInfo?.emoji} Un poco más sobre {dimInfo?.name}</div>
        <p className="text-xs text-[#6B5FA0] mt-1">Estas preguntas nos ayudan a conectarte con los recursos correctos.</p>
      </motion.div>

      <motion.div key={preguntaActual.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full space-y-5">
        <h2 className="text-2xl font-display font-bold leading-snug text-[#1E1040]">{preguntaActual.texto}</h2>

        <div className="grid gap-3">
          {preguntaActual.opciones.map(op => {
            const sel = preguntaActual.tipo === "multi" ? (valorActual || []).includes(op.value) : valorActual === op.value;
            return (
              <motion.button key={op.value} whileTap={{ scale: 0.97 }}
                onClick={() => handleRespuesta(preguntaActual.id, op.value, preguntaActual.tipo)}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${sel ? "bg-primary/20 border-primary text-[#1E1040] font-bold" : "bg-white border-[#DDD6FE] text-[#3D2A8A] hover:bg-[#EDE9FE]"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? "border-primary bg-primary" : "border-white/30"}`}>
                    {sel && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className="text-sm">{op.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {preguntaActual.tipo === "multi" && (valorActual || []).length > 0 && (
          <Button onClick={avanzar} className="w-full h-12 font-bold rounded-xl bg-[#5B21B6] flex items-center justify-center gap-2">
            Continuar <ChevronRight className="w-4 h-4" />
          </Button>
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
  const [showResultsScreen, setShowResultsScreen] = useState(hasSavedAnswers);
  const [showLevelUp, setShowLevelUp] = useState<{show: boolean, dimension: string}>({show: false, dimension: ""});

  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [diagnosticType, setDiagnosticType] = useState<string | null>(null);
  const [postStep, setPostStep] = useState<1 | 2 | 3>(1);

  // ─── Estado profundización ────────────────────────────────────────────────────
  const [showProfundizacion, setShowProfundizacion] = useState(false);
  const [profundizacionDims, setProfundizacionDims] = useState<string[]>([]);
  const [profundizacionRespuestas, setProfundizacionRespuestas] = useState<Record<string, any>>({});

  const context = JSON.parse(localStorage.getItem("korai_context") || "{}");
  const situacionLaboral = context.demographics?.situacion_laboral;
  const tipoVivienda = context.demographics?.tipo_vivienda || "";
  const indicators = getActiveIndicatorsSafe(situacionLaboral);
  
  // Adaptar label de prevision_06 según tipo de vivienda
  const indicatorsAdaptados = indicators.map(ind => {
    if (ind.id === "prevision_06") {
      let label = "Puedo pagar o sostener los gastos del hogar";
      if (tipoVivienda === "alquiler") label = "Puedo pagar el alquiler y los gastos del hogar";
      else if (tipoVivienda === "propia") label = "Puedo sostener los gastos del hogar, como servicios, comida o transporte";
      else if (tipoVivienda === "prestado_cedida") label = "Puedo sostener los gastos del lugar donde vivo, como servicios, comida o transporte";
      else if (tipoVivienda === "inestable") label = "Hoy puedo cubrir necesidades basicas como comida, transporte o higiene";
      return { ...ind, label };
    }
    return ind;
  });

  // Redirect if no context AND no saved answers
  useEffect(() => {
    if (!context.city && !hasSavedAnswers) setLocation("/");
  }, [context, setLocation]);

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

      if (n === 0) { perDim[d.id] = { r: 0, a: 0, v: 0, n: 0, color: 'verde', severity: 0, explanation: 'Sin datos.' }; return; }
      const color = (r / n >= 0.5) ? 'rojo' : (a / n >= 0.5 || (r+a)/n >= 0.5) ? 'amarillo' : 'verde';
      const severity = Math.round(((r * 1 + a * 0.5) / n) * 100);
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

  // ─── handleSubmit: envía a Supabase con profundización ───────────────────────
  const handleSubmit = async (profundizacion: Record<string, any> = {}) => {
    setIsPending(true);
    setSubmitError(null);

    try {
      const dni = context.dni || `anonimo-${Date.now()}`;

      const result = await submitToSupabase({
        dni,
        answers,
        territorio: {
          ciudad: context.city || "Desconocida",
          barrio: context.neighborhood || "",
        },
        texto_abierto: comment,
        nombre: context.nombre || "",
        apellido: context.apellido || "",
        telefono: context.telefono || "",
        profundizacion,
        demographics: context.demographics || {},
      });

      // Avisar si ya hizo el diagnóstico antes
      if (result?.diagnostic_type) {
        setDiagnosticType(result.diagnostic_type);
      }

      localStorage.setItem("korai_user_answers", JSON.stringify(answers));
      localStorage.setItem("korai_profundizacion", JSON.stringify(profundizacion));
      localStorage.removeItem("korai_user_plan_v1");

      const plan = generatePlanDesdeScores(answers, 5, situacionLaboral);
      localStorage.setItem("korai_user_plan_v1", JSON.stringify(plan));

      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });

      // ── OportunAI: enviar semáforo si el usuario viene de OportunAI ──────────
      const koraiOportunaiUser = (() => { try { return JSON.parse(localStorage.getItem("korai_oportunai_user") || "null"); } catch { return null; } })();
      if (koraiOportunaiUser?.oportunai_user_id) {
        const scores = calcularScores(answers, situacionLaboral);
        const semaforo: Record<string, string> = {};
        scores.forEach(s => { semaforo[s.dimensionId] = s.color; });
        const demo = context.demographics || {};
        const payload: Record<string, any> = {
          oportunai_user_id: koraiOportunaiUser.oportunai_user_id,
          semaforo,
          ...(demo.situacion_laboral  && { situacion_laboral: demo.situacion_laboral }),
          ...(demo.ingreso_hogar      && { ingreso_hogar: demo.ingreso_hogar }),
          ...(demo.tipo_vivienda      && { tipo_vivienda: demo.tipo_vivienda }),
          ...(context.territorio?.barrio && { barrio: context.territorio.barrio }),
          ...(comment?.trim()         && { motivo: comment.trim() }),
        };
        fetch("https://oportunai.korai.lat/api/korai/semaforo-resultado", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then(async r => {
          const body = await r.text();
          console.log("[OportunAI] status:", r.status, "body:", body);
          if (r.ok) localStorage.setItem("korai_oportunai_enviado", "true");
        }).catch(err => console.error("[OportunAI] error (probablemente CORS):", err));
      }
      // ─────────────────────────────────────────────────────────────────────────

      setShowResultsScreen(true);
    } catch (err: any) {
      console.error("Error al guardar en Supabase:", err);
      setSubmitError(err?.message || "Error al guardar. Intentá de nuevo.");
      setShowProfundizacion(false);
    } finally {
      setIsPending(false);
    }
  };

  // Detectar áreas rojas y amarillas — priorizar rojas primero
  const handleAfterComment = () => {
    const scores = calcularScores(answers, situacionLaboral);
    const prioritarias = getPrioridadesBloqueantes(scores);

    const dimsConProfundizacion = prioritarias
      .map(p => p.dimensionId)
      .filter(dimId => {
        const score = scores.find(s => s.dimensionId === dimId);
        return score && score.color !== "verde" && PROFUNDIZACION[dimId];
      });

    // Forzar profundización de empleo si el usuario está desempleado o buscando trabajo
    const sinTrabajo = ["buscando", "no_trabajo"].includes(situacionLaboral || "");
    if (sinTrabajo && !dimsConProfundizacion.includes("empleo") && PROFUNDIZACION["empleo"]) {
      dimsConProfundizacion.unshift("empleo");
    }

    if (dimsConProfundizacion.length > 0) {
      setProfundizacionDims(dimsConProfundizacion);
      setShowProfundizacion(true);
    } else {
      handleSubmit({});
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

  // ─── Pantalla de profundización ──────────────────────────────────────────────
  if (showProfundizacion) {
    return (
      <ProfundizacionScreen
        dimensiones={profundizacionDims}
        tipoVivienda={context.demographics?.tipo_vivienda}
        onComplete={(respuestas) => {
          setProfundizacionRespuestas(respuestas);
          setShowProfundizacion(false);
          handleSubmit(respuestas);
        }}
      />
    );
  }

  if (showResultsScreen && results) {
    const ctx = (() => { try { return JSON.parse(localStorage.getItem("korai_context") || "{}"); } catch { return {}; } })();
    const nombre = ctx.nombre || "";
    const esOportunai = (() => { try { return !!JSON.parse(localStorage.getItem("korai_oportunai_user") || "null")?.oportunai_user_id; } catch { return false; } })();

    // Ordenar dimensiones: rojas → amarillas → verdes
    const dimsOrdenadas = [...INSTRUMENT.dimensions].sort((a, b) => {
      const orden = { rojo: 0, amarillo: 1, verde: 2 };
      return (orden[results.perDim[a.id]?.color] ?? 2) - (orden[results.perDim[b.id]?.color] ?? 2);
    });

    // Primera acción concreta (primera dimensión urgente o de atención)
    const plan = JSON.parse(localStorage.getItem("korai_user_plan_v1") || "[]");
    const primeraAccion = plan.find(p => p.nivelColor === "rojo") || plan.find(p => p.nivelColor === "amarillo") || plan[0];

    const S = {
      screen: { minHeight: "100vh", background: "#0F0A2E", display: "flex", flexDirection: "column" as const, fontFamily: "'DM Sans', system-ui, sans-serif" },
      progressBar: { height: "3px", background: "rgba(255,255,255,0.08)", margin: "12px 24px 0" },
      progressFill: (pct: number) => ({ height: "100%", background: "#C4B5FD", borderRadius: "2px", width: `${pct}%` }),
      header: { padding: "24px 24px 0" },
      greeting: { fontFamily: "'Outfit', system-ui, sans-serif", fontSize: "22px", fontWeight: 800, color: "#F0EEFF", lineHeight: 1.2, marginBottom: "6px" },
      subtext: { fontSize: "13px", color: "#9B8EC4", lineHeight: 1.5, margin: 0 },
      dimCard: (color: string) => ({
        background: color === "rojo" ? "rgba(239,68,68,0.08)" : color === "amarillo" ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.06)",
        border: `1px solid ${color === "rojo" ? "rgba(239,68,68,0.2)" : color === "amarillo" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.15)"}`,
        borderRadius: "16px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px",
      }),
      badge: (color: string) => ({
        fontSize: "10px", fontWeight: 800, letterSpacing: "0.05em", padding: "3px 10px", borderRadius: "20px", flexShrink: 0,
        background: color === "rojo" ? "rgba(239,68,68,0.15)" : color === "amarillo" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
        color: color === "rojo" ? "#FCA5A5" : color === "amarillo" ? "#FCD34D" : "#6EE7B7",
      }),
      btnPrimary: { width: "100%", padding: "16px", background: "#7C5CFF", color: "white", border: "none", borderRadius: "16px", fontFamily: "'Outfit', system-ui", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
      btnWa: { width: "100%", padding: "16px", background: "#25D366", color: "white", border: "none", borderRadius: "16px", fontFamily: "'Outfit', system-ui", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
    };

    // ── PASO 1: Tu resultado ──────────────────────────────────────────────────
    if (postStep === 1) return (
      <div style={S.screen}>
        <div style={S.progressBar}><div style={S.progressFill(33)} /></div>
        <div style={S.header}>
          <div style={S.greeting}>
            {nombre ? <>{nombre}, <span style={{ color: "#C4B5FD" }}>encontramos cosas importantes</span> en tu diagnóstico</> : <>Encontramos <span style={{ color: "#C4B5FD" }}>cosas importantes</span> en tu diagnóstico</>}
          </div>
          <p style={{ ...S.subtext, marginTop: "8px" }}>Revisamos 6 áreas de tu vida. Esto es lo que vemos hoy.</p>
        </div>

        <div style={{ padding: "20px 24px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
          {dimsOrdenadas.map(d => {
            const color = results.perDim[d.id]?.color || "verde";
            const labelMap = { rojo: "Urgente", amarillo: "Atención", verde: "Bien" };
            const descMap = { rojo: "Necesitás apoyo urgente acá", amarillo: "Hay margen para mejorar", verde: "Vas bien en esta área" };
            return (
              <div key={d.id} style={S.dimCard(color)}>
                <span style={{ fontSize: "22px", flexShrink: 0 }}>{d.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Outfit', system-ui", fontSize: "14px", fontWeight: 700, color: "#F0EEFF" }}>{d.name}</div>
                  <div style={{ fontSize: "11px", color: "#9B8EC4", marginTop: "2px" }}>{descMap[color]}</div>
                </div>
                <div style={S.badge(color)}>{labelMap[color]}</div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "24px", marginTop: "auto" }}>
          <button style={S.btnPrimary} onClick={() => setPostStep(2)}>Ver qué hacer primero →</button>
        </div>
      </div>
    );

    // ── PASO 2: Tu próximo paso ───────────────────────────────────────────────
    if (postStep === 2) return (
      <div style={S.screen}>
        <div style={S.progressBar}><div style={S.progressFill(66)} /></div>
        <div style={S.header}>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#F59E0B", marginBottom: "8px" }}>Esta semana</div>
          <div style={S.greeting}>Lo más importante que podés hacer ahora</div>
          <p style={{ ...S.subtext, marginTop: "6px" }}>Empezar por acá puede cambiar bastante tu situación.</p>
        </div>

        {primeraAccion && (
          <div style={{ margin: "20px 24px 0", background: "#FDF8F0", borderRadius: "20px", overflow: "hidden" }}>
            <div style={{ background: "#F59E0B", padding: "16px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>{primeraAccion.emoji}</span>
              <span style={{ fontFamily: "'Outfit', system-ui", fontSize: "13px", fontWeight: 800, color: "#1E1040", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{primeraAccion.dimensionName} · Paso 1</span>
            </div>
            <div style={{ padding: "18px" }}>
              <div style={{ fontFamily: "'Outfit', system-ui", fontSize: "16px", fontWeight: 800, color: "#1E1040", marginBottom: "6px" }}>{primeraAccion.accionesCorto?.[0]}</div>
              <div style={{ fontSize: "13px", color: "#4B4068", lineHeight: 1.55, marginBottom: "14px" }}>{primeraAccion.motivo || "Este es el primer paso recomendado para tu situación."}</div>
              {primeraAccion.recursos?.[0]?.url ? (
                <a href={primeraAccion.recursos[0].url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "12px", background: "#5C40C0", color: "white", borderRadius: "12px", fontFamily: "'Outfit', system-ui", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
                  🔗 {primeraAccion.recursos[0].nombre || "Ir al recurso"}
                </a>
              ) : (
                <button onClick={() => setLocation("/prioridades")} style={{ width: "100%", padding: "12px", background: "#5C40C0", color: "white", border: "none", borderRadius: "12px", fontFamily: "'Outfit', system-ui", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                  Ver todos los pasos →
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: "12px", color: "#9B8EC4", padding: "14px 24px 0" }}>
          <span onClick={() => setPostStep(3)} style={{ color: "#C4B5FD", fontWeight: 600, cursor: "pointer" }}>Saltear este paso →</span>
        </div>

        <div style={{ padding: "24px", marginTop: "auto" }}>
          <button style={S.btnPrimary} onClick={() => setPostStep(3)}>Seguir →</button>
        </div>
      </div>
    );

    // ── PASO 3: Korai te acompaña ─────────────────────────────────────────────
    return (
      <div style={S.screen}>
        <div style={S.progressBar}><div style={S.progressFill(100)} /></div>

        <div style={{ margin: "24px 24px 0", background: "linear-gradient(135deg, #3B1FA8 0%, #5C40C0 50%, #7C5CFF 100%)", borderRadius: "24px", padding: "28px 22px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "140px", height: "140px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
          <div style={{ width: "52px", height: "52px", background: "rgba(255,255,255,0.15)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", marginBottom: "14px" }}>🌱</div>
          <div style={{ fontFamily: "'Outfit', system-ui", fontSize: "20px", fontWeight: 800, color: "white", lineHeight: 1.2, marginBottom: "8px" }}>
            {nombre ? `No estás sola en esto, ${nombre}` : "No estás solo/a en esto"}
          </div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>Un equipo de Korai te va a acompañar en los próximos pasos. Te contactamos por WhatsApp.</div>
        </div>

        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#9B8EC4", marginBottom: "14px" }}>Qué pasa ahora</div>
          {[
            { when: "Hoy", icon: "💬", text: "Te llega tu plan personalizado por WhatsApp" },
            { when: "Esta semana", icon: "🤝", text: "Korai te escribe para ver cómo avanzás" },
            { when: "En 7 días", icon: "🎯", text: "Seguimiento de tus avances y nuevas oportunidades" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "14px", marginBottom: i < 2 ? "18px" : 0, position: "relative" }}>
              {i < 2 && <div style={{ position: "absolute", left: "15px", top: "30px", bottom: "-18px", width: "1px", background: "rgba(255,255,255,0.1)" }} />}
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(124,92,255,0.15)", border: "1px solid rgba(124,92,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0, position: "relative", zIndex: 1 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#C4B5FD", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "3px" }}>{item.when}</div>
                <div style={{ fontSize: "13px", color: "#F0EEFF", lineHeight: 1.4 }}>{item.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "24px", marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          {esOportunai ? (
            <div style={{ padding: "14px 16px", borderRadius: "14px", background: "#f0fdf4", border: "2px solid #86efac", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "22px" }}>✅</span>
              <p style={{ margin: 0, color: "#16a34a", fontWeight: 800, fontSize: "14px" }}>Tu diagnóstico fue enviado a OportunAI</p>
            </div>
          ) : (
            <button style={S.btnWa} onClick={() => {
              const msg = `Hola Korai, terminé mi diagnóstico.\nMi nombre es ${nombre}\nDNI: ${ctx.dni || ""}\nQuiero recibir mi plan de acción y comenzar este proceso de acompañamiento con vos.`;
              const encoded = encodeURIComponent(msg);
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              window.open(isMobile ? `https://wa.me/5491161210313?text=${encoded}` : `https://web.whatsapp.com/send?phone=5491161210313&text=${encoded}`, "_blank");
            }}>
              <span style={{ fontSize: "20px" }}>💬</span> Recibir mi plan por WhatsApp
            </button>
          )}
          <button onClick={() => { localStorage.removeItem("korai_user_answers"); localStorage.removeItem("korai_user_plan_v1"); localStorage.removeItem("korai_user_sello_v1"); localStorage.removeItem("korai_context"); setLocation("/"); }}
            style={{ background: "none", border: "none", color: "#9B8EC4", fontSize: "12px", cursor: "pointer", padding: "4px" }}>
            Salir
          </button>
        </div>
      </div>
    );
  }

  // ─── pantalla anterior (reemplazada - NO BORRAR el bloque if original) ───
  if (false && showResultsScreen && results) {
    return (
      <div className="min-h-screen pt-20 pb-10 px-4 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 bg-[#F4F0FF]">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <header className="space-y-2">
              <h1 className="text-4xl font-black text-[#1E1040]">{hasSavedAnswers ? "Mi Diagnóstico" : "Tu Diagnóstico"}</h1>
              <p className="text-[#6B5FA0] text-lg">
                Este es el resultado de tu autodiagnóstico. Tu mirada es fundamental para entender tu realidad.
              </p>
            </header>

            {/* Aviso diagnóstico repetido */}
            {diagnosticType === "follow_up_early" && (
              <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-300 flex items-start gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <p className="text-sm font-black text-yellow-800">Ya hiciste un diagnóstico recientemente</p>
                  <p className="text-xs text-yellow-700 mt-0.5">Este nuevo registro quedó guardado y se suma a tu historial de evolución.</p>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {INSTRUMENT.dimensions.map(d => {
                const s = results.perDim[d.id];
                return (
                  <div key={d.id} className="p-6 rounded-3xl bg-white border border-[#DDD6FE] shadow-sm space-y-4 hover:bg-[#EDE9FE] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{d.emoji}</span>
                        <div>
                          <div className="font-bold text-base text-[#1E1040]">{d.name}</div>
                          <div className="text-[10px] text-[#6B5FA0] uppercase">Nivel: {s.color}</div>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        s.color === 'rojo' ? 'bg-red-100 text-red-600 border-red-300' :
                        s.color === 'amarillo' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                        'bg-green-100 text-green-700 border-green-500/30'
                      }`}>
                        {s.color}
                      </div>
                    </div>

                    <div className="flex h-2 w-full bg-white/80 rounded-full overflow-hidden border border-[#EDE9FE]">
                      <div style={{ width: `${(s.v / s.n) * 100}%` }} className="bg-[#22c55e]" />
                      <div style={{ width: `${(s.a / s.n) * 100}%` }} className="bg-[#f59e0b]" />
                      <div style={{ width: `${(s.r / s.n) * 100}%` }} className="bg-[#ef4444]" />
                    </div>

                    <div className="pt-2">
                      <p className="text-[11px] leading-relaxed text-[#3D2A8A] italic bg-white/80 p-3 rounded-xl border border-[#EDE9FE]">
                        {s.color === 'rojo' ? 'Se detectan áreas de mejora urgente.' : s.color === 'amarillo' ? 'Existen aspectos que requieren atención.' : 'La situación es mayormente positiva.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-full md:w-80 space-y-4">

            {/* CTA card */}
            <div className="rounded-2xl bg-[#EDE9FE] border border-[#C4B5FD] p-5 space-y-3">
              <div className="text-sm font-black text-[#1E1040] leading-snug">
                Identificamos qué está bloqueando tu bienestar.
              </div>
              <p className="text-xs text-[#6B5FA0] leading-relaxed">
                Tu plan de acción personalizado tiene los pasos concretos y los recursos disponibles para ayudarte a avanzar hoy.
              </p>
              <Button
                onClick={() => setLocation("/prioridades")}
                className="w-full h-12 font-bold rounded-xl bg-[#5B21B6] shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                data-testid="button-go-prioridades"
              >
                <Target className="w-5 h-5" /> Ver mi plan de acción
              </Button>
            </div>

            <Button
              onClick={() => { localStorage.removeItem("korai_user_answers"); localStorage.removeItem("korai_user_plan_v1"); localStorage.removeItem("korai_user_sello_v1"); localStorage.removeItem("korai_context"); setLocation("/"); }}
              variant="outline"
              className="w-full h-10 border-red-400 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 text-sm"
            >
              Salir
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentIndicator && !showCommentScreen) return null;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 flex flex-col items-center max-w-xl mx-auto bg-[#F4F0FF]">
      <AnimatePresence>
        {showLevelUp.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-24 left-0 right-0 mx-auto w-max z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-primary to-blue-600 text-[#1E1040] px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 text-lg">
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
               <span className="text-xs font-bold text-[#5B21B6] uppercase tracking-widest bg-primary/10 px-2 py-1 rounded">
                 {dimension?.name}
               </span>
               <h2 className="text-3xl font-display font-bold leading-tight text-[#1E1040]">
                 {currentIndicator.label}
               </h2>
               <p className="text-[#6B5FA0] text-lg">
                 Selecciona la opción que mejor represente tu situación.
               </p>
            </div>

            <div className="grid gap-4 mt-8">
              <TrafficLightButton
                color="verde"
                onClick={() => handleAnswer("verde")}
                selected={answers[currentIndicator.id] === "verde"}
              />
              <TrafficLightButton
                color="amarillo"
                onClick={() => handleAnswer("amarillo")}
                selected={answers[currentIndicator.id] === "amarillo"}
              />
              <TrafficLightButton
                color="rojo"
                onClick={() => handleAnswer("rojo")}
                selected={answers[currentIndicator.id] === "rojo"}
              />
            </div>

            <div className="flex justify-between items-center mt-8 pt-4 border-t border-[#EDE9FE]">
              <Button
                variant="ghost"
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="text-[#6B5FA0] hover:text-[#1E1040]"
              >
                Anterior
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentIdx(Math.min(indicators.length - 1, currentIdx + 1))}
                disabled={currentIdx === indicators.length - 1 || !answers[currentIndicator.id]}
                className="text-[#6B5FA0] hover:text-[#1E1040]"
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-700 mb-4">
              <motion.span
                initial={{ rotate: -45, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                className="text-3xl"
              >
                🎉
              </motion.span>
            </div>
            <h2 className="text-3xl font-display font-bold text-[#1E1040]">¡Diagnóstico completado!</h2>
            <p className="text-[#6B5FA0]">
              Antes de terminar, ¿quieres dejar algún comentario adicional sobre tu barrio?
            </p>
          </div>

          <GlassCard className="p-6">
            <Textarea
              placeholder="Escribe aquí tus observaciones, reclamos o sugerencias..."
              className="min-h-[150px] bg-black/20 border-[#DDD6FE] text-lg resize-none focus:ring-primary/50"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </GlassCard>

          {submitError && (
            <div className="text-red-600 text-sm text-center bg-red-50 border border-red-500/20 rounded-xl px-4 py-3">
              {submitError}
            </div>
          )}

          <Button
            onClick={handleAfterComment}
            disabled={isPending}
            className="w-full h-14 text-lg font-bold rounded-xl bg-[#5B21B6] hover:to-primary shadow-lg shadow-primary/25"
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
