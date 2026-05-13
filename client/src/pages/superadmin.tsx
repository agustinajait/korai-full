import { useState, useMemo, useEffect } from "react";
import { calcularScores, generatePlanDesdeScores } from "@/lib/korai-logic";
import { Loader2, AlertCircle, Users, LogOut, ArrowLeft, User, Copy, Check, MessageCircle, Trash2, Search } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4";
const CAMPAIGN_ID = "53813f5a-3613-4faf-8ca1-b369e4e908cb";

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
  if (!res.ok) throw new Error("Error al eliminar");
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
  return `Caso #${r.id?.slice(0, 6) || "—"}`;
}

function getDni(r: any): string {
  try {
    const raw = r.perfil_contextual;
    const p = typeof raw === "string" ? JSON.parse(raw) : typeof raw === "object" && raw !== null ? raw : {};
    return p?.dni || r.dni_real || "";
  } catch {}
  return r.dni_real || "";
}

function getTelefono(r: any): string {
  try {
    const raw = r.perfil_contextual;
    const p = typeof raw === "string" ? JSON.parse(raw) : typeof raw === "object" && raw !== null ? raw : {};
    return p?.telefono || "";
  } catch {}
  return "";
}

function generarMensajeWA(response: any): string {
  const answers = response.answers as Record<string, string>;
  const plan = generatePlanDesdeScores(answers);
  const nombre = getNombrePersona(response);
  const criticas = plan.filter((p: any) => p.nivelColor === "rojo").slice(0, 2);
  const areas = criticas.length > 0 ? criticas : plan.slice(0, 2);
  const areasTexto = areas.map((p: any) => p.dimensionName).join(" y ");

  let msg = `Hola ${nombre} 👋 Soy Korai, tu asistente de bienestar.\n\n`;
  msg += `Terminaste tu diagnostico y detectamos que hoy podrias necesitar apoyo en ${areasTexto}.\n\n`;
  msg += `🗓️ Tu plan para las proximas 2 semanas:\n\n`;

  areas.forEach((p: any) => {
    msg += `${p.emoji} ${p.dimensionName}\n`;
    p.accionesCorto.slice(0, 2).forEach((a: string, i: number) => {
      msg += `${i + 1}. ${a}\n`;
    });
    const r = p.recursos?.[0];
    if (r?.url) msg += `🔗 ${r.nombre}: ${r.url}\n`;
    else if (r?.telefono) msg += `📞 ${r.nombre}: ${r.telefono}\n`;
    msg += "\n";
  });

  msg += `En 7 dias te vamos a preguntar como te fue 💪\n`;
  msg += `Korai — app.korai.lat`;
  return msg;
}

function UsuarioDetalle({ response, onBack, onDelete }: { response: any; onBack: () => void; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const nombre = getNombrePersona(response);
  const dni = getDni(response);
  const telefono = getTelefono(response);
  const barrio = response.territorio?.barrio || "Sin barrio";
  const fecha = new Date(response.submitted_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  const answers = response.answers as Record<string, string>;
  const plan = generatePlanDesdeScores(answers);
  const mensaje = generarMensajeWA(response);

  const copiarMensaje = () => {
    navigator.clipboard.writeText(mensaje);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm(`Eliminar el diagnostico de ${nombre}?`)) return;
    setDeleting(true);
    await deleteResponse(response.id);
    onDelete();
  };

  const colorBadge = (c: string) =>
    c === "rojo" ? "bg-red-500/20 text-red-400" :
    c === "amarillo" ? "bg-yellow-500/20 text-yellow-400" :
    "bg-green-500/20 text-green-400";

  return (
    <div className="min-h-screen bg-[#070A13] text-[#EEF2FF]">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4 pt-4">
          <Button variant="ghost" onClick={onBack} className="text-white/50 hover:text-white hover:bg-white/10 gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
        </div>

        {/* Perfil */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7c5cff] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xl font-black">{nombre}</div>
              <div className="text-sm text-white/50 mt-1">{barrio} · {fecha}</div>
              {dni && <div className="text-sm text-white/50">DNI: {dni}</div>}
              {telefono && <div className="text-sm text-white/50">📱 {telefono}</div>}
              <div className="flex gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${response.acepto_seguimiento ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>
                  {response.acepto_seguimiento ? "✅ Acepto seguimiento" : "Sin seguimiento"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Boton WhatsApp */}
        <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            <h3 className="font-bold text-[#25D366]">Mensaje WhatsApp listo para enviar</h3>
          </div>
          <div className="bg-black/30 rounded-2xl p-4 text-sm text-white/70 whitespace-pre-wrap font-mono text-xs">
            {mensaje}
          </div>
          <div className="flex gap-3">
            <Button onClick={copiarMensaje} className="flex-1 bg-[#25D366] hover:bg-[#20c45a] text-black font-bold">
              {copied ? <><Check className="w-4 h-4 mr-2" /> Copiado!</> : <><Copy className="w-4 h-4 mr-2" /> Copiar mensaje</>}
            </Button>
            {telefono && (
              <Button
                onClick={() => window.open(`https://wa.me/549${telefono.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`, "_blank")}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold"
              >
                <MessageCircle className="w-4 h-4 mr-2" /> Abrir en WhatsApp
              </Button>
            )}
          </div>
        </div>

        {/* Plan */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-lg">Plan del usuario</h3>
          <div className="space-y-3">
            {plan.slice(0, 4).map((p: any) => (
              <div key={p.dimensionId} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <span className="text-xl">{p.emoji}</span>
                <div className="flex-1">
                  <div className="font-bold text-sm">{p.dimensionName}</div>
                  <div className="text-xs text-white/50">{p.accionesCorto[0]}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${colorBadge(p.nivelColor)}`}>
                  {p.nivelColor}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Eliminar */}
        <div className="pb-8">
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? "Eliminando..." : "Eliminar diagnostico"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Superadmin() {
  const [, setLocation] = useLocation();
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    const role = localStorage.getItem("korai_admin_role");
    if (role !== "superadmin") {
      setLocation("/admin");
      return;
    }
    fetchResponses()
      .then(data => { setResponses(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return responses;
    const q = search.toLowerCase();
    return responses.filter(r => {
      const nombre = getNombrePersona(r).toLowerCase();
      const dni = getDni(r).toLowerCase();
      const barrio = (r.territorio?.barrio || "").toLowerCase();
      return nombre.includes(q) || dni.includes(q) || barrio.includes(q);
    });
  }, [responses, search]);

  if (selected) {
    return (
      <UsuarioDetalle
        response={selected}
        onBack={() => setSelected(null)}
        onDelete={() => {
          setResponses(prev => prev.filter(r => r.id !== selected.id));
          setSelected(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070A13] text-[#EEF2FF]">
      <div className="max-w-5xl mx-auto p-4 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between pt-6">
          <div>
            <h1 className="text-2xl font-black">Panel Superadmin</h1>
            <p className="text-sm text-white/50">{responses.length} diagnosticos registrados</p>
          </div>
          <Button
            onClick={() => { localStorage.removeItem("korai_admin_auth"); localStorage.removeItem("korai_admin_role"); setLocation("/admin"); }}
            variant="ghost"
            className="text-white/50 hover:text-white hover:bg-white/10 gap-2"
          >
            <LogOut className="w-4 h-4" /> Salir
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total usuarios", value: responses.length, icon: Users },
            { label: "Con seguimiento", value: responses.filter(r => r.acepto_seguimiento).length, icon: MessageCircle },
            { label: "Con telefono", value: responses.filter(r => getTelefono(r)).length, icon: MessageCircle },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-xs text-white/50 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Buscar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, DNI o barrio..."
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 text-white placeholder:text-white/30"
          />
        </div>

        {/* Lista */}
        {loading && <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>}
        {error && <div className="text-red-400 text-center py-4">{error}</div>}

        <div className="space-y-2">
          {filtered.map(r => {
            const nombre = getNombrePersona(r);
            const dni = getDni(r);
            const telefono = getTelefono(r);
            const barrio = r.territorio?.barrio || "Sin barrio";
            const fecha = new Date(r.submitted_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });

            return (
              <div
                key={r.id}
                onClick={() => setSelected(r)}
                className="bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-white/8 rounded-2xl p-4 cursor-pointer transition-all flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{nombre}</div>
                  <div className="text-xs text-white/40">{barrio} · {fecha}</div>
                  {dni && <div className="text-xs text-white/30">DNI: {dni}</div>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {telefono && <MessageCircle className="w-4 h-4 text-[#25D366]" />}
                  {r.acepto_seguimiento && <span className="text-xs text-green-400">✅</span>}
                  <span className="text-white/20 text-xs">→</span>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="text-center text-white/30 py-10">No se encontraron resultados</div>
        )}
      </div>
    </div>
  );
}
