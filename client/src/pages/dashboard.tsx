import { useState, useMemo, useEffect } from "react";
import { INSTRUMENT } from "@/lib/instrument";
import { calcularScores, generatePlanDesdeScores } from "@/lib/korai-logic";
import { Loader2, AlertCircle, TrendingUp, Users, MessageSquare, LogOut, MapPin, ExternalLink, ArrowLeft, User, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4";
const CAMPAIGN_ID = "53813f5a-3613-4faf-8ca1-b369e4e908cb";

const PROGRAMAS_CABA: Record<string, { nombre: string; descripcion: string; url?: string; contacto?: string }[]> = {
  empleo: [
    { nombre: "CIL — Centro de Integración Laboral", descripcion: "Sacá turno para hacer tu CV y acceder a programas de empleo", url: "https://formulario-sigeci.buenosaires.gob.ar/InicioTramiteComun?idPrestacion=1422" },
    { nombre: "TrabajoBA — Portal de Empleo CABA", descripcion: "Registrate y accedé a ofertas laborales en la Ciudad", url: "https://trabajoba.buenosaires.gob.ar" },
    { nombre: "Potenciar Trabajo", descripcion: "Programa de empleo y capacitación", url: "https://www.argentina.gob.ar/desarrollosocial/potenciartrabajo" },
  ],
  educacion: [
    { nombre: "Plan FinEs", descripcion: "Terminá el secundario gratuitamente", url: "https://www.argentina.gob.ar/educacion/fines" },
    { nombre: "Becas Progresar", descripcion: "Apoyo económico para seguir estudiando", url: "https://www.argentina.gob.ar/educacion/progresar" },
    { nombre: "CENS — Secundario para adultos CABA", descripcion: "Educación secundaria para adultos en CABA", url: "https://buenosaires.gob.ar/educacion/nivel-medio/adultos-2000" },
  ],
  salud: [
    { nombre: "CAPS — Atención médica gratuita", descripcion: "Encontrá el centro de salud más cercano a tu domicilio", url: "https://buenosaires.gob.ar/salud/centros-de-salud-y-hospitales", contacto: "0800-222-5462" },
    { nombre: "Programa SUMAR", descripcion: "Cobertura de salud gratuita sin obra social", url: "https://www.argentina.gob.ar/salud/sumar" },
  ],
  vivienda: [
    { nombre: "Subsidio 690 - Asistencia Habitacional", descripcion: "Apoyo para familias en riesgo habitacional", url: "https://buenosaires.gob.ar/desarrollohumanoyhabitat/inclusion-social-y-atencion-inmediata/asistencia-habitacional" },
    { nombre: "PROMEBA", descripcion: "Mejoramiento de barrios populares", url: "https://www.argentina.gob.ar/habitat/promeba" },
  ],
  ingresos: [
    { nombre: "ANSES", descripcion: "AUH, jubilaciones y programas de apoyo económico", url: "https://www.anses.gob.ar", contacto: "130" },
    { nombre: "Potenciar Trabajo", descripcion: "Programa de empleo y capacitación", url: "https://www.argentina.gob.ar/desarrollosocial/potenciartrabajo" },
  ],
  red: [
    { nombre: "Centros Culturales Barriales CABA", descripcion: "Actividades gratuitas de arte, deporte y comunidad", url: "https://buenosaires.gob.ar/cultura/centros-culturales" },
    { nombre: "Puntos de Cultura", descripcion: "Red de organizaciones culturales", url: "https://www.argentina.gob.ar/cultura/puntos-de-cultura" },
  ],
};

async function fetchResponses() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/responses?campaign_id=eq.${CAMPAIGN_ID}&order=submitted_at.desc`,
    { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
  );
  if (!res.ok) throw new Error("Error al cargar datos");
  return res.json();
}

async function deleteResponse(id: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/responses?id=eq.${id}`,
    {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal",
      },
    }
  );
  if (!res.ok) throw new Error("Error al eliminar diagnóstico");
}

async function fetchTrazabilidad(dniHash: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/responses?campaign_id=eq.${CAMPAIGN_ID}&dni_hash=eq.${dniHash}&order=submitted_at.asc`,
    { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
  );
  if (!res.ok) throw new Error("Error al cargar trazabilidad");
  return res.json();
}

// ─── Vista de trazabilidad individual ────────────────────────────────────────
function TrazabilidadView({ response, onBack }: { response: any; onBack: () => void }) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const nombre = getNombrePersona(response);

  useEffect(() => {
    if (!response.dni_hash) { setLoading(false); return; }
    fetchTrazabilidad(response.dni_hash)
      .then(data => { setHistorial(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [response.dni_hash]);

  const colorDot = (c: string) =>
    c === "rojo" ? "bg-red-500" : c === "amarillo" ? "bg-yellow-500" : "bg-green-500";
  const colorText = (c: string) =>
    c === "rojo" ? "text-red-600" : c === "amarillo" ? "text-yellow-700" : "text-green-700";

  return (
    <div className="min-h-screen bg-[#070A13] text-[#EEF2FF] font-sans">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-white/50 hover:text-white hover:bg-white/10 gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
        </div>

        {/* Header */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7c5cff] to-[#3b82f6] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-black">{nombre}</div>
              <div className="text-xs text-white/40 mt-0.5">
                {historial.length} diagnóstico{historial.length !== 1 ? "s" : ""} registrado{historial.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : historial.length === 0 ? (
          <div className="text-center py-10 text-white/40">Sin historial disponible.</div>
        ) : (
          <>
            {/* Evolución visual por dimensión */}
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <h3 className="font-black text-lg">Evolución por dimensión</h3>
                <p className="text-xs text-white/40 mt-1">Cada columna es un diagnóstico. De izquierda a derecha, del más antiguo al más reciente.</p>
              </div>
              <div className="p-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left text-xs text-white/40 font-bold pb-3 pr-4 w-32">Dimensión</th>
                      {historial.map((h, i) => (
                        <th key={i} className="text-center text-xs text-white/40 font-bold pb-3 px-2 min-w-[80px]">
                          <div>{new Date(h.submitted_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</div>
                          <div className="text-[9px] text-white/25">#{i + 1}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {INSTRUMENT.dimensions.map(d => (
                      <tr key={d.id}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span>{d.emoji}</span>
                            <span className="font-semibold text-xs text-white/70">{d.name}</span>
                          </div>
                        </td>
                        {historial.map((h, i) => {
                          const sitLab = (() => { try { const p = (() => { const raw = h.perfil_contextual; return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); })(); return p?.profundizacion?.situacion_laboral; } catch { return undefined; } })();
                          const scores = calcularScores(h.answers || {}, sitLab);
                          const score = scores.find(s => s.dimensionId === d.id);
                          const color = score?.color || "verde";
                          // Flecha de evolución
                          let arrow = null;
                          if (i > 0) {
                            const prevSitLab = (() => { try { const p = JSON.parse(typeof historial[i-1].perfil_contextual === "string" ? historial[i-1].perfil_contextual : "{}"); return p?.profundizacion?.situacion_laboral; } catch { return undefined; } })();
                            const prevScores = calcularScores(historial[i-1].answers || {}, prevSitLab);
                            const prevScore = prevScores.find(s => s.dimensionId === d.id);
                            const colorOrder = { verde: 0, amarillo: 1, rojo: 2 };
                            const diff = (colorOrder[color] || 0) - (colorOrder[prevScore?.color || "verde"] || 0);
                            if (diff < 0) arrow = <span className="text-green-400 text-xs">↑</span>;
                            else if (diff > 0) arrow = <span className="text-red-400 text-xs">↓</span>;
                          }
                          return (
                            <td key={i} className="py-3 px-2 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className={`w-4 h-4 rounded-full ${colorDot(color)}`} title={color} />
                                {arrow}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <h3 className="font-black text-lg">Timeline de diagnósticos</h3>
              </div>
              <div className="divide-y divide-white/5">
                {historial.map((h, i) => {
                  const sitLab = (() => { try { const p = (() => { const raw = h.perfil_contextual; return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); })(); return p?.profundizacion?.situacion_laboral; } catch { return undefined; } })();
                  const scores = calcularScores(h.answers || {}, sitLab);
                  const rojas = scores.filter(s => s.color === "rojo").length;
                  const fecha = new Date(h.submitted_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
                  const isLast = i === historial.length - 1;
                  return (
                    <div key={i} className={`p-5 ${isLast ? "bg-white/3" : ""}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-bold text-sm">Diagnóstico #{i + 1}</div>
                          <div className="text-xs text-white/40">{fecha} {isLast ? "· Más reciente" : ""}</div>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          rojas >= 2 ? "bg-red-500/20 text-red-400 border-red-500/30" :
                          rojas === 1 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                          "bg-green-500/20 text-green-400 border-green-500/30"
                        }`}>
                          {rojas} área{rojas !== 1 ? "s" : ""} crítica{rojas !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {scores.map(s => (
                          <div key={s.dimensionId} className="flex items-center gap-1.5 text-xs">
                            <div className={`w-2 h-2 rounded-full ${colorDot(s.color)}`} />
                            <span className={colorText(s.color)}>{s.dimensionName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Vista de caso individual ───────────────────────────────────────────────
// Helper: extrae nombre y apellido del perfil_contextual
function getNombrePersona(r: any): string {
  try {
    const raw = r.perfil_contextual;
    // Supabase puede devolver string JSON o objeto directo
    const p = typeof raw === "string" ? JSON.parse(raw) :
              typeof raw === "object" && raw !== null ? raw : {};
    const nombre = p?.nombre || p?.demographics?.nombre || p?.name || "";
    const apellido = p?.apellido || p?.demographics?.apellido || p?.lastName || "";
    if (nombre || apellido) return `${nombre} ${apellido}`.trim();
  } catch {}
  if (r.dni_real) return `DNI ${r.dni_real}`;
  return `Caso #${r.id?.slice(0, 6) || "—"}`;
}

function CasoIndividual({ response, onBack }: { response: any; onBack: () => void }) {
  const answers = response.answers as Record<string, string>;
  const sitLab = (() => { try { const p = (() => { const raw = response.perfil_contextual; return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); })(); return p?.profundizacion?.situacion_laboral; } catch { return undefined; } })();
  const scores = calcularScores(answers, sitLab);
  const plan = generatePlanDesdeScores(answers, 6, sitLab);
  const barrio = response.territorio?.barrio || "Sin barrio";
  const fecha = new Date(response.submitted_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });

  const colorBadge = (c: string) =>
    c === "rojo" ? "bg-red-500/20 text-red-400 border-red-500/30" :
    c === "amarillo" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
    "bg-green-500/20 text-green-400 border-green-500/30";

  return (
    <div className="min-h-screen bg-[#070A13] text-[#EEF2FF] font-sans">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[1100px] h-[700px] bg-[#7c5cff]/15 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">

        {/* Header caso */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-white/50 hover:text-white hover:bg-white/10 gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver al dashboard
          </Button>
        </div>

        {/* Perfil */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7c5cff] to-[#3b82f6] flex items-center justify-center">
            <User className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-xl font-black">{getNombrePersona(response)}</div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-white/50 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" /> {barrio}
              </span>
              <span className="text-xs text-white/30">·</span>
              <span className="text-xs text-white/50">{fecha}</span>
              {response.territorio?.ciudad && (
                <>
                  <span className="text-xs text-white/30">·</span>
                  <span className="text-xs text-white/50">{response.territorio.ciudad}</span>
                </>
              )}
            </div>
          </div>
          {/* Indicador general */}
          <div className="text-right">
            {(() => {
              const rojas = scores.filter(s => s.color === "rojo").length;
              const color = rojas >= 3 ? "rojo" : rojas >= 1 ? "amarillo" : "verde";
              return (
                <span className={`px-3 py-1 rounded-full text-xs font-black border uppercase ${colorBadge(color)}`}>
                  {rojas} área{rojas !== 1 ? "s" : ""} crítica{rojas !== 1 ? "s" : ""}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Scores por dimensión */}
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h3 className="font-black text-lg">Diagnóstico por dimensión</h3>
            <p className="text-xs text-white/40 mt-1">Resultado del autodiagnóstico en las 6 áreas de bienestar</p>
          </div>
          <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scores.map(s => (
              <div key={s.dimensionId} className={`p-4 rounded-2xl border space-y-2 ${
                s.color === "rojo" ? "border-red-500/30 bg-red-500/5" :
                s.color === "amarillo" ? "border-yellow-500/30 bg-yellow-500/5" :
                "border-green-500/20 bg-green-500/5"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.emoji}</span>
                    <span className="font-bold text-sm">{s.dimensionName}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${colorBadge(s.color)}`}>
                    {s.color}
                  </span>
                </div>
                {/* Barra */}
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      s.color === "rojo" ? "bg-red-500" : s.color === "amarillo" ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${(s.verde / s.total) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-white/40">{s.verde} de {s.total} indicadores positivos</div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan generado */}
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h3 className="font-black text-lg">Plan de acción generado</h3>
            <p className="text-xs text-white/40 mt-1">Áreas prioritarias y acciones recomendadas para este caso</p>
          </div>
          <div className="p-5 space-y-4">
            {plan.map((item, i) => (
              <div key={i} className={`p-4 rounded-2xl border space-y-3 ${
                item.esPrioritaria ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-white/3"
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{item.dimensionName}</span>
                      {item.esPrioritaria && (
                        <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black">BLOQUEANTE</span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/40 mt-0.5">{item.motivo}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase flex-shrink-0 ${colorBadge(item.nivelColor)}`}>
                    {item.cuando}
                  </span>
                </div>

                {/* Acciones */}
                <div className="space-y-1">
                  {item.accionesCorto.map((a, j) => (
                    <div key={j} className="flex items-start gap-2 text-xs text-white/60">
                      <ChevronRight className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                      {a}
                    </div>
                  ))}
                </div>

                {/* Recursos */}
                {item.recursos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.recursos.map((r, j) => (
                      <a
                        key={j}
                        href={r.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-primary hover:bg-white/10 flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> {r.nombre}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Texto abierto si existe */}
        {response.texto_abierto && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <h3 className="font-black text-base mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Lo que nos contó
            </h3>
            <p className="text-sm italic text-white/70 leading-relaxed">"{response.texto_abierto}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard principal ─────────────────────────────────────────────────────
export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [barrioFilter, setBarrioFilter] = useState("all");
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [showCaseList, setShowCaseList] = useState(false);
  const [showTrazabilidad, setShowTrazabilidad] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteResponse(id);
      setResponses(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      alert("Error al eliminar. Intentá de nuevo.");
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

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
    responses.forEach(r => { const b = r.territorio?.barrio; if (b) set.add(b); });
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
          if (d.color === "rojo") d.explanation = `El ${Math.round((d.rojo / d.n) * 100)}% reporta nivel crítico.`;
          else if (d.color === "amarillo") d.explanation = `El ${Math.round(((d.rojo + d.amarillo) / d.n) * 100)}% requiere atención.`;
          else d.explanation = `El ${Math.round((d.verde / d.n) * 100)}% muestra situación positiva.`;
        }
      });
      if (nCount > 0) {
        if (rCount / nCount >= 0.33) rojo++;
        else if (aCount / nCount >= 0.33) amarillo++;
        else verde++;
      }
      if (r.texto_abierto) comentarios.push({ text: r.texto_abierto, barrio: r.territorio?.barrio || "Sin barrio", submitted_at: r.submitted_at });
    });

    const mostCritical = Object.entries(byDim).sort((a, b) => b[1].severity - a[1].severity)[0]?.[0];
    const total = filtered.length;
    return {
      total,
      dist: { rojo: total ? rojo / total : 0, amarillo: total ? amarillo / total : 0, verde: total ? verde / total : 0 },
      byDim,
      mostCritical,
      comentarios: comentarios.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()),
    };
  }, [filtered]);

  const topCriticalDims = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byDim)
      .filter(([, d]: any) => d.color === "rojo" || d.color === "amarillo")
      .sort((a: any, b: any) => b[1].severity - a[1].severity)
      .slice(0, 2).map(([id]) => id);
  }, [stats]);

  // Vista de caso individual
  if (selectedCase && showTrazabilidad) return <TrazabilidadView response={selectedCase} onBack={() => { setShowTrazabilidad(false); }} />;
  if (selectedCase) return <CasoIndividual response={selectedCase} onBack={() => setSelectedCase(null)} />;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#070A13]">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="text-white/50 text-sm">Cargando datos del territorio...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#070A13]">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2 text-white">Error al cargar datos</h2>
      <p className="text-white/50 text-sm mb-4">{error}</p>
      <Link href="/" className="text-primary hover:underline">Volver al inicio</Link>
    </div>
  );

  if (!stats) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#070A13]">
      <Users className="w-12 h-12 text-white/20 mb-4" />
      <h2 className="text-xl font-bold text-white/50">Sin datos aún</h2>
      <p className="text-white/30 text-sm mt-2">Los diagnósticos aparecerán aquí en tiempo real.</p>
    </div>
  );

  const overallColor = stats.dist.rojo >= 0.33 ? "rojo" : stats.dist.amarillo >= 0.33 ? "amarillo" : "verde";
  const overallBg = overallColor === "rojo" ? "bg-red-500/10 border-red-500/30" : overallColor === "amarillo" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-green-500/10 border-green-500/30";
  const overallDot = overallColor === "rojo" ? "bg-red-500" : overallColor === "amarillo" ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="min-h-screen bg-[#070A13] text-[#EEF2FF] font-sans">
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
            <Button
              variant="ghost"
              onClick={() => setShowCaseList(!showCaseList)}
              className="text-[#EEF2FF] hover:bg-white/10 text-sm gap-2"
            >
              <Users className="w-4 h-4" /> {showCaseList ? "Ver resumen" : "Ver casos individuales"}
            </Button>
            <Link href="/">
              <Button variant="ghost" className="text-[#EEF2FF] hover:bg-white/10 text-sm">Diagnóstico ciudadano</Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout} className="text-white/40 hover:text-white hover:bg-white/10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* LISTA DE CASOS INDIVIDUALES */}
        {showCaseList && (
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg">Casos individuales</h3>
                <p className="text-xs text-white/40 mt-0.5">{filtered.length} diagnósticos · Clic para ver detalle · "Evolución" para ver trazabilidad</p>
              </div>
              <div className="flex gap-3 text-[10px] text-white/40">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Aceptó seguimiento</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/20 inline-block" /> Sin respuesta</span>
              </div>
            </div>
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {filtered.map((r, i) => {
                const sitLabR = (() => { try { const p = (() => { const raw = r.perfil_contextual; return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); })(); return p?.profundizacion?.situacion_laboral; } catch { return undefined; } })();
                const scores = calcularScores(r.answers || {}, sitLabR);
                const rojas = scores.filter(s => s.color === "rojo").length;
                const barrio = r.territorio?.barrio || "Sin barrio";
                const fecha = new Date(r.submitted_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "2-digit" });
                const aceptoSeguimiento = r.acepto_seguimiento === true;
                const nombre = getNombrePersona(r);
                return (
                  <div
                    key={r.id || i}
                    onClick={() => setSelectedCase(r)}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    {/* Avatar con indicador seguimiento */}
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-white/40" />
                      </div>
                      {aceptoSeguimiento && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-[#070A13]" title="Aceptó seguimiento" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white truncate">{nombre}</div>
                      <div className="text-[11px] text-white/40 flex items-center gap-1.5">
                        <MapPin className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                        <span className="truncate">{barrio}</span>
                        <span>·</span>
                        <span>{fecha}</span>
                      </div>
                    </div>
                    {/* Dots semáforo */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {scores.map(s => (
                        <div key={s.dimensionId} title={`${s.dimensionName}: ${s.color}`}
                          className={`w-2.5 h-2.5 rounded-full ${s.color === "rojo" ? "bg-red-500" : s.color === "amarillo" ? "bg-yellow-500" : "bg-green-500"}`} />
                      ))}
                    </div>
                    {/* Badge áreas críticas */}
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0 ${
                      rojas >= 2 ? "bg-red-500/20 text-red-400 border-red-500/30" :
                      rojas === 1 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                      "bg-green-500/20 text-green-400 border-green-500/30"
                    }`}>
                      {rojas} 🔴
                    </span>
                    {/* Botón evolución */}
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedCase(r); setShowTrazabilidad(true); }}
                      className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors flex-shrink-0 font-bold"
                    >
                      Evolución
                    </button>
                    {/* Botón eliminar */}
                    {confirmDeleteId === r.id ? (
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                          className="text-[10px] text-white bg-red-500 px-2 py-1 rounded-lg hover:bg-red-600 transition-colors font-bold"
                        >
                          {deletingId === r.id ? "..." : "Confirmar"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDeleteId(r.id); }}
                        className="text-[10px] text-red-400/60 bg-red-500/5 border border-red-500/20 px-2 py-1 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        🗑
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
              <button key={b} onClick={() => setBarrioFilter(b)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${barrioFilter === b ? "bg-primary text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>
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
                Basado en <span className="font-black text-white">{stats.total}</span> diagnósticos · {barrioFilter === "all" ? "Ciudad de Buenos Aires" : `Barrio ${barrioFilter}`}
              </p>
            </div>
            <div className="md:ml-auto flex gap-6 text-center">
              <div><div className="text-2xl font-black text-red-400">{Math.round(stats.dist.rojo * 100)}%</div><div className="text-[10px] text-white/50 uppercase">Crítico</div></div>
              <div><div className="text-2xl font-black text-yellow-400">{Math.round(stats.dist.amarillo * 100)}%</div><div className="text-[10px] text-white/50 uppercase">Alerta</div></div>
              <div><div className="text-2xl font-black text-green-400">{Math.round(stats.dist.verde * 100)}%</div><div className="text-[10px] text-white/50 uppercase">Estable</div></div>
            </div>
          </div>
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
                    <div key={d.id} onClick={() => setSelectedDimension(isSelected ? null : d.id)}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 relative ${
                        isSelected ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" :
                        isCritical ? "border-red-500/50 bg-red-500/5" : "border-white/5 bg-white/5 hover:bg-white/10"
                      }`}>
                      {isCritical && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-bounce">ÁREA CRÍTICA</div>
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
                        }`}>{s.color}</div>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div style={{ width: `${s.severity}%` }}
                          className={`h-full rounded-full transition-all duration-1000 ${
                            s.color === "rojo" ? "bg-red-500" : s.color === "amarillo" ? "bg-yellow-500" : "bg-green-500"
                          }`} />
                      </div>
                      <p className="text-[11px] text-white/60 italic">{s.explanation}</p>
                      {isSelected && PROGRAMAS_CABA[d.id] && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2 animate-in fade-in slide-in-from-top-2">
                          <div className="text-[10px] font-black text-primary uppercase tracking-wider mb-2">Programas disponibles en CABA</div>
                          {PROGRAMAS_CABA[d.id].map((p, i) => (
                            <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                              <div className="font-bold text-xs text-white">{p.nombre}</div>
                              <div className="text-[10px] text-white/50">{p.descripcion}</div>
                              <div className="flex gap-3 mt-1">
                                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline"><ExternalLink className="w-3 h-3" /> Ver programa</a>}
                                {p.contacto && <span className="text-[10px] text-white/40">{p.contacto}</span>}
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

            {topCriticalDims.length > 0 && (
              <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-black">Intervención prioritaria recomendada</h3>
                </div>
                <p className="text-sm text-white/50">Basado en los datos del territorio, estos son los programas más urgentes:</p>
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
                          {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline mt-1"><ExternalLink className="w-3 h-3" /> Acceder al programa</a>}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-[#A9B3DA] text-[10px] font-bold uppercase mb-1">Diagnósticos</div>
                <div className="text-3xl font-black text-white">{stats.total}</div>
                <div className="text-[10px] text-green-400 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> En tiempo real</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-[#A9B3DA] text-[10px] font-bold uppercase mb-1">Barrios</div>
                <div className="text-3xl font-black text-white">{barrios.length}</div>
                <div className="text-[10px] text-white/40 mt-1">con datos</div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
              <h3 className="text-base font-black mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Voces del territorio
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {stats.comentarios.length > 0 ? stats.comentarios.map((c: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold text-white/60">{c.barrio}</span>
                      <span className="text-[9px] text-white/30 ml-auto">{new Date(c.submitted_at).toLocaleDateString("es-AR")}</span>
                    </div>
                    <p className="text-xs italic text-white/80 leading-relaxed">"{c.text}"</p>
                  </div>
                )) : <p className="text-xs text-white/30 text-center py-4">No hay comentarios aún.</p>}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#7c5cff]/20 to-transparent border border-[#7c5cff]/30 rounded-3xl p-5">
              <h3 className="text-base font-black mb-1">Sumar más territorio</h3>
              <p className="text-xs text-[#A9B3DA] mb-4">Cada diagnóstico individual enriquece la inteligencia territorial de KORAI.</p>
              <Link href="/"><Button className="w-full bg-white text-black hover:bg-white/90 font-bold rounded-xl h-11 text-sm">Ir al diagnóstico ciudadano</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
