import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Loader2, AlertCircle, Clock, Lock, Users, BarChart3 } from "lucide-react";
import koraiLogo from "@/lib/koraiLogo";

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

interface Area {
  id: string;
  nombre: string;
  descripcion?: string;
  emoji?: string;
  color?: string;
}

const DEFAULT_AREAS: Area[] = [
  { id: "1", nombre: "Empleo", descripcion: "Formación e inclusión", emoji: "💼", color: "#dcfce7" },
  { id: "2", nombre: "Salud", descripcion: "Cuidado más cerca de tu comunidad", emoji: "🩺", color: "#fce7f3" },
  { id: "3", nombre: "Vivienda", descripcion: "Acceso y mejora habitacional", emoji: "🏠", color: "#e0f2fe" },
  { id: "4", nombre: "Niñez y Juventud", descripcion: "Más oportunidades para crecer", emoji: "👶", color: "#fff3e0" },
  { id: "5", nombre: "Personas Mayores", descripcion: "Bienestar y vida activa", emoji: "👴", color: "#fefce8" },
  { id: "6", nombre: "Acción Social", descripcion: "Acompañamiento en los barrios", emoji: "🤝", color: "#f3e8ff" },
];

// Blob SVG decorativo
function Blob({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={{ ...style, borderRadius: "60% 40% 70% 30% / 50% 60% 40% 50%", opacity: 0.18 }} />
  );
}

export default function MunicipioLanding() {
  const [, params] = useRoute("/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug ?? "";

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
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

        // Fetch campaign
        const cr = await fetch(
          `${SUPABASE_URL}/rest/v1/campaigns?tenant_id=eq.${t.id}&activo=eq.true&limit=1`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        const camps = await cr.json();
        if (Array.isArray(camps) && camps[0]) setCampaignId(camps[0].id);

        // Fetch areas
        const ar = await fetch(
          `${SUPABASE_URL}/rest/v1/derivation_areas?tenant_id=eq.${t.id}&activo=eq.true&order=nombre.asc`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        const arData = await ar.json();
        setAreas(Array.isArray(arData) && arData.length > 0 ? arData : DEFAULT_AREAS);
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
    sessionStorage.setItem("korai_from_municipio", "1");
    setLocation("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d2b28" }}>
        <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-5" style={{ background: "#0d2b28" }}>
        <AlertCircle className="w-12 h-12 text-emerald-400" />
        <h1 className="text-xl font-black text-center text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Municipio no encontrado
        </h1>
        <button onClick={() => setLocation("/")} className="text-sm font-bold text-emerald-400">Ir al inicio →</button>
      </div>
    );
  }

  const primary = tenant?.color_primario || "#22C55E";
  const titulo = tenant?.bienvenida_titulo || `${tenant?.nombre} te acompaña`;
  const subtitulo = tenant?.bienvenida_subtitulo || "Queremos conocerte mejor, para conectarte con oportunidades y acompañarte en tu proceso.";

  // Split title: last word gets accent color
  const tituloWords = titulo.split(" ");
  const lastWord = tituloWords.pop();
  const firstPart = tituloWords.join(" ");

  const AREA_COLORS = ["#e0f7f0", "#fff3e0", "#f0e8ff", "#dcfce7", "#fefce8", "#fce7f3"];

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: "#0d2b28" }}>
      <div className="w-full max-w-sm relative overflow-hidden">

        {/* Blobs decorativos */}
        <Blob className="absolute -top-16 -left-16 w-48 h-48" style={{ background: primary }} />
        <Blob className="absolute top-32 -right-12 w-36 h-36" style={{ background: primary }} />
        <Blob className="absolute bottom-80 -left-10 w-28 h-28" style={{ background: primary }} />

        <div className="relative z-10 px-5 pt-10 pb-10 flex flex-col gap-6">

          {/* Header: logo + texto lateral */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between">
            {tenant?.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.nombre}
                className="h-16 w-auto object-contain bg-white rounded-xl p-2"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-lg"
                  style={{ background: primary }}>
                  {tenant?.nombre?.charAt(0) ?? "M"}
                </div>
                <span className="font-black text-sm text-gray-800" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {tenant?.nombre}
                </span>
              </div>
            )}
            <div className="text-right max-w-[120px]">
              <p className="text-xs font-black leading-tight text-white/70 uppercase tracking-wide"
                style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Un {tenant?.nombre}<br />más cerca<br />de su gente
              </p>
            </div>
          </motion.div>

          {/* Título grande */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="text-[36px] font-black leading-tight text-white"
              style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {firstPart}{" "}
              <span style={{ color: primary }}>{lastWord}</span>
            </h1>
            <p className="text-sm leading-relaxed text-white/70 mt-3"
              style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {subtitulo}
            </p>
          </motion.div>

          {/* Grid de áreas */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid grid-cols-3 gap-2">
              {areas.slice(0, 6).map((area, i) => {
                const bg = area.color || AREA_COLORS[i % AREA_COLORS.length];
                return (
                  <div key={area.id} className="rounded-2xl overflow-hidden" style={{ background: bg }}>
                    {/* Color block superior */}
                    <div className="h-16 flex items-center justify-center text-3xl"
                      style={{ background: bg + "cc" }}>
                      {area.emoji || "🏛️"}
                    </div>
                    {/* Info inferior */}
                    <div className="px-2 py-2 bg-white">
                      <p className="text-[10px] font-black text-gray-800 leading-tight"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        {area.nombre}
                      </p>
                      {area.descripcion && (
                        <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">{area.descripcion}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Card descripción Korai */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: primary + "30" }}>
              <BarChart3 className="w-5 h-5" style={{ color: primary }} />
            </div>
            <p className="text-xs text-white/80 leading-relaxed" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              <span className="font-black text-white">Korai</span> analiza tu situación y la de tu familia en áreas clave como{" "}
              <span className="font-black" style={{ color: primary }}>empleo, vivienda, salud y más</span>,
              para identificar tus necesidades y conectarte con oportunidades.
            </p>
          </motion.div>

          {/* Chips con descripción */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="grid grid-cols-3 gap-2">
            {[
              { icon: <Clock className="w-4 h-4" />, title: "2 minutos", desc: "Es simple y rápido" },
              { icon: <Lock className="w-4 h-4" />, title: "Confidencial", desc: "Tu información está protegida" },
              { icon: <Users className="w-4 h-4" />, title: "Gratuito", desc: "Tu participación suma" },
            ].map((chip, i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-3 px-1 rounded-2xl text-center"
                style={{ background: "rgba(255,255,255,0.07)" }}>
                <span style={{ color: primary }}>{chip.icon}</span>
                <span className="text-xs font-black text-white"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>{chip.title}</span>
                <span className="text-[9px] text-white/50 leading-tight"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>{chip.desc}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <button onClick={startDiagnosis}
              className="w-full h-14 text-base font-black rounded-2xl flex items-center justify-center gap-3 text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                background: primary,
                boxShadow: `0 8px 32px ${primary}55`,
              }}>
              Comenzar diagnóstico <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Footer */}
          <div className="flex items-center justify-between pb-2">
            <p className="text-[10px] text-white/40 flex items-center gap-1"
              style={{ fontFamily: "'Montserrat', sans-serif" }}>
              <Shield className="w-3 h-3" /> Tu información está protegida
            </p>
            <div className="flex items-center gap-1">
              <img src={koraiLogo} alt="Korai" className="w-4 h-4 object-contain opacity-50" />
              <span className="text-[10px] text-white/40 font-bold"
                style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Impulsado por Korai
              </span>
            </div>
          </div>

          {/* Texto decorativo bottom-left */}
          <div className="absolute bottom-4 left-4 -rotate-6 opacity-20 pointer-events-none">
            <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">
              Comunidades<br />más oportunidades
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
