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

export interface PlanItem {
  rank: number;
  dimensionId: string;
  dimensionName: string;
  emoji: string;
  nivelColor: "rojo" | "amarillo" | "verde";
  titulo: string;
  motivo: string;
  metaCorto: string;
  accionesCorto: string[];
  metaMediano: string;
  metaLargo: string;
  recursos: { nombre: string; descripcionCorta?: string; url?: string }[];
  cuando: string;
}

export interface Sello {
  municipio: string;
  texto: string;
  fechaISO: string;
  fecha: string;
  idParticipacion: string;
}

const ACCIONES_CORTO: Record<string, string[]> = {
  salud: [
    "Programar 1 consulta m\u00e9dica preventiva esta semana.",
    "Verificar el calendario de vacunaci\u00f3n y completar las pendientes.",
    "Acercarte al centro de salud m\u00e1s cercano para un chequeo.",
  ],
  educacion: [
    "Consultar en la municipalidad sobre programas de terminalidad educativa.",
    "Inscribirte en 1 curso o taller gratuito disponible en tu zona.",
    "Buscar becas disponibles (Progresar, FinEs).",
  ],
  trabajo: [
    "Actualizar tu CV y registrarte en Portal Empleo.",
    "Inscribirte en la oficina de empleo local.",
    "Consultar capacitaciones gratuitas disponibles.",
  ],
  vivienda: [
    "Hacer 1 reclamo formal sobre la necesidad m\u00e1s urgente de infraestructura.",
    "Consultar programas de mejoramiento habitacional en la municipalidad.",
    "Verificar acceso a servicios b\u00e1sicos (agua, gas, electricidad).",
  ],
  prevision: [
    "Armar un presupuesto mensual simple y registrar gastos por 30 d\u00edas.",
    "Consultar en ANSES sobre asignaciones y prestaciones disponibles.",
    "Informarte sobre talleres de educaci\u00f3n financiera.",
  ],
  cultura: [
    "Asistir a 1 actividad comunitaria o cultural este mes.",
    "Conectarte con redes vecinales o centros culturales barriales.",
    "Buscar ofertas de deportes gratuitos en tu zona.",
  ],
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

const RECURSOS_MUNICIPALES: Record<string, { nombre: string; descripcionCorta?: string; url?: string }[]> = {
  salud: [
    { nombre: "CAPS", descripcionCorta: "Centro de Atenci\u00f3n Primaria de Salud m\u00e1s cercano" },
    { nombre: "Programa SUMAR", descripcionCorta: "Cobertura de salud gratuita", url: "https://www.argentina.gob.ar/salud/sumar" },
  ],
  educacion: [
    { nombre: "Plan FinEs", descripcionCorta: "Terminalidad educativa", url: "https://www.argentina.gob.ar/educacion/fines" },
    { nombre: "Becas Progresar", descripcionCorta: "Becas para formaci\u00f3n", url: "https://www.argentina.gob.ar/educacion/progresar" },
  ],
  trabajo: [
    { nombre: "Portal Empleo", descripcionCorta: "Ministerio de Trabajo", url: "https://www.portalempleo.gob.ar" },
    { nombre: "Potenciar Trabajo", descripcionCorta: "Programa de empleo y capacitaci\u00f3n" },
  ],
  vivienda: [
    { nombre: "Mejoramiento Habitacional", descripcionCorta: "Programa municipal de mejoras" },
    { nombre: "PROMEBA", descripcionCorta: "Mejoramiento de Barrios", url: "https://www.argentina.gob.ar/habitat/promeba" },
  ],
  prevision: [
    { nombre: "ANSES", descripcionCorta: "Asignaciones y prestaciones", url: "https://www.anses.gob.ar" },
    { nombre: "Educaci\u00f3n Financiera", descripcionCorta: "Talleres del Banco Naci\u00f3n" },
  ],
  cultura: [
    { nombre: "Puntos de Cultura", descripcionCorta: "Ministerio de Cultura", url: "https://www.argentina.gob.ar/cultura" },
    { nombre: "Centros Culturales", descripcionCorta: "Espacios barriales de encuentro" },
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

export function generatePlanDesdeScores(answers: Record<string, string>, topN: number = 5): PlanItem[] {
  const scores = calcularScores(answers);
  const sorted = [...scores].sort((a, b) => a.score - b.score);
  const top = sorted.slice(0, topN);

  return top.map((s, i) => {
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
      dimensionName: s.dimensionName,
      emoji: s.emoji,
      nivelColor: s.color,
      titulo: `Mejorar ${s.dimensionName}`,
      motivo: `En ${s.dimensionName} ten\u00e9s ${s.score} de ${s.total} indicadores resueltos (faltan ${faltantes}).`,
      metaCorto: METAS_CORTO[s.dimensionId] || "Definir una acci\u00f3n concreta este mes.",
      accionesCorto: ACCIONES_CORTO[s.dimensionId] || ["Consultar con tu referente local para recibir orientaci\u00f3n."],
      metaMediano: METAS_MEDIANO[s.dimensionId] || "Avanzar sostenidamente en los pr\u00f3ximos 1-3 a\u00f1os.",
      metaLargo: METAS_LARGO[s.dimensionId] || "Alcanzar estabilidad plena en esta dimensi\u00f3n.",
      recursos: RECURSOS_MUNICIPALES[s.dimensionId] || [],
      cuando,
    };
  });
}

export function generarSello(municipio?: string): Sello {
  const now = new Date();
  const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
  const nombre = municipio || "RECONQUISTA";
  return {
    municipio: nombre,
    texto: `${nombre} TE ESCUCHA`,
    fechaISO: now.toISOString(),
    fecha: now.toLocaleString("es-AR"),
    idParticipacion: `KORAI-${hash}`,
  };
}

export async function hashDNI(dni: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(dni.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
