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
  recursos: { nombre: string; descripcionCorta?: string; url?: string; telefono?: string; accion?: string }[];
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

const RECURSOS_MUNICIPALES: Record<string, { nombre: string; descripcionCorta?: string; url?: string; telefono?: string; accion?: string }[]> = {
  empleo: [
    {
      nombre: "Centro de Integración Laboral (CIL)",
      descripcionCorta: "Sacá turno para hacer tu CV y acceder a programas de empleo. Llevá DNI y CUIL.",
      url: "https://buenosaires.gob.ar/tramites/centro-de-integracion-laboral",
      accion: "Sacar turno online",
    },
    {
      nombre: "TrabajoBA — Portal de Empleo CABA",
      descripcionCorta: "Registrate y accedé a ofertas laborales en la Ciudad.",
      url: "https://trabajoba.buenosaires.gob.ar",
      accion: "Registrarme gratis",
    },
    {
      nombre: "Oportunai — CV y Video CV",
      descripcionCorta: "Creá tu perfil laboral y video CV gratis para destacarte.",
      url: "https://oportunai.com",
      accion: "Crear mi perfil",
    },
    {
      nombre: "Formación Profesional CABA — Cursos gratuitos",
      descripcionCorta: "Más de 3.400 cursos gratuitos en 50+ centros en toda la Ciudad.",
      url: "https://buenosaires.gob.ar/educacion/agencia-de-habilidades-para-el-futuro/formacion-profesional",
      accion: "Ver cursos por barrio",
    },
  ],
  educacion: [
    {
      nombre: "Plan FinEs — Terminá el secundario gratis",
      descripcionCorta: "Programa nacional para adultos. Se cursa cerca de tu casa.",
      url: "https://www.argentina.gob.ar/educacion/fines",
      accion: "Ver cómo inscribirme",
    },
    {
      nombre: "Becas Progresar",
      descripcionCorta: "Apoyo económico mensual para seguir estudiando o capacitarte.",
      url: "https://www.argentina.gob.ar/educacion/progresar",
      accion: "Verificar si califico",
    },
    {
      nombre: "Centros de Formación Profesional por barrio",
      descripcionCorta: "Cursos gratuitos en Agronomía, Balvanera, Flores, Lugano, Palermo y más.",
      url: "https://buenosaires.gob.ar/educacion/agencia-de-habilidades-para-el-futuro/sedes-de-formacion-profesional",
      accion: "Buscar el centro más cercano",
    },
  ],
  salud: [
    {
      nombre: "CeSAC — Centro de Salud gratuito en tu barrio",
      descripcionCorta: "Atención médica, pediatría, salud mental y más. Sin obra social.",
      url: "https://buenosaires.gob.ar/salud/centros-de-salud-y-hospitales",
      telefono: "0800-222-5462",
      accion: "Encontrar el CeSAC más cercano",
    },
    {
      nombre: "Programa SUMAR — Cobertura de salud gratuita",
      descripcionCorta: "Para personas sin obra social. Cubre controles, vacunas y más.",
      url: "https://www.argentina.gob.ar/salud/sumar",
      accion: "Inscribirme al SUMAR",
    },
    {
      nombre: "Salud Mental — Línea gratuita CABA",
      descripcionCorta: "Atención y orientación en salud mental las 24hs.",
      telefono: "0800-333-1665",
      accion: "Llamar gratis",
    },
  ],
  vivienda: [
    {
      nombre: "Asistencia Habitacional CABA (Subsidio 690)",
      descripcionCorta: "Para familias en situación de calle o riesgo habitacional.",
      url: "https://buenosaires.gob.ar/desarrollohumanoyhabitat/inclusion-social-y-atencion-inmediata/asistencia-habitacional",
      telefono: "0800-333-3190",
      accion: "Consultar cómo acceder",
    },
    {
      nombre: "PROMEBA — Mejoramiento de barrios",
      descripcionCorta: "Programa nacional para mejoras en infraestructura del hogar.",
      url: "https://www.argentina.gob.ar/habitat/promeba",
      accion: "Ver si aplica en mi barrio",
    },
    {
      nombre: "Línea 147 — Reclamos de servicios urbanos CABA",
      descripcionCorta: "Reclamos por agua, gas, electricidad, residuos e iluminación.",
      telefono: "147",
      accion: "Hacer un reclamo ahora",
    },
  ],
  ingresos: [
    {
      nombre: "ANSES — Turno online",
      descripcionCorta: "AUH, jubilaciones, Potenciar Trabajo y más. Sacá turno sin salir de casa.",
      url: "https://www.anses.gob.ar/turnos",
      telefono: "130",
      accion: "Sacar turno en ANSES",
    },
    {
      nombre: "mi ANSES — Trámites online",
      descripcionCorta: "Consultá y gestioná tus beneficios desde el celular.",
      url: "https://mi.anses.gob.ar",
      accion: "Ingresar a mi ANSES",
    },
    {
      nombre: "TrabajoBA — Oportunidades laborales",
      descripcionCorta: "Portal de empleo del Gobierno de CABA.",
      url: "https://trabajoba.buenosaires.gob.ar",
      accion: "Ver ofertas de trabajo",
    },
  ],
  red: [
    {
      nombre: "Centros Culturales Barriales CABA",
      descripcionCorta: "Actividades gratuitas de arte, deporte y comunidad en tu barrio.",
      url: "https://buenosaires.gob.ar/cultura/centros-culturales",
      accion: "Ver centros cerca mío",
    },
    {
      nombre: "Puntos de Encuentro Comunitario",
      descripcionCorta: "Espacios de participación vecinal y talleres gratuitos.",
      url: "https://www.argentina.gob.ar/cultura",
      accion: "Encontrar espacios",
    },
    {
      nombre: "Línea 102 — Infancia y Adolescencia",
      descripcionCorta: "Orientación y apoyo para familias con niños y adolescentes.",
      telefono: "102",
      accion: "Llamar gratis",
    },
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
