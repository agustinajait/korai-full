import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Loader2, LogOut, Users, MessageSquare, TrendingUp, ChevronRight, MessageCircle, ArrowLeft, Settings } from "lucide-react";
import { calcularScores, generatePlanDesdeScores } from "@/lib/korai-logic";

const SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4";

function getNombre(r: any) {
  try {
    const raw = r.perfil_contextual;
    const p = typeof raw === "string" ? JSON.parse(raw) : (raw || {});
    const nombre = p?.nombre || "";
    const apellido = p?.apellido || "";
    if (nombre || apellido) return (nombre + " " + apellido).trim();
  } catch {}
  return "Caso #" + (r.id ? r.id.slice(0, 6) : "-");
}

function getTelefono(r: any) {
  try {
    const raw = r.perfil_contextual;
    const p = typeof raw === "string" ? JSON.parse(raw) : (raw || {});
    return p?.telefono || "";
  } catch { return ""; }
}

function diasDesde(fecha: string) {
  return Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
}

export default function ClientePanel() {
  const [, setLocation] = useLocation();
  const [tenant, setTenant] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"usuarios" | "config">("usuarios");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [search, setSearch] = useState("");
  // Config
  const [configForm, setConfigForm] = useState<any>({
    bienvenida_titulo: "",
    bienvenida_subtitulo: "",
    color_primario: "#5c40c0",
    color_secundario: "#9B8EC4",
    logo_url: "",
    imagen_portada_url: "",
  });
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    const session = (() => { try { return JSON.parse(localStorage.getItem("korai_client_session") || "null"); } catch { return null; } })();
    if (!session?.tenant_id) { setLocation("/admin"); return; }

    Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${session.tenant_id}`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
      }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/campaigns?tenant_id=eq.${session.tenant_id}&limit=1`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
      }).then(r => r.json()),
    ]).then(async ([tenants, campaigns]) => {
      const t = Array.isArray(tenants) ? tenants[0] : null;
      if (!t) { setLocation("/admin"); return; }
      setTenant(t);
      setConfigForm({
        bienvenida_titulo: t.bienvenida_titulo || "",
        bienvenida_subtitulo: t.bienvenida_subtitulo || "",
        color_primario: t.color_primario || "#5c40c0",
        color_secundario: t.color_secundario || "#9B8EC4",
        logo_url: t.logo_url || "",
        imagen_portada_url: t.imagen_portada_url || "",
      });

      const campaign = Array.isArray(campaigns) ? campaigns[0] : null;
      if (campaign) {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/responses?campaign_id=eq.${campaign.id}&order=submitted_at.desc`,
          { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        const data = await res.json();
        if (Array.isArray(data)) setResponses(data);
      }
      setLoading(false);
    }).catch(() => { setLocation("/admin"); });
  }, []);

  const stats = useMemo(() => {
    const total = responses.length;
    const conTel = responses.filter(r => getTelefono(r)).length;
    const criticos = responses.filter(r => {
      const scores = calcularScores(r.answers || {});
      return scores.filter(s => s.color === "rojo").length >= 2;
    }).length;
    return { total, conTel, criticos };
  }, [responses]);

  const filtered = useMemo(() => {
    if (!search.trim()) return responses;
    const q = search.toLowerCase();
    return responses.filter(r => getNombre(r).toLowerCase().includes(q) || getTelefono(r).includes(q));
  }, [responses, search]);

  const openUser = async (r: any) => {
    setSelectedUser(r);
    setNotesLoading(true);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/case_notes?response_id=eq.${r.id}&order=created_at.asc`, {
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const data = await res.json();
    setNotes(Array.isArray(data) ? data : []);
    setNotesLoading(false);
  };

  const saveConfig = async () => {
    if (!tenant) return;
    setSavingConfig(true);
    await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${tenant.id}`, {
      method: "PATCH",
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify(configForm),
    });
    setTenant((prev: any) => ({ ...prev, ...configForm }));
    setSavingConfig(false);
    alert("✅ Configuración guardada");
  };

  const colorP = tenant?.color_primario || "#5c40c0";

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8f6ff]"><Loader2 className="w-6 h-6 animate-spin" style={{ color: colorP }} /></div>;

  if (selectedUser) {
    const nombre = getNombre(selectedUser);
    const tel = getTelefono(selectedUser);
    const scores = calcularScores(selectedUser.answers || {});
    const plan = generatePlanDesdeScores(selectedUser.answers || {});
    const raw = selectedUser.perfil_contextual;
    const perfil = (() => { try { return typeof raw === "string" ? JSON.parse(raw) : (raw || {}); } catch { return {}; } })();
    const demo = perfil?.demographics || {};
    const EDAD_L: Record<string, string> = { menor18: "< 18", "18-24": "18-24", "25-40": "25-40", "41-60": "41-60", mas60: "> 60" };
    const LAB_L: Record<string, string> = { tengo_trabajo: "Trabaja", buscando: "Busca trabajo", no_trabajo: "No trabaja" };
    const VIV_L: Record<string, string> = { propia: "Propia", alquiler: "Alquiler", prestada: "Prestada", inestable: "Inestable" };

    return (
      <div className="min-h-screen bg-[#f8f6ff]">
        <header className="bg-white border-b px-6 py-3 flex items-center gap-3" style={{ borderColor: colorP + "33" }}>
          <button onClick={() => setSelectedUser(null)} className="flex items-center gap-1 text-xs font-bold px-3 h-8 rounded-lg" style={{ color: colorP, background: colorP + "15" }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Volver
          </button>
          <span className="font-black text-[#1E1040]">{nombre}</span>
          {tel && (
            <a href={`https://wa.me/549${tel.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold text-white bg-[#25D366]">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          )}
        </header>
        <div className="p-6 max-w-4xl mx-auto grid gap-5" style={{ gridTemplateColumns: "300px 1fr" }}>
          {/* Datos */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Datos personales</p>
              {tel && <div className="flex justify-between text-xs"><span className="text-gray-500">Teléfono</span><span className="font-bold">{tel}</span></div>}
              {demo.edad && <div className="flex justify-between text-xs"><span className="text-gray-500">Edad</span><span className="font-bold">{EDAD_L[demo.edad] || demo.edad}</span></div>}
              {demo.situacion_laboral && <div className="flex justify-between text-xs"><span className="text-gray-500">Laboral</span><span className="font-bold">{LAB_L[demo.situacion_laboral] || demo.situacion_laboral}</span></div>}
              {demo.tipo_vivienda && <div className="flex justify-between text-xs"><span className="text-gray-500">Vivienda</span><span className="font-bold">{VIV_L[demo.tipo_vivienda] || demo.tipo_vivienda}</span></div>}
              {demo.personas_cargo && demo.personas_cargo !== "no" && <div className="flex justify-between text-xs"><span className="text-gray-500">A cargo</span><span className="font-bold">{demo.cantidad_cargo || "Sí"}</span></div>}
              {selectedUser.territorio?.barrio && <div className="flex justify-between text-xs"><span className="text-gray-500">Barrio</span><span className="font-bold">{selectedUser.territorio.barrio}</span></div>}
            </div>
            <div className="bg-white rounded-2xl border p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Diagnóstico</p>
              {scores.map(s => (
                <div key={s.dimensionId} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{s.dimensionName}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.color === "rojo" ? "bg-red-100 text-red-600" : s.color === "amarillo" ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"}`}>
                    {s.color === "rojo" ? "Crítico" : s.color === "amarillo" ? "Alerta" : "Estable"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Conversación */}
          <div className="bg-white rounded-2xl border p-5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Conversación con Korai</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 400 }}>
              {notesLoading && <p className="text-xs text-gray-400 text-center">Cargando...</p>}
              {!notesLoading && notes.filter(n => n.tipo === "entrante" || n.tipo === "saliente").length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Sin conversación registrada</p>
              )}
              {notes.filter(n => n.tipo === "entrante" || n.tipo === "saliente").map(n => (
                <div key={n.id} className={`flex ${n.tipo === "saliente" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs ${n.tipo === "saliente" ? "text-white rounded-br-sm" : "bg-white border text-gray-800 rounded-bl-sm"}`}
                    style={n.tipo === "saliente" ? { background: colorP } : {}}>
                    <p className="whitespace-pre-wrap">{n.texto}</p>
                    <p className={`text-[10px] mt-1 ${n.tipo === "saliente" ? "text-white/60" : "text-gray-400"}`}>
                      {new Date(n.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Informe de derivación si existe */}
            {notes.filter(n => n.tipo === "informe_derivacion").map(n => (
              <div key={n.id} className="rounded-xl p-4 text-sm leading-relaxed" style={{ background: colorP + "12", border: `1px solid ${colorP}33` }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: colorP }}>📋 Informe Korai</p>
                <p className="text-gray-700 whitespace-pre-wrap text-xs">{n.texto.replace(/^📋 INFORME DE DERIVACIÓN[^\n]*\n\n/, "")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6ff]">
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center gap-3" style={{ borderColor: colorP + "33" }}>
        {tenant?.logo_url ? (
          <img src={tenant.logo_url} alt={tenant.name} className="h-8 object-contain" />
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black" style={{ background: colorP }}>
            {(tenant?.name || "K").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <p className="font-black text-[#1E1040] text-sm">{tenant?.name || "Panel"}</p>
          <p className="text-[10px] text-gray-400">Panel de diagnósticos</p>
        </div>
        <button
          onClick={() => { localStorage.removeItem("korai_client_session"); setLocation("/admin"); }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100"
        >
          <LogOut className="w-3.5 h-3.5" /> Salir
        </button>
      </header>

      {/* Stats */}
      <div className="px-6 py-5 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Diagnósticos", value: stats.total, icon: <Users className="w-4 h-4" /> },
            { label: "Con teléfono", value: stats.conTel, icon: <MessageSquare className="w-4 h-4" /> },
            { label: "Casos críticos", value: stats.criticos, icon: <TrendingUp className="w-4 h-4" /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: colorP }}>
                {s.icon}
              </div>
              <div>
                <div className="text-2xl font-black text-[#1E1040]">{s.value}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-5">
          {([["usuarios", "👥 Usuarios"], ["config", "⚙️ Configuración"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="px-5 py-2.5 text-sm font-bold transition-colors"
              style={activeTab === key ? { color: colorP, borderBottom: `2px solid ${colorP}` } : { color: "#9B8EC4", borderBottom: "2px solid transparent" }}>
              {label}
            </button>
          ))}
        </div>

        {/* TAB: Usuarios */}
        {activeTab === "usuarios" && (
          <div className="space-y-3">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o teléfono..."
              className="w-full h-10 px-4 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none" />
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {filtered.length === 0 && <p className="text-center py-12 text-gray-400 text-sm">Sin usuarios todavía</p>}
              {filtered.map((r, i) => {
                const nombre = getNombre(r);
                const tel = getTelefono(r);
                const scores = calcularScores(r.answers || {});
                const rojas = scores.filter(s => s.color === "rojo").length;
                const dias = diasDesde(r.submitted_at);
                return (
                  <div key={r.id || i} onClick={() => openUser(r)}
                    className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{ background: colorP }}>
                      {nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1E1040] truncate">{nombre}</span>
                        {rojas >= 2 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0">🔴 Crítico</span>}
                      </div>
                      <div className="text-[10px] text-gray-400">{tel || "Sin teléfono"} · {r.territorio?.barrio || "Sin barrio"} · hace {dias}d</div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {scores.map(s => <div key={s.dimensionId} className={`w-2 h-2 rounded-full ${s.color === "rojo" ? "bg-red-400" : s.color === "amarillo" ? "bg-yellow-400" : "bg-green-400"}`} />)}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: Configuración */}
        {activeTab === "config" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 max-w-lg">
            <h3 className="font-black text-[#1E1040]">Configuración de tu landing</h3>
            <p className="text-xs text-gray-400">Personalizá cómo ven tu espacio los ciudadanos en <code className="bg-gray-100 px-1 rounded">app.korai.lat/{tenant?.slug || "tu-municipio"}</code></p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Título de bienvenida</label>
                <input value={configForm.bienvenida_titulo} onChange={e => setConfigForm((f: any) => ({ ...f, bienvenida_titulo: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none"
                  placeholder="Ej: Diagnóstico de Bienestar San Isidro" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Subtítulo</label>
                <textarea value={configForm.bienvenida_subtitulo} onChange={e => setConfigForm((f: any) => ({ ...f, bienvenida_subtitulo: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none resize-none"
                  placeholder="Ej: Respondé algunas preguntas y te conectamos con recursos de tu municipio" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">URL del logo</label>
                <input value={configForm.logo_url} onChange={e => setConfigForm((f: any) => ({ ...f, logo_url: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none"
                  placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Color primario</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={configForm.color_primario} onChange={e => setConfigForm((f: any) => ({ ...f, color_primario: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                    <input value={configForm.color_primario} onChange={e => setConfigForm((f: any) => ({ ...f, color_primario: e.target.value }))}
                      className="flex-1 h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none font-mono" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Color secundario</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={configForm.color_secundario} onChange={e => setConfigForm((f: any) => ({ ...f, color_secundario: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                    <input value={configForm.color_secundario} onChange={e => setConfigForm((f: any) => ({ ...f, color_secundario: e.target.value }))}
                      className="flex-1 h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none font-mono" />
                  </div>
                </div>
              </div>
              {/* Preview */}
              <div className="rounded-xl p-4 space-y-1" style={{ background: configForm.color_primario + "12", border: `1px solid ${configForm.color_primario}33` }}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Preview landing</p>
                {configForm.logo_url && <img src={configForm.logo_url} alt="logo" className="h-8 object-contain mb-2" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                <p className="font-black text-lg" style={{ color: configForm.color_primario }}>{configForm.bienvenida_titulo || "Tu municipio"}</p>
                <p className="text-xs text-gray-500">{configForm.bienvenida_subtitulo || "Subtítulo de bienvenida"}</p>
              </div>
            </div>

            <button onClick={saveConfig} disabled={savingConfig}
              className="w-full h-10 rounded-xl text-white text-sm font-bold disabled:opacity-50"
              style={{ background: colorP }}>
              {savingConfig ? "Guardando..." : "Guardar configuración"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
