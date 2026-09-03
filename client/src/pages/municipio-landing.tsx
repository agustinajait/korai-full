import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Loader2, AlertCircle, Clock, Lock, Users } from "lucide-react";
import koraiLogo from "@/lib/koraiLogo";
import fliaImg from "@/lib/fliaImg";

if (typeof document !== "undefined" && !document.getElementById("montserrat-font")) {
  const link = document.createElement("link");
  link.id = "montserrat-font";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap";
  document.head.appendChild(link);
}

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

export default function MunicipioLanding() {
  const [, params] = useRoute("/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug ?? "";

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(
      `${SUPABASE_URL}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}&activo=eq.true&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    )
      .then(r => r.json())
      .then(async (data) => {
        if (!Array.isArray(data) || !data[0]) { setNotFound(true); setLoading(false); return; }
        const t = data[0] as Tenant;
        setTenant(t);
        const cr = await fetch(
          `${SUPABASE_URL}/rest/v1/campaigns?tenant_id=eq.${t.id}&activo=eq.true&limit=1`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        const camps = await cr.json();
        if (Array.isArray(camps) && camps[0]) setCampaignId(camps[0].id);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  function startDiagnosis() {
    if (tenant) {
      localStorage.setItem("korai_context", JSON.stringify({
        tenant_id: tenant.id,
        campaign_id: campaignId,
        slug,
      }));
    }
    // Flag de sesión para saltar la home genérica (se borra al cerrar pestaña)
    sessionStorage.setItem("korai_from_municipio", "1");
    setLocation("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F7FF" }}>
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#5c40c0" }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-5" style={{ background: "#F8F7FF" }}>
        <AlertCircle className="w-12 h-12" style={{ color: "#6B5FA0" }} />
        <h1 className="text-xl font-black text-center" style={{ fontFamily: "'Montserrat', sans-serif", color: "#1E1040" }}>
          Municipio no encontrado
        </h1>
        <p className="text-sm text-center" style={{ color: "#6B5FA0" }}>
          El enlace no corresponde a ningún municipio activo.
        </p>
        <button onClick={() => setLocation("/")} className="text-sm font-bold" style={{ color: "#5c40c0" }}>
          Ir al inicio →
        </button>
      </div>
    );
  }

  const primary = tenant?.color_primario || "#5c40c0";
  const secondary = tenant?.color_secundario || "#22C55E";
  const titulo = tenant?.bienvenida_titulo || `Diagnóstico Social`;
  const subtitulo = tenant?.bienvenida_subtitulo || "Respondé unas preguntas y te conectamos con los recursos que necesitás en tu comunidad.";

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: "#F8F7FF" }}>
      <div className="w-full max-w-sm flex flex-col min-h-screen px-5 pt-10 pb-8 gap-6">

        {/* Logo del municipio — centrado y prominente */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 pt-2">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.nombre}
              className="h-20 w-auto object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg"
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
              {tenant?.nombre?.charAt(0) ?? "M"}
            </div>
          )}
          <p className="text-xs font-bold tracking-wide uppercase"
            style={{ color: primary, fontFamily: "'Montserrat', sans-serif" }}>
            {tenant?.nombre}
          </p>
        </motion.div>

        {/* Título y subtítulo del municipio */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }} className="text-center">
          <h1 className="text-2xl font-black leading-snug mb-3"
            style={{ fontFamily: "'Montserrat', sans-serif", color: "#1E1040", textWrap: "balance" } as React.CSSProperties}>
            {titulo}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#6B5FA0", fontFamily: "'Montserrat', sans-serif" }}>
            {subtitulo}
          </p>
        </motion.div>

        {/* Imagen familia */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }} className="flex justify-center">
          <img src={fliaImg} alt="Familia"
            className="w-4/5 object-contain"
            style={{ maxHeight: "180px", filter: `drop-shadow(0 6px 20px ${primary}30)` }} />
        </motion.div>

        {/* Chips: 2 min / anónimo / gratuito */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }} className="grid grid-cols-3 gap-2">
          {[
            { icon: <Clock className="w-4 h-4" />, label: "2 minutos" },
            { icon: <Lock className="w-4 h-4" />, label: "Anónimo" },
            { icon: <Users className="w-4 h-4" />, label: "Gratuito" },
          ].map((chip, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border"
              style={{ background: "#fff", borderColor: primary + "30" }}>
              <span style={{ color: primary }}>{chip.icon}</span>
              <span className="text-[10px] font-bold"
                style={{ color: "#6B5FA0", fontFamily: "'Montserrat', sans-serif" }}>
                {chip.label}
              </span>
            </div>
          ))}
        </motion.div>

        <div className="flex-1" />

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }} className="space-y-3">
          <button onClick={startDiagnosis}
            className="w-full h-14 text-base font-black rounded-2xl shadow-lg flex items-center justify-center gap-3 text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
              boxShadow: `0 8px 32px ${primary}45`,
            }}>
            Comenzar diagnóstico <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-[10px] text-center flex items-center justify-center gap-1"
            style={{ color: "#9B8EC4", fontFamily: "'Montserrat', sans-serif" }}>
            <Shield className="w-3 h-3" /> Tu información está protegida
          </p>
        </motion.div>

        {/* Footer Korai */}
        <div className="flex items-center justify-center gap-1.5 pb-2">
          <img src={koraiLogo} alt="Korai" className="w-4 h-4 object-contain opacity-40" />
          <span className="text-[10px] font-bold opacity-40"
            style={{ fontFamily: "'Montserrat', sans-serif", color: "#6B5FA0" }}>
            Impulsado por Korai
          </span>
        </div>
      </div>
    </div>
  );
}
