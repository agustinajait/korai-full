import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Shield, Users, Loader2, AlertCircle } from "lucide-react";

const SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4";

interface Tenant {
  id: string;
  nombre: string;
  slug: string;
  logo_url?: string;
  color_primario?: string;
  color_secundario?: string;
  bienvenida_titulo?: string;
  bienvenida_subtitulo?: string;
}

interface Campaign {
  id: string;
  nombre: string;
  tenant_id: string;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "99, 102, 241";
}

export default function MunicipioLanding() {
  const [, params] = useRoute("/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug ?? "";

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetchTenant();
  }, [slug]);

  async function fetchTenant() {
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}&activo=eq.true&limit=1`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await res.json();
      if (!Array.isArray(data) || !data[0]) { setNotFound(true); setLoading(false); return; }
      const t = data[0] as Tenant;
      setTenant(t);

      // Fetch campaign
      const campRes = await fetch(
        `${SUPABASE_URL}/rest/v1/campaigns?tenant_id=eq.${t.id}&activo=eq.true&limit=1`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const campData = await campRes.json();
      if (Array.isArray(campData) && campData[0]) setCampaign(campData[0] as Campaign);
    } catch {
      setNotFound(true);
    }
    setLoading(false);
  }

  function startDiagnosis() {
    if (tenant) {
      localStorage.setItem("korai_context", JSON.stringify({
        tenant_id: tenant.id,
        campaign_id: campaign?.id ?? null,
        slug,
      }));
    }
    setLocation("/survey");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-bold text-center">Municipio no encontrado</h1>
        <p className="text-sm text-muted-foreground text-center">
          El enlace que usaste no corresponde a ningún municipio activo.
        </p>
        <button onClick={() => setLocation("/")} className="text-sm text-primary underline">Volver al inicio</button>
      </div>
    );
  }

  const primary = tenant?.color_primario ?? "#6366f1";
  const secondary = tenant?.color_secundario ?? "#8b5cf6";
  const primaryRgb = hexToRgb(primary);
  const titulo = tenant?.bienvenida_titulo ?? `Diagnóstico Social - ${tenant?.nombre}`;
  const subtitulo = tenant?.bienvenida_subtitulo ?? "Respondé unas preguntas y conectamos con los recursos que necesitás.";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(135deg, #0a0a0f 0%, #111118 60%, #0d0d16 100%)`,
      }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] opacity-25"
          style={{ background: primary }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] opacity-10"
          style={{ background: secondary }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.nombre} className="h-10 w-auto object-contain" />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg"
              style={{ background: primary }}
            >
              {tenant?.nombre?.charAt(0) ?? "K"}
            </div>
          )}
          <span className="text-white font-semibold text-sm opacity-80">{tenant?.nombre}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/40">Activo</span>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-lg w-full"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 border"
            style={{
              background: `rgba(${primaryRgb}, 0.12)`,
              borderColor: `rgba(${primaryRgb}, 0.3)`,
              color: primary,
            }}
          >
            <MapPin className="w-3.5 h-3.5" />
            {tenant?.nombre}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-5"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            {titulo}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base sm:text-lg text-white/55 leading-relaxed mb-10 max-w-md mx-auto"
          >
            {subtitulo}
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={startDiagnosis}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-base transition-all duration-200 hover:scale-105 active:scale-100 shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
                boxShadow: `0 20px 60px rgba(${primaryRgb}, 0.35)`,
              }}
            >
              Iniciar diagnóstico gratuito
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 flex items-center justify-center gap-6 text-white/30 text-xs"
          >
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Datos protegidos
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Anónimo y voluntario
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>2 min</span>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-5 text-white/20 text-xs">
        Powered by{" "}
        <span className="text-white/40 font-semibold">Korai</span>
      </footer>
    </div>
  );
}
