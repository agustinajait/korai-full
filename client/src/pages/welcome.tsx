import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Target } from "lucide-react";
import { useState } from "react";
import { CITIES } from "@/lib/instrument";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Welcome() {
  const [_, setLocation] = useLocation();
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  const handleStart = () => {
    if (!city) return;
    
    // Save context to local storage (simple state persistence)
    localStorage.setItem("korai_context", JSON.stringify({ city, neighborhood }));
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
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 mb-4 shadow-2xl shadow-primary/30"
          >
            <span className="text-4xl font-black text-white">K</span>
          </motion.div>
          <h1 className="text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
            KORAI
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            El semáforo social inteligente
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
              <Label className="text-white/80 font-display">Barrio (Opcional)</Label>
              <Input 
                placeholder="Ej. Centro, El Sol..." 
                className="bg-black/20 border-white/10 h-12 text-lg focus:ring-primary/50 placeholder:text-white/20"
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleStart}
            disabled={!city}
            className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:to-primary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
          >
            Comenzar Diagnóstico <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

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
