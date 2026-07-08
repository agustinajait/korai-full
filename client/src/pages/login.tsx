import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import koraiLogo from "@/lib/koraiLogo";
import { Loader2 } from "lucide-react";

const C = {
  bg: "#f0eef8",
  primary: "#5c40c0",
  text: "#1E1040",
  textSub: "#6B5FA0",
  border: "#DDD6FE",
};

export default function Login() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEnviarCodigo = async () => {
    if (!email.trim()) return;
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    if (error) { setError("No pudimos enviar el código. Verificá el email."); }
    else { setStep("codigo"); }
    setLoading(false);
  };

  const handleVerificarCodigo = async () => {
    if (!codigo.trim()) return;
    setLoading(true); setError("");
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: codigo, type: "email" });
    if (error) { setError("Código incorrecto o expirado. Intentá de nuevo."); }
    else { setLocation("/prioridades"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "Montserrat, system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "400px", background: "white", borderRadius: "24px", padding: "32px", border: `1px solid ${C.border}`, boxShadow: "0 4px 24px rgba(92,64,192,0.08)" }}>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "28px" }}>
          <img src={koraiLogo} alt="Korai" style={{ width: "52px", height: "52px", marginBottom: "12px" }} />
          <h1 style={{ fontWeight: 900, fontSize: "22px", color: C.text, margin: 0 }}>Ver mi plan</h1>
          <p style={{ color: C.textSub, fontSize: "13px", marginTop: "6px", textAlign: "center" }}>
            {step === "email"
              ? "Ingresá tu email para recibir un código de acceso"
              : `Te enviamos un código a ${email}`}
          </p>
        </div>

        {step === "email" ? (
          <>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: C.textSub, display: "block", marginBottom: "6px" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEnviarCodigo()}
                placeholder="tu@email.com"
                style={{ width: "100%", height: "48px", padding: "0 16px", borderRadius: "14px", border: `1px solid ${C.border}`, background: C.bg, fontSize: "15px", color: C.text, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            {error && <p style={{ color: "#ef4444", fontSize: "12px", marginBottom: "12px" }}>{error}</p>}
            <button
              onClick={handleEnviarCodigo}
              disabled={loading || !email.trim()}
              style={{ width: "100%", height: "48px", borderRadius: "14px", border: "none", background: C.primary, color: "white", fontWeight: 800, fontSize: "15px", cursor: "pointer", opacity: loading || !email.trim() ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              {loading ? <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} /> : "Recibir código por email"}
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: C.textSub, display: "block", marginBottom: "6px" }}>Código de verificación</label>
              <input
                type="number"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleVerificarCodigo()}
                placeholder="123456"
                style={{ width: "100%", height: "56px", padding: "0 16px", borderRadius: "14px", border: `1px solid ${C.border}`, background: C.bg, fontSize: "22px", fontWeight: 700, color: C.text, outline: "none", textAlign: "center", letterSpacing: "8px", boxSizing: "border-box" }}
              />
              <p style={{ fontSize: "11px", color: C.textSub, marginTop: "4px" }}>Revisá también la carpeta de spam.</p>
            </div>
            {error && <p style={{ color: "#ef4444", fontSize: "12px", marginBottom: "12px" }}>{error}</p>}
            <button
              onClick={handleVerificarCodigo}
              disabled={loading || codigo.length < 4}
              style={{ width: "100%", height: "48px", borderRadius: "14px", border: "none", background: C.primary, color: "white", fontWeight: 800, fontSize: "15px", cursor: "pointer", opacity: loading || codigo.length < 4 ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px" }}
            >
              {loading ? <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} /> : "Ingresar"}
            </button>
            <button onClick={() => { setStep("email"); setCodigo(""); setError(""); }} style={{ width: "100%", background: "none", border: "none", color: C.textSub, fontSize: "12px", cursor: "pointer", padding: "4px" }}>
              Cambiar email
            </button>
          </>
        )}

        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: C.textSub }}>¿Todavía no hiciste el diagnóstico?</p>
          <button onClick={() => setLocation("/")} style={{ background: "none", border: "none", color: C.primary, fontSize: "13px", fontWeight: 700, cursor: "pointer", marginTop: "4px" }}>
            Empezar ahora →
          </button>
        </div>
      </div>
    </div>
  );
}
