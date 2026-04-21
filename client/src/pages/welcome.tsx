import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MapPin, Target, Heart, Briefcase, Home, BookOpen, Shield, Users } from "lucide-react";
import logoImg from "@assets/logo.png_1770738353179.png";
import { useState } from "react";
import { hashDNI } from "@/lib/korai-logic";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
  "Villa Urquiza", "Villa del Parque"
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
  const [city, setCity] = useState("Buenos Aires");
  const [dni, setDni] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [hasChildren, setHasChildren] = useState("");
  const [hasAdults, setHasAdults] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [mode, setMode] = useState<"new" | "returning">("new");
  const [returningDni, setReturningDni] = useState("");
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [returnError, setReturnError] = useState("");

  const handleStart = async () => {
    if (!city) return;

    let dniHash = "";
    if (dni.trim()) {
      dniHash = await hashDNI(dni);
      localStorage.setItem("korai_user_dni_hash_v1", dniHash);
      localStorage.setItem("korai_user_dni", dni.trim());
    }

    localStorage.setItem("korai_context", JSON.stringify({
      city,
      neighborhood,
      dni: dni.trim() || `anonimo-${Date.now()}`,
      demographics: {
        ageRange,
        civilStatus,
        hasChildren,
        hasAdults,
        dniHash
      }
    }));
    setLocation("/survey");
  };

  const handleReturning = async () => {
    if (!returningDni.trim()) {
      setReturnError("Ingresá tu DNI para ver tu diagnóstico.");
      return;
    }
    setLoadingReturn(true);
    setReturnError("");

    try {
      const hash = await hashDNI(returningDni);
      const SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4";

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/responses?dni_hash=eq.${hash}&order=submitted_at.desc&limit=1`,
        {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          }
        }
      );

      const data = await res.json();

      if (!data || data.length === 0) {
        setReturnError("No encontramos un diagnóstico con ese DNI. ¿Querés hacer uno nuevo?");
        setLoadingReturn(false);
        return;
      }

      const response = data[0];
      localStorage.setItem("korai_user_answers", JSON.stringify(response.answers));
      localStorage.setItem("korai_user_dni", returningDni.trim());
      localStorage.setItem("korai_user_dni_hash_v1", hash);
      localStorage.setItem("korai_context", JSON.stringify({
        city: response.territorio?.ciudad || "Buenos Aires",
        neighborhood: response.territorio?.barrio || "",
        dni: returningDni.trim(),
      }));

      const { generatePlanDesdeScores, generarSello } = await import("@/lib/korai-logic");
      const plan = generatePlanDesdeScores(response.answers);
      localStorage.setItem("korai_user_plan_v1", JSON.stringify(plan));
      const sello = generarSello(response.territorio?.ciudad);
      localStorage.setItem("korai_user_sello_v1", JSON.stringify(sello));

      setLocation("/prioridades");
    } catch (e) {
      setReturnError("Error al buscar tu diagnóstico. Intentá de nuevo.");
    }
    setLoadingReturn(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mb-4"
          >
            <img src={logoImg} alt="KORAI" className="w-24 h-24 object-contain mx-auto drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]" />
          </motion.div>
          <h1 className="text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
            KORAI
          </h1>
          <p className="text-lg text-white/70 font-medium">
            Tu asistente de bienestar comunitario
          </p>
          <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto">
            En pocos minutos vas a conocer tu situación en las 6 áreas clave de tu vida y recibir orientación concreta sobre recursos y programas disponibles para vos.
          </p>
        </div>

        {/* Areas preview */}
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

        {/* Mode toggle */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            onClick={() => setMode("new")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === "new" ? "bg-primary text-white shadow-lg" : "text-white/50 hover:text-white"}`}
          >
            Nuevo diagnóstico
          </button>
          <button
            onClick={() => setMode("returning")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === "returning" ? "bg-primary text-white shadow-lg" : "text-white/50 hover:text-white"}`}
          >
            Ver mi diagnóstico
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === "new" ? (
            <motion.div
              key="new"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <GlassCard className="p-6 space-y-5 border-t border-white/10 shadow-2xl shadow-black/50">
                <div className="space-y-4">
                  {/* Ciudad - prefilled Buenos Aires */}
                  <div className="space-y-2">
                    <Label className="text-white/80 font-display text-sm">Ciudad</Label>
                    <div className="h-12 bg-black/20 border border-white/10 rounded-lg flex items-center px-4 text-white/70">
                      Buenos Aires
                    </div>
                  </div>

                  {/* Barrio */}
                  <div className="space-y-2">
                    <Label className="text-white/80 font-display text-sm">Barrio</Label>
                    <Select onValueChange={setNeighborhood}>
                      <SelectTrigger className="bg-black/20 border-white/10 h-12 text-base focus:ring-primary/50">
                        <SelectValue placeholder="Seleccioná tu barrio" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white max-h-60">
                        {BARRIOS_CABA.map(b => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* DNI */}
                  <div className="space-y-2">
                    <Label className="text-white/80 font-display text-sm">DNI</Label>
                    <Input
                      placeholder="Ingresá tu DNI"
                      className="bg-black/20 border-white/10 h-12 text-base focus:ring-primary/50 placeholder:text-white/20"
                      value={dni}
                      onChange={e => setDni(e.target.value)}
                      data-testid="input-dni"
                    />
                    <p className="text-[10px] text-white/30">Se guarda solo un hash seguro, nunca tu DNI real. Necesario para ver tu diagnóstico después.</p>
                  </div>

                  {/* Más opciones */}
                  <div className="pt-1">
                    <button
                      onClick={() => setShowMore(!showMore)}
                      className="text-xs font-bold text-primary/80 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider"
                    >
                      {showMore ? "Ocultar opciones" : "+ Datos opcionales"}
                    </button>

                    {showMore && (
                      <div className="grid grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
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
                              <SelectItem value="No decir">No decir</SelectItem>
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
                              <SelectItem value="No decir">No decir</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleStart}
                  className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:to-primary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
                >
                  Comenzar mi diagnóstico <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <p className="text-xs text-center text-white/30 leading-relaxed">
                  Tu participación es anónima y ayuda a mejorar tu comunidad.
                </p>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="returning"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassCard className="p-6 space-y-5 border-t border-white/10 shadow-2xl shadow-black/50">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-white">Ver mi diagnóstico anterior</h3>
                  <p className="text-sm text-white/50">Ingresá tu DNI para acceder a tu plan personalizado</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80 font-display text-sm">DNI</Label>
                  <Input
                    placeholder="Ingresá tu DNI"
                    className="bg-black/20 border-white/10 h-12 text-base focus:ring-primary/50 placeholder:text-white/20"
                    value={returningDni}
                    onChange={e => { setReturningDni(e.target.value); setReturnError(""); }}
                  />
                  {returnError && (
                    <p className="text-xs text-red-400">{returnError}</p>
                  )}
                </div>

                <Button
                  onClick={handleReturning}
                  disabled={loadingReturn}
                  className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:to-primary transition-all shadow-lg shadow-primary/25"
                >
                  {loadingReturn ? "Buscando..." : "Ver mi diagnóstico"} <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <p className="text-xs text-center text-white/30">
                  Si no hiciste un diagnóstico antes, seleccioná "Nuevo diagnóstico"
                </p>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard link */}
        <Link href="/dashboard">
          <Button variant="outline" className="w-full h-11 border-white/10 bg-white/5 hover:bg-white/10 text-sm">
            Ver Dashboard Institucional
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
