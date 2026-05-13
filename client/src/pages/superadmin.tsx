import { useState, useMemo, useEffect } from "react";
import { INSTRUMENT } from "@/lib/instrument";
import { calcularScores, generatePlanDesdeScores } from "@/lib/korai-logic";
import { Loader2, AlertCircle, TrendingUp, Users, MessageSquare, LogOut, MapPin, ExternalLink, ArrowLeft, User, ChevronRight, Copy, Check, MessageCircle, Trash2, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4";
const CAMPAIGN_ID = "53813f5a-3613-4faf-8ca1-b369e4e908cb";

const PROGRAMAS_CABA: Record<string, { nombre: string; descripcion: string; url?: string; contacto?: string }[]> = {
  empleo: [
    { nombre: "CIL - Centro de Integracion Laboral", descripcion: "Saca turno para hacer tu CV", url: "https://formulario-sigeci.buenosaires.gob.ar/InicioTramiteComun?idPrestacion=1422" },
    { nombre: "TrabajoBA", descripcion: "Portal de Empleo CABA", url: "https://trabajoba.buenosaires.gob.ar" },
    { nombre: "Potenciar Trabajo", descripcion: "Programa de empleo y capacitacion", url: "https://www.argentina.gob.ar/desarrollosocial/potenciartrabajo" },
  ],
  educacion: [
    { nombre: "Plan FinEs", descripcion: "Termina el secundario gratuitamente", url: "https://www.argentina.gob.ar/educacion/fines" },
    { nombre: "Becas Progresar", descripcion: "Apoyo economico para seguir estudiando", url: "https://www.argentina.gob.ar/educacion/progresar" },
  ],
  salud: [
    { nombre: "CAPS", descripcion: "Atencion medica gratuita", url: "https://buenosaires.gob.ar/salud/centros-de-salud-y-hospitales", contacto: "0800-222-5462" },
    { nombre: "Programa SUMAR", descripcion: "Cobertura de salud gratuita sin obra social", url: "https://www.argentina.gob.ar/salud/sumar" },
  ],
  vivienda: [
    { nombre: "Subsidio 690", descripcion: "Asistencia Habitacional", url: "https://buenosaires.gob.ar/desarrollohumanoyhabitat/inclusion-social-y-atencion-inmediata/asistencia-habitacional" },
    { nombre: "PROMEBA", descripcion: "Mejoramiento de barrios populares", url: "https://www.argentina.gob.ar/habitat/promeba" },
  ],
  ingresos: [
    { nombre: "ANSES", descripcion: "AUH, jubilaciones y programas de apoyo economico", url: "https://www.anses.gob.ar", contacto: "130" },
    { nombre: "Potenciar Trabajo", descripcion: "Programa de empleo", url: "https://www.argentina.gob.ar/desarrollosocial/potenciartrabajo" },
  ],
  red: [
    { nombre: "Centros Culturales CABA", descripcion: "Actividades gratuitas de arte, deporte y comunidad", url: "https://buenosaires.gob.ar/cultura/centros-culturales" },
    { nombre: "Puntos de Cultura", descripcion: "Red de organizaciones culturales", url: "https://www.argentina.gob.ar/cultura/puntos-de-cultura" },
  ],
};

async function fetchResponses() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/responses?campaign_id=eq.${CAMPAIGN_ID}&order=submitted_at.desc`, { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } });
  if (!res.ok) throw new Error("Error al cargar datos");
  return res.json();
}

async function deleteResponseById(id: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/responses?id=eq.${id}`, { method: "DELETE", headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Prefer": "return=minimal" } });
  if (!res.ok) throw new Error("Error al eliminar");
}

async function fetchTrazabilidad(dniHash: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/responses?campaign_id=eq.${CAMPAIGN_ID}&dni_hash=eq.${dniHash}&order=submitted_at.asc`, { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } });
  if (!res.ok) throw new Error("Error al cargar trazabilidad");
  return res.json();
}

function getNombrePersona(r: any): string {
  try {
    const raw = r.perfil_contextual;
    const p = typeof raw === "string" ? JSON.parse(raw) : typeof raw === "object" && raw !== null ? raw : {};
    const nombre = p?.nombre || p?.demographics?.nombre || p?.name || "";
    const apellido = p?.apellido || p?.demographics?.apellido || p?.lastName || "";
    if (nombre || apellido) return `${nombre} ${apellido}`.trim();
  } catch {}
  if (r.dni_real) return `DNI ${r.dni_real}`;
  return `Caso #${r.id?.slice(0, 6) || "-"}`;
}

function getDni(r: any): string {
  try { const raw = r.perfil_contextual; const p = typeof raw === "string" ? JSON.parse(raw) : typeof raw === "object" && raw !== null ? raw : {}; return p?.dni || r.dni_real || ""; } catch { return r.dni_real || ""; }
}

function getTelefono(r: any): string {
  try { const raw = r.perfil_contextual; const p = typeof raw === "string" ? JSON.parse(raw) : typeof raw === "object" && raw !== null ? raw : {}; return p?.telefono || ""; } catch { return ""; }
}

function generarMensajeWA(response: any): string {
  const answers = response.answers as Record<string, string>;
  const plan = generatePlanDesdeScores(answers);
  const nombre = getNombrePersona(response);
  const criticas = plan.filter((p: any) => p.nivelColor === "rojo").slice(0, 2);
  const areas = criticas.length > 0 ? criticas : plan.slice(0, 2);
  const areasTexto = areas.map((p: any) => p.dimensionName).join(" y ");
  let msg = `Hola ${nombre} 👋 Soy Korai, tu asistente de bienestar.\n\nTerminaste tu diagnostico y detectamos que hoy podrias necesitar apoyo en ${areasTexto}.\n\nTu plan para las proximas 2 semanas:\n\n`;
  areas.forEach((p: any) => {
    msg += `${p.emoji} ${p.dimensionName}\n`;
    p.accionesCorto.slice(0, 2).forEach((a: string, i: number) => { msg += `${i + 1}. ${a}\n`; });
    const r = p.recursos?.[0];
    if (r?.url) msg += `🔗 ${r.nombre}: ${r.url}\n`;
    else if (r?.telefono) msg += `📞 ${r.nombre}: ${r.telefono}\n`;
    msg += "\n";
  });
  msg += `En 7 dias te vamos a preguntar como te fue 💪\nKorai - app.korai.lat`;
  return msg;
}

const colorDot = (c: string) => c === "rojo" ? "bg-red-500" : c === "amarillo" ? "bg-yellow-500" : "bg-green-500";
const colorBadge = (c: string) => c === "rojo" ? "bg-red-500/20 text-red-400 border-red-500/30" : c === "amarillo" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-green-500/20 text-green-400 border-green-500/30";

function TrazabilidadView({ response, onBack }: { response: any; onBack: () => void }) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!response.dni_hash) { setLoading(false); return; }
    fetchTrazabilidad(response.dni_hash).then(data => { setHistorial(data); setLoading(false); }).catch(() => setLoading(false));
  }, [response.dni_hash]);
  return (
    <div className="min-h-screen bg-[#070A13] text-[#EEF2FF]">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Button variant="ghost" onClick={onBack} className="text-white/50 hover:text-white hover:bg-white/10 gap-2 mt-4"><ArrowLeft className="w-4 h-4" /> Volver</Button>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="text-xl font-black">{getNombrePersona(response)}</div>
          <div className="text-xs text-white/40 mt-1">{historial.length} diagnosticos registrados</div>
        </div>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : historial.length === 0 ? (
          <div className="text-center py-10 text-white/40">Sin historial disponible.</div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-white/10"><h3 className="font-black text-lg">Evolucion por dimension</h3></div>
            <div className="p-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-xs text-white/40 font-bold pb-3 pr-4 w-32">Dimension</th>
                    {historial.map((h, i) => <th key={i} className="text-center text-xs text-white/40 font-bold pb-3 px-2 min-w-[80px]"><div>{new Date(h.submitted_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</div></th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {INSTRUMENT.dimensions.map(d => (
                    <tr key={d.id}>
                      <td className="py-3 pr-4"><div className="flex items-center gap-2"><span>{d.emoji}</span><span className="font-semibold text-xs text-white/70">{d.name}</span></div></td>
                      {historial.map((h, i) => {
                        const sitLab = (() => { try { const p = (() => { const raw = h.perfil_contextual; return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); })(); return p?.profundizacion?.situacion_laboral; } catch { return undefined; } })();
                        const scores = calcularScores(h.answers || {}, sitLab);
                        const score = scores.find(s => s.dimensionId === d.id);
                        const color = score?.color || "verde";
                        return <td key={i} className="py-3 px-2 text-center"><div className={`w-4 h-4 rounded-full mx-auto ${colorDot(color)}`} /></td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UsuarioDetalle({ response, onBack, onDelete, onTrazabilidad }: { response: any; onBack: () => void; onDelete: () => void; onTrazabilidad: () => void }) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const nombre = getNombrePersona(response);
  const dni = getDni(response);
  const telefono = getTelefono(response);
  const barrio = response.territorio?.barrio || "Sin barrio";
  const fecha = new Date(response.submitted_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  const answers = response.answers as Record<string, string>;
  const sitLab = (() => { try { const p = (() => { const raw = response.perfil_contextual; return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); })(); return p?.profundizacion?.situacion_laboral; } catch { return undefined; } })();
  const scores = calcularScores(answers, sitLab);
  const plan = generatePlanDesdeScores(answers, 6, sitLab);
  const mensaje = generarMensajeWA(response);

  return (
    <div className="min-h-screen bg-[#070A13] text-[#EEF2FF]">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4 pt-4">
          <Button variant="ghost" onClick={onBack} className="text-white/50 hover:text-white hover:bg-white/10 gap-2"><ArrowLeft className="w-4 h-4" /> Volver</Button>
          <Button variant="ghost" onClick={onTrazabilidad} className="text-primary hover:bg-primary/10 gap-2 text-sm"><TrendingUp className="w-4 h-4" /> Ver evolucion</Button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7c5cff] to-[#3b82f6] flex items-center justify-center flex-shrink-0"><User className="w-7 h-7 text-white" /></div>
            <div className="flex-1">
              <div className="text-xl font-black">{nombre}</div>
              <div className="text-sm text-white/50 mt-1">{barrio} · {fecha}</div>
              {dni && <div className="text-sm text-white/40 mt-1">DNI: {dni}</div>}
              {telefono && <div className="text-sm text-white/40">Telefono: {telefono}</div>}
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${response.acepto_seguimiento ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>{response.acepto_seguimiento ? "Acepto seguimiento" : "Sin seguimiento"}</span>
                {(() => { const rojas = scores.filter(s => s.color === "rojo").length; return <span className={`text-xs px-2 py-0.5 rounded-full border ${colorBadge(rojas >= 2 ? "rojo" : rojas >= 1 ? "amarillo" : "verde")}`}>{rojas} areas criticas</span>; })()}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-white/10"><h3 className="font-black text-lg">Diagnostico por dimension</h3></div>
          <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scores.map(s => (
              <div key={s.dimensionId} className={`p-4 rounded-2xl border space-y-2 ${s.color === "rojo" ? "border-red-500/30 bg-red-500/5" : s.color === "amarillo" ? "border-yellow-500/30 bg-yellow-500/5" : "border-green-500/20 bg-green-500/5"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><span className="text-xl">{s.emoji}</span><span className="font-bold text-sm">{s.dimensionName}</span></div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${colorBadge(s.color)}`}>{s.color}</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className={`h-full rounded-full ${s.color === "rojo" ? "bg-red-500" : s.color === "amarillo" ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${(s.verde / s.total) * 100}%` }} /></div>
                <div className="text-[10px] text-white/40">{s.verde} de {s.total} indicadores positivos</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-[#25D366]" /><h3 className="font-bold text-[#25D366]">Mensaje WhatsApp listo para enviar</h3></div>
          <div className="bg-black/30 rounded-2xl p-4 text-xs text-white/70 whitespace-pre-wrap font-mono">{mensaje}</div>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => { navigator.clipboard.writeText(mensaje); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex-1 bg-[#25D366] hover:bg-[#20c45a] text-black font-bold">
              {copied ? <><Check className="w-4 h-4 mr-2" /> Copiado!</> : <><Copy className="w-4 h-4 mr-2" /> Copiar mensaje</>}
            </Button>
            {telefono && <Button onClick={() => window.open(`https://wa.me/549${telefono.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`, "_blank")} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold"><MessageCircle className="w-4 h-4 mr-2" /> Abrir en WhatsApp</Button>}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-white/10"><h3 className="font-black text-lg">Plan de accion</h3></div>
          <div className="p-5 space-y-4">
            {plan.map((item: any, i: number) => (
              <div key={i} className={`p-4 rounded-2xl border space-y-2 ${item.esPrioritaria ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-white/3"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.emoji}</span>
                  <div className="flex-1"><div className="font-bold text-sm">{item.dimensionName}</div><div className="text-[10px] text-white/40">{item.motivo}</div></div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${colorBadge(item.nivelColor)}`}>{item.cuando}</span>
                </div>
                {item.accionesCorto.map((a: string, j: number) => <div key={j} className="flex items-start gap-2 text-xs text-white/60"><ChevronRight className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />{a}</div>)}
                {item.recursos.length > 0 && <div className="flex flex-wrap gap-2 pt-1">{item.recursos.map((r: any, j: number) => <a key={j} href={r.url || "#"} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-primary flex items-center gap-1"><ExternalLink className="w-2.5 h-2.5" />{r.nombre}</a>)}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="pb-8">
          <Button onClick={async () => { if (!confirm(`Eliminar el diagnostico de ${nombre}?`)) return; setDeleting(true); await deleteResponseById(response.id); onDelete(); }} disabled={deleting} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl">
            <Trash2 className="w-4 h-4 mr-2" />{deleting ? "Eliminando..." : "Eliminar diagnostico"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Superadmin() {
  const [, setLocation] = useLocation();
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [barrioFilter, setBarrioFilter] = useState("all");
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [showTrazabilidad, setShowTrazabilidad] = useState(false);
  const [showCaseList, setShowCaseList] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("korai_admin_role");
    if (role !== "superadmin") { setLocation("/admin"); return; }
    fetchResponses().then(data => { setResponses(data); setIsLoading(false); }).catch(e => { setError(e.message); setIsLoading(false); });
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await deleteResponseById(id); setResponses(prev => prev.filter(r => r.id !== id)); setSelectedCase(null); } catch { alert("Error al eliminar."); }
    setDeletingId(null); setConfirmDeleteId(null);
  };

  const barrios = useMemo(() => { const set = new Set<string>(); responses.forEach(r => { const b = r.territorio?.barrio; if (b) set.add(b); }); return Array.from(set).sort(); }, [responses]);

  const filtered = useMemo(() => {
    let list = barrioFilter === "all" ? responses : responses.filter(r => r.territorio?.barrio === barrioFilter);
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(r => getNombrePersona(r).toLowerCase().includes(q) || getDni(r).toLowerCase().includes(q) || (r.territorio?.barrio || "").toLowerCase().includes(q)); }
    return list;
  }, [responses, barrioFilter, search]);

  const stats = useMemo(() => {
    if (!filtered.length) return null;
    let rojo = 0, amarillo = 0, verde = 0;
    const byDim: Record<string, any> = {};
    INSTRUMENT.dimensions.forEach(d => { byDim[d.id] = { rojo: 0, amarillo: 0, verde: 0, n: 0, color: "verde", severity: 0, explanation: "" }; });
    const comentarios: any[] = [];
    filtered.forEach(r => {
      const answers = r.answers as Record<string, string>;
      let rCount = 0, aCount = 0, nCount = 0;
      Object.entries(answers).forEach(([key, val]) => {
        const dimId = key.split("_")[0];
        if (byDim[dimId]) { byDim[dimId].n++; if (val === "rojo") byDim[dimId].rojo++; else if (val === "amarillo") byDim[dimId].amarillo++; else if (val === "verde") byDim[dimId].verde++; }
        nCount++; if (val === "rojo") rCount++; else if (val === "amarillo") aCount++;
      });
      Object.keys(byDim).forEach(dimId => {
        const d = byDim[dimId];
        if (d.n > 0) { d.color = (d.rojo / d.n >= 0.5) ? "rojo" : ((d.rojo + d.amarillo) / d.n >= 0.5) ? "amarillo" : "verde"; d.severity = Math.round(((d.rojo + d.amarillo * 0.5) / d.n) * 100); d.explanation = d.color === "rojo" ? `El ${Math.round((d.rojo / d.n) * 100)}% reporta nivel critico.` : d.color === "amarillo" ? `El ${Math.round(((d.rojo + d.amarillo) / d.n) * 100)}% requiere atencion.` : `El ${Math.round((d.verde / d.n) * 100)}% muestra situacion positiva.`; }
      });
      if (nCount > 0) { if (rCount / nCount >= 0.33) rojo++; else if (aCount / nCount >= 0.33) amarillo++; else verde++; }
      if (r.texto_abierto) comentarios.push({ text: r.texto_abierto, barrio: r.territorio?.barrio || "Sin barrio", submitted_at: r.submitted_at });
    });
    const mostCritical = Object.entries(byDim).sort((a, b) => b[1].severity - a[1].severity)[0]?.[0];
    const total = filtered.length;
    return { total, dist: { rojo: total ? rojo / total : 0, amarillo: total ? amarillo / total : 0, verde: total ? verde / total : 0 }, byDim, mostCritical, comentarios: comentarios.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()) };
  }, [filtered]);

  const topCriticalDims = useMemo(() => { if (!stats) return []; return Object.entries(stats.byDim).filter(([, d]: any) => d.color === "rojo" || d.color === "amarillo").sort((a: any, b: any) => b[1].severity - a[1].severity).slice(0, 2).map(([id]) => id); }, [stats]);

  if (showTrazabilidad && selectedCase) return <TrazabilidadView response={selectedCase} onBack={() => setShowTrazabilidad(false)} />;
  if (selectedCase) return <UsuarioDetalle response={selectedCase} onBack={() => setSelectedCase(null)} onDelete={() => { setResponses(prev => prev.filter(r => r.id !== selectedCase.id)); setSelectedCase(null); }} onTrazabilidad={() => setShowTrazabilidad(true)} />;
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#070A13]"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#070A13] text-red-400">{error}</div>;
  if (!stats) return <div className="min-h-screen flex items-center justify-center bg-[#070A13] text-white/40">Sin datos aun</div>;

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

        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#7c5cff] to-[#3b82f6] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/20">K</div>
            <div><div className="text-xl font-black leading-tight">KORAI Superadmin</div><div className="text-xs text-[#A9B3DA]">Panel de control total</div></div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowCaseList(!showCaseList)} className="text-[#EEF2FF] hover:bg-white/10 text-sm gap-2"><Users className="w-4 h-4" />{showCaseList ? "Ver resumen" : "Ver usuarios"}</Button>
            <Link href="/"><Button variant="ghost" className="text-[#EEF2FF] hover:bg-white/10 text-sm">Diagnostico</Button></Link>
            <Button variant="ghost" onClick={() => { localStorage.removeItem("korai_admin_auth"); localStorage.removeItem("korai_admin_role"); setLocation("/admin"); }} className="text-white/40 hover:text-white hover:bg-white/10"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[{ label: "Total usuarios", value: responses.length }, { label: "Con seguimiento", value: responses.filter(r => r.acepto_seguimiento).length }, { label: "Con telefono", value: responses.filter(r => getTelefono(r)).length }].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4"><div className="text-2xl font-black">{s.value}</div><div className="text-xs text-white/50 mt-1">{s.label}</div></div>
          ))}
        </div>

        {showCaseList && (
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <h3 className="font-black text-lg mb-3">Usuarios registrados</h3>
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, DNI o barrio..." className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 text-white placeholder:text-white/30" /></div>
            </div>
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {filtered.map((r, i) => {
                const sitLabR = (() => { try { const p = (() => { const raw = r.perfil_contextual; return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); })(); return p?.profundizacion?.situacion_laboral; } catch { return undefined; } })();
                const scores = calcularScores(r.answers || {}, sitLabR);
                const rojas = scores.filter(s => s.color === "rojo").length;
                const barrio = r.territorio?.barrio || "Sin barrio";
                const fecha = new Date(r.submitted_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "2-digit" });
                const nombre = getNombrePersona(r);
                const telefono = getTelefono(r);
                return (
                  <div key={r.id || i} onClick={() => setSelectedCase(r)} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 cursor-pointer transition-colors group">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><User className="w-4 h-4 text-white/40" /></div>
                      {r.acepto_seguimiento && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-[#070A13]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white truncate">{nombre}</div>
                      <div className="text-[11px] text-white/40 flex items-center gap-1.5"><MapPin className="w-2.5 h-2.5 text-primary flex-shrink-0" /><span className="truncate">{barrio}</span><span>·</span><span>{fecha}</span></div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">{scores.map(s => <div key={s.dimensionId} className={`w-2.5 h-2.5 rounded-full ${colorDot(s.color)}`} />)}</div>
                    {telefono && <MessageCircle className="w-4 h-4 text-[#25D366] flex-shrink-0" />}
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0 ${rojas >= 2 ? "bg-red-500/20 text-red-400 border-red-500/30" : rojas === 1 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}`}>{rojas} criticas</span>
                    <button onClick={e => { e.stopPropagation(); setSelectedCase(r); setShowTrazabilidad(true); }} className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors flex-shrink-0 font-bold">Evolucion</button>
                    {confirmDeleteId === r.id ? (
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id} className="text-[10px] text-white bg-red-500 px-2 py-1 rounded-lg font-bold">{deletingId === r.id ? "..." : "Confirmar"}</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded-lg">Cancelar</button>
                      </div>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(r.id); }} className="text-[10px] text-red-400/60 bg-red-500/5 border border-red-500/20 px-2 py-1 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors flex-shrink-0">Eliminar</button>
                    )}
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Filtrar por barrio:</span>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setBarrioFilter("all")} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${barrioFilter === "all" ? "bg-primary text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>Todos ({responses.length})</button>
            {barrios.map(b => <button key={b} onClick={() => setBarrioFilter(b)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${barrioFilter === b ? "bg-primary text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>{b}</button>)}
          </div>
        </div>

        <div className={`p-8 rounded-[40px] border relative overflow-hidden ${overallBg}`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl animate-pulse ${overallDot}`}><div className="text-white font-black text-lg">CABA</div></div>
            <div className="text-center md:text-left"><h2 className="text-2xl font-black uppercase tracking-tighter">Estado General del Territorio</h2><p className="text-[#A9B3DA] text-sm mt-1">Basado en <span className="font-black text-white">{stats.total}</span> diagnosticos · {barrioFilter === "all" ? "Ciudad de Buenos Aires" : `Barrio ${barrioFilter}`}</p></div>
            <div className="md:ml-auto flex gap-6 text-center">
              <div><div className="text-2xl font-black text-red-400">{Math.round(stats.dist.rojo * 100)}%</div><div className="text-[10px] text-white/50 uppercase">Critico</div></div>
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
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10"><h3 className="text-xl font-black">Diagnostico por Dimension</h3><p className="text-xs text-white/40 mt-1">Hace clic en una dimension para ver los programas disponibles</p></div>
              <div className="p-6 grid sm:grid-cols-2 gap-4">
                {INSTRUMENT.dimensions.map(d => {
                  const s = stats.byDim[d.id] || { rojo: 0, amarillo: 0, verde: 0, n: 0, color: "verde", severity: 0, explanation: "" };
                  const isSelected = selectedDimension === d.id;
                  const isCritical = stats.mostCritical === d.id && s.severity > 0;
                  return (
                    <div key={d.id} onClick={() => setSelectedDimension(isSelected ? null : d.id)} className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 relative ${isSelected ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : isCritical ? "border-red-500/50 bg-red-500/5" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                      {isCritical && <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-bounce">AREA CRITICA</div>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><span className="text-2xl">{d.emoji}</span><div><div className="font-bold text-base">{d.name}</div><div className="text-[10px] text-muted-foreground uppercase">Severidad: {s.severity}%</div></div></div>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${colorBadge(s.color)}`}>{s.color}</div>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div style={{ width: `${s.severity}%` }} className={`h-full rounded-full transition-all duration-1000 ${s.color === "rojo" ? "bg-red-500" : s.color === "amarillo" ? "bg-yellow-500" : "bg-green-500"}`} /></div>
                      <p className="text-[11px] text-white/60 italic">{s.explanation}</p>
                      {isSelected && PROGRAMAS_CABA[d.id] && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
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
                <div className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-400" /><h3 className="text-lg font-black">Intervencion prioritaria recomendada</h3></div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {topCriticalDims.flatMap(dimId => (PROGRAMAS_CABA[dimId] || []).slice(0, 2).map((p, i) => {
                    const dim = INSTRUMENT.dimensions.find(d => d.id === dimId);
                    return (
                      <div key={`${dimId}-${i}`} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex items-center gap-2"><span className="text-lg">{dim?.emoji}</span><div className="text-[10px] text-white/40 uppercase font-bold">{dim?.name}</div></div>
                        <div className="font-bold text-sm text-white">{p.nombre}</div>
                        <div className="text-[10px] text-white/50">{p.descripcion}</div>
                        {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline mt-1"><ExternalLink className="w-3 h-3" /> Acceder al programa</a>}
                      </div>
                    );
                  }))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4"><div className="text-[#A9B3DA] text-[10px] font-bold uppercase mb-1">Diagnosticos</div><div className="text-3xl font-black text-white">{stats.total}</div><div className="text-[10px] text-green-400 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> En tiempo real</div></div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4"><div className="text-[#A9B3DA] text-[10px] font-bold uppercase mb-1">Barrios</div><div className="text-3xl font-black text-white">{barrios.length}</div><div className="text-[10px] text-white/40 mt-1">con datos</div></div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
              <h3 className="text-base font-black mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Voces del territorio</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {stats.comentarios.length > 0 ? stats.comentarios.map((c: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 mb-2"><MapPin className="w-3 h-3 text-primary" /><span className="text-[10px] font-bold text-white/60">{c.barrio}</span><span className="text-[9px] text-white/30 ml-auto">{new Date(c.submitted_at).toLocaleDateString("es-AR")}</span></div>
                    <p className="text-xs italic text-white/80 leading-relaxed">"{c.text}"</p>
                  </div>
                )) : <p className="text-xs text-white/30 text-center py-4">No hay comentarios aun.</p>}
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#7c5cff]/20 to-transparent border border-[#7c5cff]/30 rounded-3xl p-5">
              <h3 className="text-base font-black mb-1">Sumar mas territorio</h3>
              <p className="text-xs text-[#A9B3DA] mb-4">Cada diagnostico individual enriquece la inteligencia territorial de KORAI.</p>
              <Link href="/"><Button className="w-full bg-white text-black hover:bg-white/90 font-bold rounded-xl h-11 text-sm">Ir al diagnostico ciudadano</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
