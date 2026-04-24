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
  esPrioritaria?: boolean; // área bloqueante según nueva lógica
}

// Nueva lógica: niveles de prioridad según el doc
// 1. Crítico (bloquea todo): salud grave, riesgo de vivienda
// 2. Urgente: empleo / ingresos
// 3. Desarrollo: educación / red
const PRIORIDAD_BLOQUEANTE: Record<string, number> = {
  salud:     1, // crítico
  vivienda:  1, // crítico
  empleo:    2, // urgente
  ingresos:  2, // urgente
  educacion: 3, // desarrollo
  red:       3, // desarrollo
};

const ACCIONES_CORTO: Record<string, string[]> = {
  empleo: [
    "Actualizar mi CV y registrarme en Portal Empleo.",
    "Acercarme a la oficina de empleo local.",
    "Consultar capacitaciones gratuitas disponibles en mi zona.",
  ],
  educacion: [
    "Consultar en la municipalidad sobre programas de terminalidad educativa.",
    "Inscribirme en 1 curso o taller gratuito disponible en mi zona.",
    "Buscar becas disponibles (Progresar, FinEs).",
  ],
  salud: [
    "Programar 1 consulta médica preventiva esta semana.",
    "Verificar mi calendario de vacunación y completar las pendientes.",
    "Acercarme al centro de salud más cercano para un chequeo.",
  ],
  vivienda: [
    "Hacer 1 reclamo formal sobre la necesidad más urgente en mi hogar.",
    "Consultar programas de mejoramiento habitacional en la municipalidad.",
    "Verificar mi acceso a servicios básicos (agua, gas, electricidad).",
  ],
  ingresos: [
    "Consultar en ANSES sobre asignaciones y prestaciones disponibles.",
    "Armar un presupuesto mensual simple.",
    "Ver oportunidades laborales en Portal Empleo.",
  ],
  red: [
    "Asistir a 1 actividad comunitaria o cultural este mes.",
    "Conectarme con redes vecinales o centros culturales barriales.",
    "Buscar espacios de apoyo en mi comunidad.",
  ],
};

const METAS_CORTO: Record<string, string> = {
  empleo:    "Actualizar mi CV y registrarme en al menos 1 plataforma de empleo.",
  educacion: "Inscribirme en 1 curso o taller gratuito disponible en mi zona.",
  salud:     "Programar al menos 1 consulta médica preventiva este mes.",
  vivienda:  "Hacer 1 reclamo formal sobre la necesidad más urgente en mi hogar.",
  ingresos:  "Consultar en ANSES sobre programas disponibles y armar un presupuesto.",
  red:       "Asistir a 1 actividad comunitaria o cultural este mes.",
};

const METAS_MEDIANO: Record<string, string> = {
  empleo:    "Lograr un empleo con mejores condiciones o formalizar mi actividad actual.",
  educacion: "Terminar un ciclo educativo (secundario o formación técnica) en los próximos 2 años.",
  salud:     "Completar todos los controles médicos preventivos y vacunas pendientes.",
  vivienda:  "Resolver al menos 2 problemas críticos de infraestructura de mi hogar.",
  ingresos:  "Tener un fondo de emergencia equivalente a 1 mes de gastos básicos.",
  red:       "Participar activamente en una organización barrial o proyecto comunitario.",
};

const METAS_LARGO: Record<string, string> = {
  empleo:    "Tener empleo estable, con aportes y condiciones dignas.",
  educacion: "Alcanzar el nivel educativo deseado y mantener formación continua.",
  salud:     "Mantener un estado de salud estable con controles regulares y acceso pleno.",
  vivienda:  "Vivir en una casa segura, con todos los servicios básicos resueltos.",
  ingresos:  "Contar con ingresos estables y planificación financiera que brinde tranquilidad.",
  red:       "Ser parte activa de la vida cultural y social del barrio, con redes de apoyo sólidas.",
};

const RECURSOS_MUNICIPALES: Record<string, { nombre: string; descripcionCorta?: string; url?: string }[]> = {
  empleo: [
    { nombre: "Portal Empleo", descripcionCorta: "Ministerio de Trabajo", url: "https://www.portalempleo.gob.ar" },
    { nombre: "Oportunai", descripcionCorta: "Creá tu CV y video CV", url: "https://www.oportunai.com.ar" },
    { nombre: "Potenciar Trabajo", descripcionCorta: "Programa de empleo y capacitación" },
  ],
  educacion: [
    { nombre: "Plan FinEs", descripcionCorta: "Terminalidad educativa", url: "https://www.argentina.gob.ar/educacion/fines" },
    { nombre: "Becas Progresar", descripcionCorta: "Becas para formación", url: "https://www.argentina.gob.ar/educacion/progresar" },
  ],
  salud: [
    { nombre: "CAPS", descripcionCorta: "Centro de Atención Primaria de Salud más cercano" },
    { nombre: "Programa SUMAR", descripcionCorta: "Cobertura de salud gratuita", url: "https://www.argentina.gob.ar/salud/sumar" },
  ],
  vivienda: [
    { nombre: "Mejoramiento Habitacional", descripcionCorta: "Programa municipal de mejoras" },
    { nombre: "PROMEBA", descripcionCorta: "Mejoramiento de Barrios", url: "https://www.argentina.gob.ar/habitat/promeba" },
  ],
  ingresos: [
    { nombre: "ANSES", descripcionCorta: "Asignaciones y prestaciones", url: "https://www.anses.gob.ar" },
    { nombre: "Portal Empleo", descripcionCorta: "Oportunidades laborales", url: "https://www.portalempleo.gob.ar" },
  ],
  red: [
    { nombre: "Puntos de Cultura", descripcionCorta: "Ministerio de Cultura", url: "https://www.argentina.gob.ar/cultura" },
    { nombre: "Centros Culturales", descripcionCorta: "Espacios barriales de encuentro" },
  ],
};

export function calcularScores(answers: Record<string, string>): DimensionScore[] {
  return INSTRUMENT.dimensions.map(d => {
    const dimIndicators = INSTRUMENT.indicators.filter(i => i.dimension === d.id);
    const total = dimIndicators.length;
    const verde    = dimIndicators.filter(i => answers[i.id] === "verde").length;
    const amarillo = dimIndicators.filter(i => answers[i.id] === "amarillo").length;
    const rojo     = dimIndicators.filter(i => answers[i.id] === "rojo").length;
    const score    = verde;
    const color: "rojo" | "amarillo" | "verde" =
      score <= 2 ? "rojo" : score <= 5 ? "amarillo" : "verde";
    return { dimensionId: d.id, dimensionName: d.name, emoji: d.emoji, score, total, verde, amarillo, rojo, color };
  });
}

// Nueva lógica de priorización según el documento
// Selecciona hasta 2 áreas prioritarias por factor bloqueante
export function getPrioridadesBloqueantes(scores: DimensionScore[]): DimensionScore[] {
  const rojas = scores.filter(s => s.color === "rojo");
  if (rojas.length === 0) return [];

  // Ordenar por nivel de prioridad bloqueante (1=crítico, 2=urgente, 3=desarrollo)
  const ordenadas = [...rojas].sort((a, b) =>
    (PRIORIDAD_BLOQUEANTE[a.dimensionId] || 3) - (PRIORIDAD_BLOQUEANTE[b.dimensionId] || 3)
  );

  // Máximo 2 áreas prioritarias
  return ordenadas.slice(0, 2);
}

export function generatePlanDesdeScores(answers: Record<string, string>, topN: number = 5): PlanItem[] {
  const scores = calcularScores(answers);
  const prioritarias = getPrioridadesBloqueantes(scores);
  const idsPrioritarias = new Set(prioritarias.map(p => p.dimensionId));

  // Ordenar: primero las bloqueantes, luego el resto por score
  const sorted = [...scores].sort((a, b) => {
    const aPrio = idsPrioritarias.has(a.dimensionId) ? 0 : 1;
    const bPrio = idsPrioritarias.has(b.dimensionId) ? 0 : 1;
    if (aPrio !== bPrio) return aPrio - bPrio;
    return a.score - b.score;
  });

  return sorted.slice(0, topN).map((s, i) => {
    const faltantes = s.total - s.score;
    const cuando =
      s.color === "rojo" ? "Próximas 2 semanas" :
      s.color === "amarillo" ? "Próximos 60 días" :
      "Sostener durante el año";

    return {
      rank: i + 1,
      dimensionId: s.dimensionId,
      dimensionName: s.dimensionName,
      emoji: s.emoji,
      nivelColor: s.color,
      titulo: `Mejorar ${s.dimensionName}`,
      motivo: `En ${s.dimensionName} tenés ${s.score} de ${s.total} indicadores resueltos (faltan ${faltantes}).`,
      metaCorto:     METAS_CORTO[s.dimensionId]     || "Definir una acción concreta este mes.",
      accionesCorto: ACCIONES_CORTO[s.dimensionId]  || ["Consultar con tu referente local para recibir orientación."],
      metaMediano:   METAS_MEDIANO[s.dimensionId]   || "Avanzar sostenidamente en los próximos 1-3 años.",
      metaLargo:     METAS_LARGO[s.dimensionId]     || "Alcanzar estabilidad plena en esta dimensión.",
      recursos:      RECURSOS_MUNICIPALES[s.dimensionId] || [],
      cuando,
      esPrioritaria: idsPrioritarias.has(s.dimensionId),
    };
  });
}

export function generarSello(municipio?: string): Sello {
  const now = new Date();
  const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
  const nombre = municipio || "KORAI";
  return {
    municipio: nombre,
    texto: `${nombre} TE ESCUCHA`,
    fechaISO: now.toISOString(),
    fecha: now.toLocaleString("es-AR"),
    idParticipacion: `KORAI-${hash}`,
  };
}

export interface Sello {
  municipio: string;
  texto: string;
  fechaISO: string;
  fecha: string;
  idParticipacion: string;
}

export async function hashDNI(dni: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(dni.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
