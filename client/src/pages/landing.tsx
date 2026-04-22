import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Shield, Sparkles } from "lucide-react";
import logoImg from "@assets/korai-logo.png";

export default function Landing() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#070A13]">
      
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-sm flex flex-col items-center text-center space-y-8"
      >
        {/* Logo */}
        <motion.img
          src={logoImg}
          alt="KORAI"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="w-20 h-20 object-contain drop-shadow-[0_0_40px_rgba(0,200,255,0.5)]"
        />

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight">KORAI</h1>
          <p className="text-white/50 text-sm">Tu asistente de bienestar comunitario</p>
        </div>

        {/* Illustration area — SVG humanizado */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative w-full"
        >
          {/* Card con ilustración SVG */}
          <div className="relative bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/20 rounded-[32px] p-8 overflow-hidden">
            
            {/* Decorative circles */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl" />

            {/* SVG ilustración simple y emotiva */}
            <svg viewBox="0 0 200 160" className="w-full max-w-[220px] mx-auto" fill="none">
              {/* Fondo circular suave */}
              <ellipse cx="100" cy="130" rx="70" ry="15" fill="rgba(124,92,255,0.1)" />
              
              {/* Cuerpo persona */}
              <ellipse cx="100" cy="95" rx="28" ry="35" fill="rgba(124,92,255,0.3)" />
              
              {/* Cabeza */}
              <circle cx="100" cy="55" r="22" fill="rgba(255,220,190,0.9)" />
              
              {/* Cabello */}
              <ellipse cx="100" cy="42" rx="22" ry="14" fill="rgba(80,50,120,0.8)" />
              <ellipse cx="78" cy="55" rx="8" ry="16" fill="rgba(80,50,120,0.8)" />
              <ellipse cx="122" cy="55" rx="8" ry="16" fill="rgba(80,50,120,0.8)" />
              
              {/* Ojos cerrados — expresión de paz */}
              <path d="M92 57 Q96 54 100 57" stroke="rgba(80,50,120,0.6)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M100 57 Q104 54 108 57" stroke="rgba(80,50,120,0.6)" strokeWidth="1.5" strokeLinecap="round" />
              
              {/* Sonrisa */}
              <path d="M94 63 Q100 68 106 63" stroke="rgba(200,100,100,0.7)" strokeWidth="1.5" strokeLinecap="round" />
              
              {/* Manos con corazón */}
              <ellipse cx="85" cy="100" rx="10" ry="8" fill="rgba(255,220,190,0.9)" />
              <ellipse cx="115" cy="100" rx="10" ry="8" fill="rgba(255,220,190,0.9)" />
              
              {/* Corazón en el centro */}
              <path d="M96 97 C96 94 92 91 92 95 C92 99 100 104 100 104 C100 104 108 99 108 95 C108 91 104 94 104 97 C104 94 100 91 100 94 C100 91 96 94 96 97Z" fill="rgba(124,92,255,0.8)" />
              
              {/* Plantas/hojas decorativas izquierda */}
              <path d="M30 120 Q20 100 35 90 Q45 80 40 100" fill="rgba(34,197,94,0.3)" />
              <path d="M25 115 Q15 95 30 88" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5" />
              <path d="M42 125 Q35 108 48 100 Q55 92 52 110" fill="rgba(34,197,94,0.25)" />
              
              {/* Plantas/hojas decorativas derecha */}
              <path d="M170 120 Q180 100 165 90 Q155 80 160 100" fill="rgba(34,197,94,0.3)" />
              <path d="M175 115 Q185 95 170 88" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5" />
              <path d="M158 125 Q165 108 152 100 Q145 92 148 110" fill="rgba(34,197,94,0.25)" />

              {/* Elementos flotantes — corazón arriba izquierda */}
              <circle cx="55" cy="45" r="14" fill="rgba(124,92,255,0.15)" />
              <path d="M51 44 C51 42 49 40 49 43 C49 46 55 49 55 49 C55 49 61 46 61 43 C61 40 59 42 59 44 C59 42 57 40 57 42 C57 40 55 42 55 44 C55 42 53 40 53 42 C53 40 51 42 51 44Z" fill="rgba(124,92,255,0.6)" />

              {/* Elemento flotante — persona arriba derecha */}
              <circle cx="148" cy="40" r="14" fill="rgba(0,200,200,0.15)" />
              <circle cx="148" cy="36" r="5" fill="rgba(0,200,200,0.5)" />
              <ellipse cx="148" cy="48" rx="7" ry="6" fill="rgba(0,200,200,0.4)" />
            </svg>
          </div>
        </motion.div>

        {/* Texto empático */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="space-y-5 w-full"
        >
          <h2 className="text-2xl font-black text-white leading-tight">
            En pocos minutos vamos a entender mejor tu situación.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Te acompañamos a identificar qué es lo que realmente te importa resolver, y te conectamos con los recursos concretos que tenés disponibles hoy.
          </p>

          {/* Los 3 mensajes */}
          <div className="space-y-3 text-left">
            {[
              { icon: Sparkles, text: "Estás a punto de comenzar.", color: "text-primary" },
              { icon: Shield, text: "No hay respuestas correctas o incorrectas.", color: "text-cyan-400" },
              { icon: Heart, text: "Contanos cómo estás, así podemos ayudarte de verdad.", color: "text-pink-400" },
            ].map(({ icon: Icon, text, color }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5"
              >
                <div className={`p-1.5 rounded-full bg-white/5 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm text-white/80 font-medium">{text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Botón */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="w-full space-y-3"
        >
          <Button
            onClick={() => setLocation("/welcome")}
            className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
          >
            Comenzar diagnóstico <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <button
            onClick={() => setLocation("/welcome")}
            className="w-full text-xs text-white/30 hover:text-white/50 transition-colors py-2"
          >
            Tu información es confidencial y está protegida 🔒
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
