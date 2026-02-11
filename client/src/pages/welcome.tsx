import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Target } from "lucide-react";
import logoImg from "@assets/logo.png_1770738353179.png";
import { useState } from "react";
import { CITIES } from "@/lib/instrument";
import { hashDNI } from "@/lib/korai-logic";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Welcome() {
  const [_, setLocation] = useLocation();
  const [city, setCity] = useState("");
  const [dni, setDni] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [hasChildren, setHasChildren] = useState("");
  const [hasAdults, setHasAdults] = useState("");
  const [showMore, setShowMore] = useState(false);

  const handleStart = async () => {
    if (!city) return;

    let dniHash = "";
    if (dni.trim()) {
      dniHash = await hashDNI(dni);
      localStorage.setItem("korai_user_dni_hash_v1", dniHash);
    }
    
    localStorage.setItem("korai_context", JSON.stringify({ 
      city, 
      neighborhood,
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
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mb-4"
          >
            <img src={logoImg} alt="KORAI" className="w-28 h-28 object-contain mx-auto drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]" />
          </motion.div>
          <h1 className="text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
            KORAI
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Tu asistente de bienestar comunitario
          </p>
        </div>

        <GlassCard className="p-8 space-y-6 border-t border-white/10 shadow-2xl shadow-black/50">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/80 font-display">¿En qué ciudad vives?</Label>
              <Select onValueChange={setCity}>
                <SelectTrigger className="bg-black/20 border-white/10 h-12 text-lg focus:ring-primary/50">
                  <SelectValue placeholder="Selecciona tu ciudad" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 text-white">
                  {CITIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white/80 font-display">DNI (opcional)</Label>
              <Input 
                placeholder="Ingresa tu DNI" 
                className="bg-black/20 border-white/10 h-12 text-lg focus:ring-primary/50 placeholder:text-white/20"
                value={dni}
                onChange={e => setDni(e.target.value)}
                data-testid="input-dni"
              />
              <p className="text-[10px] text-white/40">Se guarda solo un hash seguro, nunca tu DNI real.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-white/80 font-display">Barrio</Label>
              <Input 
                placeholder="Tu barrio (opcional)" 
                className="bg-black/20 border-white/10 h-12 text-lg focus:ring-primary/50 placeholder:text-white/20"
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                data-testid="input-neighborhood"
              />
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setShowMore(!showMore)}
                className="text-xs font-bold text-primary/80 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider"
              >
                {showMore ? "Ocultar opciones" : "Más opciones"}
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
                        {['18-29','30-39','40-49','50-59','60+'].map(x => (
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
                        {['soltero/a','casado/a','conviviente','separado/a','viudo/a','prefiero no decir'].map(x => (
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

          <div className="pt-4">
            <Button 
              onClick={handleStart}
              disabled={!city}
              className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:to-primary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
            >
              Comenzar Diagnóstico <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          <p className="text-xs text-center text-white/30 leading-relaxed">
            Tu participación es anónima y ayuda a mejorar tu comunidad.
          </p>
        </GlassCard>

        <div className="flex gap-4">
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full h-12 border-white/10 bg-white/5 hover:bg-white/10">
              Ver Dashboard
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full h-12 border-white/10 bg-white/5 hover:bg-white/10">
              Ciudadano
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <GlassCard className="p-4 flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors cursor-default">
             <div className="p-2 rounded-full bg-green-500/20 text-green-400">
               <Target className="w-5 h-5" />
             </div>
             <div className="text-xs text-white/60 font-medium leading-tight">Mide tu calidad de vida</div>
           </GlassCard>
           <GlassCard className="p-4 flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors cursor-default">
             <div className="p-2 rounded-full bg-orange-500/20 text-orange-400">
               <MapPin className="w-5 h-5" />
             </div>
             <div className="text-xs text-white/60 font-medium leading-tight">Mapa en tiempo real</div>
           </GlassCard>
        </div>
      </motion.div>
    </div>
  );
}
