import { INSTRUMENT } from "./instrument";

export interface DimensionScore {
  dimensionId: string;
  dimensionName: string;
  emoji: string;
  score: number;
  total: number;
  verde: number;
  amarillo: number;
  rojo: number;
  color: "rojo" | "amarillo" | "verde";
}

export interface Prioridad {
  rank: number;
  dimensionId: string;
  titulo: string;
  necesidad: string;
  accion: string;
  cuando: string;
  color: "rojo" | "amarillo" | "verde";
  emoji: string;
}

export interface Meta {
  dimensionId: string;
  dimensionName: string;
  emoji: string;
  color: "rojo" | "amarillo" | "verde";
  corto: string;
  mediano: string;
  largo: string;
  recursos: { nombre: string; url?: string }[];
}

export interface Sello {
  municipio: string;
  fecha: string;
  idParticipacion: string;
}

const ACCIONES: Record<string, string> = {
  salud: "Acercate al centro de salud m\u00e1s cercano para un chequeo gratuito y revisa el calendario de vacunaci\u00f3n.",
  educacion: "Consulta en la municipalidad sobre programas de terminalidad educativa y becas disponibles.",
  trabajo: "Inscribite en la oficina de empleo local y en el Portal Empleo de Naci\u00f3n para capacitaciones.",
  vivienda: "Presenta un reclamo ante la municipalidad sobre infraestructura b\u00e1sica y consulta programas de mejoramiento habitacional.",
  prevision: "Accede a talleres gratuitos de educaci\u00f3n financiera del Banco Naci\u00f3n o ANSES.",
  cultura: "Participa en actividades del centro cultural barrial y sum\u00e1te a redes vecinales locales.",
};

const METAS_CORTO: Record<string, string> = {
  salud: "Programar al menos 1 consulta m\u00e9dica preventiva este mes.",
  educacion: "Inscribirme en 1 curso o taller gratuito disponible en mi zona.",
  trabajo: "Actualizar mi CV y registrarme en al menos 1 plataforma de empleo.",
  vivienda: "Hacer 1 reclamo formal sobre la necesidad m\u00e1s urgente de infraestructura.",
  prevision: "Armar un presupuesto mensual simple y registrar gastos por 30 d\u00edas.",
  cultura: "Asistir a 1 actividad comunitaria o cultural este mes.",
};

const METAS_MEDIANO: Record<string, string> = {
  salud: "Completar todos los controles m\u00e9dicos preventivos y vacunas pendientes en el a\u00f1o.",
  educacion: "Terminar un ciclo educativo (primaria, secundaria o formaci\u00f3n t\u00e9cnica) en los pr\u00f3ximos 2 a\u00f1os.",
  trabajo: "Lograr un empleo con mejores condiciones o formalizar mi actividad actual.",
  vivienda: "Resolver al menos 2 problemas cr\u00edticos de infraestructura de mi hogar.",
  prevision: "Tener un fondo de emergencia equivalente a 3 meses de gastos b\u00e1sicos.",
  cultura: "Participar activamente en una organizaci\u00f3n barrial o proyecto comunitario.",
};

const METAS_LARGO: Record<string, string> = {
  salud: "Mantener un estado de salud estable con controles regulares y acceso pleno a servicios.",
  educacion: "Alcanzar el nivel educativo deseado y sostener formaci\u00f3n continua.",
  trabajo: "Tener empleo estable, con aportes y condiciones dignas para toda la familia.",
  vivienda: "Vivir en una casa segura, con todos los servicios b\u00e1sicos resueltos.",
  prevision: "Contar con ahorro, seguros y planificaci\u00f3n financiera que brinde tranquilidad.",
  cultura: "Ser parte activa de la vida cultural y social del barrio, con redes de apoyo s\u00f3lidas.",
};

const RECURSOS_MUNICIPALES: Record<string, { nombre: string; url?: string }[]> = {
  salud: [
    { nombre: "Centro de Atenci\u00f3n Primaria de Salud (CAPS) m\u00e1s cercano" },
    { nombre: "Programa SUMAR (cobertura de salud gratuita)", url: "https://www.argentina.gob.ar/salud/sumar" },
  ],
  educacion: [
    { nombre: "Plan FinEs (Terminalidad educativa)", url: "https://www.argentina.gob.ar/educacion/fines" },
    { nombre: "Becas Progresar", url: "https://www.argentina.gob.ar/educacion/progresar" },
  ],
  trabajo: [
    { nombre: "Portal Empleo (Ministerio de Trabajo)", url: "https://www.portalempleo.gob.ar" },
    { nombre: "Programa Potenciar Trabajo" },
  ],
  vivienda: [
    { nombre: "Programa de Mejoramiento Habitacional" },
    { nombre: "PROMEBA (Mejoramiento de Barrios)", url: "https://www.argentina.gob.ar/habitat/promeba" },
  ],
  prevision: [
    { nombre: "ANSES - Asignaciones y prestaciones", url: "https://www.anses.gob.ar" },
    { nombre: "Talleres de Educaci\u00f3n Financiera (Banco Naci\u00f3n)" },
  ],
  cultura: [
    { nombre: "Puntos de Cultura (Ministerio de Cultura)", url: "https://www.argentina.gob.ar/cultura" },
    { nombre: "Centros Culturales Barriales" },
  ],
};

export function calcularScores(answers: Record<string, string>): DimensionScore[] {
  return INSTRUMENT.dimensions.map(d => {
    const dimIndicators = INSTRUMENT.indicators.filter(i => i.dimension === d.id);
    const total = dimIndicators.length;
    const verde = dimIndicators.filter(i => answers[i.id] === "verde").length;
    const amarillo = dimIndicators.filter(i => answers[i.id] === "amarillo").length;
    const rojo = dimIndicators.filter(i => answers[i.id] === "rojo").length;
    const score = verde;
    const color: "rojo" | "amarillo" | "verde" =
      score <= 2 ? "rojo" : score <= 5 ? "amarillo" : "verde";
    return {
      dimensionId: d.id,
      dimensionName: d.name,
      emoji: d.emoji,
      score,
      total,
      verde,
      amarillo,
      rojo,
      color,
    };
  });
}

export function generatePrioridadesDesdeRespuestas(answers: Record<string, string>): Prioridad[] {
  const scores = calcularScores(answers);
  const sorted = [...scores].sort((a, b) => a.score - b.score);
  const top5 = sorted.slice(0, 5);

  return top5.map((s, i) => {
    const faltantes = s.total - s.score;
    let cuando: string;
    if (s.color === "rojo") {
      cuando = "Pr\u00f3ximas 2 semanas";
    } else if (s.color === "amarillo") {
      cuando = "Pr\u00f3ximos 60 d\u00edas";
    } else {
      cuando = "Sostener durante el a\u00f1o";
    }

    return {
      rank: i + 1,
      dimensionId: s.dimensionId,
      titulo: `Mejorar ${s.dimensionName}`,
      necesidad: `En ${s.dimensionName} ten\u00e9s ${s.score} de ${s.total} indicadores resueltos (faltan ${faltantes}).`,
      accion: ACCIONES[s.dimensionId] || "Consulta con tu referente local para recibir orientaci\u00f3n.",
      cuando,
      color: s.color,
      emoji: s.emoji,
    };
  });
}

export function generateMetasDesdeScores(answers: Record<string, string>): Meta[] {
  const scores = calcularScores(answers);
  return scores.map(s => ({
    dimensionId: s.dimensionId,
    dimensionName: s.dimensionName,
    emoji: s.emoji,
    color: s.color,
    corto: METAS_CORTO[s.dimensionId] || "Definir una acci\u00f3n concreta este mes.",
    mediano: METAS_MEDIANO[s.dimensionId] || "Avanzar sostenidamente en los pr\u00f3ximos 1-3 a\u00f1os.",
    largo: METAS_LARGO[s.dimensionId] || "Alcanzar estabilidad plena en esta dimensi\u00f3n.",
    recursos: RECURSOS_MUNICIPALES[s.dimensionId] || [],
  }));
}

export function generarSello(municipio?: string): Sello {
  const now = new Date();
  const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
  return {
    municipio: municipio || "RECONQUISTA TE ESCUCHA",
    fecha: now.toLocaleString("es-AR"),
    idParticipacion: `KORAI-${hash}-${now.getFullYear()}`,
  };
}

export async function hashDNI(dni: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(dni.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
