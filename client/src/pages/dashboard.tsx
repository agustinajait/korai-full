import { useState, useMemo, useEffect } from "react";
import { INSTRUMENT } from "@/lib/instrument";
import { Loader2, AlertCircle, TrendingUp, Users, MessageSquare, LogOut, MapPin, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4";
const CAMPAIGN_ID = "53813f5a-3613-4faf-8ca1-b369e4e908cb";

// Programas reales de CABA por dimensión
const PROGRAMAS_CABA: Record<string, { nombre: string; descripcion: string; url?: string; contacto?: string }[]> = {
  salud: [
    { nombre: "CAPS - Centros de Atención Primaria", descripcion: "Atención médica gratuita en tu barrio", url: "https://buenosaires.gob.ar/salud/caps", contacto: "0800-222-5462" },
    { nombre: "Programa SUMAR", descripcion: "Cobertura de salud gratuita para población sin obra social", url: "https://www.argentina.gob.ar/salud/sumar" },
  ],
  educacion: [
    { nombre: "Plan FinEs", descripcion: "Terminá el secundario gratuitamente", url: "https://www.argentina.gob.ar/educacion/fines" },
    { nombre: "Becas Progresar", descripcion: "Apoyo económico para seguir estudiando", url: "https://www.argentina.gob.ar/educacion/progresar" },
    { nombre: "CENS - Centros Educativos Nivel Secundario", descripcion: "Educación secundaria para adultos en CABA", url: "https://buenosaires.gob.ar/educacion" },
  ],
  trabajo: [
    { nombre: "Programa Fomento al Empleo CABA", descripcion: "Subsidios para empresas que contraten mujeres y personas vulnerables", url: "https://buenosaires.gob.ar/gobierno/trabajo/programas-de-fomento-al-empleo" },
    { nombre: "Portal Empleo", descripcion: "Bolsa de trabajo del Ministerio de Trabajo", url: "https://www.portalempleo.gob.ar" },
    { nombre: "Oportunai", descripcion: "Creá tu perfil laboral y video CV", url: "https://oportunai.com" },
  ],
  vivienda: [
    { nombre: "Subsidio 690 - Asistencia Habitacional", descripcion: "Apoyo económico para familias en riesgo de desamparo habitacional", contacto: "atencioninmediata@buenosaires.gob.ar", url: "https://buenosaires.gob.ar/desarrollohumanoyhabitat/inclusion-social-y-atencion-inmediata/asistencia-habitacional" },
    { nombre: "Programa Nuestras Familias", descripcion: "Acompañamiento habitacional para familias vulnerables", contacto: "nuestrasfamilias@buenosaires.gob.ar" },
    { nombre: "PROMEBA", descripcion: "Mejoramiento de barrios populares", url: "https://www.argentina.gob.ar/habitat/promeba" },
  ],
  prevision: [
    { nombre: "ANSES - Asignaciones y Prestaciones", descripcion: "AUH, jubilaciones y programas de apoyo económico", url: "https://www.anses.gob.ar", contacto: "130" },
    { nombre: "Potenciar Trabajo", descripcion: "Programa de empleo y capacitación", url: "https://www.argentina.gob.ar/desarrollosocial/potenciartrabajo" },
    { nombre: "Sedes de Atención Social CABA", descripcion: "Av. Entre Ríos 1492, lunes a viernes 9 a 15hs", contacto: "0800-333-3262" },
  ],
  cultura: [
    { nombre: "Centros Culturales Barriales", descripcion: "Espacios de encuentro y actividades comunitarias gratuitas", url: "https://buenosaires.gob.ar/cultura" },
    { nombre: "Puntos de Cultura", descripcion: "Red de organizaciones culturales comunitarias", url: "https://www.argentina.gob.ar/cultura" },
  ],
};

async function fetchResponses() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/responses?campaign_id=eq.${CAMPAIGN_ID}&order=submitted_at.desc`,
    {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      }
    }
  );
  if (!res.ok) throw new Error("Error al cargar datos");
  return res.json();
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [barrioFilter, setBarrioFilter] = useState("all");

  useEffect(() => {
    fetchResponses()
      .then(data => { setResponses(data); setIsLoading(false); })
      .catch(e => { setError(e.message); setIsLoading(false); });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("korai_admin_auth");
    setLocation("/admin");
  };

  const barrios = useMemo(() => {
    const set = new Set<string>();
    responses.forEach(r => {
      const b = r.territorio?.barrio;
      if (b) set.add(b);
    });
    return Array.from(set).sort();
  }, [responses]);

  const filtered = useMemo(() => {
    if (barrioFilter === "all") return responses;
    return responses.filter(r => r.territorio?.barrio === barrioFilter);
  }, [responses, barrioFilter]);

  const stats = useMemo(() => {
    if (!filtered.length) return null;

    let rojo = 0, amarillo = 0, verde = 0;
    const byDim: Record<string, any> = {};

    INSTRUMENT.dimensions.forEach(d => {
      byDim[d.id] = { rojo: 0, amarillo: 0, verde: 0, n: 0, color: "verde", severity: 0, explanation: "" };
    });

    const comentarios: any[] = [];

    filtered.forEach(r => {
      const answers = r.answers as Record<string, string>;
      let rCount = 0, aCount = 0, nCount = 0;

      Object.entries(answers).forEach(([key, val]) => {
        const dimId = key.split("_")[0];
        if (byDim[dimId]) {
          byDim[dimId].n++;
          if (val === "rojo") byDim[dimId].rojo++;
          else if (val === "amarillo") byDim[dimId].amarillo++;
          else if (val === "verde") byDim[dimId].verde++;
        }
        nCount++;
        if (val === "rojo") rCount++;
        else if (val === "amarillo") aCount++;
      });

      Object.keys(byDim).forEach(dimId => {
        const d = byDim[dimId];
        if (d.n > 0) {
          d.color = (d.rojo / d.n >= 0.5) ? "rojo" : ((d.rojo + d.amarillo) / d.n >= 0.5) ? "amarillo" : "verde";
          d.severity = Math.round(((d.rojo + d.amarillo * 0.5) / d.n) * 100);
          if (d.color === "rojo") d.explanation = `El ${Math.round((d.rojo / d.n) * 100)}% de los diagnósticos reporta nivel crítico.`;
          else if (d.color === "amarillo") d.explanation = `El ${Math.round(((d.rojo + d.amarillo) / d.n) * 100)}% requiere atención preventiva.`;
          else d.explanation = `El ${Math.round((d.verde / d.n) * 100)}% de los diagnósticos muestra situación positiva.`;
        }
      });

      if (nCount > 0) {
        if (rCount / nCount >= 0.33) rojo++;
        else if (aCount / nCount >= 0.33) amarillo++;
        else verde++;
      }

      if (r.texto_abierto) {
        comentarios.push({
          text: r.texto_abierto,
          barrio: r.territorio?.barrio || "Sin barrio",
          submitted_at: r.submitted_at,
        });
      }
    });

    // Dimensión más crítica
    let mostCritical = Object.entries(byDim).sort((a, b) => b[1].severity - a[1].severity)[0]?.[0];
    const total = filtered.length;

    return {
      total,
      dist: {
        rojo: total ? rojo / total : 0,
        amarillo: total ? amarillo / total : 0,
        verde: total ? verde / total : 0,
      },
      byDim,
      mostCritical,
      comentarios: comentarios.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()),
    };
  }, [filtered]);

  // Dimensiones más críticas para mostrar programas
  const topCriticalDims = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byDim)
      .filter(([, d]: any) => d.color === "rojo" || d.color === "amarillo")
      .sort((a: any, b: any) => b[1].severity - a[1].severity)
      .slice(0, 2)
      .map(([id]) => id);
  }, [stats]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070A13]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-white/50 text-sm">Cargando datos del territorio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#070A13]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-white">Error al cargar datos</h2>
        <p className="text-white/50 text-sm mb-4">{error}</p>
        <Link href="/" className="text-primary hover:underline">Volver al inicio</Link>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#070A13]">
        <Users className="w-12 h-12 text-white/20 mb-4" />
        <h2 className="text-xl font-bold text-white/50">Sin datos aún</h2>
        <p className="text-white/30 text-sm mt-2">Los diagnósticos aparecerán aquí en tiempo real.</p>
      </div>
    );
  }

  const overallColor = stats.dist.rojo >= 0.33 ? "rojo" : stats.dist.amarillo >= 0.33 ? "amarillo" : "verde";
  const overallBg = overallColor === "rojo" ? "bg-red-500/10 border-red-500/30" : overallColor === "amarillo" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-green-500/10 border-green-500/30";
  const overallDot = overallColor === "rojo" ? "bg-red-500" : overallColor === "amarillo" ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="min-h-screen bg-[#070A13] text-[#EEF2FF] font-sans">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[1100px] h-[700px] bg-[#7c5cff]/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[900px] h-[600px] bg-[#f59e0b]/8 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#7c5cff] to-[#3b82f6] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/20">K</div>
            <div>
              <div className="text-xl font-black leading-tight">KORAI Dashboard</div>
              <div className="text-xs text-[#A9B3DA]">Panel institucional · Ciudad de Buenos Aires</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" className="text-[#EEF2FF] hover:bg-white/10 text-sm">Diagnóstico ciudadano</Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout} className="text-white/40 hover:text-white hover:bg-white/10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filtro por barrio */}
        <div className="flex items-center gap-3 flex-wrap">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Filtrar por barrio:</span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setBarrioFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${barrioFilter === "all" ? "bg-primary text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
            >
              Todos ({responses.length})
            </button>
            {barrios.map(b => (
              <button
                key={b}
                onClick={() => setBarrioFilter(b)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${barrioFilter === b ? "bg-primary text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Estado general */}
        <div className={`p-8 rounded-[40px] border relative overflow-hidden ${overallBg}`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl animate-pulse ${overallDot}`}>
              <div className="text-white font-black text-lg">CABA</div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Estado General del Territorio</h2>
              <p className="text-[#A9B3DA] text-sm mt-1">
                Basado en <span className="font-black text-white">{stats.total}</span> diagnósticos individuales · {barrioFilter === "all" ? "Ciudad de Buenos Aires" : `Barrio ${barrioFilter}`}
              </p>
            </div>
            <div className="md:ml-auto flex gap-6 text-center">
              <div>
                <div className="text-2xl font-black text-red-400">{Math.round(stats.dist.rojo * 100)}%</div>
                <div className="text-[10px] text-white/50 uppercase">Crítico</div>
              </div>
              <div>
                <div className="text-2xl font-black text-yellow-400">{Math.round(stats.dist.amarillo * 100)}%</div>
                <div className="text-[10px] text-white/50 uppercase">Alerta</div>
              </div>
              <div>
                <div className="text-2xl font-black text-green-400">{Math.round(stats.dist.verde * 100)}%</div>
                <div className="text-[10px] text-white/50 uppercase">Estable</div>
              </div>
            </div>
          </div>

          {/* Barra de distribución */}
          <div className="mt-6 flex h-3 w-full rounded-full overflow-hidden bg-white/10">
            <div style={{ width: `${stats.dist.verde * 100}%` }} className="bg-[#22c55e] transition-all duration-1000" />
            <div style={{ width: `${stats.dist.amarillo * 100}%` }} className="bg-[#f59e0b] transition-all duration-1000" />
            <div style={{ width: `${stats.dist.rojo * 100}%` }} className="bg-[#ef4444] transition-all duration-1000" />
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">

          {/* Dimensiones */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-black">Diagnóstico por Dimensión</h3>
                <p className="text-xs text-white/40 mt-1">Hacé clic en una dimensión para ver los programas disponibles</p>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-4">
                {INSTRUMENT.dimensions.map(d => {
                  const s = stats.byDim[d.id] || { rojo: 0, amarillo: 0, verde: 0, n: 0, color: "verde", severity: 0, explanation: "" };
                  const isSelected = selectedDimension === d.id;
                  const isCritical = stats.mostCritical === d.id && s.severity > 0;

                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDimension(isSelected ? null : d.id)}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 relative ${
                        isSelected ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" :
                        isCritical ? "border-red-500/50 bg-red-500/5" :
                        "border-white/5 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      {isCritical && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-bounce">
                          ÁREA CRÍTICA
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{d.emoji}</span>
                          <div>
                            <div className="font-bold text-base">{d.name}</div>
                            <div className="text-[10px] text-muted-foreground uppercase">Severidad: {s.severity}%</div>
                          </div>
                        </div>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          s.color === "rojo" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                          s.color === "amarillo" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                          "bg-green-500/20 text-green-400 border-green-500/30"
                        }`}>
                          {s.color}
                        </div>
                      </div>

                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${s.severity}%` }}
                          className={`h-full rounded-full transition-all duration-1000 ${
                            s.color === "rojo" ? "bg-red-500" : s.color === "amarillo" ? "bg-yellow-500" : "bg-green-500"
                          }`}
                        />
                      </div>

                      <p className="text-[11px] text-white/60 italic">{s.explanation}</p>

                      {/* Programas disponibles al hacer clic */}
                      {isSelected && PROGRAMAS_CABA[d.id] && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2 animate-in fade-in slide-in-from-top-2">
                          <div className="text-[10px] font-black text-primary uppercase tracking-wider mb-2">
                            Programas disponibles en CABA
                          </div>
                          {PROGRAMAS_CABA[d.id].map((p, i) => (
                            <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                              <div className="font-bold text-xs text-white">{p.nombre}</div>
                              <div className="text-[10px] text-white/50">{p.descripcion}</div>
                              <div className="flex gap-3 mt-1">
                                {p.url && (
                                  <a href={p.url} target="_blank" rel="noopener noreferrer"
                                    className="text-[10px] text-primary flex items-center gap-1 hover:underline">
                                    <ExternalLink className="w-3 h-3" /> Ver programa
                                  </a>
                                )}
                                {p.contacto && (
                                  <span className="text-[10px] text-white/40">{p.contacto}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Programas recomendados para las áreas más críticas */}
            {topCriticalDims.length > 0 && (
              <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-black">Intervención prioritaria recomendada</h3>
                </div>
                <p className="text-sm text-white/50">Basado en los datos del territorio, estos son los programas más urgentes para atender:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {topCriticalDims.flatMap(dimId =>
                    (PROGRAMAS_CABA[dimId] || []).slice(0, 2).map((p, i) => {
                      const dim = INSTRUMENT.dimensions.find(d => d.id === dimId);
                      return (
                        <div key={`${dimId}-${i}`} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{dim?.emoji}</span>
                            <div className="text-[10px] text-white/40 uppercase font-bold">{dim?.name}</div>
                          </div>
                          <div className="font-bold text-sm text-white">{p.nombre}</div>
                          <div className="text-[10px] text-white/50">{p.descripcion}</div>
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] text-primary flex items-center gap-1 hover:underline mt-1">
                              <ExternalLink className="w-3 h-3" /> Acceder al programa
                            </a>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha */}
          <div className="lg:col-span-4 space-y-6">

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-[#A9B3DA] text-[10px] font-bold uppercase mb-1">Diagnósticos</div>
                <div className="text-3xl font-black text-white">{stats.total}</div>
                <div className="text-[10px] text-green-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> En tiempo real
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-[#A9B3DA] text-[10px] font-bold uppercase mb-1">Barrios</div>
                <div className="text-3xl font-black text-white">{barrios.length}</div>
                <div className="text-[10px] text-white/40 mt-1">con datos</div>
              </div>
            </div>

            {/* Comentarios */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
              <h3 className="text-base font-black mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Voces del territorio
              </h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {stats.comentarios.length > 0 ? stats.comentarios.map((c: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold text-white/60">{c.barrio}</span>
                      <span className="text-[9px] text-white/30 ml-auto">
                        {new Date(c.submitted_at).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                    <p className="text-xs italic text-white/80 leading-relaxed">"{c.text}"</p>
                  </div>
                )) : (
                  <p className="text-xs text-white/30 text-center py-4">No hay comentarios aún.</p>
                )}
              </div>
            </div>

            {/* CTA institucional */}
            <div className="bg-gradient-to-br from-[#7c5cff]/20 to-transparent border border-[#7c5cff]/30 rounded-3xl p-5">
              <h3 className="text-base font-black mb-1">Sumar más territorio</h3>
              <p className="text-xs text-[#A9B3DA] mb-4">Cada diagnóstico individual enriquece la inteligencia territorial de KORAI.</p>
              <Link href="/">
                <Button className="w-full bg-white text-black hover:bg-white/90 font-bold rounded-xl h-11 text-sm">
                  Ir al diagnóstico ciudadano
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
