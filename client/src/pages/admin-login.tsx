import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Ingresá la contraseña");
      return;
    }
    setError("");
    setLoading(true);
    if (password === "korai2025") {
      localStorage.setItem("korai_admin_auth", "true");
      setLocation("/dashboard");
    } else {
      setError("Contraseña incorrecta");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4"
          >
            <ShieldCheck className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-black tracking-tight">Panel Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Ingresá la contraseña para acceder al dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              data-testid="input-admin-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Contraseña de admin"
              className="w-full h-12 pl-11 pr-12 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
              autoFocus
            />
            <button
              type="button"
              data-testid="button-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-400 text-xs px-1"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span data-testid="text-login-error">{error}</span>
            </motion.div>
          )}

          <Button
            data-testid="button-admin-login"
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary font-bold text-sm"
          >
            {loading ? "Verificando..." : "Acceder al Dashboard"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            data-testid="link-back-home"
            onClick={() => setLocation("/")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </motion.div>
    </div>
  );
}
