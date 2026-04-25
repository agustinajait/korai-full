import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Heart, CheckCircle, Phone, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { hashDNI } from "@/lib/korai-logic";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import oraiMujer from "@/lib/oraiMujer";
import koraiLogo from "@/lib/koraiLogo";

if (typeof document !== "undefined" && !document.getElementById("montserrat-font")) {
  const link = document.createElement("link");
  link.id = "montserrat-font";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&display=swap";
  document.head.appendChild(link);
}

const BARRIOS_CABA = [
  "Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo",
  "Caballito", "Chacarita", "Coghlan", "Colegiales", "Constitución",
  "Flores", "Floresta", "La Boca", "La Paternal", "Liniers", "Mataderos",
  "Monte Castro", "Montserrat", "Nueva Pompeya", "Núñez", "Palermo",
  "Parque Avellaneda", "Parque Chacabuco", "Parque Chas", "Parque Patricios",
  "Puerto Madero", "Recoleta", "Retiro", "Saavedra", "San Cristóbal",
  "San Nicolás", "San Telmo", "Tribunales", "Versalles", "Villa Crespo",
  "Villa del Parque", "Villa Devoto", "Villa General Mitre", "Villa Lugano",
  "Villa Luro", "Villa Ortúzar", "Villa Pueyrredón", "Villa Real",
  "Villa Riachuelo", "Villa Santa Rita", "Villa Soldati", "Villa Urquiza",
];

// ─── Preguntas de contexto ────────────────────────────────────────────────────
const CONTEXT_QUESTIONS = [
  {
    id: "edad",
    emoji: "🎂",
    titulo: "¿En qué rango de edad estás?",
    subtitulo: "Nos ayuda a conectarte con programas que aplican a tu momento de vida.",
    opciones: [
      { value: "menor18", label: "Menos de 18", emoji: "🌱" },
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
      { value: "tengo_trabajo",   label: "Tengo trabajo",          emoji: "✅" },
      { value: "buscando",        label: "Estoy buscando trabajo",  emoji: "🔍" },
      { value: "no_trabajo",      label: "No trabajo actualmente",  emoji: "⏸️" },
    ],
  },
  {
    id: "tipo_vivienda",
    emoji: "🏠",
    titulo: "¿Tu vivienda es…?",
    subtitulo: "Tu situación habitacional nos ayuda a identificar programas de apoyo.",
    opciones: [
      { value: "propia",    label: "Propia",            emoji: "🏡" },
      { value: "alquiler",  label: "Alquilada",         emoji: "🔑" },
      { value: "prestada",  label: "Prestada / cedida", emoji: "🤝" },
      { value: "inestable", label: "Situación inestable", emoji: "⚠️" },
    ],
  },
  {
    id: "personas_cargo",
    emoji: "👨‍👩‍👧",
    titulo: "¿Tenés personas a cargo?",
    subtitulo: "Hijos, adultos mayores u otras personas que dependan de vos.",
    opciones: [
      { value: "si",  label: "Sí, tengo personas a cargo", emoji: "👨‍👩‍👧" },
      { value: "no",  label: "No",                         emoji: "🙋" },
    ],
  },
];

// ─── Pantalla de pregunta de contexto ────────────────────────────────────────
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
    <div className="min-h-screen w-full flex flex-col bg-[#070A13]">
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <button onClick={onBack} className="text-white/40 hover:text-white transition-colors p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${
              i < stepNum ? "bg-primary w-6" : i === stepNum - 1 ? "bg-primary w-4" : "bg-white/10 w-4"
            }`} />
          ))}
        </div>
        <div className="text-xs text-white/30">{stepNum}/{totalSteps}</div>
      </div>

      {/* Contenido */}
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        className="flex-1 flex flex-col px-5 pt-8 pb-8 max-w-sm mx-auto w-full"
      >
        <div className="text-5xl mb-4">{question.emoji}</div>
        <h2 style={{fontFamily: "'Montserrat', sans-serif"}} className="text-2xl font-black text-white leading-tight mb-2">
          {question.titulo}
        </h2>
        <p className="text-white/40 text-sm mb-8 leading-relaxed">{question.subtitulo}</p>

        <div className="space-y-3 flex-1">
          {question.opciones.map((op, i) => (
            <motion.button
              key={op.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(op.value)}
              className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                selected === op.value
                  ? "bg-primary/30 border-primary scale-[1.02] shadow-lg shadow-primary/20"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <span className="text-xl">{op.emoji}</span>
              <span style={{fontFamily: "'Montserrat', sans-serif"}} className={`font-bold text-sm ${selected === op.value ? "text-white" : "text-white/70"}`}>
                {op.label}
              </span>
              {selected === op.value && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                  <CheckCircle className="w-4 h-4 text-primary" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Welcome() {
  const [_, setLocation] = useLocation();
  const [mode, setMode] = useState<"landing" | "form" | "context" | "returning">("landing");

  // Datos básicos
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [formError, setFormError] = useState("");

  // Contexto gamificado
  const [contextStep, setContextStep] = useState(0);
  const [contextAnswers, setContextAnswers] = useState<Record<string, string>>({});

  // Returning
  const [returningDni, setReturningDni] = useState("");
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [returnError, setReturnError] = useState("");

  // Después del form básico → arrancar preguntas de contexto
  const handleFormNext = () => {
    if (!dni.trim()) { setFormError("El DNI es necesario para guardar tu diagnóstico."); return; }
    setFormError("");
    setContextStep(0);
    setMode("context");
  };

  // Cada respuesta de contexto
  const handleContextSelect = (value: string) => {
    const question = CONTEXT_QUESTIONS[contextStep];
    const newAnswers = { ...contextAnswers, [question.id]: value };
    setContextAnswers(newAnswers);

    if (contextStep + 1 < CONTEXT_QUESTIONS.length) {
      setContextStep(prev => prev + 1);
    } else {
      // Terminaron todas las preguntas → guardar y arrancar survey
      handleStart(newAnswers);
    }
  };

  const handleContextBack = () => {
    if (contextStep === 0) {
      setMode("form");
    } else {
      setContextStep(prev => prev - 1);
    }
  };

  const handleStart = async (ctx: Record<string, string>) => {
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
        edad: ctx.edad,
        situacion_laboral: ctx.situacion_laboral,
        tipo_vivienda: ctx.tipo_vivienda,
        personas_cargo: ctx.personas_cargo,
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
      if (!data || data.length === 0) {
        setReturnError("No encontramos un diagnóstico con ese DNI.");
        setLoadingReturn(false);
        return;
      }
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
    } catch (e) {
      setReturnError("Error al buscar tu diagnóstico.");
    }
    setLoadingReturn(false);
  };

  // ─── PANTALLA 1: Landing ────────────────────────────────────────────────────
  if (mode === "landing") {
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#F0EEFF] overflow-hidden">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-col items-center pt-10 pb-2">
          <div className="flex items-center gap-2">
            <img src={koraiLogo} alt="KORAI logo" className="w-9 h-9 object-contain" />
            <span style={{fontFamily: "'Montserrat', sans-serif"}} className="text-3xl font-black text-[#2D1B69] tracking-tight">KORAI</span>
          </div>
          <p style={{fontFamily: "'Montserrat', sans-serif"}} className="text-[#9B8EC4] text-xs mt-1">Tu asistente de bienestar comunitario</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
          className="flex justify-center items-center flex-1 px-4">
          <img src={oraiMujer} alt="KORAI ilustración" className="w-72 h-72 object-contain drop-shadow-[0_4px_30px_rgba(124,92,255,0.2)]" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
          className="flex flex-col items-center px-5 pb-8 gap-3 w-full max-w-sm mx-auto">
          <div className="text-center">
            <h2 style={{fontFamily: "'Montserrat', sans-serif"}} className="text-xl font-black text-[#2D1B69] leading-tight">Estás a punto de comenzar.</h2>
            <Heart className="w-3.5 h-3.5 text-purple-400 mx-auto mt-1" />
          </div>
          <div className="space-y-2 w-full">
            {[
              { icon: CheckCircle, text: "No hay respuestas correctas o incorrectas." },
              { icon: Heart, text: "Contanos cómo estás." },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/80 border border-purple-100 shadow-sm">
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <p style={{fontFamily: "'Montserrat', sans-serif"}} className="text-xs text-[#2D1B69] font-semibold text-left">{text}</p>
              </motion.div>
            ))}
          </div>
          <div className="w-full space-y-2 pt-1">
            <Button onClick={() => setMode("form")}
              className="w-full h-12 text-base font-bold rounded-2xl bg-[#5B21B6] hover:bg-[#4C1D95] active:scale-[0.98] transition-all shadow-lg shadow-purple-400/40 flex items-center justify-center gap-2"
              style={{fontFamily: "'Montserrat', sans-serif"}}>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              Comenzar diagnóstico
            </Button>
            <button onClick={() => setMode("returning")}
              className="w-full py-1.5 text-xs text-[#7B6BAE] hover:text-[#2D1B69] transition-colors"
              style={{fontFamily: "'Montserrat', sans-serif"}}>
              Ya hice mi diagnóstico → Ver mis resultados
            </button>
            <p className="text-[10px] text-[#9D8EC4] text-center">🔒 Tu información es confidencial · Menos de 3 minutos</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── PANTALLA 2: Datos básicos ──────────────────────────────────────────────
  if (mode === "form") {
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#070A13]">
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <div className="flex items-center px-5 pt-6 pb-2">
          <button onClick={() => setMode("landing")} className="text-white/40 hover:text-white transition-colors p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col px-5 pt-4 pb-8 max-w-sm mx-auto w-full space-y-6">

          <div>
            <h1 style={{fontFamily: "'Montserrat', sans-serif"}} className="text-2xl font-black text-white">Antes de comenzar</h1>
            <p className="text-white/40 text-sm mt-1">Tus datos se guardan de forma segura y encriptada.</p>
          </div>

          {/* Nombre */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-white/60 text-xs font-bold uppercase tracking-wider">Nombre</label>
              <Input placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)}
                className="bg-white/5 border-white/10 h-11 text-sm text-white placeholder:text-white/20 focus:border-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/60 text-xs font-bold uppercase tracking-wider">Apellido</label>
              <Input placeholder="Tu apellido" value={apellido} onChange={e => setApellido(e.target.value)}
                className="bg-white/5 border-white/10 h-11 text-sm text-white placeholder:text-white/20 focus:border-primary/50" />
            </div>
          </div>

          {/* DNI */}
          <div className="space-y-1.5">
            <label className="text-white/60 text-xs font-bold uppercase tracking-wider">DNI *</label>
            <Input placeholder="Ingresá tu DNI" value={dni} onChange={e => { setDni(e.target.value); setFormError(""); }}
              className="bg-white/5 border-white/10 h-11 text-sm text-white placeholder:text-white/20 focus:border-primary/50"
              data-testid="input-dni" />
            <p className="text-[10px] text-white/25">Tu DNI se guarda encriptado. Lo usás para volver a ver tu diagnóstico.</p>
          </div>

          {/* Barrio */}
          <div className="space-y-1.5">
            <label className="text-white/60 text-xs font-bold uppercase tracking-wider">Barrio</label>
            <Select onValueChange={setNeighborhood}>
              <SelectTrigger className="bg-white/5 border-white/10 h-11 text-sm text-white focus:border-primary/50">
                <SelectValue placeholder="Seleccioná tu barrio" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f1220] border-white/10 text-white max-h-60">
                {BARRIOS_CABA.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <label className="text-white/60 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> WhatsApp
            </label>
            <Input placeholder="Ej: 1155556666" value={telefono} onChange={e => setTelefono(e.target.value)}
              className="bg-white/5 border-white/10 h-11 text-sm text-white placeholder:text-white/20 focus:border-primary/50" />
            <p className="text-[10px] text-white/25">Para enviarte recursos y hacer seguimiento de tu situación.</p>
          </div>

          {formError && <p className="text-red-400 text-sm text-center">{formError}</p>}

          <Button onClick={handleFormNext}
            className="w-full h-12 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            style={{fontFamily: "'Montserrat', sans-serif"}}>
            Continuar <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-[10px] text-white/20 text-center">Tu participación es confidencial y ayuda a mejorar tu comunidad.</p>
        </motion.div>
      </div>
    );
  }

  // ─── PANTALLA 3: Preguntas de contexto gamificadas ──────────────────────────
  if (mode === "context") {
    return (
      <AnimatePresence mode="wait">
        <ContextQuestion
          key={contextStep}
          question={CONTEXT_QUESTIONS[contextStep]}
          stepNum={contextStep + 1}
          totalSteps={CONTEXT_QUESTIONS.length}
          onSelect={handleContextSelect}
          onBack={handleContextBack}
        />
      </AnimatePresence>
    );
  }

  // ─── PANTALLA 4: Ver diagnóstico anterior ───────────────────────────────────
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#070A13] relative overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[100px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <div className="text-4xl mb-3">👋</div>
          <h1 style={{fontFamily: "'Montserrat', sans-serif"}} className="text-2xl font-black text-white">¡Hola de nuevo!</h1>
          <p className="text-white/50 text-sm">Ingresá tu DNI para ver tu plan personalizado</p>
        </div>

        <GlassCard className="p-6 space-y-4 border-t border-white/10 shadow-2xl">
          <div className="space-y-1.5">
            <label className="text-white/60 text-xs font-bold uppercase tracking-wider">DNI</label>
            <Input placeholder="Ingresá tu DNI"
              className="bg-black/20 border-white/10 h-12 text-base text-white focus:ring-primary/50 placeholder:text-white/20"
              value={returningDni}
              onChange={e => { setReturningDni(e.target.value); setReturnError(""); }} />
            {returnError && <p className="text-xs text-red-400">{returnError}</p>}
          </div>
          <Button onClick={handleReturning} disabled={loadingReturn}
            className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25">
            {loadingReturn ? "Buscando..." : "Ver mi diagnóstico"} <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </GlassCard>

        <button onClick={() => setMode("landing")} className="w-full text-xs text-white/30 hover:text-white/50 transition-colors py-2">
          ← Volver
        </button>
      </motion.div>
    </div>
  );
}
