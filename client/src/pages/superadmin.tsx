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
  await fetch(`${SUPABASE_URL}/rest/v1/responses?id=eq.${responseId}`, {
    method: "PATCH",
    headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
    body: JSON.stringify({ ultimo_contacto: new Date().toISOString(), ultimo_estado: estado }),
  });
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

async function enviarWhatsAppAdmin(telefono: string, mensaje: string, responseId: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send_whatsapp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ telefono, mensaje, responseId }),
  });
  const data = await res.json();
  if (!res.ok || data.status === "error") throw new Error(data?.error || "Error enviando WhatsApp");
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
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"analisis" | "usuarios" | "usuario">("usuarios");

  useEffect(() => {
    const role = localStorage.getItem("korai_admin_role");
    if (role !== "superadmin") { setLocation("/admin"); return; }
    fetchResponses()
      .then(data => { setResponses(data); setIsLoading(false); })
      .catch(e => { setError(e.message); setIsLoading(false); });
  }, []);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await deleteResponse(id); setResponses(prev => prev.filter(r => r.id !== id)); if (editingUser?.id === id) setEditingUser(null); } catch { alert("Error al eliminar."); }
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
    setShowImport(false); setImportText("");
    setNotesLoading(true);
    fetchNotes(r.id).then(n => { setNotes(n); setNotesLoading(false); });
    setActiveTab("usuario");
  };

  const handleImportarConversacion = async () => {
    if (!editingUser || !importText.trim()) return;
    setImportLoading(true);
    const lines = importText.trim().split("\n");
    const myName = editForm.nombre || editForm.telefono || "Korai";
    const notasParsed: Array<{ texto: string; tipo: string }> = [];
    let current: { tipo: string; texto: string } | null = null;

    for (const line of lines) {
      const match = line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?\s*m\.?)?\s*[-–]\s*(.+?):\s*(.*)$/i);
      if (match) {
        if (current) notasParsed.push(current);
        const sender = match[1].trim();
        const texto = match[2].trim();
        if (!texto || texto === "<Multimedia omitido>" || texto === "<Media omitted>") { current = null; continue; }
        const esKorai = sender.toLowerCase().includes("korai") || sender.toLowerCase().includes(myName.toLowerCase().split(" ")[0].toLowerCase());
        current = { tipo: esKorai ? "saliente" : "entrante", texto };
      } else if (current && line.trim() && !line.startsWith("‎")) {
        current.texto += "\n" + line.trim();
      }
    }
    if (current) notasParsed.push(current);

    let guardadas = 0;
    for (const n of notasParsed) {
      try {
        const nota = await addNote(editingUser.id, n.texto, "contactado");
        await fetch(`${SUPABASE_URL}/rest/v1/case_notes?id=eq.${nota.id}`, {
          method: "PATCH",
          headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
          body: JSON.stringify({ tipo: n.tipo }),
        });
        guardadas++;
      } catch {}
    }

    const nuevas = await fetchNotes(editingUser.id);
    setNotes(nuevas);
    setImportText("");
    setShowImport(false);
    setImportLoading(false);
    alert(`✅ Se importaron ${guardadas} mensajes correctamente.`);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      const merged = await updateResponseProfile(editingUser, editForm);
      setResponses(prev => prev.map(r => r.id === editingUser.id ? { ...r, perfil_contextual: JSON.stringify(merged) } : r));
      setEditingUser(prev => prev ? { ...prev, perfil_contextual: JSON.stringify(merged) } : null);
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
      const historial = notes.filter(n => n.tipo === "entrante" || n.tipo === "saliente").map(n => ({ tipo: n.tipo, texto: n.texto, created_at: n.created_at }));
      const notasContexto = notes.filter(n => n.tipo === "nota" || (!n.tipo)).map(n => n.texto);
      const mensaje = await generarMensajeIA({ tipo, nombre, plan, mensajeUsuario, historial, notasContexto });
      setIaMensaje(mensaje);
    } catch (e) {
      setIaError(e.message || "Error al generar mensaje");
    }
    setIaLoading(false);
  };

  const handleMensajeEntrante = async () => {
    if (!editingUser || !mensajeUsuario.trim()) return;
    setSavingNote(true);
    try {
      const nota = await addNote(editingUser.id, mensajeUsuario.trim(), "contactado");
      const notaConTipo = { ...nota, tipo: "entrante" };
      await fetch(`${SUPABASE_URL}/rest/v1/case_notes?id=eq.${nota.id}`, {
        method: "PATCH",
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
        body: JSON.stringify({ tipo: "entrante" }),
      });
      setNotes(prev => [{ ...nota, tipo: "entrante" }, ...prev]);
      setMensajeUsuario("");
      setIaLoading(true); setIaError(""); setIaMensaje("");
      const nombre = getNombrePersona(editingUser);
      const plan = planDeUsuario(editingUser);
      const historial = [{ tipo: "entrante", texto: mensajeUsuario.trim(), created_at: new Date().toISOString() }, ...notes.filter(n => n.tipo === "entrante" || n.tipo === "saliente").map(n => ({ tipo: n.tipo, texto: n.texto, created_at: n.created_at }))];
      const notasContexto = notes.filter(n => n.tipo === "nota" || (!n.tipo)).map(n => n.texto);
      const mensaje = await generarMensajeIA({ tipo: "respuesta", nombre, plan, mensajeUsuario: mensajeUsuario.trim(), historial, notasContexto });
      setIaMensaje(mensaje);
      setIaLoading(false);
    } catch (e) {
      setIaError(e.message || "Error"); setSavingNote(false); setIaLoading(false);
    }
    setSavingNote(false);
  };

  const [enviandoWA, setEnviandoWA] = useState(false);
  const [mensajeOperador, setMensajeOperador] = useState("");

  const handleEnviarRespuesta = async (textoOverride?: string) => {
    const texto = textoOverride ?? iaMensaje.trim();
    if (!editingUser || !texto) return;
    const telefono = editForm.telefono;
    if (!telefono) { alert("Este usuario no tiene teléfono cargado."); return; }
    setEnviandoWA(true);
    try {
      await enviarWhatsAppAdmin(telefono, texto, editingUser.id);
      setNotes(prev => [{ id: Date.now().toString(), response_id: editingUser.id, texto, tipo: "saliente", estado: "contactado", created_at: new Date().toISOString() }, ...prev]);
      if (textoOverride) setMensajeOperador("");
      else setIaMensaje("");
    } catch (e: any) {
      alert("Error al enviar: " + e.message);
    }
    setEnviandoWA(false);
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
      list = list.filter(r => getNombrePersona(r).toLowerCase().includes(q) || getDni(r).toLowerCase().includes(q) || (r.territorio?.barrio || "").toLowerCase().includes(q) || getTelefono(r).replace(/\D/g, "").includes(q.replace(/\D/g, "")));
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

    // ── Métricas demográficas ─────────────────────────────────────────────────
    const demografico = {
      empleo: { sin_trabajo: 0, buscando: 0, con_trabajo: 0 },
      ingreso: { menos_700k: 0, r700k_1300k: 0, r1300k_2000k: 0, mas_2000k: 0, prefiero_no: 0 },
      vivienda: { propia: 0, alquiler: 0, prestada: 0, inestable: 0 },
      beneficio: { si: 0, no: 0 },
      seguridad: { seguro: 0, inseguro: 0 },
    };
    filtered.forEach(r => {
      const perfil = (() => { try { const raw = r.perfil_contextual; return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); } catch { return {}; } })();
      const demo = perfil?.demographics || perfil || {};
      if (demo.situacion_laboral === "no_trabajo") demografico.empleo.sin_trabajo++;
      else if (demo.situacion_laboral === "buscando") demografico.empleo.buscando++;
      else if (demo.situacion_laboral === "tengo_trabajo") demografico.empleo.con_trabajo++;
      if (demo.ingreso_hogar === "menos_700k") demografico.ingreso.menos_700k++;
      else if (demo.ingreso_hogar === "700k_1300k") demografico.ingreso.r700k_1300k++;
      else if (demo.ingreso_hogar === "1300k_2000k") demografico.ingreso.r1300k_2000k++;
      else if (demo.ingreso_hogar === "mas_2000k") demografico.ingreso.mas_2000k++;
      else if (demo.ingreso_hogar === "prefiero_no") demografico.ingreso.prefiero_no++;
      if (demo.tipo_vivienda === "propia") demografico.vivienda.propia++;
      else if (demo.tipo_vivienda === "alquiler") demografico.vivienda.alquiler++;
      else if (demo.tipo_vivienda === "prestada") demografico.vivienda.prestada++;
      else if (demo.tipo_vivienda === "inestable") demografico.vivienda.inestable++;
      if (demo.beneficio_social === "si") demografico.beneficio.si++;
      else if (demo.beneficio_social === "no") demografico.beneficio.no++;
      const seg = r.answers?.["vivienda_05"];
      if (seg === "verde") demografico.seguridad.seguro++;
      else if (seg === "rojo" || seg === "amarillo") demografico.seguridad.inseguro++;
    });

    return { total, dist: { rojo: total ? rojo / total : 0, amarillo: total ? amarillo / total : 0, verde: total ? verde / total : 0 }, byDim, mostCritical, comentarios: comentarios.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()), demografico };
  }, [filtered]);

  const colorBadge = (c) => c === "rojo" ? "bg-red-500/20 text-red-400 border-red-500/30" : c === "amarillo" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-green-500/20 text-green-400 border-green-500/30";

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#f0eef8]"><Loader2 className="w-10 h-10 animate-spin text-[#5c40c0]" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#f0eef8] text-red-400">{error}</div>;
  if (!stats) return <div className="min-h-screen flex items-center justify-center bg-[#f0eef8] text-[#9B8EC4]">Sin datos aun</div>;

  const overallColor = stats.dist.rojo >= 0.33 ? "rojo" : stats.dist.amarillo >= 0.33 ? "amarillo" : "verde";
  const overallDot = overallColor === "rojo" ? "bg-red-500" : overallColor === "amarillo" ? "bg-yellow-500" : "bg-green-500";

  const uniqueUsers = new Set(responses.map(r => r.dni_hash).filter(Boolean)).size;
  const totalDiag = responses.length;
  const rediag = totalDiag - uniqueUsers;
  const tasaRetorno = uniqueUsers > 0 ? Math.round((rediag / uniqueUsers) * 100) : 0;
  const conSeguimiento = responses.filter(r => r.acepto_seguimiento).length;
  const conTelefono = responses.filter(r => getTelefono(r)).length;

  return (
    <div className="min-h-screen bg-[#f0eef8] text-[#1E1040] font-sans">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#B8A9E8] h-14">
        <div className="mx-auto px-10 h-full flex items-center gap-3" style={{ maxWidth: 1100 }}>
          <img src={koraiLogo} alt="KORAI" className="w-8 h-8 object-contain flex-shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-black text-[#1E1040]">KORAI</span>
            <span className="text-[10px] text-[#9B8EC4]">Panel Superadmin</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.origin + "/")}
              className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-bold text-[#5c40c0] bg-[#ede9fe] hover:bg-[#ddd6fe] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Copiar enlace
            </button>
            <button
              onClick={() => { localStorage.removeItem("korai_admin_auth"); localStorage.removeItem("korai_admin_role"); setLocation("/admin"); }}
              className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-bold text-[#9B8EC4] hover:text-[#1E1040] hover:bg-[#f0eef8] transition-colors border border-[#B8A9E8]"
            >
              <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* ── KPIs ── */}
      <div className="sticky top-14 z-10 bg-white border-b border-[#B8A9E8] py-4">
        <div className="mx-auto px-10" style={{ maxWidth: 1100 }}>
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Personas únicas", value: uniqueUsers, sub: "dedup. por DNI", color: "#5c40c0", bg: "#ede9fe" },
              { label: "Diagnósticos", value: totalDiag, sub: "incluye rediag.", color: "#1E1040", bg: "#f0eef8" },
              { label: "Retornos", value: `${rediag} (${tasaRetorno}%)`, sub: "volvieron a diag.", color: "#7c5cff", bg: "#ede9fe" },
              { label: "Con seguimiento", value: conSeguimiento, sub: "aceptaron acomp.", color: "#16a34a", bg: "#f0fdf4" },
              { label: "Con teléfono", value: conTelefono, sub: "contactables WA", color: "#1E1040", bg: "#f0eef8" },
            ].map(kpi => (
              <div key={kpi.label} className="flex flex-col justify-between px-5 py-4 rounded-2xl" style={{ background: kpi.bg }}>
                <div>
                  <div className="text-xs font-bold text-[#1E1040] leading-tight">{kpi.label}</div>
                  <div className="text-[11px] text-[#9B8EC4] mt-0.5">{kpi.sub}</div>
                </div>
                <div className="text-2xl font-black mt-2 leading-none" style={{ color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="sticky z-10 bg-white border-b border-[#B8A9E8]" style={{ top: "152px" }}>
        <div className="mx-auto px-10 flex gap-1" style={{ maxWidth: 1100 }}>
          {(["usuarios", "analisis"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-3 text-sm font-bold transition-colors"
              style={activeTab === tab
                ? { color: "#5c40c0", borderBottom: "2px solid #5c40c0" }
                : { color: "#9B8EC4", borderBottom: "2px solid transparent" }
              }
            >
              {tab === "usuarios" ? "Usuarios" : "Análisis"}
            </button>
          ))}
          <button
            onClick={() => editingUser && setActiveTab("usuario")}
            className="px-5 py-3 text-sm font-bold transition-colors"
            style={
              activeTab === "usuario"
                ? { color: "#5c40c0", borderBottom: "2px solid #5c40c0" }
                : editingUser
                ? { color: "#9B8EC4", borderBottom: "2px solid transparent" }
                : { color: "#9B8EC4", borderBottom: "2px solid transparent", opacity: 0.4, cursor: "not-allowed" }
            }
          >
            {editingUser ? getNombrePersona(editingUser).split(" ")[0] : "Usuario"}
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div>

        {/* TAB: Análisis territorial */}
        {activeTab === "analisis" && (
        <div className="py-8 mx-auto px-10 space-y-5" style={{ maxWidth: 1100 }}>
          {/* Estado general */}
          <div className={`p-6 rounded-3xl border relative overflow-hidden ${overallColor === "rojo" ? "bg-red-500/10 border-red-500/30" : overallColor === "amarillo" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-green-500/10 border-green-500/30"}`}>
            <div className="flex items-center gap-4 flex-wrap">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm animate-pulse flex-shrink-0 ${overallDot}`}>
                <span className="text-white font-black text-xs">CABA</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-black uppercase tracking-tighter">Estado General del Territorio</h2>
                <p className="text-[#6B5FA0] text-sm mt-0.5">Basado en <span className="font-black text-[#1E1040]">{stats.total}</span> diagnósticos — {barrios.length} barrios</p>
              </div>
              <div className="flex gap-5 text-center flex-shrink-0">
                <div><div className="text-xl font-black text-red-400">{Math.round(stats.dist.rojo * 100)}%</div><div className="text-[10px] text-[#6B5FA0] uppercase">Crítico</div></div>
                <div><div className="text-xl font-black text-yellow-400">{Math.round(stats.dist.amarillo * 100)}%</div><div className="text-[10px] text-[#6B5FA0] uppercase">Alerta</div></div>
                <div><div className="text-xl font-black text-green-400">{Math.round(stats.dist.verde * 100)}%</div><div className="text-[10px] text-[#6B5FA0] uppercase">Estable</div></div>
              </div>
            </div>
            <div className="mt-4 flex h-2.5 w-full rounded-full overflow-hidden bg-[#ede9fe]">
              <div style={{ width: `${stats.dist.verde * 100}%` }} className="bg-[#22c55e]" />
              <div style={{ width: `${stats.dist.amarillo * 100}%` }} className="bg-[#f59e0b]" />
              <div style={{ width: `${stats.dist.rojo * 100}%` }} className="bg-[#ef4444]" />
            </div>
          </div>

          {/* Dimensiones */}
          <div className="bg-white border border-[#B8A9E8] rounded-3xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#B8A9E8]">
              <h3 className="text-base font-black">Diagnóstico por Dimensión</h3>
            </div>
            <div className="p-5 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {INSTRUMENT.dimensions.map(d => {
                const s = stats.byDim[d.id] || { rojo: 0, amarillo: 0, verde: 0, n: 0, color: "verde", severity: 0, explanation: "" };
                const isSelected = selectedDimension === d.id;
                const isCritical = stats.mostCritical === d.id && s.severity > 0;
                return (
                  <div key={d.id} onClick={() => setSelectedDimension(isSelected ? null : d.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative ${isSelected ? "border-[#5c40c0]/50 bg-[#5c40c0]/5" : isCritical ? "border-red-500/50 bg-red-500/5" : "border-[#B8A9E8] bg-white hover:bg-[#f8f6ff]"}`}>
                    {isCritical && <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">CRÍTICO</div>}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl flex-shrink-0">{d.emoji}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{d.name}</div>
                          <div className="text-[10px] text-[#9B8EC4]">Severidad: {s.severity}%</div>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border flex-shrink-0 ${colorBadge(s.color)}`}>{s.color}</div>
                    </div>
                    <div className="h-1.5 w-full bg-[#f0eef8] rounded-full overflow-hidden">
                      <div style={{ width: `${s.severity}%` }} className={`h-full rounded-full ${s.color === "rojo" ? "bg-red-500" : s.color === "amarillo" ? "bg-yellow-500" : "bg-green-500"}`} />
                    </div>
                    <p className="text-[10px] text-[#6B5FA0] italic">{s.explanation}</p>
                    {isSelected && PROGRAMAS_CABA[d.id] && (
                      <div className="mt-2 pt-2 border-t border-[#B8A9E8] space-y-2">
                        {PROGRAMAS_CABA[d.id].map((p, i) => (
                          <div key={i} className="p-3 rounded-xl bg-[#f8f6ff] space-y-1">
                            <div className="font-bold text-xs">{p.nombre}</div>
                            <div className="text-[10px] text-[#6B5FA0]">{p.descripcion}</div>
                            {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#5c40c0] flex items-center gap-1 hover:underline"><ExternalLink className="w-3 h-3" /> Ver programa</a>}
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

          {/* Estadísticas demográficas */}
          {stats.demografico && (
            <div className="bg-white border border-[#B8A9E8] rounded-3xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#B8A9E8]">
                <h3 className="text-base font-black">Estadísticas sociales</h3>
              </div>
              <div className="p-5 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* Situación laboral */}
                <div className="bg-gradient-to-br from-white to-[#ede9fe] border border-[#B8A9E8] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💼</span>
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

                {/* Ingreso del hogar */}
                <div className="bg-gradient-to-br from-white to-[#ede9fe] border border-[#B8A9E8] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💰</span>
                    <span className="text-xs font-black uppercase text-[#6B5FA0] tracking-wider">Ingreso del hogar</span>
                  </div>
                  {[
                    { label: "< $700K", val: stats.demografico.ingreso.menos_700k, color: "bg-red-500" },
                    { label: "$700K–$1.3M", val: stats.demografico.ingreso.r700k_1300k, color: "bg-orange-400" },
                    { label: "$1.3M–$2M", val: stats.demografico.ingreso.r1300k_2000k, color: "bg-yellow-500" },
                    { label: "> $2M", val: stats.demografico.ingreso.mas_2000k, color: "bg-green-500" },
                    { label: "Prefiere no decir", val: stats.demografico.ingreso.prefiero_no, color: "bg-gray-300" },
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

                {/* Tipo de vivienda */}
                <div className="bg-gradient-to-br from-white to-[#ede9fe] border border-[#B8A9E8] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏠</span>
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
                  <div className="bg-gradient-to-br from-white to-[#ede9fe] border border-[#B8A9E8] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏛️</span>
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
                          <div className="h-1.5 bg-white rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Seguridad barrial */}
                {(stats.demografico.seguridad.seguro + stats.demografico.seguridad.inseguro) > 0 && (
                  <div className="bg-gradient-to-br from-white to-[#ede9fe] border border-[#B8A9E8] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🔒</span>
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
                          <div className="h-1.5 bg-white rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[9px] text-[#9B8EC4] pt-1">Basado en: "Me siento seguro/a en mi barrio, especialmente de noche"</p>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Voces del territorio */}
          <div className="bg-white border border-[#B8A9E8] rounded-3xl p-5">
            <h3 className="text-base font-black mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#5c40c0]" /> Voces del territorio</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {stats.comentarios.length > 0 ? stats.comentarios.map((c, i) => (
                <div key={i} className="p-3 rounded-2xl bg-[#f8f6ff] border border-[#B8A9E8]">
                  <div className="flex items-center gap-2 mb-1.5"><MapPin className="w-3 h-3 text-[#5c40c0]" /><span className="text-[10px] text-[#6B5FA0]">{c.barrio}</span><span className="text-[9px] text-[#9B8EC4] ml-auto">{new Date(c.submitted_at).toLocaleDateString("es-AR")}</span></div>
                  <p className="text-xs italic text-[#1E1040]">"{c.text}"</p>
                </div>
              )) : <p className="text-xs text-[#9B8EC4] col-span-2 text-center py-4">No hay comentarios aún.</p>}
            </div>
          </div>
        </div>
        )}

        {/* TAB: Lista de usuarios */}
        {activeTab === "usuarios" && (
        <div className="py-6 mx-auto px-10" style={{ maxWidth: 860 }}>

          {/* Buscador y filtros */}
          <div className="bg-white border border-[#B8A9E8] rounded-2xl px-5 pt-4 pb-3 mb-3 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-base text-[#1E1040]">Usuarios</h2>
              <span className="text-xs text-[#9B8EC4] font-bold bg-[#f0eef8] px-2 py-1 rounded-lg">{filtered.length} de {responses.length}</span>
            </div>
            <div className="flex gap-2">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, DNI, barrio o teléfono..."
                className="flex-1 h-9 px-3 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-sm text-[#1E1040] placeholder:text-[#9B8EC4] focus:outline-none focus:border-[#5c40c0]"
              />
              <div className="flex items-center gap-1.5 bg-[#f0eef8] border border-[#B8A9E8] rounded-xl px-3 h-9">
                <MapPin className="w-3.5 h-3.5 text-[#5c40c0] flex-shrink-0" />
                <select
                  value={barrioFilter}
                  onChange={e => setBarrioFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#1E1040] focus:outline-none cursor-pointer"
                >
                  <option value="all">Todos los barrios</option>
                  {barrios.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista — crece con el contenido, la página scrollea */}
          <div className="bg-white border border-[#B8A9E8] rounded-2xl overflow-hidden divide-y divide-[#EDE9FE]">
            {filtered.map((r, i) => {
              const nombre = getNombrePersona(r);
              const telefono = getTelefono(r);
              const dni = getDni(r);
              const barrio = r.territorio?.barrio || "Sin barrio";
              const fecha = new Date(r.submitted_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
              const sitLabR = (() => { try { const p = (() => { const raw = r.perfil_contextual; return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); })(); return p?.profundizacion?.situacion_laboral; } catch { return undefined; } })();
              const scores = calcularScores(r.answers || {}, sitLabR);
              const rojas = scores.filter(s => s.color === "rojo").length;
              const isActive = editingUser?.id === r.id;
              const answers = r.answers || {};
              const plan = generatePlanDesdeScores(answers);
              const criticas = plan.filter(p => p.nivelColor === "rojo").slice(0, 2);
              const areas = criticas.length > 0 ? criticas : plan.slice(0, 2);
              const areasTexto = areas.map(p => p.dimensionName).join(" y ");
              let msg = "app.korai.lat\n\nHola " + nombre + "! Soy Korai, tu asistente de bienestar.\nDetectamos que podrias necesitar apoyo en " + areasTexto + ".\n\nTu plan:\n\n";
              areas.forEach(p => { msg += p.emoji + " " + p.dimensionName + "\n"; p.accionesCorto.slice(0,2).forEach((a,i) => { msg += (i+1) + ". " + a + "\n"; }); const rec = p.recursos?.[0]; if (rec?.url) msg += "Recurso: " + rec.nombre + ": " + rec.url + "\n"; msg += "\n"; });
              msg += "\nEn 7 dias te vamos a contactar.";
              return (
                <div
                  key={r.id || i}
                  className={`px-4 py-3 transition-colors cursor-pointer ${isActive ? "bg-[#ede9fe] border-l-2 border-l-[#5c40c0]" : "hover:bg-[#f8f6ff]"}`}
                  onClick={() => openEdit(r)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#5c40c0] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-black">{nombre ? nombre.charAt(0).toUpperCase() : "?"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-[#1E1040] truncate">{nombre}</span>
                        {r.bot_pausado && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-300 flex-shrink-0">⚠️ ALERTA</span>
                        )}
                        {r.ultimo_estado && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border flex-shrink-0 ${
                            r.ultimo_estado === "cerrado" ? "bg-green-500/20 text-green-600 border-green-500/30" :
                            r.ultimo_estado === "sin_respuesta" ? "bg-orange-500/20 text-orange-500 border-orange-500/30" :
                            r.ultimo_estado === "con_dificultades" ? "bg-red-500/20 text-red-500 border-red-500/30" :
                            r.ultimo_estado === "en_proceso" ? "bg-blue-500/20 text-blue-500 border-blue-500/30" :
                            "bg-purple-500/20 text-[#5c40c0] border-purple-500/30"
                          }`}>{r.ultimo_estado.replace(/_/g, " ")}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#9B8EC4] mb-1.5">{barrio} · {fecha}{dni ? " · DNI: " + dni : ""}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1">{scores.map(s => <div key={s.dimensionId} className={`w-2 h-2 rounded-full ${s.color === "rojo" ? "bg-red-500" : s.color === "amarillo" ? "bg-yellow-500" : "bg-green-500"}`} />)}</div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${rojas >= 2 ? "bg-red-500/20 text-red-400 border-red-500/30" : rojas === 1 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}`}>{rojas} críticas</span>
                        {(() => { const dias = diasDesde(r.ultimo_contacto || r.submitted_at); return dias >= 7 ? <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500 border border-gray-300">{dias}d sin contacto</span> : null; })()}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-2 transition-colors ${isActive ? "text-[#5c40c0]" : "text-[#B8A9E8]"}`} />
                  </div>
                  {/* Acciones rápidas inline */}
                  <div className="flex items-center gap-1.5 mt-2 ml-11 flex-wrap" onClick={e => e.stopPropagation()}>
                    {telefono && (
                      <button onClick={() => { window.open("https://wa.me/549" + telefono.replace(/\D/g, "") + "?text=" + encodeURIComponent(msg), "_blank"); addNote(r.id, "Contacto por WhatsApp (enviado desde admin)", "contactado").catch(() => {}); }} className="text-[9px] bg-green-500/20 text-green-600 border border-green-500/30 px-2 py-1 rounded-lg font-bold flex items-center gap-1"><MessageCircle className="w-2.5 h-2.5" /> WA</button>
                    )}
                    <button onClick={() => addNote(r.id, "Sin respuesta al contacto", "sin_respuesta").catch(() => {})} className="text-[9px] bg-orange-500/20 text-orange-500 border border-orange-500/30 px-2 py-1 rounded-lg font-bold">Sin resp.</button>
                    <button onClick={() => { navigator.clipboard.writeText(msg); alert("Plan copiado!"); }} className="text-[9px] bg-purple-500/20 text-purple-500 border border-purple-500/30 px-2 py-1 rounded-lg font-bold">Copiar</button>
                    {confirmDeleteId === r.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id} className="text-[9px] text-white bg-red-500 px-2 py-1 rounded-lg font-bold">{deletingId === r.id ? "..." : "Confirmar"}</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-[9px] text-[#9B8EC4] bg-white px-2 py-1 rounded-lg border border-[#B8A9E8]">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(r.id)} className="text-[9px] text-red-500 bg-red-50 border border-red-300 px-2 py-1 rounded-lg hover:bg-red-100 font-bold">Eliminar</button>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-[#9B8EC4] text-sm">No se encontraron usuarios</div>
            )}
          </div>
        </div>
        )}

        {/* TAB: Perfil de usuario — dos columnas */}
        {activeTab === "usuario" && editingUser && (
        <div className="py-6 mx-auto px-10" style={{ maxWidth: 1100 }}>

          {/* Encabezado */}
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setActiveTab("usuarios")} className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold text-[#5c40c0] bg-[#ede9fe] hover:bg-[#ddd6fe] transition-colors flex-shrink-0">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </button>
            <div className="w-10 h-10 rounded-full bg-[#5c40c0] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-black">{getNombrePersona(editingUser).charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-black text-xl text-[#1E1040]">{getNombrePersona(editingUser)}</div>
                {editingUser.bot_pausado && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-300">⚠️ BOT PAUSADO</span>
                )}
              </div>
              <div className="text-xs text-[#9B8EC4]">{editingUser.territorio?.barrio || "Sin barrio"} · {new Date(editingUser.submitted_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}</div>
            </div>
            {editingUser.bot_pausado ? (
              <button
                onClick={async () => {
                  await fetch(`https://jgqqkgfppovkbwklctol.supabase.co/rest/v1/responses?id=eq.${editingUser.id}`, {
                    method: "PATCH",
                    headers: { "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4", "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4`, "Content-Type": "application/json", "Prefer": "return=minimal" },
                    body: JSON.stringify({ bot_pausado: false }),
                  });
                  setResponses(prev => prev.map(r => r.id === editingUser.id ? { ...r, bot_pausado: false } : r));
                  setEditingUser(prev => prev ? { ...prev, bot_pausado: false } : null);
                }}
                className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold text-green-700 bg-green-100 border border-green-300 hover:bg-green-200 transition-colors flex-shrink-0"
              >
                ✅ Reactivar bot
              </button>
            ) : (
              <button
                onClick={async () => {
                  await fetch(`https://jgqqkgfppovkbwklctol.supabase.co/rest/v1/responses?id=eq.${editingUser.id}`, {
                    method: "PATCH",
                    headers: { "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4", "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4`, "Content-Type": "application/json", "Prefer": "return=minimal" },
                    body: JSON.stringify({ bot_pausado: true }),
                  });
                  setResponses(prev => prev.map(r => r.id === editingUser.id ? { ...r, bot_pausado: true } : r));
                  setEditingUser(prev => prev ? { ...prev, bot_pausado: true } : null);
                }}
                className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold text-orange-700 bg-orange-50 border border-orange-300 hover:bg-orange-100 transition-colors flex-shrink-0"
              >
                ⏸ Tomar control
              </button>
            )}
          </div>

          {/* Grid 2 columnas: izquierda datos + notas | derecha conversación */}
          <div className="grid gap-5" style={{ gridTemplateColumns: "380px 1fr" }}>

            {/* COLUMNA IZQUIERDA */}
            <div className="space-y-4">

              {/* Datos del usuario */}
              <div className="bg-white border border-[#B8A9E8] rounded-2xl p-5 space-y-4">
                <h4 className="font-black text-sm text-[#1E1040]">Datos del usuario</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#6B5FA0] uppercase tracking-wide block mb-1">Nombre</label>
                      <input value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} className="w-full h-9 px-3 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-sm focus:outline-none focus:border-[#5c40c0]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#6B5FA0] uppercase tracking-wide block mb-1">Apellido</label>
                      <input value={editForm.apellido} onChange={e => setEditForm(f => ({ ...f, apellido: e.target.value }))} className="w-full h-9 px-3 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-sm focus:outline-none focus:border-[#5c40c0]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#6B5FA0] uppercase tracking-wide block mb-1">Teléfono</label>
                      <input value={editForm.telefono} onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))} className="w-full h-9 px-3 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-sm focus:outline-none focus:border-[#5c40c0]" placeholder="11xxxxxxxx" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#6B5FA0] uppercase tracking-wide block mb-1">DNI</label>
                      <input value={editForm.dni} onChange={e => setEditForm(f => ({ ...f, dni: e.target.value }))} className="w-full h-9 px-3 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-sm focus:outline-none focus:border-[#5c40c0]" />
                    </div>
                  </div>
                </div>
                <button onClick={saveEdit} disabled={savingEdit} className="w-full h-9 rounded-xl bg-[#5c40c0] text-white text-sm font-bold disabled:opacity-50">
                  {savingEdit ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>

              {/* Diagnóstico de bienestar */}
              {(() => {
                const plan = generatePlanDesdeScores(editingUser.answers || {});
                if (!plan.length) return null;
                return (
                  <div className="bg-white border border-[#B8A9E8] rounded-2xl p-5 space-y-3">
                    <h4 className="font-black text-sm text-[#1E1040]">Diagnóstico de bienestar</h4>
                    <div className="space-y-2">
                      {plan.map(p => {
                        const color = p.nivelColor === "rojo" ? { bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", text: "text-red-700", label: "Crítico" }
                          : p.nivelColor === "amarillo" ? { bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-400", text: "text-yellow-700", label: "Alerta" }
                          : { bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500", text: "text-green-700", label: "Estable" };
                        return (
                          <div key={p.dimensionId} className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${color.bg} ${color.border}`}>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
                            <span className="text-xs font-bold text-[#1E1040] flex-1">{p.dimensionName}</span>
                            <span className={`text-[10px] font-black ${color.text}`}>{color.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Historial de acompañamiento */}
              <div className="bg-white border border-[#B8A9E8] rounded-2xl p-5 space-y-3">
                <h4 className="font-black text-sm text-[#1E1040]">Historial de acompañamiento</h4>
                <div className="flex gap-2">
                  <select value={newEstado} onChange={e => setNewEstado(e.target.value)} className="h-9 px-2 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-xs font-bold text-[#1E1040] focus:outline-none">
                    <option value="contactado">Contactado</option>
                    <option value="sin_respuesta">Sin respuesta</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="con_dificultades">Con dificultades</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                  <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Anotá lo que hablaron..." className="flex-1 h-9 px-3 rounded-xl bg-[#f0eef8] border border-[#B8A9E8] text-sm focus:outline-none" onKeyDown={e => e.key === "Enter" && handleAddNote()} />
                  <button onClick={handleAddNote} disabled={savingNote || !newNote.trim()} className="h-9 w-9 rounded-xl bg-[#5c40c0] text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center">{savingNote ? "…" : "+"}</button>
                </div>
                <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 280, scrollbarWidth: "thin" }}>
                  {notesLoading && <p className="text-xs text-[#9B8EC4]">Cargando...</p>}
                  {notes.length === 0 && !notesLoading && <p className="text-xs text-[#9B8EC4]">Sin notas todavía.</p>}
                  {notes.filter(n => !n.tipo || n.tipo === "nota").map(n => (
                    <div key={n.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#f0eef8]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${n.estado === "cerrado" ? "bg-green-500/20 text-green-600" : n.estado === "con_dificultades" ? "bg-red-500/20 text-red-500" : n.estado === "sin_respuesta" ? "bg-orange-500/20 text-orange-500" : n.estado === "en_proceso" ? "bg-blue-500/20 text-blue-500" : "bg-purple-500/20 text-[#5c40c0]"}`}>{n.estado?.replace(/_/g, " ")}</span>
                          <span className="text-[10px] text-[#9B8EC4]">{new Date(n.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</span>
                        </div>
                        <p className="text-xs text-[#1E1040]">{n.texto}</p>
                      </div>
                      <button onClick={() => handleDeleteNote(n.id)} className="text-[10px] text-red-400 hover:text-red-600 flex-shrink-0 mt-0.5">✕</button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* COLUMNA DERECHA — Conversación completa */}
            <div className="bg-white border border-[#B8A9E8] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-[#1E1040] flex items-center gap-2"><MessageCircle className="w-4 h-4 text-[#5c40c0]" /> Conversación</h4>
                <button onClick={() => { setShowImport(s => !s); setImportText(""); }} className="text-xs bg-[#f0eef8] border border-[#B8A9E8] text-[#5c40c0] px-3 py-1.5 rounded-lg font-bold">
                  {showImport ? "✕ Cancelar" : "📥 Importar WA"}
                </button>
              </div>

              {showImport && (
                <div className="bg-[#f8f6ff] border border-[#B8A9E8] rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-[#6B5FA0]">Pegá el texto exportado de WhatsApp</p>
                  <p className="text-[11px] text-[#9B8EC4]">En WhatsApp: abrí el chat → ⋮ → Más → Exportar chat → Sin archivos → copiá todo el texto acá.</p>
                  <textarea value={importText} onChange={e => setImportText(e.target.value)} className="w-full h-32 px-3 py-2 rounded-xl bg-white border border-[#B8A9E8] text-xs focus:outline-none resize-none font-mono" placeholder={"15/07/2024, 10:23 - Korai: Hola!\n15/07/2024, 10:25 - María: Hola..."} />
                  <button onClick={handleImportarConversacion} disabled={importLoading || !importText.trim()} className="w-full h-9 rounded-xl bg-[#5c40c0] text-white text-xs font-bold disabled:opacity-40 flex items-center justify-center gap-2">
                    {importLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> Importando...</> : "✅ Importar conversación"}
                  </button>
                </div>
              )}

              {/* Chat */}
              <div className="flex flex-col-reverse overflow-y-auto bg-[#f8f6ff] rounded-2xl p-4 gap-2" style={{ height: 320, scrollbarWidth: "thin" }}>
                {notesLoading && <p className="text-xs text-[#9B8EC4] text-center">Cargando...</p>}
                {!notesLoading && notes.filter(n => n.tipo === "entrante" || n.tipo === "saliente").length === 0 && (
                  <p className="text-xs text-[#9B8EC4] text-center py-2">Sin conversación todavía.</p>
                )}
                {[...notes].reverse().filter(n => n.tipo === "entrante" || n.tipo === "saliente").map(n => (
                  <div key={n.id} className={`flex ${n.tipo === "saliente" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs ${n.tipo === "saliente" ? "bg-[#5c40c0] text-white rounded-br-sm" : "bg-white text-[#1E1040] border border-[#B8A9E8] rounded-bl-sm"}`}>
                      <p className="whitespace-pre-wrap">{n.texto}</p>
                      <p className={`text-[10px] mt-1 ${n.tipo === "saliente" ? "text-white/60" : "text-[#9B8EC4]"}`}>{new Date(n.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} · {new Date(n.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mensaje entrante */}
              {/* Panel operador — visible cuando bot está pausado */}
              {editingUser.bot_pausado && (
                <div className="bg-orange-50 border border-orange-300 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⚠️</span>
                    <p className="text-xs font-black text-orange-700 uppercase tracking-wide">Modo operador — el bot está pausado</p>
                  </div>
                  <p className="text-xs text-orange-600">Escribí tu respuesta acá y se enviará desde el número de Korai directamente al usuario.</p>
                  <textarea
                    value={mensajeOperador}
                    onChange={e => setMensajeOperador(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-orange-300 text-sm focus:outline-none resize-none"
                    placeholder="Escribí tu respuesta como operador..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(mensajeOperador)}
                      disabled={!mensajeOperador.trim()}
                      className="h-9 px-3 rounded-lg bg-white border border-orange-300 text-orange-700 text-xs font-bold disabled:opacity-40"
                    >
                      Copiar
                    </button>
                    <button
                      onClick={() => handleEnviarRespuesta(mensajeOperador)}
                      disabled={enviandoWA || !mensajeOperador.trim()}
                      className="flex-1 h-9 rounded-lg bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      {enviandoWA ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageCircle className="w-3 h-3" />}
                      Enviar desde Korai
                    </button>
                  </div>
                </div>
              )}

              {/* Sección carga de mensaje entrante + IA (solo si bot activo) */}
              {!editingUser.bot_pausado && (
              <>
              <div>
                <label className="text-[10px] font-bold text-[#6B5FA0] uppercase tracking-wide block mb-1.5">Mensaje recibido</label>
                <div className="flex gap-2">
                  <textarea value={mensajeUsuario} onChange={e => setMensajeUsuario(e.target.value)} className="flex-1 h-14 px-3 py-2 rounded-xl bg-white border border-[#B8A9E8] text-sm focus:outline-none resize-none" placeholder="Pegá lo que te escribió por WhatsApp..." />
                  <button onClick={handleMensajeEntrante} disabled={savingNote || iaLoading || !mensajeUsuario.trim()} className="h-14 px-4 rounded-xl bg-[#25D366] text-white text-xs font-bold disabled:opacity-40 flex flex-col items-center justify-center gap-0.5">
                    <MessageCircle className="w-4 h-4" />
                    <span>Responder</span>
                  </button>
                </div>
              </div>

              {/* Acciones IA */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => handleGenerarIA("plan")} disabled={iaLoading} className="text-xs bg-[#5c40c0]/10 text-[#5c40c0] border border-[#5c40c0]/30 px-3 py-1.5 rounded-lg font-bold disabled:opacity-50">✨ Generar plan inicial</button>
                <button onClick={() => handleGenerarIA("seguimiento")} disabled={iaLoading} className="text-xs bg-[#5c40c0]/10 text-[#5c40c0] border border-[#5c40c0]/30 px-3 py-1.5 rounded-lg font-bold disabled:opacity-50">🔄 Generar seguimiento</button>
              </div>

              {iaLoading && <p className="text-xs text-[#9B8EC4] flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Korai está pensando...</p>}
              {iaError && <p className="text-xs text-red-500">{iaError}</p>}

              {/* Respuesta IA */}
              {iaMensaje && (
                <div className="space-y-2 bg-[#ede9fe] rounded-2xl p-4">
                  <p className="text-xs font-bold text-[#5c40c0]">✨ Respuesta sugerida — podés editarla</p>
                  <textarea value={iaMensaje} onChange={e => setIaMensaje(e.target.value)} className="w-full h-36 px-3 py-2 rounded-xl bg-white border border-[#B8A9E8] text-sm focus:outline-none resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard.writeText(iaMensaje)} className="flex-1 h-9 rounded-lg bg-white border border-[#B8A9E8] text-[#5c40c0] text-xs font-bold">Copiar</button>
                    <button onClick={() => handleEnviarRespuesta()} disabled={enviandoWA} className="flex-1 h-9 rounded-lg bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-40">
                      {enviandoWA ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageCircle className="w-3 h-3" />} Enviar desde Korai
                    </button>
                  </div>
                </div>
              )}
              </>
              )}
            </div>

          </div>
        </div>
        )}
      </div>
    </div>
  );
}
