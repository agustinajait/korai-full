import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Loader2, MessageCircle, ArrowLeft, Phone } from "lucide-react";
import koraiLogo from "@/lib/koraiLogo";

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

export default function AreaPanel() {
  const [, params] = useRoute("/area/:areaId");
  const [, setLocation] = useLocation();
  const areaId = params?.areaId;

  const [area, setArea] = useState<any>(null);
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaso, setSelectedCaso] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!areaId) return;
    Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/derivation_areas?id=eq.${areaId}`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
      }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/responses?derivado_a=eq.${areaId}&order=derivado_at.desc`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
      }).then(r => r.json()),
    ]).then(([areas, responses]) => {
      if (Array.isArray(areas) && areas[0]) setArea(areas[0]);
      if (Array.isArray(responses)) setCasos(responses);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [areaId]);

  const openCaso = async (r: any) => {
    setSelectedCaso(r);
    setNotesLoading(true);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/case_notes?response_id=eq.${r.id}&order=created_at.asc`, {
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const data = await res.json();
    setNotes(Array.isArray(data) ? data : []);
    setNotesLoading(false);
  };

  const handleAddNote = async () => {
    if (!selectedCaso || !newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/case_notes`, {
        method: "POST",
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
        body: JSON.stringify({ response_id: selectedCaso.id, texto: newNote.trim(), tipo: "nota", estado: "en_proceso" }),
      });
      const data = await res.json();
      if (Array.isArray(data) && data[0]) setNotes(prev => [...prev, data[0]]);
      setNewNote("");
    } catch {}
    setSavingNote(false);
  };

  const handleCerrarCaso = async () => {
    if (!selectedCaso) return;
    await fetch(`${SUPABASE_URL}/rest/v1/responses?id=eq.${selectedCaso.id}`, {
      method: "PATCH",
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({ ultimo_estado: "cerrado" }),
    });
    setCasos(prev => prev.map(r => r.id === selectedCaso.id ? { ...r, ultimo_estado: "cerrado" } : r));
    setSelectedCaso((prev: any) => prev ? { ...prev, ultimo_estado: "cerrado" } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6ff]">
        <Loader2 className="w-6 h-6 animate-spin text-[#5c40c0]" />
      </div>
    );
  }

  if (!area) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6ff]">
        <div className="text-center">
          <p className="text-[#1E1040] font-bold mb-2">Área no encontrada</p>
          <button onClick={() => setLocation("/")} className="text-[#5c40c0] text-sm underline">Volver al inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6ff]">
      {/* Header */}
      <div className="bg-white border-b border-[#B8A9E8] px-6 py-4 flex items-center gap-4">
        <div dangerouslySetInnerHTML={{ __html: koraiLogo }} className="w-8 h-8" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{area.icono}</span>
            <span className="font-black text-[#1E1040]">{area.nombre}</span>
          </div>
          <p className="text-xs text-[#9B8EC4]">{area.descripcion || "Panel de casos derivados"}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-[#5c40c0]">{casos.length}</div>
          <div className="text-[10px] text-[#9B8EC4] uppercase tracking-wide">casos derivados</div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Lista de casos */}
        <div className="w-80 bg-white border-r border-[#B8A9E8] overflow-y-auto flex-shrink-0">
          {casos.length === 0 && (
            <div className="text-center py-16 text-[#9B8EC4] text-sm">Sin casos derivados todavía</div>
          )}
          {casos.map(r => {
            const nombre = getNombre(r);
            const tel = getTelefono(r);
            const dias = diasDesde(r.derivado_at || r.submitted_at);
            const isActive = selectedCaso?.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => openCaso(r)}
                className={`px-4 py-3 border-b border-[#f0ecff] cursor-pointer transition-colors ${isActive ? "bg-[#ede9fe] border-l-2 border-l-[#5c40c0]" : "hover:bg-[#f8f6ff]"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-black" style={{ background: area.color }}>
                    {nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-[#1E1040] truncate">{nombre}</div>
                    <div className="text-[10px] text-[#9B8EC4]">{tel || "Sin teléfono"} · Derivado hace {dias}d</div>
                    {r.derivado_nota && <div className="text-[10px] text-[#6B5FA0] truncate mt-0.5">"{r.derivado_nota}"</div>}
                  </div>
                  {r.ultimo_estado === "cerrado" && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-green-100 text-green-600 border border-green-300 flex-shrink-0">✓ Cerrado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detalle del caso */}
        <div className="flex-1 overflow-y-auto">
          {!selectedCaso ? (
            <div className="flex items-center justify-center h-full text-[#9B8EC4] text-sm">
              Seleccioná un caso para ver el detalle
            </div>
          ) : (
            <div className="p-6 max-w-2xl mx-auto space-y-5">
              {/* Encabezado caso */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-black" style={{ background: area.color }}>
                  {getNombre(selectedCaso).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-black text-xl text-[#1E1040]">{getNombre(selectedCaso)}</div>
                  <div className="text-xs text-[#9B8EC4]">
                    {getTelefono(selectedCaso) || "Sin teléfono"} · Derivado el {selectedCaso.derivado_at ? new Date(selectedCaso.derivado_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long" }) : "-"}
                  </div>
                </div>
                {getTelefono(selectedCaso) && (
                  <a
                    href={`https://wa.me/549${getTelefono(selectedCaso).replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#1da851] transition-colors flex-shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
                {selectedCaso.ultimo_estado !== "cerrado" && (
                  <button onClick={handleCerrarCaso} className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold text-green-700 bg-green-50 border border-green-300 hover:bg-green-100 transition-colors flex-shrink-0">
                    ✓ Cerrar caso
                  </button>
                )}
              </div>

              {/* Nota de derivación */}
              {selectedCaso.derivado_nota && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide mb-1">Nota de derivación</p>
                  <p className="text-sm text-indigo-800">{selectedCaso.derivado_nota}</p>
                </div>
              )}

              {/* Historial de conversación */}
              <div>
                <p className="text-[10px] font-bold text-[#6B5FA0] uppercase tracking-wide mb-2">Historial de conversación con Korai</p>
                <div className="bg-[#f8f6ff] rounded-2xl p-4 space-y-2 max-h-64 overflow-y-auto">
                  {notesLoading && <p className="text-xs text-[#9B8EC4] text-center">Cargando...</p>}
                  {!notesLoading && notes.filter(n => n.tipo === "entrante" || n.tipo === "saliente").length === 0 && (
                    <p className="text-xs text-[#9B8EC4] text-center py-2">Sin conversación registrada</p>
                  )}
                  {notes.filter(n => n.tipo === "entrante" || n.tipo === "saliente").map(n => (
                    <div key={n.id} className={`flex ${n.tipo === "saliente" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs ${n.tipo === "saliente" ? "bg-[#5c40c0] text-white rounded-br-sm" : "bg-white text-[#1E1040] border border-[#B8A9E8] rounded-bl-sm"}`}>
                        <p className="whitespace-pre-wrap">{n.texto}</p>
                        <p className={`text-[10px] mt-1 ${n.tipo === "saliente" ? "text-white/60" : "text-[#9B8EC4]"}`}>{new Date(n.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} · {new Date(n.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas del área */}
              <div>
                <p className="text-[10px] font-bold text-[#6B5FA0] uppercase tracking-wide mb-2">Notas del área</p>
                <div className="space-y-2 mb-3">
                  {notes.filter(n => n.tipo === "nota").length === 0 && (
                    <p className="text-xs text-[#9B8EC4]">Sin notas todavía.</p>
                  )}
                  {notes.filter(n => n.tipo === "nota").map(n => (
                    <div key={n.id} className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
                      <p className="text-xs text-[#1E1040] whitespace-pre-wrap">{n.texto}</p>
                      <p className="text-[10px] text-[#9B8EC4] mt-1">{new Date(n.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#B8A9E8] text-sm focus:outline-none resize-none"
                    placeholder="Agregá una nota sobre el seguimiento..."
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={savingNote || !newNote.trim()}
                    className="h-full px-4 rounded-xl bg-[#5c40c0] text-white text-xs font-bold disabled:opacity-40"
                  >
                    {savingNote ? "..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
