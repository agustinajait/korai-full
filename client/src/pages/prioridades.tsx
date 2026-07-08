import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, ExternalLink, MessageCircle } from "lucide-react";
import { generatePlanDesdeScores, type PlanItem } from "@/lib/korai-logic";
import { getRecursosPorBarrio } from "@/lib/recursos-por-zona";

const RECURSOS_EXTRA: Record<string, { nombre: string; descripcion: string; url?: string; telefono?: string; accion: string }[]> = {
  empleo: [
    { nombre: "Centro de Integracion Laboral (CIL)", descripcion: "Saca turno para hacer tu CV y acceder a programas de empleo. Lleva DNI y CUIL.", url: "https://formulario-sigeci.buenosaires.gob.ar/InicioTramiteComun?idPrestacion=1422", accion: "Sacar turno online ahora" },
    { nombre: "TrabajoBA - Portal de Empleo CABA", descripcion: "Registrate y accede a ofertas laborales en la Ciudad.", url: "https://trabajoba.buenosaires.gob.ar", accion: "Registrarme y buscar trabajo" },
  ],
  educacion: [
    { nombre: "Plan FinEs", descripcion: "Termina el secundario gratis. Hay sedes en tu barrio.", url: "https://www.argentina.gob.ar/educacion/fines", accion: "Ver sedes cercanas" },
    { nombre: "Becas Progresar", descripcion: "Apoyo economico para seguir estudiando.", url: "https://www.argentina.gob.ar/educacion/progresar", accion: "Ver si califico" },
  ],
  salud: [
    { nombre: "CeSAC - Centro de Salud gratuito", descripcion: "Atencion medica gratuita cerca de tu casa.", url: "https://buenosaires.gob.ar/salud/centros-de-salud-y-hospitales", telefono: "0800-222-5462", accion: "Encontrar el mas cercano" },
    { nombre: "Programa SUMAR", descripcion: "Cobertura de salud gratuita si no tenes obra social.", url: "https://www.argentina.gob.ar/salud/sumar", accion: "Inscribirme gratis" },
  ],
  vivienda: [
    { nombre: "IVC - Instituto de Vivienda", descripcion: "Programas de mejora, alquiler y escrituracion social.", url: "https://buenosaires.gob.ar/habitat/programas-habitacionales", accion: "Ver programas disponibles" },
    { nombre: "Centro de Gestion y Participacion", descripcion: "Orientacion social y tramites cerca de tu casa.", url: "https://buenosaires.gob.ar/cgp", accion: "Encontrar el mas cercano" },
  ],
  ingresos: [
    { nombre: "ANSES - Turno online", descripcion: "AUH, jubilaciones, Potenciar Trabajo y mas. Saca turno sin salir de casa.", url: "https://turnos.anses.gob.ar", accion: "Sacar turno en ANSES" },
    { nombre: "mi ANSES - Tramites online", descripcion: "Consulta y gestiona tus beneficios desde el celular.", url: "https://mi.anses.gob.ar", accion: "Ingresar a mi ANSES" },
  ],
  red: [
    { nombre: "Centros de Inclusion Social", descripcion: "Espacios de encuentro, talleres y actividades comunitarias gratuitas.", url: "https://buenosaires.gob.ar/desarrollohumanoyhabitat/centros-de-inclusion-social", accion: "Buscar centro cercano" },
    { nombre: "Red de Apoyo Comunitario", descripcion: "Voluntarios y organizaciones que pueden acompanarte.", url: "https://buenosaires.gob.ar/cultura/centros-culturales", accion: "Conectar con la red" },
  ],
};

const MOTIVO_COLOR: Record<string, Record<string, string>> = {
  rojo: {
    empleo: "Tu situacion laboral necesita atencion urgente. Hay oportunidades concretas que podrias estar perdiendo.",
    educacion: "Tu nivel educativo puede estar limitando tus oportunidades. Hay programas gratuitos que pueden ayudarte.",
    salud: "Tu situacion de salud necesita atencion urgente. Hay servicios gratuitos disponibles para vos.",
    vivienda: "Tu situacion habitacional tiene aspectos que necesitan atencion urgente. Hay riesgos o inestabilidades que pueden afectar tu bienestar y el de tu familia.",
    ingresos: "Tu situacion de prevision social y economica necesita atencion urgente. Puede que no estes accediendo a beneficios o protecciones a las que tenes derecho.",
    red: "Tu red de vinculos y apoyo social es debil o inexistente. Tener personas o espacios de contencion es clave para el bienestar y para salir adelante.",
  },
  amarillo: {
    empleo: "Tu situacion laboral tiene aspectos que requieren atencion. Hay oportunidades concretas que podes aprovechar para mejorar tu estabilidad en el empleo.",
    educacion: "Hay aspectos de tu situacion educativa que pueden mejorar. Existen programas que pueden ayudarte a avanzar.",
    salud: "Tu situacion de salud requiere atencion. Es importante que tomes medidas preventivas.",
    vivienda: "Tu situacion habitacional tiene aspectos que requieren atencion. Hay programas que pueden ayudarte.",
    ingresos: "Tu situacion economica requiere atencion. Hay beneficios disponibles que quizas no estas aprovechando.",
    red: "Tu red de vinculos podria fortalecerse. Conectarte con tu comunidad puede mejorar mucho tu bienestar.",
  },
};

export default function Prioridades() {
  const [, setLocation] = useLocation();
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const context = (() => { try { return JSON.parse(localStorage.getItem("korai_context") || "{}"); } catch { return {}; } })();
  const barrio = context.neighborhood || "";
  const savedIdx = parseInt(localStorage.getItem("korai_plan_start_idx") || "0");
  localStorage.removeItem("korai_plan_start_idx");
  const [currentIdx, setCurrentIdx] = useState(savedIdx);

  useEffect(() => {
    const cached = localStorage.getItem("korai_user_plan_v1");
    if (cached) {
      setPlan(JSON.parse(cached));
    } else {
      const answersRaw = localStorage.getItem("korai_user_answers");
      if (answersRaw) {
        const answers = JSON.parse(answersRaw);
        const generated = generatePlanDesdeScores(answers);
        setPlan(generated);
        localStorage.setItem("korai_user_plan_v1", JSON.stringify(generated));
      }
    }
  }, []);

  const handleWhatsApp = (_item?: PlanItem) => {
    const context = (() => { try { return JSON.parse(localStorage.getItem("korai_context") || "{}"); } catch { return {}; } })();
    const nombre = context.nombre || "";
    const dni = context.dni ? `\nDNI: ${context.dni}` : "";
    const msg = `Hola Korai. Terminé mi diagnóstico.\n\nMi nombre es ${nombre} y quiero que me envíes mi plan personalizado y me acompañes en el proceso.${dni}`;
    const encoded = encodeURIComponent(msg);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobile
      ? `https://wa.me/5491161210313?text=${encoded}`
      : `https://web.whatsapp.com/send?phone=5491161210313&text=${encoded}`;
    window.open(url, "_blank");
  };

  if (plan.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", background: "#f0eef8", fontFamily: "Montserrat, system-ui, sans-serif" }}>
        <AlertTriangle style={{ width: "48px", height: "48px", color: "#f59e0b", marginBottom: "16px" }} />
        <h2 style={{ textAlign: "center", color: "#1e1040", fontWeight: 800, fontSize: "18px", marginBottom: "8px" }}>Necesitas completar el diagnostico primero</h2>
        <p style={{ color: "#6b5fa0", textAlign: "center", fontSize: "14px", marginBottom: "20px" }}>Completa la encuesta para ver tu plan personalizado.</p>
        <button onClick={() => setLocation("/")} style={{ background: "#5c40c0", color: "white", border: "none", borderRadius: "12px", padding: "12px 24px", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
          Ir al inicio
        </button>
      </div>
    );
  }

  const item = plan[currentIdx];
  if (!item) return null;

  const color = item.nivelColor;
  const headerColor = color === "rojo" ? "#ff6b6b" : color === "amarillo" ? "#ffd166" : "#34d399";
  const textOnHeader = color === "amarillo" ? "#7c5200" : "white";
  const dotActiveColor = (c: string) => c === "rojo" ? "#ff6b6b" : c === "amarillo" ? "#ffd166" : "#34d399";
  const nextItem = plan[currentIdx + 1];
  const isLast = currentIdx === plan.length - 1;
  const motivo = MOTIVO_COLOR[color]?.[item.dimensionId] || item.motivo;
  const recursos = getRecursosPorBarrio(barrio, item.dimensionId);

  return (
    <div style={{ minHeight: "100vh", background: "#f0eef8", display: "flex", flexDirection: "column", fontFamily: "Montserrat, system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#5c40c0", padding: "14px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 style={{ color: "white", fontWeight: 900, fontSize: "17px", margin: 0 }}>Mi plan de accion</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", margin: "2px 0 0" }}>Area {currentIdx + 1} de {plan.length}</p>
      </div>

      {/* Dots */}
      <div style={{ display: "flex", gap: "8px", padding: "12px 20px 8px", justifyContent: "center" }}>
        {plan.map((p, i) => (
          <div
            key={i}
            onClick={() => setCurrentIdx(i)}
            style={{
              width: i === currentIdx ? "28px" : "10px",
              height: "10px",
              borderRadius: "20px",
              background: i === currentIdx ? dotActiveColor(p.nivelColor) : i < currentIdx ? dotActiveColor(p.nivelColor) + "99" : "#d1c9e8",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>

        {/* Area card */}
        <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", marginBottom: "12px", boxShadow: "0 2px 12px rgba(92,64,192,0.08)", border: `2px solid ${headerColor}` }}>
          {/* Card header */}
          <div style={{ background: headerColor, padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 }}>
              {item.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, color: textOnHeader, fontWeight: 900, fontSize: "20px" }}>{item.dimensionName}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <span style={{ background: "rgba(255,255,255,0.9)", color: headerColor, fontSize: "11px", fontWeight: 800, padding: "2px 10px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: headerColor, display: "inline-block", border: "1px solid rgba(0,0,0,0.15)" }} />
                  {color === "rojo" ? "URGENTE" : color === "amarillo" ? "ATENCION" : "BIEN"}
                </span>
                <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "12px", fontWeight: 600 }}>{item.cuando}</span>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "10px", padding: "4px 10px", color: textOnHeader, fontWeight: 800, fontSize: "13px" }}>#{currentIdx + 1}</div>
          </div>

          {/* Motivo */}
          <div style={{ margin: "14px 16px", borderLeft: `4px solid ${headerColor}`, paddingLeft: "12px" }}>
            <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 800, color: color === "rojo" ? "#ef4444" : color === "amarillo" ? "#d97706" : "#059669", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {color === "rojo" ? "Por que esta en rojo?" : color === "amarillo" ? "Por que esta en amarillo?" : "Por que esta en verde?"}
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#374151", lineHeight: 1.5 }}>{motivo}</p>
          </div>

          {/* Acciones */}
          <div style={{ padding: "0 16px 14px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 800, color: "#5c40c0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Que podes hacer hoy</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {item.accionesCorto.slice(0, 2).map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: headerColor, display: "flex", alignItems: "center", justifyContent: "center", color: textOnHeader, fontWeight: 800, fontSize: "13px", flexShrink: 0 }}>{i + 1}</div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#374151", lineHeight: 1.5, paddingTop: "4px" }}>{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recursos */}
          {recursos.length > 0 && (
            <div style={{ padding: "0 16px 16px" }}>
              <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 800, color: "#5c40c0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Donde ir o a quien llamar</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {recursos.map((r, i) => (
                  <div key={i} style={{ background: "#f8f7ff", borderRadius: "12px", padding: "12px" }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "13px", color: "#1e1040" }}>{r.nombre}</p>
                    <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#6b7280", lineHeight: 1.4 }}>{r.descripcion}</p>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", color: "#5c40c0", fontWeight: 600, textDecoration: "none" }}>
                        <ExternalLink style={{ width: "12px", height: "12px" }} />
                        {r.accion}
                      </a>
                    )}
                    {r.telefono && <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#6b7280" }}>Tel: {r.telefono}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <button
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            style={{ flex: 1, height: "48px", borderRadius: "14px", border: `2px solid ${currentIdx === 0 ? "#d1c9e8" : "#5c40c0"}`, background: "white", color: currentIdx === 0 ? "#c4b5fd" : "#5c40c0", fontWeight: 700, fontSize: "14px", cursor: currentIdx === 0 ? "not-allowed" : "pointer" }}
          >
            ← Anterior
          </button>
          <button
            onClick={() => {
              if (isLast) setLocation("/metas");
              else setCurrentIdx(i => i + 1);
            }}
            style={{ flex: 1, height: "48px", borderRadius: "14px", border: "none", background: isLast ? "#34d399" : "#5c40c0", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
          >
            {isLast ? "✓ Listo" : `Siguiente → ${nextItem?.dimensionName || ""}`}
          </button>
        </div>

        {/* WhatsApp button */}
        <button
          onClick={() => handleWhatsApp(item)}
          style={{ width: "100%", height: "52px", borderRadius: "14px", border: "none", background: "#25D366", color: "white", fontWeight: 800, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "6px" }}
        >
          <MessageCircle style={{ width: "20px", height: "20px" }} />
          Recibir info de {item.dimensionName} por WhatsApp
        </button>
        <p style={{ textAlign: "center", fontSize: "11px", color: "#9b8ec4", margin: "0 0 12px" }}>Te mandamos cada paso directo a tu celular</p>
        <button onClick={() => setLocation("/survey")} style={{ width: "100%", height: "44px", borderRadius: "14px", border: "2px solid #5c40c0", background: "white", color: "#5c40c0", fontWeight: 700, fontSize: "14px", cursor: "pointer", marginBottom: "16px" }}>Ver mi diagnostico completo</button>

        <div style={{ background: "#f0eef8", borderRadius: "14px", padding: "14px 16px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#6B5FA0", margin: "0 0 8px", fontWeight: 600 }}>¿Querés guardar tu plan y volver a verlo después?</p>
          <button onClick={() => setLocation("/login")} style={{ background: "none", border: "none", color: "#5c40c0", fontSize: "13px", fontWeight: 800, cursor: "pointer", textDecoration: "underline" }}>
            Ingresá con tu email →
          </button>
        </div>

      </div>
    </div>
  );
}
