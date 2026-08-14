import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import koraiLogo from "@/lib/koraiLogo";

/**
 * GET /join/:token
 *
 * Magic link de OportunAI → Korai. El usuario llega acá desde un link
 * enviado por OportunAI (ej: "Hacé tu diagnóstico en Korai") con un token
 * firmado con el secreto compartido KORAI_JOIN_SECRET.
 *
 * Korai no tiene sesión de servidor ni Supabase Auth: el auth es
 * localStorage puro, igual que el resto de la app. Este flujo:
 * 1. Manda el token a POST /api/join/verify (el server valida firma + exp).
 * 2. Si es válido, arma el mismo "korai_context" que arma welcome.tsx al
 *    empezar el diagnóstico, pre-cargado con los datos que mandó OportunAI.
 * 3. Redirige a /survey para que la persona arranque el diagnóstico directo,
 *    sin tener que volver a cargar sus datos a mano.
 */

type Status = "verificando" | "ok" | "error";

interface JoinPayload {
  origen: "oportunai";
  oportunai_user_id: string;
  nombre_completo: string;
  email: string;
  telefono?: string;
  perfil_url?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  token_requerido: "El link está incompleto. Pedí que te reenvíen la invitación desde OportunAI.",
  malformed: "Este link no es válido.",
  invalid_signature: "Este link no es válido.",
  expired: "Este link venció. Pedí que te reenvíen la invitación desde OportunAI.",
  invalid_payload: "Este link no es válido.",
  config: "Hubo un problema para validar el link. Probá de nuevo en unos minutos.",
  error_interno: "Hubo un problema para validar el link. Probá de nuevo en unos minutos.",
};

export default function Join() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<Status>("verificando");
  const [errorMessage, setErrorMessage] = useState("");
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;

    if (!token) {
      setErrorMessage(ERROR_MESSAGES.token_requerido);
      setStatus("error");
      return;
    }

    (async () => {
      try {
        const res = await fetch("https://oportunai.korai.lat/api/join/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const body = await res.json();

        if (!res.ok || !body.ok) {
          setErrorMessage(ERROR_MESSAGES[body.error] || ERROR_MESSAGES.error_interno);
          setStatus("error");
          return;
        }

        const payload = body.data as JoinPayload;
        const [nombre, ...resto] = (payload.nombre_completo || "").trim().split(/\s+/);

        localStorage.setItem("korai_context", JSON.stringify({
          city: "Buenos Aires",
          neighborhood: "",
          nombre: nombre || "",
          apellido: resto.join(" "),
          dni: `oportunai-${payload.oportunai_user_id}`,
          telefono: payload.telefono || "",
          demographics: {
            nombre: nombre || "",
            apellido: resto.join(" "),
          },
        }));

        // Registro aparte del vínculo con OportunAI: no pisa korai_context
        // si más adelante se agrega lógica que dependa de saber el origen.
        localStorage.setItem("korai_oportunai_join_v1", JSON.stringify({
          oportunai_user_id: payload.oportunai_user_id,
          email: payload.email,
          telefono: payload.telefono || "",
          perfil_url: payload.perfil_url || "",
          vinculado_at: new Date().toISOString(),
        }));

        setStatus("ok");
        setTimeout(() => setLocation("/survey"), 1200);
      } catch (err) {
        console.error("[join] error verificando token:", err);
        setErrorMessage(ERROR_MESSAGES.error_interno);
        setStatus("error");
      }
    })();
  }, [token, setLocation]);

  return (
    <div className="min-h-screen w-full flex justify-center items-center" style={{ background: "#F8F7FF" }}>
      <div className="w-full max-w-sm px-5">
        <GlassCard className="p-8 flex flex-col items-center text-center gap-4">
          <img src={koraiLogo} alt="KORAI logo" className="w-12 h-12 object-contain" />

          {status === "verificando" && (
            <>
              <Loader2 className="w-10 h-10 animate-spin text-[#5B21B6]" />
              <p className="text-[#6B5FA0] text-sm">Validando tu invitación de OportunAI...</p>
            </>
          )}

          {status === "ok" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
              <h1 className="text-xl font-black text-[#1E1040]">¡Listo!</h1>
              <p className="text-[#6B5FA0] text-sm">Te llevamos a tu diagnóstico...</p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <XCircle className="w-10 h-10 text-red-500" />
              <h1 className="text-xl font-black text-[#1E1040]">No pudimos validar el link</h1>
              <p className="text-[#6B5FA0] text-sm">{errorMessage}</p>
              <Button
                onClick={() => setLocation("/")}
                className="w-full h-11 rounded-2xl bg-[#5B21B6] text-white font-bold mt-2"
              >
                Ir al inicio
              </Button>
            </motion.div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
