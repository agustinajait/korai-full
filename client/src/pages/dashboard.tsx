import { useState, useMemo, useEffect } from "react";
import koraiLogo from "@/lib/koraiLogo";
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
    <div className="min-h-screen bg-[#f0eef8] text-[#1E1040] font-sans">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-[#6B5FA0] hover:text-[#1E1040] hover:bg-[#ede9fe] gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-br from-white to-[#f0eef8] border border-[#B8A9E8] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#1E1040]" />
            </div>
            <div>
              <div className="text-xl font-black">{nombre}</div>
              <div className="text-xs text-[#9B8EC4] mt-0.5">
                {historial.length} diagnóstico{historial.length !== 1 ? "s" : ""} registrado{historial.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : historial.length === 0 ? (
          <div className="text-center py-10 text-[#9B8EC4]">Sin historial disponible.</div>
        ) : (
          <>
            {/* Evolución visual por dimensión */}
            <div className="bg-white border border-[#B8A9E8] rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-[#B8A9E8]">
                <h3 className="font-black text-lg">Evolución por dimensión</h3>
                <p className="text-xs text-[#9B8EC4] mt-1">Cada columna es un diagnóstico. De izquierda a derecha, del más antiguo al más reciente.</p>
              </div>
              <div className="p-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left text-xs text-[#9B8EC4] font-bold pb-3 pr-4 w-32">Dimensión</th>
                      {historial.map((h, i) => (
                        <th key={i} className="text-center text-xs text-[#9B8EC4] font-bold pb-3 px-2 min-w-[80px]">
                          <div>{new Date(h.submitted_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</div>
                          <div className="text-[9px] text-[#C4B5FD]">#{i + 1}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE9FE]">
                    {INSTRUMENT.dimensions.map(d => (
                      <tr key={d.id}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span>{d.emoji}</span>
                            <span className="font-semibold text-xs text-[#1E1040]">{d.name}</span>
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
            <div className="bg-white border border-[#B8A9E8] rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-[#B8A9E8]">
                <h3 className="font-black text-lg">Timeline de diagnósticos</h3>
              </div>
              <div className="divide-y divide-[#EDE9FE]">
                {historial.map((h, i) => {
                  const sitLab = (() => { try { const p = (() => { const raw = h.perfil_contextual; return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); })(); return p?.profundizacion?.situacion_laboral; } catch { return undefined; } })();
                  const scores = calcularScores(h.answers || {}, sitLab);
                  const rojas = scores.filter(s => s.color === "rojo").length;
                  const fecha = new Date(h.submitted_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
                  const isLast = i === historial.length - 1;
                  return (
                    <div key={i} className={`p-5 ${isLast ? "bg-[#f8f6ff]" : ""}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-bold text-sm">Diagnóstico #{i + 1}</div>
                          <div className="text-xs text-[#9B8EC4]">{fecha} {isLast ? "· Más reciente" : ""}</div>
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
function getDni(r: any): string {
  try {
    const raw = r.perfil_contextual;
    const p = typeof raw === "string" ? JSON.parse(raw) : (raw || {});
    return p?.dni || r.dni_real || "";
  } catch { return r.dni_real || ""; }
}

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
    <div className="min-h-screen bg-[#f0eef8] text-[#1E1040] font-sans">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[1100px] h-[700px] bg-[#5c40c0]/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">

        {/* Header caso */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-[#6B5FA0] hover:text-[#1E1040] hover:bg-[#ede9fe] gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver al dashboard
          </Button>
        </div>

        {/* Perfil */}
        <div className="bg-white border border-[#B8A9E8] rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-14 h-14 flex items-center justify-center">
            <User className="w-7 h-7 text-[#1E1040]" />
          </div>
          <div className="flex-1">
            <div className="text-xl font-black">{getNombrePersona(response)}</div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-[#6B5FA0] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" /> {barrio}
              </span>
              <span className="text-xs text-[#9B8EC4]">·</span>
              <span className="text-xs text-[#6B5FA0]">{fecha}</span>
              {response.territorio?.ciudad && (
                <>
                  <span className="text-xs text-[#9B8EC4]">·</span>
                  <span className="text-xs text-[#6B5FA0]">{response.territorio.ciudad}</span>
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
        <div className="bg-white border border-[#B8A9E8] rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-[#B8A9E8]">
            <h3 className="font-black text-lg">Diagnóstico por dimensión</h3>
            <p className="text-xs text-[#9B8EC4] mt-1">Resultado del autodiagnóstico en las 6 áreas de bienestar</p>
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
                <div className="h-1.5 w-full bg-[#ede9fe] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      s.color === "rojo" ? "bg-red-500" : s.color === "amarillo" ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${(s.verde / s.total) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-[#9B8EC4]">{s.verde} de {s.total} indicadores positivos</div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan generado */}
        <div className="bg-white border border-[#B8A9E8] rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-[#B8A9E8]">
            <h3 className="font-black text-lg">Plan de acción generado</h3>
            <p className="text-xs text-[#9B8EC4] mt-1">Áreas prioritarias y acciones recomendadas para este caso</p>
          </div>
          <div className="p-5 space-y-4">
            {plan.map((item, i) => (
              <div key={i} className={`p-4 rounded-2xl border space-y-3 ${
                item.esPrioritaria ? "border-red-500/30 bg-red-500/5" : "border-[#B8A9E8] bg-[#f8f6ff]"
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{item.dimensionName}</span>
                      {item.esPrioritaria && (
                        <span className="text-[9px] bg-red-500 text-[#1E1040] px-2 py-0.5 rounded-full font-black">BLOQUEANTE</span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#9B8EC4] mt-0.5">{item.motivo}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase flex-shrink-0 ${colorBadge(item.nivelColor)}`}>
                    {item.cuando}
                  </span>
                </div>

                {/* Acciones */}
                <div className="space-y-1">
                  {item.accionesCorto.map((a, j) => (
                    <div key={j} className="flex items-start gap-2 text-xs text-[#6B5FA0]">
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
                        className="text-[10px] bg-white border border-[#B8A9E8] px-2 py-1 rounded-lg text-primary hover:bg-[#ede9fe] flex items-center gap-1 transition-colors"
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
          <div className="bg-white border border-[#B8A9E8] rounded-3xl p-5">
            <h3 className="font-black text-base mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Lo que nos contó
            </h3>
            <p className="text-sm italic text-[#1E1040] leading-relaxed">"{response.texto_abierto}"</p>
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
  const [caseSearch, setCaseSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [showCaseList, setShowCaseList] = useState(false);
  const [filtroCriticos, setFiltroCriticos] = useState(false);
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
    let list = barrioFilter === "all" ? responses : responses.filter(r => r.territorio?.barrio === barrioFilter);
    if (caseSearch.trim()) {
      const q = caseSearch.toLowerCase();
      list = list.filter(r => getNombrePersona(r).toLowerCase().includes(q) || getDni(r).toLowerCase().includes(q));
    }
    return list;
  }, [responses, barrioFilter, caseSearch]);

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

    // ── Métricas demográficas ─────────────────────────────────────────────────
    const demografico = {
      empleo: { sin_trabajo: 0, buscando: 0, con_trabajo: 0 },
      ingreso: { menos_700k: 0, r700k_1300k: 0, r1300k_2000k: 0, mas_2000k: 0, prefiero_no: 0 },
      educacion: { sin_secundario: 0, con_secundario: 0, cursando: 0 },
      vivienda: { propia: 0, alquiler: 0, prestada: 0, inestable: 0 },
      beneficio: { si: 0, no: 0 },
      seguridad: { seguro: 0, inseguro: 0 },
      habilidades: { limpieza: 0, cuidado: 0, cocina: 0, construccion: 0, ventas: 0, admin: 0, tecnologia: 0, oficios: 0, otro: 0 },
    };

    filtered.forEach(r => {
      const perfil = (() => { try { const raw = r.perfil_contextual; return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); } catch { return {}; } })();
      const demo = perfil?.demographics || perfil || {};

      // Empleo
      if (demo.situacion_laboral === "no_trabajo") demografico.empleo.sin_trabajo++;
      else if (demo.situacion_laboral === "buscando") demografico.empleo.buscando++;
      else if (demo.situacion_laboral === "tengo_trabajo") demografico.empleo.con_trabajo++;

      // Ingreso del hogar
      if (demo.ingreso_hogar === "menos_700k") demografico.ingreso.menos_700k++;
      else if (demo.ingreso_hogar === "700k_1300k") demografico.ingreso.r700k_1300k++;
      else if (demo.ingreso_hogar === "1300k_2000k") demografico.ingreso.r1300k_2000k++;
      else if (demo.ingreso_hogar === "mas_2000k") demografico.ingreso.mas_2000k++;
      else if (demo.ingreso_hogar === "prefiero_no") demografico.ingreso.prefiero_no++;

      // Educación (desde profundización)
      const prof = perfil?.profundizacion || {};
      if (prof.edu_secundario === "no") demografico.educacion.sin_secundario++;
      else if (prof.edu_secundario === "si") demografico.educacion.con_secundario++;
      else if (prof.edu_secundario === "curso") demografico.educacion.cursando++;

      // Vivienda
      if (demo.tipo_vivienda === "propia") demografico.vivienda.propia++;
      else if (demo.tipo_vivienda === "alquiler") demografico.vivienda.alquiler++;
      else if (demo.tipo_vivienda === "prestada") demografico.vivienda.prestada++;
      else if (demo.tipo_vivienda === "inestable") demografico.vivienda.inestable++;

      // Beneficio social (solo quienes vieron la pregunta: ingreso bajo)
      if (demo.beneficio_social === "si") demografico.beneficio.si++;
      else if (demo.beneficio_social === "no") demografico.beneficio.no++;

      // Habilidades laborales (emp_tareas — en profundizacion)
      const profDem = perfil?.profundizacion || {};
      const tareas = profDem["emp_tareas"];
      if (tareas) {
        const vals = Array.isArray(tareas) ? tareas : String(tareas).split(",");
        vals.forEach((v: string) => {
          const k = v.trim() as keyof typeof demografico.habilidades;
          if (k in demografico.habilidades) demografico.habilidades[k]++;
        });
      }

      // Seguridad barrial (indicador vivienda_05)
      const seg = r.answers?.["vivienda_05"];
      if (seg === "verde") demografico.seguridad.seguro++;
      else if (seg === "rojo" || seg === "amarillo") demografico.seguridad.inseguro++;
    });

    const usuariosUnicos = new Set(filtered.map(r => r.dni_hash).filter(Boolean)).size;

    return {
      total,
      usuariosUnicos,
      dist: { rojo: total ? rojo / total : 0, amarillo: total ? amarillo / total : 0, verde: total ? verde / total : 0 },
      byDim,
      mostCritical,
      comentarios: comentarios.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()),
      demografico,
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
    <div className="min-h-screen flex items-center justify-center bg-[#f0eef8]">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="text-[#6B5FA0] text-sm">Cargando datos del territorio...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#f0eef8]">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2 text-[#1E1040]">Error al cargar datos</h2>
      <p className="text-[#6B5FA0] text-sm mb-4">{error}</p>
      <Link href="/" className="text-primary hover:underline">Volver al inicio</Link>
    </div>
  );

  if (!stats) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#f0eef8]">
      <Users className="w-12 h-12 text-[#C4B5FD] mb-4" />
      <h2 className="text-xl font-bold text-[#6B5FA0]">Sin datos aún</h2>
      <p className="text-[#9B8EC4] text-sm mt-2">Los diagnósticos aparecerán aquí en tiempo real.</p>
    </div>
  );

  const overallColor = stats.dist.rojo >= 0.33 ? "rojo" : stats.dist.amarillo >= 0.33 ? "amarillo" : "verde";

  // KPIs ejecutivos
  const personasCriticas = Math.round(stats.total * stats.dist.rojo);
  const sinBeneficioVulnerable = stats.demografico?.beneficio?.no || 0;
  const dimMasCritica = stats.mostCritical
    ? { id: stats.mostCritical, ...stats.byDim[stats.mostCritical] }
    : null;
  const dimMasCriticaNombre = dimMasCritica
    ? ({"empleo":"Empleo","ingresos":"Ingresos","vivienda":"Vivienda","salud":"Salud","educacion":"Educación","vinculos":"Red y Vínculos"}[dimMasCritica.id] || dimMasCritica.id)
    : "";
  const dimMasCriticaPct = dimMasCritica
    ? Math.round((dimMasCritica.rojo / (dimMasCritica.n || 1)) * 100)
    : 0;
  const overallBg = overallColor === "rojo" ? "bg-red-500/10 border-red-500/30" : overallColor === "amarillo" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-green-500/10 border-green-500/30";
  const overallDot = overallColor === "rojo" ? "bg-red-500" : overallColor === "amarillo" ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="min-h-screen bg-[#f0eef8] text-[#1E1040] font-sans">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[1100px] h-[700px] bg-[#5c40c0]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[900px] h-[600px] bg-[#ffd166]/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <img src={koraiLogo} alt="KORAI" className="w-12 h-12 object-contain" />
            <div>
              <div className="text-xl font-black leading-tight">KORAI Dashboard</div>
              <div className="text-xs text-[#6B5FA0]">Panel institucional · Ciudad de Buenos Aires</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowCaseList(!showCaseList)}
              className="text-[#1E1040] hover:bg-[#ede9fe] text-sm gap-2"
            >
              <Users className="w-4 h-4" /> {showCaseList ? "Ver resumen" : "Ver casos individuales"}
            </Button>
            <Button
              variant="ghost"
              className="text-[#1E1040] hover:bg-[#ede9fe] text-sm"
              onClick={() => { navigator.clipboard?.writeText(window.location.origin + "/"); }}
            >
              Copiar enlace
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="text-[#9B8EC4] hover:text-[#1E1040] hover:bg-[#ede9fe]">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* LISTA DE CASOS INDIVIDUALES */}
        {showCaseList && (
          <div className="bg-white border border-[#B8A9E8] rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-[#B8A9E8] flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg">Casos individuales</h3>
                <p className="text-xs text-[#9B8EC4] mt-0.5">
                  {filtroCriticos
                    ? <><span className="text-red-500 font-bold">🚨 Mostrando solo casos críticos</span> · <button onClick={() => setFiltroCriticos(false)} className="underline text-[#6B5FA0]">Ver todos</button></>
                    : <>{filtered.length} diagnósticos · Clic para ver detalle · "Evolución" para ver trazabilidad</>
                  }
                </p>
              </div>
              <div className="flex gap-3 text-[10px] text-[#9B8EC4]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Aceptó seguimiento</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/20 inline-block" /> Sin respuesta</span>
              </div>
            </div>
            <div className="p-5 border-b border-[#B8A9E8]">
              <input
                value={caseSearch}
                onChange={e => setCaseSearch(e.target.value)}
                placeholder="Buscar por nombre o DNI..."
                className="w-full h-11 px-4 rounded-xl bg-white border border-[#B8A9E8] text-sm text-[#1E1040] placeholder:text-[#9B8EC4] focus:outline-none"
              />
            </div>
            <div className="divide-y divide-[#EDE9FE] max-h-[600px] overflow-y-auto">
              {(filtroCriticos
                ? filtered.filter(r => {
                    const sc = calcularScores(r.answers || {}, r.perfil_contextual?.demographics?.situacion_laboral);
                    return sc.filter(s => s.color === "rojo").length >= 2;
                  })
                : filtered
              ).map((r, i) => {
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
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-white cursor-pointer transition-colors group"
                  >
                    {/* Avatar con indicador seguimiento */}
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#B8A9E8] flex items-center justify-center">
                        <User className="w-4 h-4 text-[#9B8EC4]" />
                      </div>
                      {aceptoSeguimiento && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-[#070A13]" title="Aceptó seguimiento" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[#1E1040] truncate">{nombre}</div>
                      <div className="text-[11px] text-[#9B8EC4] flex items-center gap-1.5">
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
                          className="text-[10px] text-[#1E1040] bg-red-500 px-2 py-1 rounded-lg hover:bg-red-600 transition-colors font-bold"
                        >
                          {deletingId === r.id ? "..." : "Confirmar"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] text-[#9B8EC4] bg-white px-2 py-1 rounded-lg hover:bg-[#ede9fe] transition-colors"
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
                    <ChevronRight className="w-4 h-4 text-[#C4B5FD] group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtro por barrio */}
        <div className="flex items-center gap-3 flex-wrap">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-xs text-[#6B5FA0] uppercase font-bold tracking-wider">Filtrar por barrio:</span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setBarrioFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${barrioFilter === "all" ? "bg-primary text-[#1E1040]" : "bg-white text-[#6B5FA0] hover:bg-[#ede9fe]"}`}
            >
              Todos ({responses.length})
            </button>
            {barrios.map(b => (
              <button key={b} onClick={() => setBarrioFilter(b)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${barrioFilter === b ? "bg-primary text-[#1E1040]" : "bg-white text-[#6B5FA0] hover:bg-[#ede9fe]"}`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Estado general */}
        <div className={`p-8 rounded-[40px] border relative overflow-hidden ${overallBg}`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-sm animate-pulse ${overallDot}`}>
              <div className="text-[#1E1040] font-black text-lg">CABA</div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Estado General del Territorio</h2>
              <p className="text-[#6B5FA0] text-sm mt-1">
                <span className="font-black text-[#1E1040]">{stats.usuariosUnicos}</span> personas únicas · <span className="font-black text-[#1E1040]">{stats.total}</span> diagnósticos · {barrioFilter === "all" ? "Ciudad de Buenos Aires" : `Barrio ${barrioFilter}`}
              </p>
            </div>
            <div className="md:ml-auto flex gap-6 text-center">
              <div><div className="text-2xl font-black text-red-400">{Math.round(stats.dist.rojo * 100)}%</div><div className="text-[10px] text-[#6B5FA0] uppercase">Crítico</div></div>
              <div><div className="text-2xl font-black text-yellow-400">{Math.round(stats.dist.amarillo * 100)}%</div><div className="text-[10px] text-[#6B5FA0] uppercase">Alerta</div></div>
              <div><div className="text-2xl font-black text-green-400">{Math.round(stats.dist.verde * 100)}%</div><div className="text-[10px] text-[#6B5FA0] uppercase">Estable</div></div>
            </div>
          </div>
          <div className="mt-6 flex h-3 w-full rounded-full overflow-hidden bg-[#ede9fe]">
            <div style={{ width: `${stats.dist.verde * 100}%` }} className="bg-[#22c55e] transition-all duration-1000" />
            <div style={{ width: `${stats.dist.amarillo * 100}%` }} className="bg-[#f59e0b] transition-all duration-1000" />
            <div style={{ width: `${stats.dist.rojo * 100}%` }} className="bg-[#ef4444] transition-all duration-1000" />
          </div>
        </div>

        {/* ── KPIs ejecutivos ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* Personas únicas */}
          <div className="bg-white border border-[#B8A9E8] rounded-2xl p-5 flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">👤</span>
              <span className="text-[10px] font-black uppercase text-[#5c40c0] tracking-wider">Personas únicas</span>
            </div>
            <div className="text-4xl font-black text-[#5c40c0] leading-none">{stats.usuariosUnicos}</div>
            <div className="text-sm text-[#6B5FA0] leading-snug">personas distintas relevadas</div>
            <div className="text-[10px] text-[#9B8EC4]">Deduplicado por DNI</div>
          </div>

          {/* Diagnósticos totales */}
          <div className="bg-white border border-[#B8A9E8] rounded-2xl p-5 flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <span className="text-[10px] font-black uppercase text-[#6B5FA0] tracking-wider">Diagnósticos</span>
            </div>
            <div className="text-4xl font-black text-[#1E1040] leading-none">{stats.total}</div>
            <div className="text-sm text-[#6B5FA0] leading-snug">diagnósticos realizados</div>
            <div className="text-[10px] text-[#9B8EC4]">Incluye rediagnósticos</div>
          </div>

          {/* Personas en situación crítica — clickeable */}
          <div
            className={`rounded-2xl p-5 flex flex-col gap-1.5 shadow-sm cursor-pointer transition-all border-2 ${filtroCriticos ? "bg-red-50 border-red-400 ring-2 ring-red-200" : "bg-white border-[#B8A9E8] hover:border-red-300 hover:bg-red-50"}`}
            onClick={() => { setFiltroCriticos(f => !f); setShowCaseList(true); }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🚨</span>
                <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">Situación crítica</span>
              </div>
              {filtroCriticos && <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black">FILTRO ON</span>}
            </div>
            <div className="text-4xl font-black text-red-500 leading-none">{personasCriticas}</div>
            <div className="text-sm text-[#6B5FA0] leading-snug">personas en situación crítica</div>
            <div className="text-[10px] text-[#9B8EC4]">{Math.round(stats.dist.rojo * 100)}% del total · <span className="text-red-400 font-bold">Clic para ver</span></div>
          </div>

          {/* Sin cobertura de beneficios */}
          <div className="bg-white border border-[#B8A9E8] rounded-2xl p-5 flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span className="text-[10px] font-black uppercase text-yellow-600 tracking-wider">Brecha de cobertura</span>
            </div>
            <div className="text-4xl font-black text-yellow-500 leading-none">{sinBeneficioVulnerable}</div>
            <div className="text-sm text-[#6B5FA0] leading-snug">personas vulnerables sin beneficio social</div>
            <div className="text-[10px] text-[#9B8EC4]">No están en el sistema de protección social</div>
          </div>

          {/* Dimensión más crítica */}
          <div className="bg-white border border-[#B8A9E8] rounded-2xl p-5 flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <span className="text-[10px] font-black uppercase text-[#6B5FA0] tracking-wider">Dimensión más crítica</span>
            </div>
            <div className="text-2xl font-black text-[#5c40c0] leading-tight">{dimMasCriticaNombre || "—"}</div>
            <div className="text-sm text-[#6B5FA0] leading-snug">{dimMasCriticaPct}% de los diagnósticos en rojo</div>
            <div className="text-[10px] text-[#9B8EC4]">Requiere intervención prioritaria</div>
          </div>

        </div>

        {/* ── Panel demográfico ─────────────────────────────────────────── */}
        {stats.demografico && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Empleo */}
            <div className="bg-gradient-to-br from-white to-[#ede9fe] border border-[#B8A9E8] rounded-3xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">💼</span>
                <span className="text-xs font-black uppercase text-[#6B5FA0] tracking-wider">Situación laboral</span>
              </div>
              {[
                { label: "Con trabajo", val: stats.demografico.empleo.con_trabajo, color: "bg-green-500" },
                { label: "Buscando", val: stats.demografico.empleo.buscando, color: "bg-yellow-500" },
                { label: "Sin trabajo", val: stats.demografico.empleo.sin_trabajo, color: "bg-red-500" },
              ].map(({ label, val, color }) => {
                const pct = stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;
                return (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#6B5FA0]">{label}</span>
                      <span className="font-black text-[#1E1040]">{pct}% <span className="text-[#9B8EC4] font-normal">({val})</span></span>
                    </div>
                    <div className="h-1.5 bg-white rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ingreso */}
            <div className="bg-gradient-to-br from-white to-[#ede9fe] border border-[#B8A9E8] rounded-3xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <span className="text-xs font-black uppercase text-[#6B5FA0] tracking-wider">Ingreso del hogar</span>
              </div>
              {[
                { label: "< $700K", val: stats.demografico.ingreso.menos_700k, color: "bg-red-500" },
                { label: "$700K–$1.3M", val: stats.demografico.ingreso.r700k_1300k, color: "bg-orange-400" },
                { label: "$1.3M–$2M", val: stats.demografico.ingreso.r1300k_2000k, color: "bg-yellow-500" },
                { label: "> $2M", val: stats.demografico.ingreso.mas_2000k, color: "bg-green-500" },
                { label: "Prefiere no decir", val: stats.demografico.ingreso.prefiero_no, color: "bg-white/20" },
              ].map(({ label, val, color }) => {
                const pct = stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;
                return (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#6B5FA0]">{label}</span>
                      <span className="font-black text-[#1E1040]">{pct}% <span className="text-[#9B8EC4] font-normal">({val})</span></span>
                    </div>
                    <div className="h-1.5 bg-white rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Educación */}
            <div className="bg-gradient-to-br from-white to-[#ede9fe] border border-[#B8A9E8] rounded-3xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">📚</span>
                <span className="text-xs font-black uppercase text-[#6B5FA0] tracking-wider">Educación</span>
              </div>
              {[
                { label: "Secundario completo", val: stats.demografico.educacion.con_secundario, color: "bg-green-500" },
                { label: "Cursando", val: stats.demografico.educacion.cursando, color: "bg-yellow-500" },
                { label: "Sin secundario", val: stats.demografico.educacion.sin_secundario, color: "bg-red-500" },
              ].map(({ label, val, color }) => {
                const base = stats.demografico.educacion.con_secundario + stats.demografico.educacion.cursando + stats.demografico.educacion.sin_secundario;
                const pct = base > 0 ? Math.round((val / base) * 100) : 0;
                return (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#6B5FA0]">{label}</span>
                      <span className="font-black text-[#1E1040]">{pct}% <span className="text-[#9B8EC4] font-normal">({val})</span></span>
                    </div>
                    <div className="h-1.5 bg-white rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <p className="text-[9px] text-[#C4B5FD] pt-1">Solo usuarios que pasaron por profundización educativa</p>
            </div>

            {/* Vivienda */}
            <div className="bg-gradient-to-br from-white to-[#ede9fe] border border-[#B8A9E8] rounded-3xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏠</span>
                <span className="text-xs font-black uppercase text-[#6B5FA0] tracking-wider">Tipo de vivienda</span>
              </div>
              {[
                { label: "Propia", val: stats.demografico.vivienda.propia, color: "bg-green-500" },
                { label: "Alquilada", val: stats.demografico.vivienda.alquiler, color: "bg-yellow-500" },
                { label: "Prestada", val: stats.demografico.vivienda.prestada, color: "bg-orange-400" },
                { label: "Inestable", val: stats.demografico.vivienda.inestable, color: "bg-red-500" },
              ].map(({ label, val, color }) => {
                const pct = stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;
                return (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#6B5FA0]">{label}</span>
                      <span className="font-black text-[#1E1040]">{pct}% <span className="text-[#9B8EC4] font-normal">({val})</span></span>
                    </div>
                    <div className="h-1.5 bg-white rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Beneficio social */}
            {(stats.demografico.beneficio.si + stats.demografico.beneficio.no) > 0 && (
              <div className="bg-gradient-to-br from-white to-[#ede9fe] border border-[#B8A9E8] rounded-3xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏛️</span>
                  <span className="text-xs font-black uppercase text-[#6B5FA0] tracking-wider">Beneficio social</span>
                </div>
                <p className="text-[10px] text-[#9B8EC4]">Solo usuarios con ingreso bajo</p>
                {[
                  { label: "Recibe beneficio", val: stats.demografico.beneficio.si, color: "bg-green-500" },
                  { label: "No recibe ninguno", val: stats.demografico.beneficio.no, color: "bg-red-500" },
                ].map(({ label, val, color }) => {
                  const base = stats.demografico.beneficio.si + stats.demografico.beneficio.no;
                  const pct = base > 0 ? Math.round((val / base) * 100) : 0;
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#6B5FA0]">{label}</span>
                        <span className="font-black text-[#1E1040]">{pct}% <span className="text-[#9B8EC4] font-normal">({val})</span></span>
                      </div>
                      <div className="h-2 bg-[#DDD6FE] rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Seguridad barrial */}
            {(stats.demografico.seguridad.seguro + stats.demografico.seguridad.inseguro) > 0 && (
              <div className="bg-gradient-to-br from-white to-[#ede9fe] border border-[#B8A9E8] rounded-3xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔒</span>
                  <span className="text-xs font-black uppercase text-[#6B5FA0] tracking-wider">Seguridad en el barrio</span>
                </div>
                {[
                  { label: "Se siente seguro/a", val: stats.demografico.seguridad.seguro, color: "bg-green-500" },
                  { label: "No se siente seguro/a", val: stats.demografico.seguridad.inseguro, color: "bg-red-500" },
                ].map(({ label, val, color }) => {
                  const base = stats.demografico.seguridad.seguro + stats.demografico.seguridad.inseguro;
                  const pct = base > 0 ? Math.round((val / base) * 100) : 0;
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#6B5FA0]">{label}</span>
                        <span className="font-black text-[#1E1040]">{pct}% <span className="text-[#9B8EC4] font-normal">({val})</span></span>
                      </div>
                      <div className="h-2 bg-[#DDD6FE] rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[9px] text-[#9B8EC4] pt-1">Basado en: "Me siento seguro/a en mi barrio, especialmente de noche"</p>
              </div>
            )}

            {/* Habilidades laborales */}
            {Object.values(stats.demografico.habilidades).some(v => v > 0) && (
              <div className="bg-gradient-to-br from-white to-[#ede9fe] border border-[#B8A9E8] rounded-3xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛠️</span>
                  <span className="text-xs font-black uppercase text-[#6B5FA0] tracking-wider">Habilidades laborales</span>
                </div>
                <p className="text-[9px] text-[#9B8EC4]">Solo usuarios sin empleo que pasaron por profundización</p>
                {[
                  { label: "Limpieza",       key: "limpieza",      emoji: "🧹" },
                  { label: "Cuidado",        key: "cuidado",       emoji: "🤝" },
                  { label: "Cocina",         key: "cocina",        emoji: "🍳" },
                  { label: "Construcción",   key: "construccion",  emoji: "🏗️" },
                  { label: "Ventas",         key: "ventas",        emoji: "🛒" },
                  { label: "Administración", key: "admin",         emoji: "📋" },
                  { label: "Tecnología",     key: "tecnologia",    emoji: "💻" },
                  { label: "Oficios",        key: "oficios",       emoji: "🔧" },
                  { label: "Otro",           key: "otro",          emoji: "➕" },
                ].filter(({ key }) => stats.demografico.habilidades[key as keyof typeof stats.demografico.habilidades] > 0)
                 .sort((a, b) => stats.demografico.habilidades[b.key as keyof typeof stats.demografico.habilidades] - stats.demografico.habilidades[a.key as keyof typeof stats.demografico.habilidades])
                 .map(({ label, key, emoji }) => {
                  const val = stats.demografico.habilidades[key as keyof typeof stats.demografico.habilidades];
                  const base = Object.values(stats.demografico.habilidades).reduce((a, b) => a + b, 0);
                  const pct = base > 0 ? Math.round((val / base) * 100) : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#6B5FA0]">{emoji} {label}</span>
                        <span className="font-black text-[#1E1040]">{val} <span className="text-[#9B8EC4] font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-[#DDD6FE] rounded-full overflow-hidden">
                        <div className="h-full bg-[#5c40c0] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Dimensiones */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-gradient-to-br from-white to-[#f0eef8] border border-[#B8A9E8] rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-[#B8A9E8]">
                <h3 className="text-xl font-black">Diagnóstico por Dimensión</h3>
                <p className="text-xs text-[#9B8EC4] mt-1">Hacé clic en una dimensión para ver los indicadores más críticos</p>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-4 items-start">
                {INSTRUMENT.dimensions.map(d => {
                  const s = stats.byDim[d.id] || { rojo: 0, amarillo: 0, verde: 0, n: 0, color: "verde", severity: 0, explanation: "" };
                  const isSelected = selectedDimension === d.id;
                  const isCritical = stats.mostCritical === d.id && s.severity > 0;
                  return (
                    <div key={d.id} onClick={() => setSelectedDimension(isSelected ? null : d.id)}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 relative ${
                        isSelected ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" :
                        isCritical ? "border-red-500/50 bg-red-500/5" : "border-[#B8A9E8] bg-white hover:bg-[#ede9fe]"
                      }`}>
                      {isCritical && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-[#1E1040] text-[9px] font-black px-2 py-0.5 rounded-full animate-bounce">ÁREA CRÍTICA</div>
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
                      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                        <div style={{ width: `${s.severity}%` }}
                          className={`h-full rounded-full transition-all duration-1000 ${
                            s.color === "rojo" ? "bg-red-500" : s.color === "amarillo" ? "bg-yellow-500" : "bg-green-500"
                          }`} />
                      </div>
                      <p className="text-[11px] text-[#6B5FA0] italic">{s.explanation}</p>
                      {isSelected && (() => {
                        // Indicadores de esta dimensión ordenados por % de rojo+amarillo
                        const indsDim = INSTRUMENT.indicators.filter(ind => ind.dimension === d.id);
                        const indsConScore = indsDim.map(ind => {
                          let rojo = 0, amarillo = 0, total = 0;
                          filtered.forEach(r => {
                            const val = r.answers?.[ind.id];
                            if (val) { total++; if (val === "rojo") rojo++; else if (val === "amarillo") amarillo++; }
                          });
                          return { ind, rojo, amarillo, total, pct: total > 0 ? Math.round(((rojo + amarillo) / total) * 100) : 0, pctRojo: total > 0 ? Math.round((rojo / total) * 100) : 0 };
                        }).filter(x => x.total > 0).sort((a, b) => b.pct - a.pct);
                        if (indsConScore.length === 0) return <div className="mt-3 pt-3 border-t border-[#B8A9E8] text-[11px] text-[#9B8EC4]">Sin datos suficientes aún.</div>;
                        return (
                          <div className="mt-3 pt-3 border-t border-[#B8A9E8] space-y-2 animate-in fade-in slide-in-from-top-2">
                            <div className="text-[10px] font-black text-[#5c40c0] uppercase tracking-wider mb-2">Indicadores más críticos</div>
                            {indsConScore.slice(0, 4).map(({ ind, rojo, amarillo, total, pct, pctRojo }) => (
                              <div key={ind.id} className="space-y-1">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-[11px] text-[#1E1040] leading-snug flex-1">{ind.label}</span>
                                  <span className={`text-[10px] font-black flex-shrink-0 ${pctRojo >= 50 ? "text-red-500" : pct >= 40 ? "text-yellow-500" : "text-[#9B8EC4]"}`}>{pct}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#ede9fe] rounded-full overflow-hidden">
                                  <div className="h-full flex">
                                    <div className="bg-red-400 h-full transition-all duration-700" style={{ width: `${total > 0 ? (rojo/total)*100 : 0}%` }} />
                                    <div className="bg-yellow-400 h-full transition-all duration-700" style={{ width: `${total > 0 ? (amarillo/total)*100 : 0}%` }} />
                                  </div>
                                </div>
                                <div className="text-[9px] text-[#9B8EC4]">{rojo} en rojo · {amarillo} en alerta · {total} respondieron</div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
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
                <p className="text-sm text-[#6B5FA0]">Basado en los datos del territorio, estos son los programas más urgentes:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {topCriticalDims.flatMap(dimId =>
                    (PROGRAMAS_CABA[dimId] || []).slice(0, 2).map((p, i) => {
                      const dim = INSTRUMENT.dimensions.find(d => d.id === dimId);
                      return (
                        <div key={`${dimId}-${i}`} className="p-4 rounded-2xl bg-white border border-[#B8A9E8] space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{dim?.emoji}</span>
                            <div className="text-[10px] text-[#9B8EC4] uppercase font-bold">{dim?.name}</div>
                          </div>
                          <div className="font-bold text-sm text-[#1E1040]">{p.nombre}</div>
                          <div className="text-[10px] text-[#6B5FA0]">{p.descripcion}</div>
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
              <div className="bg-gradient-to-br from-white to-[#f0eef8] border border-[#B8A9E8] rounded-2xl p-4 shadow-sm">
                <div className="text-[#6B5FA0] text-[10px] font-bold uppercase mb-1">Diagnósticos</div>
                <div className="text-3xl font-black text-[#1E1040]">{stats.total}</div>
                <div className="text-[10px] text-green-400 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> En tiempo real</div>
              </div>
              <div className="bg-gradient-to-br from-white to-[#f0eef8] border border-[#B8A9E8] rounded-2xl p-4 shadow-sm">
                <div className="text-[#6B5FA0] text-[10px] font-bold uppercase mb-1">Barrios</div>
                <div className="text-3xl font-black text-[#1E1040]">{barrios.length}</div>
                <div className="text-[10px] text-[#9B8EC4] mt-1">con datos</div>
              </div>
            </div>

            <div className="bg-white border border-[#B8A9E8] rounded-3xl p-5 shadow-sm">
              <h3 className="text-base font-black mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Voces del territorio
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {stats.comentarios.length > 0 ? stats.comentarios.map((c: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl bg-white border border-[#B8A9E8]">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold text-[#6B5FA0]">{c.barrio}</span>
                      <span className="text-[9px] text-[#9B8EC4] ml-auto">{new Date(c.submitted_at).toLocaleDateString("es-AR")}</span>
                    </div>
                    <p className="text-xs italic text-[#1E1040] leading-relaxed">"{c.text}"</p>
                  </div>
                )) : <p className="text-xs text-[#9B8EC4] text-center py-4">No hay comentarios aún.</p>}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#5c40c0]/20 to-transparent border border-[#7c5cff]/30 rounded-3xl p-5">
              <h3 className="text-base font-black mb-1">Sumar más territorio</h3>
              <p className="text-xs text-[#6B5FA0] mb-4">Cada diagnóstico individual enriquece la inteligencia territorial de KORAI.</p>
              <Button
                className="w-full bg-white text-black hover:bg-white/90 font-bold rounded-xl h-11 text-sm"
                onClick={() => { navigator.clipboard?.writeText(window.location.origin + "/"); }}
              >
                Copiar enlace de diagnóstico
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
