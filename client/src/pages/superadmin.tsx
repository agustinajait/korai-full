import { useState, useMemo, useEffect } from "react";
import { INSTRUMENT } from "@/lib/instrument";
import { calcularScores, generatePlanDesdeScores } from "@/lib/korai-logic";
import { Loader2, AlertCircle, TrendingUp, Users, MessageSquare, LogOut, MapPin, ExternalLink, ArrowLeft, User, ChevronRight, MessageCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import koraiLogo from "@/lib/koraiLogo";

const SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4";
const CAMPAIGN_ID = "53813f5a-3613-4faf-8ca1-b369e4e908cb";

const PROGRAMAS_CABA = {
  empleo: [
    { nombre: "CIL - Centro de Integracion Laboral", descripcion: "Saca turno para hacer tu CV", url: "https://formulario-sigeci.buenosaires.gob.ar/InicioTramiteComun?idPrestacion=1422" },
    { nombre: "TrabajoBA", descripcion: "Portal de Empleo CABA", url: "https://trabajoba.buenosaires.gob.ar" },
  ],
  educacion: [
    { nombre: "Plan FinEs", descripcion: "Termina el secundario gratuitamente", url: "https://www.argentina.gob.ar/educacion/fines" },
    { nombre: "Becas Progresar", descripcion: "Apoyo economico para seguir estudiando", url: "https://www.argentina.gob.ar/educacion/progresar" },
  ],
  salud: [
    { nombre: "CAPS", descripcion: "Atencion medica gratuita", url: "https://buenosaires.gob.ar/salud/centros-de-salud-y-hospitales", contacto: "0800-222-5462" },
    { nombre: "Programa SUMAR", descripcion: "Cobertura de salud gratuita", url: "https://www.argentina.gob.ar/salud/sumar" },
  ],
  vivienda: [
    { nombre: "Subsidio 690", descripcion: "Asistencia Habitacional", url: "https://buenosaires.gob.ar/desarrollohumanoyhabitat/inclusion-social-y-atencion-inmediata/asistencia-habitacional" },
    { nombre: "PROMEBA", descripcion: "Mejoramiento de barrios populares", url: "https://www.argentina.gob.ar/habitat/promeba" },
  ],
  ingresos: [
    { nombre: "ANSES", descripcion: "AUH, jubilaciones y programas de apoyo", url: "https://www.anses.gob.ar", contacto: "130" },
  ],
  red: [
    { nombre: "Centros Culturales CABA", descripcion: "Actividades gratuitas", url: "https://buenosaires.gob.ar/cultura/centros-culturales" },
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

async function deleteResponse(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/responses?id=eq.${id}`,
    { method: "DELETE", headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Prefer": "return=minimal" } }
  );
  if (!res.ok) throw new Error("Error al eliminar");
}

async function fetchNotes(responseId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/case_notes?response_id=eq.${responseId}&order=created_at.desc`,
    { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
  );
  if (!res.ok) return [];
  return res.json();
}

async function addNote(responseId: string, texto: string, estado: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/case_notes`, {
    method: "POST",
    headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify({ response_id: responseId, texto, estado }),
  });
  if (!res.ok) throw new Error("Error al guardar nota");
  const data = await res.json();
  return data[0];
}

async function deleteNote(id: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/case_notes?id=eq.${id}`, {
    method: "DELETE",
    headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Prefer": "return=minimal" },
  });
}

function diasDesde(fecha: string): number {
  return Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
}

async function generarMensajeIA(payload) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate_message`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.status === "error") throw new Error(data?.error || "Error generando mensaje");
  return data.mensaje as string;
}

async function updateResponseProfile(r, updates) {
  const raw = r.perfil_contextual;
  const p = (() => { try { return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); } catch { return {}; } })();
  const merged = { ...p, ...updates };
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/responses?id=eq.${r.id}`,
    {
      method: "PATCH",
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({ perfil_contextual: JSON.stringify(merged) }),
    }
  );
  if (!res.ok) throw new Error("Error al guardar");
  return merged;
}

function getNombrePersona(r) {
  try {
    const raw = r.perfil_contextual;
    const p = typeof raw === "string" ? JSON.parse(raw) : (typeof raw === "object" && raw !== null ? raw : {});
    const nombre = p?.nombre || p?.demographics?.nombre || "";
    const apellido = p?.apellido || p?.demographics?.apellido || "";
    if (nombre || apellido) return (nombre + " " + apellido).trim();
  } catch {}
  if (r.dni_real) return "DNI " + r.dni_real;
  return "Caso #" + (r.id ? r.id.slice(0, 6) : "-");
}

function getDni(r) {
  try { const raw = r.perfil_contextual; const p = typeof raw === "string" ? JSON.parse(raw) : (raw || {}); return p?.dni || r.dni_real || ""; } catch { return r.dni_real || ""; }
}

function getTelefono(r) {
  try { const raw = r.perfil_contextual; const p = typeof raw === "string" ? JSON.parse(raw) : (raw || {}); return p?.telefono || ""; } catch { return ""; }
}

export default function Superadmin() {
  const [, setLocation] = useLocation();
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [barrioFilter, setBarrioFilter] = useState("all");
  const [selectedCase, setSelectedCase] = useState(null);
  const [showCaseList, setShowCaseList] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: "", apellido: "", telefono: "", dni: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [iaMensaje, setIaMensaje] = useState("");
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState("");
  const [mensajeUsuario, setMensajeUsuario] = useState("");
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newEstado, setNewEstado] = useState("contactado");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("korai_admin_role");
    if (role !== "superadmin") { setLocation("/admin"); return; }
    fetchResponses()
      .then(data => { setResponses(data); setIsLoading(false); })
      .catch(e => { setError(e.message); setIsLoading(false); });
  }, []);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await deleteResponse(id); setResponses(prev => prev.filter(r => r.id !== id)); } catch { alert("Error al eliminar."); }
    setDeletingId(null); setConfirmDeleteId(null);
  };

  const openEdit = (r) => {
    const raw = r.perfil_contextual;
    const p = (() => { try { return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); } catch { return {}; } })();
    setEditingUser(r);
    setEditForm({
      nombre: p?.nombre || "",
      apellido: p?.apellido || "",
      telefono: p?.telefono || "",
      dni: p?.dni || r.dni_real || "",
    });
    setIaMensaje(""); setIaError(""); setMensajeUsuario("");
    setNotes([]); setNewNote("");
    setNotesLoading(true);
    fetchNotes(r.id).then(n => { setNotes(n); setNotesLoading(false); });
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      const merged = await updateResponseProfile(editingUser, editForm);
      setResponses(prev => prev.map(r => r.id === editingUser.id ? { ...r, perfil_contextual: JSON.stringify(merged) } : r));
      setEditingUser(null);
    } catch { alert("Error al guardar los cambios."); }
    setSavingEdit(false);
  };

  const planDeUsuario = (r) => {
    const answers = r?.answers || {};
    const plan = generatePlanDesdeScores(answers);
    const criticas = plan.filter(p => p.nivelColor === "rojo").slice(0, 2);
    return (criticas.length > 0 ? criticas : plan.slice(0, 2));
  };

  const handleGenerarIA = async (tipo) => {
    if (!editingUser) return;
    setIaLoading(true); setIaError(""); setIaMensaje("");
    try {
      const nombre = getNombrePersona(editingUser);
      const plan = planDeUsuario(editingUser);
      const mensaje = await generarMensajeIA({ tipo, nombre, plan, mensajeUsuario });
      setIaMensaje(mensaje);
    } catch (e) {
      setIaError(e.message || "Error al generar mensaje");
    }
    setIaLoading(false);
  };

  const handleAddNote = async () => {
    if (!editingUser || !newNote.trim()) return;
    setSavingNote(true);
    try {
      const nota = await addNote(editingUser.id, newNote.trim(), newEstado);
      setNotes(prev => [nota, ...prev]);
      setNewNote("");
    } catch { alert("Error al guardar la nota."); }
    setSavingNote(false);
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const barrios = useMemo(() => {
    const set = new Set();
    responses.forEach(r => { const b = r.territorio?.barrio; if (b) set.add(b); });
    return Array.from(set).sort();
  }, [responses]);

  const filtered = useMemo(() => {
    let list = barrioFilter === "all" ? responses : responses.filter(r => r.territorio?.barrio === barrioFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => getNombrePersona(r).toLowerCase().includes(q) || getDni(r).toLowerCase().includes(q) || (r.territorio?.barrio || "").toLowerCase().includes(q));
    }
    return list;
  }, [responses, barrioFilter, search]);

  const stats = useMemo(() => {
    if (!filtered.length) return null;
    let rojo = 0, amarillo = 0, verde = 0;
    const byDim = {};
    INSTRUMENT.dimensions.forEach(d => { byDim[d.id] = { rojo: 0, amarillo: 0, verde: 0, n: 0, color: "verde", severity: 0, explanation: "" }; });
    const comentarios = [];
    filtered.forEach(r => {
      const answers = r.answers || {};
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
    return { total, dist: { rojo: total ? rojo / total : 0, amarillo: total ? amarillo / total : 0, verde: total ? verde / total : 0 }, byDim, mostCritical, comentarios: comentarios.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)) };
  }, [filtered]);

  const topCriticalDims = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byDim).filter(([, d]) => d.color === "rojo" || d.color === "amarillo").sort((a, b) => b[1].severity - a[1].severity).slice(0, 2).map(([id]) => id);
  }, [stats]);

  const colorBadge = (c) => c === "rojo" ? "bg-red-500/20 text-red-400 border-red-500/30" : c === "amarillo" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-green-500/20 text-green-400 border-green-500/30";

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#f0eef8]"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#f0eef8] text-red-400">{error}</div>;
  if (!stats) return <div className="min-h-screen flex items-center justify-center bg-[#f0eef8] text-[#9B8EC4]">Sin datos aun</div>;

  const overallColor = stats.dist.rojo >= 0.33 ? "rojo" : stats.dist.amarillo >= 0.33 ? "amarillo" : "verde";
  const overallBg = overallColor === "rojo" ? "bg-red-500/10 border-red-500/30" : overallColor === "amarillo" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-green-500/10 border-green-500/30";
  const overallDot = overallColor === "rojo" ? "bg-red-500" : overallColor === "amarillo" ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="min-h-screen bg-[#f0eef8] text-[#1E1040] font-sans">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[1100px] h-[700px] bg-[#5c40c0]/5 rounded-full blur-[120px]" />
      </div>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <img src={koraiLogo} alt="KORAI" className="w-12 h-12 object-contain" />
            <div><div className="text-xl font-black">KORAI Superadmin</div><div className="text-xs text-[#6B5FA0]">Panel de control total</div></div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowCaseList(s => !s)} className="text-[#1E1040] hover:bg-[#ede9fe] text-sm gap-2">
              <Users className="w-4 h-4" /> {showCaseList ? "Ver resumen" : "Ver usuarios"}
            </Button>
            <Link href="/"><Button variant="ghost" className="text-[#1E1040] hover:bg-[#ede9fe] text-sm">Diagnostico</Button></Link>
            <Button variant="ghost" onClick={() => { localStorage.removeItem("korai_admin_auth"); localStorage.removeItem("korai_admin_role"); setLocation("/admin"); }} className="text-[#9B8EC4] hover:text-[#1E1040] hover:bg-[#ede9fe]">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Usuarios únicos", value: new Set(responses.map(r => r.dni_hash).filter(Boolean)).size },
            { label: "Diagnósticos", value: responses.length },
            { label: "Con seguimiento", value: responses.filter(r => r.acepto_seguimiento).length },
            { label: "Con teléfono", value: responses.filter(r => getTelefono(r)).length },
          ].map(s => (
            <div key={s.label} className="bg-gradient-to-br from-white to-[#f0eef8] border border-[#B8A9E8] rounded-2xl p-4 shadow-sm"><div className="text-2xl font-black">{s.value}</div><div className="text-xs text-[#6B5FA0] mt-1">{s.label}</div></div>
          ))}
        </div>

        {showCaseList && (
          <div className="bg-gradient-to-br from-white to-[#f0eef8] border border-[#B8A9E8] rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#B8A9E8]">
              <h3 className="font-black text-lg mb-3">Usuarios registrados</h3>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, DNI o barrio..." className="w-full h-11 px-4 rounded-xl bg-white border border-[#B8A9E8] text-sm text-[#1E1040] placeholder:text-[#9B8EC4] focus:outline-none" />
            </div>
            <div className="divide-y divide-[#EDE9FE] max-h-[600px] overflow-y-scroll user-list-scroll" style={{ scrollbarColor: "#5c40c0 #ede9fe", scrollbarWidth: "auto" }}>
              {filtered.map((r, i) => {
                const nombre = getNombrePersona(r);
                const telefono = getTelefono(r);
                const dni = getDni(r);
                const barrio = r.territorio?.barrio || "Sin barrio";
                const fecha = new Date(r.submitted_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
                const sitLabR = (() => { try { const p = (() => { const raw = r.perfil_contextual; return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); })(); return p?.profundizacion?.situacion_laboral; } catch { return undefined; } })();
                const scores = calcularScores(r.answers || {}, sitLabR);
                const rojas = scores.filter(s => s.color === "rojo").length;
                const answers = r.answers || {};
                const plan = generatePlanDesdeScores(answers);
                const criticas = plan.filter(p => p.nivelColor === "rojo").slice(0, 2);
                const areas = criticas.length > 0 ? criticas : plan.slice(0, 2);
                const areasTexto = areas.map(p => p.dimensionName).join(" y ");
                let msg = "app.korai.lat\n\nHola " + nombre + "! Soy Korai, tu asistente de bienestar.\nDetectamos que podrias necesitar apoyo en " + areasTexto + ".\n\nTu plan:\n\n";
                areas.forEach(p => { msg += p.emoji + " " + p.dimensionName + "\n"; p.accionesCorto.slice(0,2).forEach((a,i) => { msg += (i+1) + ". " + a + "\n"; }); const rec = p.recursos?.[0]; if (rec?.url) msg += "Recurso: " + rec.nombre + ": " + rec.url + "\n"; msg += "\n"; });
                msg += "\nEn 7 dias te vamos a contactar.";
                return (
                  <div key={r.id || i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f0eef8] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#5c40c0] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-black">{nombre ? nombre.charAt(0).toUpperCase() : "?"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[#1E1040] truncate">{nombre}</div>
                      <div className="text-xs text-[#9B8EC4]">{barrio} · {fecha}{dni ? " · DNI: " + dni : ""}</div>
                    </div>
                    {(() => { const dias = diasDesde(r.submitted_at); return dias >= 7 ? <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500 border border-orange-500/30 flex-shrink-0">{dias}d sin contacto</span> : null; })()}
                    <div className="flex items-center gap-1">{scores.map(s => <div key={s.dimensionId} className={`w-2.5 h-2.5 rounded-full ${s.color === "rojo" ? "bg-red-500" : s.color === "amarillo" ? "bg-yellow-500" : "bg-green-500"}`} />)}</div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${rojas >= 2 ? "bg-red-500/20 text-red-400 border-red-500/30" : rojas === 1 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}`}>{rojas} criticas</span>
                    {telefono && (
                      <button onClick={() => window.open("https://wa.me/549" + telefono.replace(/\D/g, "") + "?text=" + encodeURIComponent(msg), "_blank")} className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"><MessageCircle className="w-3 h-3" /> WA</button>
                    )}
                    <button onClick={() => { navigator.clipboard.writeText(msg); alert("Plan copiado!"); }} className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg font-bold">Copiar</button>
                    <button onClick={() => openEdit(r)} className="text-xs bg-blue-500/20 text-blue-500 border border-blue-500/30 px-3 py-1.5 rounded-lg font-bold">Ver/Editar</button>
                    {confirmDeleteId === r.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id} className="text-[10px] text-[#1E1040] bg-red-500 px-2 py-1 rounded-lg font-bold">{deletingId === r.id ? "..." : "Confirmar"}</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] text-[#9B8EC4] bg-white px-2 py-1 rounded-lg">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(r.id)} className="text-[10px] text-red-500 bg-red-50 border border-red-300 px-2 py-1 rounded-lg hover:bg-red-100 font-bold">🗑 Eliminar</button>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && <div className="text-center py-8 text-[#9B8EC4]">No se encontraron usuarios</div>}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-xs text-[#6B5FA0] uppercase font-bold tracking-wider">Filtrar por barrio:</span>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setBarrioFilter("all")} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${barrioFilter === "all" ? "bg-primary text-[#1E1040]" : "bg-white text-[#6B5FA0] hover:bg-[#ede9fe]"}`}>Todos ({responses.length})</button>
            {barrios.map(b => <button key={b} onClick={() => setBarrioFilter(b)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${barrioFilter === b ? "bg-primary text-[#1E1040]" : "bg-white text-[#6B5FA0] hover:bg-[#ede9fe]"}`}>{b}</button>)}
          </div>
        </div>

        <div className={`p-8 rounded-[40px] border relative overflow-hidden ${overallBg}`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-sm animate-pulse ${overallDot}`}><div className="text-[#1E1040] font-black text-lg">CABA</div></div>
            <div className="text-center md:text-left"><h2 className="text-2xl font-black uppercase tracking-tighter">Estado General del Territorio</h2><p className="text-[#6B5FA0] text-sm mt-1">Basado en <span className="font-black text-[#1E1040]">{stats.total}</span> diagnosticos</p></div>
            <div className="md:ml-auto flex gap-6 text-center">
              <div><div className="text-2xl font-black text-red-400">{Math.round(stats.dist.rojo * 100)}%</div><div className="text-[10px] text-[#6B5FA0] uppercase">Critico</div></div>
              <div><div className="text-2xl font-black text-yellow-400">{Math.round(stats.dist.amarillo * 100)}%</div><div className="text-[10px] text-[#6B5FA0] uppercase">Alerta</div></div>
              <div><div className="text-2xl font-black text-green-400">{Math.round(stats.dist.verde * 100)}%</div><div className="text-[10px] text-[#6B5FA0] uppercase">Estable</div></div>
            </div>
          </div>
          <div className="mt-6 flex h-3 w-full rounded-full overflow-hidden bg-[#ede9fe]">
            <div style={{ width: `${stats.dist.verde * 100}%` }} className="bg-[#22c55e]" />
            <div style={{ width: `${stats.dist.amarillo * 100}%` }} className="bg-[#f59e0b]" />
            <div style={{ width: `${stats.dist.rojo * 100}%` }} className="bg-[#ef4444]" />
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-gradient-to-br from-white to-[#f0eef8] border border-[#B8A9E8] rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-[#B8A9E8]"><h3 className="text-xl font-black">Diagnostico por Dimension</h3></div>
              <div className="p-6 grid sm:grid-cols-2 gap-4">
                {INSTRUMENT.dimensions.map(d => {
                  const s = stats.byDim[d.id] || { rojo: 0, amarillo: 0, verde: 0, n: 0, color: "verde", severity: 0, explanation: "" };
                  const isSelected = selectedDimension === d.id;
                  const isCritical = stats.mostCritical === d.id && s.severity > 0;
                  return (
                    <div key={d.id} onClick={() => setSelectedDimension(isSelected ? null : d.id)} className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 relative ${isSelected ? "border-primary/50 bg-primary/5" : isCritical ? "border-red-500/50 bg-red-500/5" : "border-[#B8A9E8] bg-white hover:bg-[#ede9fe]"}`}>
                      {isCritical && <div className="absolute -top-2 -right-2 bg-red-500 text-[#1E1040] text-[9px] font-black px-2 py-0.5 rounded-full">CRITICO</div>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><span className="text-2xl">{d.emoji}</span><div><div className="font-bold">{d.name}</div><div className="text-[10px] text-[#9B8EC4]">Severidad: {s.severity}%</div></div></div>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${colorBadge(s.color)}`}>{s.color}</div>
                      </div>
                      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden"><div style={{ width: `${s.severity}%` }} className={`h-full rounded-full ${s.color === "rojo" ? "bg-red-500" : s.color === "amarillo" ? "bg-yellow-500" : "bg-green-500"}`} /></div>
                      <p className="text-[11px] text-[#6B5FA0] italic">{s.explanation}</p>
                      {isSelected && PROGRAMAS_CABA[d.id] && (
                        <div className="mt-3 pt-3 border-t border-[#B8A9E8] space-y-2">
                          {PROGRAMAS_CABA[d.id].map((p, i) => (
                            <div key={i} className="p-3 rounded-xl bg-white space-y-1">
                              <div className="font-bold text-xs">{p.nombre}</div>
                              <div className="text-[10px] text-[#6B5FA0]">{p.descripcion}</div>
                              {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline"><ExternalLink className="w-3 h-3" /> Ver programa</a>}
                              {p.contacto && <span className="text-[10px] text-[#9B8EC4]">{p.contacto}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-white to-[#f0eef8] border border-[#B8A9E8] rounded-2xl p-4 shadow-sm"><div className="text-[#6B5FA0] text-[10px] font-bold uppercase mb-1">Diagnosticos</div><div className="text-3xl font-black">{stats.total}</div><div className="text-[10px] text-green-400 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> En tiempo real</div></div>
              <div className="bg-gradient-to-br from-white to-[#f0eef8] border border-[#B8A9E8] rounded-2xl p-4 shadow-sm"><div className="text-[#6B5FA0] text-[10px] font-bold uppercase mb-1">Barrios</div><div className="text-3xl font-black">{barrios.length}</div><div className="text-[10px] text-[#9B8EC4] mt-1">con datos</div></div>
            </div>
            <div className="bg-white border border-[#B8A9E8] rounded-3xl p-5">
              <h3 className="text-base font-black mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Voces del territorio</h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {stats.comentarios.length > 0 ? stats.comentarios.map((c, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-white">
                    <div className="flex items-center gap-2 mb-1"><MapPin className="w-3 h-3 text-primary" /><span className="text-[10px] text-[#6B5FA0]">{c.barrio}</span><span className="text-[9px] text-[#9B8EC4] ml-auto">{new Date(c.submitted_at).toLocaleDateString("es-AR")}</span></div>
                    <p className="text-xs italic text-[#1E1040]">"{c.text}"</p>
                  </div>
                )) : <p className="text-xs text-[#9B8EC4] text-center py-4">No hay comentarios aun.</p>}
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#5c40c0]/20 to-transparent border border-[#7c5cff]/30 rounded-3xl p-5">
              <h3 className="text-base font-black mb-1">Sumar mas territorio</h3>
              <Link href="/"><Button className="w-full bg-white text-black hover:bg-white/90 font-bold rounded-xl h-11 text-sm mt-3">Ir al diagnostico ciudadano</Button></Link>
            </div>
          </div>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-lg">Editar usuario</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#6B5FA0]">Nombre</label>
                <input value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} className="w-full h-10 px-3 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-sm mt-1 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B5FA0]">Apellido</label>
                <input value={editForm.apellido} onChange={e => setEditForm(f => ({ ...f, apellido: e.target.value }))} className="w-full h-10 px-3 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-sm mt-1 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B5FA0]">Teléfono</label>
                <input value={editForm.telefono} onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))} className="w-full h-10 px-3 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-sm mt-1 focus:outline-none" placeholder="11xxxxxxxx" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B5FA0]">DNI</label>
                <input value={editForm.dni} onChange={e => setEditForm(f => ({ ...f, dni: e.target.value }))} className="w-full h-10 px-3 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-sm mt-1 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingUser(null)} className="flex-1 h-10 rounded-xl border border-[#B8A9E8] text-sm font-bold text-[#6B5FA0]">Cancelar</button>
              <button onClick={saveEdit} disabled={savingEdit} className="flex-1 h-10 rounded-xl bg-[#5c40c0] text-white text-sm font-bold disabled:opacity-50">{savingEdit ? "Guardando..." : "Guardar"}</button>
            </div>

            <div className="border-t border-[#EDE9FE] pt-4 space-y-3">
              <h4 className="font-black text-sm">📋 Historial de acompañamiento</h4>
              <div className="flex gap-2">
                <select value={newEstado} onChange={e => setNewEstado(e.target.value)} className="h-9 px-2 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-xs font-bold text-[#1E1040] focus:outline-none">
                  <option value="contactado">Contactado</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="con_dificultades">Con dificultades</option>
                  <option value="cerrado">Cerrado</option>
                </select>
                <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Anotá lo que hablaron..." className="flex-1 h-9 px-3 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-sm focus:outline-none" onKeyDown={e => e.key === "Enter" && handleAddNote()} />
                <button onClick={handleAddNote} disabled={savingNote || !newNote.trim()} className="h-9 px-3 rounded-xl bg-[#5c40c0] text-white text-xs font-bold disabled:opacity-40">{savingNote ? "..." : "+"}</button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {notesLoading && <p className="text-xs text-[#9B8EC4]">Cargando...</p>}
                {notes.length === 0 && !notesLoading && <p className="text-xs text-[#9B8EC4]">Sin notas todavía.</p>}
                {notes.map(n => (
                  <div key={n.id} className="flex items-start gap-2 p-2 rounded-xl bg-[#f0eef8]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${n.estado === "cerrado" ? "bg-green-500/20 text-green-600" : n.estado === "con_dificultades" ? "bg-red-500/20 text-red-500" : n.estado === "en_proceso" ? "bg-blue-500/20 text-blue-500" : "bg-purple-500/20 text-[#5c40c0]"}`}>{n.estado?.replace("_", " ")}</span>
                        <span className="text-[10px] text-[#9B8EC4]">{new Date(n.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-xs text-[#1E1040]">{n.texto}</p>
                    </div>
                    <button onClick={() => handleDeleteNote(n.id)} className="text-[10px] text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#EDE9FE] pt-4 space-y-3">
              <h4 className="font-black text-sm flex items-center gap-2">✨ Acompañamiento con IA</h4>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => handleGenerarIA("plan")} disabled={iaLoading} className="text-xs bg-[#5c40c0]/10 text-[#5c40c0] border border-[#5c40c0]/30 px-3 py-1.5 rounded-lg font-bold disabled:opacity-50">Generar plan</button>
                <button onClick={() => handleGenerarIA("seguimiento")} disabled={iaLoading} className="text-xs bg-[#5c40c0]/10 text-[#5c40c0] border border-[#5c40c0]/30 px-3 py-1.5 rounded-lg font-bold disabled:opacity-50">Generar seguimiento</button>
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B5FA0]">¿Qué te escribió el usuario? (opcional, para generar respuesta)</label>
                <textarea value={mensajeUsuario} onChange={e => setMensajeUsuario(e.target.value)} className="w-full h-16 px-3 py-2 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-sm mt-1 focus:outline-none resize-none" placeholder="Pegá aquí lo que te escribió..." />
                <button onClick={() => handleGenerarIA("respuesta")} disabled={iaLoading || !mensajeUsuario.trim()} className="mt-2 text-xs bg-[#5c40c0]/10 text-[#5c40c0] border border-[#5c40c0]/30 px-3 py-1.5 rounded-lg font-bold disabled:opacity-50">Generar respuesta</button>
              </div>

              {iaLoading && <p className="text-xs text-[#9B8EC4] flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Generando con IA...</p>}
              {iaError && <p className="text-xs text-red-500">{iaError}</p>}

              {iaMensaje && (
                <div className="space-y-2">
                  <textarea value={iaMensaje} onChange={e => setIaMensaje(e.target.value)} className="w-full h-40 px-3 py-2 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-sm focus:outline-none resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(iaMensaje); alert("Mensaje copiado!"); }} className="flex-1 h-9 rounded-lg bg-purple-500/20 text-purple-500 text-xs font-bold">Copiar</button>
                    {editForm.telefono && (
                      <button onClick={() => window.open("https://wa.me/549" + editForm.telefono.replace(/\D/g, "") + "?text=" + encodeURIComponent(iaMensaje), "_blank")} className="flex-1 h-9 rounded-lg bg-green-500/20 text-green-500 text-xs font-bold">Abrir WhatsApp</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
