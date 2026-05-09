import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePlanDesdeScores } from "@/lib/korai-logic";

const SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4";
const CAMPAIGN_ID = "53813f5a-3613-4faf-8ca1-b369e4e908cb";

function normalizarNumero(telefono: string): string {
  const digits = telefono.replace(/\D/g, "");
  if (digits.startsWith("549")) return digits;
  if (digits.startsWith("54")) return `549${digits.slice(2)}`;
  if (digits.startsWith("9")) return `54${digits}`;
  return `549${digits}`;
}

function normalizarNumero(telefono: string): string {
  const digits = telefono.replace(/\D/g, "");
  if (digits.startsWith("549")) return digits;
  if (digits.startsWith("54")) return `549${digits.slice(2)}`;
  if (digits.startsWith("9")) return `54${digits}`;
  return `549${digits}`;
}

async function registrarAceptacion(dniHash: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/responses?campaign_id=eq.${CAMPAIGN_ID}&dni_hash=eq.${dniHash}&order=submitted_at.desc&limit=1`,
    { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
  );
  const data = await res.json();
  if (!data || data.length === 0) return null;

  const response = data[0];

  await fetch(
    `${SUPABASE_URL}/rest/v1/responses?id=eq.${response.id}`,
    {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ acepto_seguimiento: true, fecha_aceptacion: new Date().toISOString() }),
    }
  );

  return response;
}

function generarMensaje2(plan: any[], context: any, profundizacion: any): string {
  const nombre = context.nombre || "";
  const criticas = plan.filter((p: any) => p.nivelColor === "rojo").slice(0, 2);
  const areas = criticas.length > 0 ? criticas : plan.slice(0, 2);

  let msg = `Perfecto${nombre ? ` ${nombre}` : ""} ðŸ™Œ AcÃ¡ estÃ¡ tu plan para las prÃ³ximas 2 semanas:\n\n`;

  areas.forEach((p: any) => {
    msg += `${p.emoji} *${p.dimensionName}*\n`;
    p.accionesCorto.slice(0, 2).forEach((a: string, i: number) => {
      msg += `${i + 1}. ${a}\n`;
    });
    const r = p.recursos?.[0];
    if (r?.telefono) msg += `ðŸ“ž ${r.nombre}: ${r.telefono}\n`;
    else if (r?.url) msg += `ðŸ”— ${r.nombre}: ${r.url}\n`;

    if (p.dimensionId === "empleo" && profundizacion?.emp_disponibilidad !== "no") {
      msg += `ðŸ”— SacÃ¡ turno en el CIL: buenosaires.gob.ar/tramites/centro-de-integracion-laboral\n`;
    }
    if (p.dimensionId === "salud" && profundizacion?.sal_cobertura === "no") {
      msg += `ðŸ“ž SUMAR (sin obra social): 0800-222-5462\n`;
    }
    msg += "\n";
  });

  msg += `---\nEn 7 dÃ­as te vamos a preguntar cÃ³mo te fue ðŸ’ª\n`;
  msg += `_Korai â€” app.korai.lat_`;
  return msg;
}

function enviarWhatsApp(telefono: string, mensaje: string) {
  const numeroNormalizado = normalizarNumero(telefono);
  return fetch(`${SUPABASE_URL}/functions/v1/send_whatsapp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ telefono: numeroNormalizado, mensaje }),
  });
}

export default function Confirmar() {
  const [_, setLocation] = useLocation();
  const [estado, setEstado] = useState<"cargando" | "ok" | "error">("cargando");
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dniHash = params.get("h") || "";

    if (!dniHash) { setEstado("error"); return; }

    registrarAceptacion(dniHash)
      .then(response => {
        if (!response) { setEstado("error"); return; }

        const context = (() => { try { return JSON.parse(localStorage.getItem("korai_context") || "{}"); } catch { return {}; } })();
        const profundizacion = (() => { try { return JSON.parse(localStorage.getItem("korai_profundizacion") || "{}"); } catch { return {}; } })();
        const planRaw = localStorage.getItem("korai_user_plan_v1");
        const plan = planRaw ? JSON.parse(planRaw) : generatePlanDesdeScores(response.answers || {});

        setNombre(context.nombre || response.dni_real || "");
        setEstado("ok");

        const mensaje = generarMensaje2(plan, context, profundizacion);
        const telefono = (context.telefono || response.telefono || "").replace(/\D/g, "");
        if (telefono && telefono.length >= 8) {
          enviarWhatsApp(telefono, mensaje).catch(err => console.error("Error enviando WhatsApp:", err));
        }
      })
      .catch(() => setEstado("error"));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-[#F4F0FF]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex flex-col items-center text-center gap-6"
      >
        {estado === "cargando" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-[#5B21B6]" />
            <p className="text-[#6B5FA0] text-sm">Registrando tu confirmaciÃ³n...</p>
          </>
        )}

        {estado === "ok" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-green-100 border-4 border-green-400 flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-[#1E1040]">
                Â¡Genial{nombre ? `, ${nombre}` : ""}! ðŸ™Œ
              </h1>
              <p className="text-[#6B5FA0] text-sm leading-relaxed">
                Tu confirmaciÃ³n quedÃ³ registrada. En un momento te llega el plan por WhatsApp al nÃºmero que ingresaste.
              </p>
              <p className="text-[#9B8EC4] text-xs mt-2">
                Si no te llegÃ³ en unos segundos, tocÃ¡ el botÃ³n de abajo.
              </p>
            </div>

            <Button
              onClick={() => {
                const planRaw = localStorage.getItem("korai_user_plan_v1");
                if (!planRaw) return;
                const plan = JSON.parse(planRaw);
                const context = (() => { try { return JSON.parse(localStorage.getItem("korai_context") || "{}"); } catch { return {}; } })();
                const profundizacion = (() => { try { return JSON.parse(localStorage.getItem("korai_profundizacion") || "{}"); } catch { return {}; } })();
                const mensaje = generarMensaje2(plan, context, profundizacion);
                const telefono = (context.telefono || "").replace(/\D/g, "");
                if (telefono && telefono.length >= 8) {
                  enviarWhatsApp(telefono, mensaje).catch(err => console.error("Error reenviando WhatsApp:", err));
                }
              }}
              className="w-full h-12 font-bold rounded-2xl bg-[#5B21B6] text-white flex items-center justify-center gap-2"
            >
              ðŸ“² Reenviar mi plan por WhatsApp
            </Button>

            <button
              onClick={() => setLocation("/prioridades")}
              className="text-xs text-[#9B8EC4] hover:text-[#5B21B6] transition-colors"
            >
              Ver mi plan en la app â†’
            </button>
          </>
        )}

        {estado === "error" && (
          <>
            <div className="text-5xl">ðŸ˜•</div>
            <div className="space-y-2">
              <h1 className="text-xl font-black text-[#1E1040]">No pudimos confirmar</h1>
              <p className="text-[#6B5FA0] text-sm">El link puede haber expirado. VolvÃ© a tu diagnÃ³stico.</p>
            </div>
            <Button onClick={() => setLocation("/")} className="bg-[#5B21B6] text-white rounded-2xl h-12 w-full font-bold">
              Volver al inicio
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}

