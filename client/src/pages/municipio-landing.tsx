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
  name: string;
  slug: string;
  logo_url?: string;
  color_primario?: string;
  color_secundario?: string;
  bienvenida_titulo?: string;
  bienvenida_subtitulo?: string;
  settings?: { color_fondo?: string };
}

interface Area {
  id: string;
  nombre: string;
  descripcion?: string;
  emoji?: string;
  color?: string;
  imagen_url?: string;
}

// Fotos por defecto por nombre de área (Unsplash libre)
const AREA_DEFAULTS: Record<string, { color: string; emoji: string; imagen_url: string }> = {
  empleo:    { color: "#dcfce7", emoji: "💼", imagen_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80" },
  salud:     { color: "#fce7f3", emoji: "🩺", imagen_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80" },
  vivienda:  { color: "#e0f2fe", emoji: "🏠", imagen_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80" },
  niñez:     { color: "#fff3e0", emoji: "👶", imagen_url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&q=80" },
  juventud:  { color: "#fff3e0", emoji: "🎓", imagen_url: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=400&q=80" },
  mayores:   { color: "#fefce8", emoji: "👴", imagen_url: "https://images.unsplash.com/photo-1516307365426-bea591f05011?w=400&q=80" },
  acción:    { color: "#f3e8ff", emoji: "🤝", imagen_url: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&q=80" },
  social:    { color: "#f3e8ff", emoji: "🤝", imagen_url: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&q=80" },
};

const FALLBACK_AREAS: Area[] = [
  { id: "1", nombre: "Centros Faro", descripcion: "Primera infancia", emoji: "👶", color: "#e0f2fe", imagen_url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&q=80" },
  { id: "2", nombre: "Niñez y Juventud", descripcion: "Más oportunidades para su futuro", emoji: "🎓", color: "#fff3e0", imagen_url: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=400&q=80" },
  { id: "3", nombre: "Empleo", descripcion: "Formación e inclusión", emoji: "💼", color: "#dcfce7", imagen_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80" },
  { id: "4", nombre: "Salud", descripcion: "Cuidado más cerca de tu comunidad", emoji: "🏥", color: "#fce7f3", imagen_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80" },
];

// Asegura que el color sea legible sobre fondo oscuro (#0d2b28)
function ensureReadableOnDark(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum < 0.25) return "#4ade80"; // verde brillante si el color es muy oscuro
    return hex;
  } catch {
    return "#22C55E";
  }
}

function getAreaDefaults(nombre: string) {
  const key = nombre.toLowerCase();
  for (const [k, v] of Object.entries(AREA_DEFAULTS)) {
    if (key.includes(k)) return v;
  }
  return { color: "#f0f0f0", emoji: "🏛️", imagen_url: "" };
}

function Blob({ style }: { style?: React.CSSProperties }) {
  return <div className="absolute pointer-events-none" style={{ borderRadius: "60% 40% 70% 30% / 50% 60% 40% 50%", opacity: 0.15, ...style }} />;
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

        const cr = await fetch(
          `${SUPABASE_URL}/rest/v1/campaigns?tenant_id=eq.${t.id}&limit=1`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        const camps = await cr.json();
        if (Array.isArray(camps) && camps[0]) setCampaignId(camps[0].id);

        const ar = await fetch(
          `${SUPABASE_URL}/rest/v1/derivation_areas?tenant_id=eq.${t.id}&activo=eq.true&order=nombre.asc&limit=4`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        const arData = await ar.json();
        setAreas(Array.isArray(arData) && arData.length > 0 ? arData : FALLBACK_AREAS);
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
  const secondary = tenant?.color_secundario || primary;
  const bgColor = tenant?.settings?.color_fondo || "#0d2b28";
  // Para textos de acento sobre el fondo, usar el secundario si está definido, sino el primario
  // ensureReadableOnDark asegura que sea legible sobre fondos oscuros
  const accentOnDark = ensureReadableOnDark(tenant?.color_secundario ? secondary : primary);
  const titulo = tenant?.bienvenida_titulo || `${tenant?.name} te acompaña`;
  const subtitulo = tenant?.bienvenida_subtitulo || "Queremos conocerte mejor, para entender tus necesidades y seguir construyendo una comunidad más cercana.";

  const tituloWords = titulo.split(" ");
  const lastWord = tituloWords.pop();
  const firstPart = tituloWords.join(" ");

  const displayAreas = areas.slice(0, 4).map(a => {
    const def = getAreaDefaults(a.nombre);
    return {
      ...a,
      color: a.color || def.color,
      emoji: a.emoji || def.emoji,
      imagen_url: a.imagen_url || def.imagen_url,
    };
  });

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: bgColor }}>
      <div className="w-full max-w-sm relative overflow-hidden">

        {/* Blobs — alternan primary y secondary */}
        <Blob style={{ top: -60, left: -60, width: 180, height: 180, background: primary }} />
        <Blob style={{ top: 80, right: -40, width: 130, height: 130, background: secondary }} />
        <Blob style={{ bottom: 200, left: -30, width: 100, height: 100, background: secondary }} />
        <Blob style={{ bottom: 40, right: -20, width: 80, height: 80, background: primary }} />

        <div className="relative z-10 px-4 pt-10 pb-10 flex flex-col gap-5">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between">
            {tenant?.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name}
                className="w-auto object-contain"
                style={{ height: "64px", maxWidth: "180px", imageRendering: "auto" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-lg"
                  style={{ background: secondary }}>
                  {tenant?.name?.charAt(0) ?? "M"}
                </div>
                <span className="font-black text-sm text-gray-800" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {tenant?.name}
                </span>
              </div>
            )}
            <div className="text-right max-w-[130px]">
              <p className="text-[11px] font-black leading-tight uppercase tracking-wide"
                style={{ fontFamily: "'Montserrat', sans-serif", color: accentOnDark }}>
                {tenant?.name}<br />más cerca<br />de su gente
              </p>
            </div>
          </motion.div>

          {/* Título */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="text-[38px] font-black leading-none text-white mb-3"
              style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {firstPart}{"\n"}
              <span style={{ color: accentOnDark }}>{lastWord}</span>
              <span className="ml-1 text-2xl">↗</span>
            </h1>
            <p className="text-sm leading-relaxed text-white/90 text-center"
              style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {subtitulo}
            </p>
          </motion.div>

          {/* Card intro */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: accentOnDark + "25" }}>
              <Users className="w-5 h-5" style={{ color: accentOnDark }} />
            </div>
            <p className="text-xs text-white leading-relaxed" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Esta propuesta llega a <span className="font-black" style={{ color: accentOnDark }}>personas y familias</span> a
              través de los <strong className="text-white">espacios municipales</strong> donde ya acompañamos a la comunidad.
            </p>
          </motion.div>

          {/* Grid 2x2 de áreas con fotos */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid grid-cols-2 gap-2">
              {displayAreas.map((area) => (
                <div key={area.id} className="rounded-2xl overflow-hidden" style={{ background: area.color }}>
                  {/* Foto */}
                  <div className="h-28 overflow-hidden relative">
                    {area.imagen_url ? (
                      <img
                        src={area.imagen_url}
                        alt={area.nombre}
                        className="w-full h-full object-cover"
                        onError={e => {
                          const el = e.target as HTMLImageElement;
                          el.style.display = "none";
                          const parent = el.parentElement;
                          if (parent) {
                            parent.style.display = "flex";
                            parent.style.alignItems = "center";
                            parent.style.justifyContent = "center";
                            parent.style.fontSize = "40px";
                            parent.innerHTML = area.emoji || "🏛️";
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl"
                        style={{ background: area.color }}>
                        {area.emoji}
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="px-3 py-3 bg-white">
                    <p className="text-[11px] font-black text-gray-800 leading-tight"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      {area.nombre}
                    </p>
                    {area.descripcion && (
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{area.descripcion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card Korai */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <p className="text-xs text-white leading-relaxed" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              <span className="font-black text-white">Korai</span> analiza tu situación y la de tu familia en áreas clave como{" "}
              <span className="font-black" style={{ color: accentOnDark }}>empleo, vivienda, salud y más</span>,
              para identificar tus necesidades, conectarte con oportunidades y acompañarte en tu proceso.
            </p>
          </motion.div>

          {/* Chips */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="grid grid-cols-3 gap-1">
            {[
              { icon: <Clock className="w-5 h-5" />, title: "2 minutos", desc: "Es simple y rápido" },
              { icon: <Lock className="w-5 h-5" />, title: "Confidencial", desc: "Tu información está protegida" },
              { icon: <Users className="w-5 h-5" />, title: "Gratuito", desc: "Tu participación suma" },
            ].map((chip, i) => (
              <div key={i} className="flex flex-col items-start gap-1 py-3 px-2">
                <span style={{ color: accentOnDark }}>{chip.icon}</span>
                <span className="text-xs font-black text-white"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>{chip.title}</span>
                <span className="text-[9px] text-white/75 leading-tight"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>{chip.desc}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-white/60 flex items-center gap-1"
              style={{ fontFamily: "'Montserrat', sans-serif" }}>
              <Shield className="w-3 h-3" /> Tu información está protegida
            </p>
            <div className="flex items-center gap-1">
              <img src={koraiLogo} alt="Korai" className="w-4 h-4 object-contain opacity-60" />
              <span className="text-[10px] text-white/60 font-bold"
                style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Impulsado por Korai
              </span>
            </div>
          </div>

          {/* Texto decorativo */}
          <div className="absolute bottom-6 left-4 -rotate-6 opacity-15 pointer-events-none">
            <p className="text-[9px] font-black text-white uppercase tracking-widest leading-tight">
              Comunidades<br />más oportunidades
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
