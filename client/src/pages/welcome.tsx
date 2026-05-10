import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Heart, CheckCircle, Phone, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { hashDNI } from "@/lib/korai-logic";
import { ZONAS_BUENOS_AIRES } from "@/lib/instrument";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import oraiMujer from "@/lib/oraiMujer";
import koraiLogo from "@/lib/koraiLogo";
import fliaImg from "@/lib/fliaImg";

if (typeof document !== "undefined" && !document.getElementById("montserrat-font")) {
  const link = document.createElement("link");
  link.id = "montserrat-font";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap";
  document.head.appendChild(link);
}

const C = {
  bg:        "#F4F0FF",
  bgCard:    "#FFFFFF",
  primary:   "#5B21B6",
  primaryLight: "#EDE9FE",
  text:      "#1E1040",
  textSub:   "#6B5FA0",
  border:    "#DDD6FE",
  borderBtn: "#C4B5FD",
};

const CONTEXT_QUESTIONS = [
  {
    id: "edad",
    emoji: "📋",
    titulo: "¿En qué rango de edad estás?",
    subtitulo: "Nos ayuda a conectarte con programas según tu momento de vida.",
    opciones: [
      { value: "menor18", label: "Menos de 18",  emoji: "🌱" },
      { value: "18-24",   label: "18 a 24 años", emoji: "⚡" },
      { value: "25-40",   label: "25 a 40 años", emoji: "🔥" },
      { value: "41-60",   label: "41 a 60 años", emoji: "💪" },
      { value: "mas60",   label: "Más de 60",    emoji: "⭐" },
    ],
  },
  {
    id: "situacion_laboral",
    emoji: "💼",
    titulo: "¿Cuál es tu situación laboral hoy?",
    subtitulo: "Sin juicios. Solo queremos entender desde dónde partís.",
    opciones: [
      { value: "tengo_trabajo", label: "Tengo trabajo",         emoji: "✅" },
      { value: "buscando",      label: "Estoy buscando trabajo", emoji: "🔍" },
      { value: "no_trabajo",    label: "No trabajo actualmente", emoji: "⏸️" },
    ],
  },
  {
    id: "tipo_vivienda",
    emoji: "🏠",
    titulo: "¿Tu vivienda es…?",
    subtitulo: "Tu situación habitacional nos ayuda a identificar programas de apoyo.",
    opciones: [
      { value: "propia",    label: "Propia",              emoji: "🏡" },
      { value: "alquiler",  label: "Alquilada",           emoji: "🔑" },
      { value: "prestada",  label: "Prestada / cedida",   emoji: "🤝" },
      { value: "inestable", label: "Situación inestable", emoji: "⚠️" },
    ],
  },
  {
    id: "personas_cargo",
    emoji: "👨‍👩‍👧",
    titulo: "¿Tenés personas a cargo?",
    subtitulo: "Hijos, adultos mayores u otras personas que dependen de vos.",
    opciones: [
      { value: "ninos",   label: "Sí, niños o adolescentes",  emoji: "👶" },
      { value: "adultos", label: "Sí, adultos mayores",       emoji: "👴" },
      { value: "ambos",   label: "Ambos",                     emoji: "👨‍👩‍👧‍👦" },
      { value: "no",      label: "No tengo personas a cargo", emoji: "🙋" },
    ],
  },
  {
    id: "cantidad_cargo",
    emoji: "🔢",
    titulo: "¿Cuántas personas tenés a cargo?",
    subtitulo: "Incluyendo a todos los que mencionaste.",
    opciones: [
      { value: "1",   label: "1 persona",      emoji: "1️⃣" },
      { value: "2-3", label: "2 a 3 personas", emoji: "2️⃣" },
      { value: "4+",  label: "4 o más",        emoji: "👨‍👩‍👧‍👦" },
    ],
    soloSi: ["ninos", "adultos", "ambos"],
  },
];

function ContextQuestion({
  question, stepNum, totalSteps, onSelect, onBack,
}: {
  question: typeof CONTEXT_QUESTIONS[0];
  stepNum: number;
  totalSteps: number;
  onSelect: (value: string) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    setSelected(value);
    setTimeout(() => onSelect(value), 350);
  };

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: C.bg }}>
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <button onClick={onBack} className="p-1 rounded-full hover:bg-black/5 transition-colors">
          <ChevronLeft className="w-5 h-5" style={{ color: C.textSub }} />
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i < stepNum ? 24 : 12,
                background: i < stepNum ? C.primary : C.border,
              }} />
          ))}
        </div>
        <div className="text-xs font-bold" style={{ color: C.textSub }}>{stepNum}/{totalSteps}</div>
      </div>

      <motion.div key={question.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
        className="flex-1 flex flex-col px-5 pt-8 pb-8 max-w-sm mx-auto w-full">
        <div className="text-5xl mb-4">{question.emoji}</div>
        <h2 className="text-2xl font-black leading-tight mb-2" style={{ fontFamily: "'Montserrat', sans-serif", color: C.text }}>
          {question.titulo}
        </h2>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: C.textSub }}>{question.subtitulo}</p>

        <div className="space-y-3 flex-1">
          {question.opciones.map((op, i) => (
            <motion.button key={op.value}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(op.value)}
              className="w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3"
              style={{
                background: selected === op.value ? C.primaryLight : C.bgCard,
                borderColor: selected === op.value ? C.primary : C.border,
                boxShadow: selected === op.value ? `0 0 0 3px ${C.primaryLight}` : "none",
              }}>
              <span className="text-xl">{op.emoji}</span>
              <span className="font-bold text-sm flex-1" style={{ fontFamily: "'Montserrat', sans-serif", color: C.text }}>
                {op.label}
              </span>
              {selected === op.value && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle className="w-4 h-4" style={{ color: C.primary }} />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function TransitionScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-5 pb-10 pt-10"
      style={{ background: C.bg }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="w-full max-w-sm flex flex-col items-center text-center gap-6">

        <motion.img src={oraiMujer} alt="KORAI" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }} className="w-52 h-52 object-contain" />

        <div className="space-y-3">
          <h2 className="text-2xl font-black leading-tight" style={{ fontFamily: "'Montserrat', sans-serif", color: C.text }}>
            Ahora vamos a lo que realmente importa.
          </h2>
          <p className="text-base leading-relaxed" style={{ color: C.textSub }}>
            Te vamos a hacer algunas preguntas sobre cómo te sentís en distintas áreas de tu vida.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>
            No hay respuestas buenas ni malas. Solo contanos con honestidad cómo estás hoy.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full">
          {[
            { emoji: "💼", label: "Empleo" },
            { emoji: "📚", label: "Educación" },
            { emoji: "🩺", label: "Salud" },
            { emoji: "🏠", label: "Vivienda" },
            { emoji: "🧾", label: "Ingresos" },
            { emoji: "🤝", label: "Red" },
          ].map((a, i) => (
            <motion.div key={a.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.06 }}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border"
              style={{ background: C.bgCard, borderColor: C.border }}>
              <span className="text-xl">{a.emoji}</span>
              <span className="text-[10px] font-bold" style={{ color: C.textSub }}>{a.label}</span>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="w-full space-y-2">
          <Button onClick={onStart}
            className="w-full h-12 text-base font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
            style={{ fontFamily: "'Montserrat', sans-serif", background: C.primary }}>
            Empezar el diagnóstico <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-[10px] text-center" style={{ color: C.textSub }}>
            🔒 Tus respuestas son confidenciales
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function Welcome() {
  const [_, setLocation] = useLocation();
  const [mode, setMode] = useState<"landing" | "form" | "context" | "transition" | "returning">("landing");

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [formError, setFormError] = useState("");

  const [contextStep, setContextStep] = useState(0);
  const [contextAnswers, setContextAnswers] = useState<Record<string, string>>({});

  const [returningDni, setReturningDni] = useState("");
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [returnError, setReturnError] = useState("");

  const activeQuestions = CONTEXT_QUESTIONS.filter(q => {
    if (!q.soloSi) return true;
    return q.soloSi.includes(contextAnswers.personas_cargo || "");
  });

  const handleFormNext = () => {
    if (!dni.trim()) { setFormError("El DNI es necesario para guardar tu diagnóstico."); return; }
    if (!telefono.trim() || telefono.replace(/\D/g, "").length < 8) { setFormError("Ingresá tu número de WhatsApp para recibir tu plan."); return; }
    setFormError("");
    localStorage.removeItem("korai_user_answers");
    localStorage.removeItem("korai_user_plan_v1");
    localStorage.removeItem("korai_user_sello_v1");
    localStorage.removeItem("korai_profundizacion");
    setContextStep(0);
    setContextAnswers({});
    setMode("context");
  };

  const handleContextSelect = (value: string) => {
    const question = activeQuestions[contextStep];
    const newAnswers = { ...contextAnswers, [question.id]: value };
    setContextAnswers(newAnswers);

    const nextActive = CONTEXT_QUESTIONS.filter(q => {
      if (!q.soloSi) return true;
      return q.soloSi.includes(newAnswers.personas_cargo || "");
    });

    if (contextStep + 1 < nextActive.length) {
      setContextStep(prev => prev + 1);
    } else {
      setContextAnswers(newAnswers);
      setMode("transition");
    }
  };

  const handleContextBack = () => {
    if (contextStep === 0) setMode("form");
    else setContextStep(prev => prev - 1);
  };

  const handleStart = async () => {
    let dniHash = "";
    if (dni.trim()) {
      dniHash = await hashDNI(dni);
      localStorage.setItem("korai_user_dni_hash_v1", dniHash);
      localStorage.setItem("korai_user_dni", dni.trim());
    }
    localStorage.setItem("korai_context", JSON.stringify({
      city: "Buenos Aires",
      neighborhood,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      dni: dni.trim() || `usuario-${Date.now()}`,
      telefono: telefono.trim(),
      demographics: {
        dniHash,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        ...contextAnswers,
      },
    }));
    setLocation("/survey");
  };

  const handleReturning = async () => {
    if (!returningDni.trim()) { setReturnError("Ingresá tu DNI."); return; }
    setLoadingReturn(true);
    setReturnError("");
    try {
      const hash = await hashDNI(returningDni);
      const SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4";
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/responses?dni_hash=eq.${hash}&order=submitted_at.desc&limit=1`,
        { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await res.json();
      if (!data || data.length === 0) { setReturnError("No encontramos un diagnóstico con ese DNI."); setLoadingReturn(false); return; }
      const response = data[0];
      localStorage.setItem("korai_user_answers", JSON.stringify(response.answers));
      localStorage.setItem("korai_user_dni", returningDni.trim());
      localStorage.setItem("korai_context", JSON.stringify({
        city: response.territorio?.ciudad || "Buenos Aires",
        neighborhood: response.territorio?.barrio || "",
        dni: returningDni.trim(),
      }));
      const { generatePlanDesdeScores, generarSello } = await import("@/lib/korai-logic");
      const plan = generatePlanDesdeScores(response.answers);
      localStorage.setItem("korai_user_plan_v1", JSON.stringify(plan));
      localStorage.setItem("korai_user_sello_v1", JSON.stringify(generarSello(response.territorio?.ciudad)));
      setLocation("/prioridades");
    } catch (e) { setReturnError("Error al buscar tu diagnóstico."); }
    setLoadingReturn(false);
  };

  if (mode === "landing") {
    return (
      <div className="min-h-screen w-full flex justify-center" style={{ background: "#F8F7FF" }}>
        <div className="w-full max-w-sm flex flex-col min-h-screen px-5 pt-12 pb-6 gap-4">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2">
            <img src={koraiLogo} alt="KORAI logo" className="w-10 h-10 object-contain" />
            <span style={{ fontFamily: "'Montserrat', sans-serif" }} className="text-3xl font-black tracking-tight text-[#1E1040]">
              KOR<span className="text-[#22C55E]">AI</span>
            </span>
          </motion.div>
          <div className="space-y-3 mt-6">
            {[
              { emoji: "💜", color: "#7C3AED", text: "Queremos conocerte," },
              { emoji: "👂", color: "#0EA5E9", text: "escucharte y acercarte" },
              { emoji: "👥", color: "#22C55E", text: "oportunidades para vos y tu familia." },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
                className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-xl" style={{ background: `${item.color}22` }}>
                  {item.emoji}
                </div>
                <span style={{ fontFamily: "'Montserrat', sans-serif", color: item.color }} className="text-xl font-black leading-tight">
                  {item.text}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex flex-col gap-0">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              className="flex justify-center">
              <img src={fliaImg} alt="Familia KORAI" className="w-full object-contain" style={{ maxHeight: "220px", filter: "drop-shadow(0 4px 20px rgba(124,58,237,0.15))" }} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-[#E9D5FF] bg-[#F5F3FF]">
                <div className="w-11 h-11 rounded-full bg-[#EDE9FE] flex items-center justify-center flex-shrink-0 text-xl">⏱️</div>
                <p style={{ fontFamily: "'Montserrat', sans-serif" }} className="text-sm text-[#1E1040] leading-snug">
                  Es un <span className="font-black text-[#7C3AED]">diagnóstico simple</span> que dura solo <span className="font-black text-[#22C55E]">unos minutos</span> y nos permite acompañarte mejor.
                </p>
              </div>
              <Button onClick={() => setMode("form")}
                className="w-full h-14 text-lg font-black rounded-2xl shadow-lg flex items-center justify-center gap-3"
                style={{ fontFamily: "'Montserrat', sans-serif", background: "linear-gradient(135deg, #7C3AED, #22C55E)" }}>
                Comenzar <ArrowRight className="w-5 h-5" />
              </Button>
              <button onClick={() => setMode("returning")} className="w-full py-1 text-xs font-semibold text-center" style={{ fontFamily: "'Montserrat', sans-serif", color: C.textSub }}>
                Ya hice mi diagnóstico → Ver mis resultados
              </button>
              <p className="text-[10px] text-center" style={{ color: C.textSub }}>🔒 Tu información está protegida</p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "form") {
    return (
      <div className="min-h-screen w-full flex flex-col" style={{ background: C.bg }}>
        <div className="flex items-center px-5 pt-6 pb-2">
          <button onClick={() => setMode("landing")} className="p-1 rounded-full hover:bg-black/5 transition-colors">
            <ChevronLeft className="w-5 h-5" style={{ color: C.textSub }} />
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col px-5 pt-4 pb-8 max-w-sm mx-auto w-full space-y-5">
          <div>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", color: C.text }} className="text-2xl font-black">Antes de comenzar</h1>
            <p className="text-sm mt-1" style={{ color: C.textSub }}>Tus datos se guardan de forma segura y encriptada.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Nombre", val: nombre, set: setNombre, ph: "Tu nombre" },
              { label: "Apellido", val: apellido, set: setApellido, ph: "Tu apellido" },
            ].map(f => (
              <div key={f.label} className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: C.textSub }}>{f.label}</label>
                <Input placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)}
                  className="h-11 text-sm border-2 rounded-xl"
                  style={{ background: C.bgCard, borderColor: C.border, color: C.text }} />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: C.textSub }}>DNI *</label>
            <Input placeholder="Ingresá tu DNI" value={dni} onChange={e => { setDni(e.target.value); setFormError(""); }}
              className="h-11 text-sm border-2 rounded-xl"
              style={{ background: C.bgCard, borderColor: formError ? "#ef4444" : C.border, color: C.text }}
              data-testid="input-dni" />
            <p className="text-[10px]" style={{ color: C.textSub }}>Tu DNI se guarda encriptado para que puedas volver a ver tu diagnóstico.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: C.textSub }}>Barrio</label>
            <select
              value={neighborhood}
              onChange={e => setNeighborhood(e.target.value)}
              className="w-full h-11 text-sm border-2 rounded-xl px-3 appearance-none"
              style={{ background: C.bgCard, borderColor: C.border, color: neighborhood ? C.text : C.textSub, fontFamily: "inherit" }}
            >
              <option value="" disabled>Seleccioná tu barrio</option>
              {Object.entries(ZONAS_BUENOS_AIRES).map(([zona, barrios]) => (
                <optgroup key={zona} label={zona}>
                  {barrios.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: C.textSub }}>
              <Phone className="w-3 h-3" /> WhatsApp *
            </label>
            <Input placeholder="Ej: 1155556666" value={telefono} onChange={e => { setTelefono(e.target.value); setFormError(""); }}
              className="h-11 text-sm border-2 rounded-xl"
              style={{ background: C.bgCard, borderColor: C.border, color: C.text }} />
            <p className="text-[10px]" style={{ color: C.textSub }}>Para enviarte tu plan y hacer seguimiento de tu situación.</p>
          </div>

          {formError && <p className="text-red-500 text-sm text-center font-semibold">{formError}</p>}

          <Button onClick={handleFormNext}
            className="w-full h-12 text-base font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
            style={{ fontFamily: "'Montserrat', sans-serif", background: C.primary }}>
            Continuar <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-[10px] text-center" style={{ color: C.textSub }}>Tu participación es confidencial y ayuda a mejorar tu comunidad.</p>
        </motion.div>
      </div>
    );
  }

  if (mode === "context") {
    return (
      <AnimatePresence mode="wait">
        <ContextQuestion
          key={contextStep}
          question={activeQuestions[contextStep]}
          stepNum={contextStep + 1}
          totalSteps={activeQuestions.length}
          onSelect={handleContextSelect}
          onBack={handleContextBack}
        />
      </AnimatePresence>
    );
  }

  if (mode === "transition") {
    return <TransitionScreen onStart={handleStart} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-5" style={{ background: C.bg }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <div className="text-4xl mb-3">👋</div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", color: C.text }} className="text-2xl font-black">¡Hola de nuevo!</h1>
          <p className="text-sm" style={{ color: C.textSub }}>Ingresá tu DNI para ver tu plan personalizado</p>
        </div>

        <div className="p-6 rounded-3xl border-2 space-y-4 shadow-sm" style={{ background: C.bgCard, borderColor: C.border }}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: C.textSub }}>DNI</label>
            <Input placeholder="Ingresá tu DNI" value={returningDni}
              onChange={e => { setReturningDni(e.target.value); setReturnError(""); }}
              className="h-12 text-base border-2 rounded-xl"
              style={{ background: C.bg, borderColor: C.border, color: C.text }} />
            {returnError && <p className="text-xs text-red-500 font-semibold">{returnError}</p>}
          </div>
          <Button onClick={handleReturning} disabled={loadingReturn}
            className="w-full h-12 text-base font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
            style={{ fontFamily: "'Montserrat', sans-serif", background: C.primary }}>
            {loadingReturn ? "Buscando..." : <><span>Ver mi diagnóstico</span><ArrowRight className="w-4 h-4" /></>}
          </Button>
        </div>

        <button onClick={() => setMode("landing")} className="w-full text-xs font-semibold py-2 transition-colors" style={{ color: C.textSub }}>
          ← Volver
        </button>
      </motion.div>
    </div>
  );
}
