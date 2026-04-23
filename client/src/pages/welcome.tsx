import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Heart, Briefcase, Home, BookOpen, Shield, Users, Phone, Sparkles, CheckCircle } from "lucide-react";
import { useState } from "react";
import { hashDNI } from "@/lib/korai-logic";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import oraiMujer from "@/lib/oraiMujer";

const BARRIOS_CABA = [
  "Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo",
  "Caballito", "Chacarita", "Coghlan", "Colegiales", "Constitución",
  "Flores", "Floresta", "La Boca", "La Paternal", "Liniers", "Mataderos",
  "Monte Castro", "Montserrat", "Nueva Pompeya", "Núñez", "Palermo",
  "Parque Avellaneda", "Parque Chacabuco", "Parque Chas", "Parque Patricios",
  "Puerto Madero", "Recoleta", "Retiro", "Saavedra", "San Cristóbal",
  "San Nicolás", "San Telmo", "Tribunales", "Versalles", "Villa Crespo",
  "Villa del Parque", "Villa Devoto", "Villa General Mitre", "Villa Gorriti",
  "Villa Lugano", "Villa Luro", "Villa Ortúzar", "Villa Pueyrredón",
  "Villa Real", "Villa Riachuelo", "Villa Santa Rita", "Villa Soldati",
  "Villa Urquiza"
];

const AREAS = [
  { icon: Heart, label: "Salud", color: "text-red-400", bg: "bg-red-500/20" },
  { icon: Briefcase, label: "Trabajo", color: "text-blue-400", bg: "bg-blue-500/20" },
  { icon: Home, label: "Vivienda", color: "text-orange-400", bg: "bg-orange-500/20" },
  { icon: BookOpen, label: "Educación", color: "text-green-400", bg: "bg-green-500/20" },
  { icon: Shield, label: "Previsión", color: "text-purple-400", bg: "bg-purple-500/20" },
  { icon: Users, label: "Cultura", color: "text-yellow-400", bg: "bg-yellow-500/20" },
];

export default function Welcome() {
  const [_, setLocation] = useLocation();
  const [mode, setMode] = useState<"landing" | "form" | "returning">("landing");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [hasChildren, setHasChildren] = useState("");
  const [hasAdults, setHasAdults] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [returningDni, setReturningDni] = useState("");
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [returnError, setReturnError] = useState("");

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
      demographics: { ageRange, civilStatus, hasChildren, hasAdults, dniHash, nombre: nombre.trim(), apellido: apellido.trim() }
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

  // PANTALLA 1: Landing con ilustración
  if (mode === "landing") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-5 py-4 relative overflow-hidden bg-[#F0EEFF]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm flex flex-col items-center text-center gap-3"
        >
          {/* Logo — compacto, horizontal */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow shadow-purple-300/50">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="text-2xl font-black text-[#2D1B69] tracking-tight">KORAI</div>
          </div>
          <p className="text-[#7B6BAE] text-xs -mt-1">Tu asistente de bienestar comunitario</p>

          {/* Ilustración — más chica */}
          <motion.img
            src={oraiMujer}
            alt="KORAI ilustración"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-52 h-52 object-contain drop-shadow-[0_0_30px_rgba(124,92,255,0.25)]"
          />

          {/* Título */}
          <div>
            <h2 className="text-xl font-black text-[#2D1B69] leading-tight">
              Estás a punto de comenzar.
            </h2>
            <Heart className="w-3.5 h-3.5 text-purple-400 mx-auto mt-1" />
          </div>

          {/* 2 mensajes — más compactos */}
          <div className="space-y-2 w-full">
            {[
              { icon: CheckCircle, text: "No hay respuestas correctas o incorrectas." },
              { icon: Heart, text: "Contanos cómo estás." },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/70 border border-purple-100"
              >
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <p className="text-xs text-[#2D1B69] font-medium text-left">{text}</p>
              </motion.div>
            ))}
          </div>

          {/* Botones */}
          <div className="w-full space-y-2 pt-1">
            <Button
              onClick={() => setMode("form")}
              className="w-full h-12 text-base font-bold rounded-2xl bg-[#5B21B6] hover:bg-[#4C1D95] active:scale-[0.98] transition-all shadow-lg shadow-purple-400/40 flex items-center justify-center gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              Comenzar diagnóstico
            </Button>
            <button
              onClick={() => setMode("returning")}
              className="w-full py-1.5 text-xs text-[#7B6BAE] hover:text-[#2D1B69] transition-colors"
            >
              Ya hice mi diagnóstico → Ver mis resultados
            </button>
            <p className="text-[10px] text-[#9D8EC4] text-center">🔒 Tu información es confidencial · Menos de 3 minutos</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // PANTALLA 2: Formulario
  if (mode === "form") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-5"
        >
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black text-white">Antes de comenzar</h1>
            <p className="text-white/50 text-sm">Estos datos nos permiten acompañarte mejor y hacer seguimiento de tu situación.</p>
          </div>

          {/* 6 áreas */}
          <div className="grid grid-cols-3 gap-2">
            {AREAS.map(({ icon: Icon, label, color, bg }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className={`p-2 rounded-full ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-[10px] text-white/60 font-medium">{label}</span>
              </div>
            ))}
          </div>

          <GlassCard className="p-6 space-y-4 border-t border-white/10 shadow-2xl shadow-black/50">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-white/80 text-sm">Nombre</Label>
                <Input
                  placeholder="Tu nombre"
                  className="bg-black/20 border-white/10 h-11 text-sm focus:ring-primary/50 placeholder:text-white/20"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/80 text-sm">Apellido</Label>
                <Input
                  placeholder="Tu apellido"
                  className="bg-black/20 border-white/10 h-11 text-sm focus:ring-primary/50 placeholder:text-white/20"
                  value={apellido}
                  onChange={e => setApellido(e.target.value)}
                />
              </div>
            </div>

            {/* DNI */}
            <div className="space-y-1.5">
              <Label className="text-white/80 text-sm">DNI</Label>
              <Input
                placeholder="Ingresá tu DNI"
                className="bg-black/20 border-white/10 h-11 text-sm focus:ring-primary/50 placeholder:text-white/20"
                value={dni}
                onChange={e => setDni(e.target.value)}
                data-testid="input-dni"
              />
              <p className="text-[10px] text-white/30">Tu DNI se guarda encriptado. Lo necesitás para volver a ver tu diagnóstico.</p>
            </div>

            {/* Barrio */}
            <div className="space-y-1.5">
              <Label className="text-white/80 text-sm">Barrio</Label>
              <Select onValueChange={setNeighborhood}>
                <SelectTrigger className="bg-black/20 border-white/10 h-11 text-sm focus:ring-primary/50">
                  <SelectValue placeholder="Seleccioná tu barrio" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 text-white max-h-60">
                  {BARRIOS_CABA.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <Label className="text-white/80 text-sm flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Teléfono WhatsApp
              </Label>
              <Input
                placeholder="Ej: 1155556666"
                className="bg-black/20 border-white/10 h-11 text-sm focus:ring-primary/50 placeholder:text-white/20"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
              />
              <p className="text-[10px] text-white/30">Para enviarte recursos y seguimiento por WhatsApp.</p>
            </div>

            {/* Más opciones */}
            <div>
              <button
                onClick={() => setShowMore(!showMore)}
                className="text-xs font-bold text-primary/70 hover:text-primary transition-colors uppercase tracking-wider"
              >
                {showMore ? "− Ocultar datos opcionales" : "+ Datos opcionales"}
              </button>
              {showMore && (
                <div className="grid grid-cols-2 gap-3 mt-3 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-white/50 uppercase">Edad</Label>
                    <Select onValueChange={setAgeRange}>
                      <SelectTrigger className="bg-black/20 border-white/10 h-10 text-sm">
                        <SelectValue placeholder="Rango..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white">
                        {['18-29', '30-39', '40-49', '50-59', '60+'].map(x => (
                          <SelectItem key={x} value={x}>{x}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-white/50 uppercase">Estado Civil</Label>
                    <Select onValueChange={setCivilStatus}>
                      <SelectTrigger className="bg-black/20 border-white/10 h-10 text-sm">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white">
                        {['Soltero/a', 'Casado/a', 'Conviviente', 'Separado/a', 'Viudo/a', 'Prefiero no decir'].map(x => (
                          <SelectItem key={x} value={x}>{x}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-white/50 uppercase">Hijos a cargo</Label>
                    <Select onValueChange={setHasChildren}>
                      <SelectTrigger className="bg-black/20 border-white/10 h-10 text-sm">
                        <SelectValue placeholder="..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white">
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Sí">Sí</SelectItem>
                        <SelectItem value="Prefiero no decir">Prefiero no decir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-white/50 uppercase">Adultos a cargo</Label>
                    <Select onValueChange={setHasAdults}>
                      <SelectTrigger className="bg-black/20 border-white/10 h-10 text-sm">
                        <SelectValue placeholder="..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white">
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Sí">Sí</SelectItem>
                        <SelectItem value="Prefiero no decir">Prefiero no decir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Botón */}
            <div className="pt-2">
              <Button
                onClick={handleStart}
                className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:to-primary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
              >
                Comenzar mi diagnóstico <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <p className="text-xs text-center text-white/25">Tu participación es confidencial y ayuda a mejorar tu comunidad.</p>
          </GlassCard>

          <button onClick={() => setMode("landing")} className="w-full text-xs text-white/30 hover:text-white/50 transition-colors py-2">
            ← Volver
          </button>

          <button
            onClick={() => { localStorage.clear(); setMode("landing"); }}
            className="w-full text-xs text-red-400/50 hover:text-red-400 transition-colors py-1"
          >
            Salir y borrar datos
          </button>
        </motion.div>
      </div>
    );
  }

  // PANTALLA 3: Ver diagnóstico anterior
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-5"
      >
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black text-white">Ver mi diagnóstico</h1>
          <p className="text-white/50 text-sm">Ingresá tu DNI para acceder a tu plan personalizado</p>
        </div>

        <GlassCard className="p-6 space-y-4 border-t border-white/10 shadow-2xl">
          <div className="space-y-1.5">
            <Label className="text-white/80 text-sm">DNI</Label>
            <Input
              placeholder="Ingresá tu DNI"
              className="bg-black/20 border-white/10 h-12 text-base focus:ring-primary/50 placeholder:text-white/20"
              value={returningDni}
              onChange={e => { setReturningDni(e.target.value); setReturnError(""); }}
            />
            {returnError && <p className="text-xs text-red-400">{returnError}</p>}
          </div>

          <Button
            onClick={handleReturning}
            disabled={loadingReturn}
            className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 transition-all shadow-lg shadow-primary/25"
          >
            {loadingReturn ? "Buscando..." : "Ver mi diagnóstico"} <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </GlassCard>

        <button onClick={() => setMode("landing")} className="w-full text-xs text-white/30 hover:text-white/50 transition-colors py-2">
          ← Volver
        </button>
      </motion.div>
    </div>
  );
}
