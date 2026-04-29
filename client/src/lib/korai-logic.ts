import { INSTRUMENT, getActiveIndicatorsSafe } from "./instrument";

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
  promedio: number;
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
  recursos: { nombre: string; descripcionCorta?: string; url?: string; telefono?: string; accion?: string; tipo?: "publico" | "privado" | "ong" }[];
  cuando: string;
  esPrioritaria?: boolean; // área bloqueante según nueva lógica
}

// Nueva lógica de priorización
// 1. Crítico: salud, vivienda
// 2. Urgente: empleo, prevision
// 3. Desarrollo: educacion, red
const PRIORIDAD_BLOQUEANTE: Record<string, number> = {
  salud:     1,
  vivienda:  1,
  empleo:    2,
  prevision: 2,
  educacion: 3,
  red:       3,
};

const ACCIONES_CORTO: Record<string, string[]> = {
  empleo: [
    "Registrarme en el CIL para hacer mi CV esta semana.",
    "Inscribirme en TrabajoBA para ver ofertas laborales.",
    "Consultar cursos gratuitos de formación profesional en mi barrio.",
  ],
  prevision: [
    "Consultar en ANSES sobre asignaciones y prestaciones disponibles.",
    "Armar un presupuesto mensual simple para organizar mis gastos.",
    "Ver si califico para algún programa de asistencia económica.",
  ],
  educacion: [
    "Consultar sobre el Plan FinEs para terminar el secundario.",
    "Inscribirme en 1 curso o taller gratuito disponible en mi zona.",
    "Buscar becas disponibles (Progresar, FinEs).",
  ],
  salud: [
    "Acercarme al CeSAC de mi barrio esta semana.",
    "Verificar mi calendario de vacunación y completar las pendientes.",
    "Consultar sobre el Programa SUMAR si no tengo obra social.",
  ],
  vivienda: [
    "Llamar al 147 para hacer un reclamo formal sobre servicios.",
    "Consultar programas de mejoramiento habitacional.",
    "Verificar mi acceso a servicios básicos (agua, gas, electricidad).",
  ],
  red: [
    "Asistir a 1 actividad comunitaria o cultural este mes.",
    "Conectarme con centros culturales o espacios barriales.",
    "Buscar espacios de apoyo en mi comunidad.",
  ],
};

const METAS_CORTO: Record<string, string> = {
  empleo:    "Registrarme en el CIL y TrabajoBA esta semana.",
  prevision: "Consultar en ANSES sobre programas disponibles y armar un presupuesto.",
  educacion: "Inscribirme en 1 curso o taller gratuito disponible en mi zona.",
  salud:     "Acercarme al CeSAC de mi barrio para un chequeo preventivo.",
  vivienda:  "Hacer 1 reclamo formal sobre la necesidad más urgente en mi hogar.",
  red:       "Asistir a 1 actividad comunitaria o cultural este mes.",
};

const METAS_MEDIANO: Record<string, string> = {
  empleo:    "Lograr un empleo con mejores condiciones o formalizar mi actividad actual.",
  prevision: "Tener un fondo de emergencia equivalente a 1 mes de gastos básicos.",
  educacion: "Terminar un ciclo educativo (secundario o formación técnica) en los próximos 2 años.",
  salud:     "Completar todos los controles médicos preventivos y vacunas pendientes.",
  vivienda:  "Resolver al menos 2 problemas críticos de infraestructura de mi hogar.",
  red:       "Participar activamente en una organización barrial o proyecto comunitario.",
};

const METAS_LARGO: Record<string, string> = {
  empleo:    "Tener empleo estable, con aportes y condiciones dignas.",
  prevision: "Contar con ingresos estables y planificación financiera que brinde tranquilidad.",
  educacion: "Alcanzar el nivel educativo deseado y mantener formación continua.",
  salud:     "Mantener un estado de salud estable con controles regulares y acceso pleno.",
  vivienda:  "Vivir en una casa segura, con todos los servicios básicos resueltos.",
  red:       "Ser parte activa de la vida cultural y social del barrio, con redes de apoyo sólidas.",
};

const RECURSOS_MUNICIPALES: Record<string, { nombre: string; descripcionCorta?: string; url?: string; telefono?: string; accion?: string; tipo?: "publico" | "privado" | "ong" }[]> = {
  empleo: [
    {
      nombre: "Centro de Integración Laboral (CIL)",
      descripcionCorta: "Sacá turno para hacer tu CV y acceder a programas de empleo. Llevá DNI y CUIL.",
      url: "https://buenosaires.gob.ar/tramites/centro-de-integracion-laboral",
      accion: "Sacar turno online", tipo: "publico",
    },
    {
      nombre: "TrabajoBA — Portal de Empleo CABA",
      descripcionCorta: "Registrate y accedé a ofertas laborales en la Ciudad.",
      url: "https://trabajoba.buenosaires.gob.ar",
      accion: "Registrarme gratis", tipo: "publico",
    },
    {
      nombre: "Oportunai — CV y Video CV",
      descripcionCorta: "Creá tu perfil laboral y video CV gratis para destacarte.",
      url: "https://oportunai.com",
      accion: "Crear mi perfil", tipo: "privado",
    },
    {
      nombre: "Formación Profesional CABA — Cursos gratuitos",
      descripcionCorta: "Más de 3.400 cursos gratuitos en 50+ centros en toda la Ciudad.",
      url: "https://buenosaires.gob.ar/educacion/agencia-de-habilidades-para-el-futuro/formacion-profesional",
      accion: "Ver cursos por barrio", tipo: "publico",
    },
    {
      nombre: "Fundación Forge — Formación laboral juvenil",
      descripcionCorta: "Talleres gratuitos de habilidades laborales para jóvenes de 17 a 25 años.",
      url: "https://fundacionforge.org.ar",
      accion: "Ver programas", tipo: "ong",
    },
    {
      nombre: "Junior Achievement Argentina",
      descripcionCorta: "Programas gratuitos de emprendimiento y empleo para jóvenes.",
      url: "https://www.jaargentina.org.ar",
      accion: "Ver programas", tipo: "ong",
    },
    {
      nombre: "Accenture — Becas y capacitación tecnológica",
      descripcionCorta: "Programa de RSE con cursos gratuitos en tecnología y habilidades digitales.",
      url: "https://www.accenture.com/ar-es/about/citizenship/skills-to-succeed",
      accion: "Ver oportunidades", tipo: "privado",
    },
  ],
  educacion: [
    {
      nombre: "Plan FinEs — Terminá el secundario gratis",
      descripcionCorta: "Programa nacional para adultos. Se cursa cerca de tu casa.",
      url: "https://www.argentina.gob.ar/educacion/fines",
      accion: "Ver cómo inscribirme", tipo: "publico",
    },
    {
      nombre: "Becas Progresar",
      descripcionCorta: "Apoyo económico mensual para seguir estudiando o capacitarte.",
      url: "https://www.argentina.gob.ar/educacion/progresar",
      accion: "Verificar si califico", tipo: "publico",
    },
    {
      nombre: "Centros de Formación Profesional por barrio",
      descripcionCorta: "Cursos gratuitos en Agronomía, Balvanera, Flores, Lugano, Palermo y más.",
      url: "https://buenosaires.gob.ar/educacion/agencia-de-habilidades-para-el-futuro/sedes-de-formacion-profesional",
      accion: "Buscar el centro más cercano", tipo: "publico",
    },
    {
      nombre: "Cimientos — Becas para estudiantes",
      descripcionCorta: "ONG que otorga becas y acompañamiento a jóvenes en situación vulnerable.",
      url: "https://www.cimientos.org",
      accion: "Ver becas disponibles", tipo: "ong",
    },
    {
      nombre: "Coursera — Cursos online gratuitos",
      descripcionCorta: "Miles de cursos gratuitos de universidades y empresas líderes.",
      url: "https://www.coursera.org",
      accion: "Explorar cursos gratis", tipo: "privado",
    },
    {
      nombre: "Google — Certificados de Carrera",
      descripcionCorta: "Certificados profesionales gratuitos en tecnología, datos y negocios.",
      url: "https://grow.google/intl/es-419/google-career-certificates",
      accion: "Ver certificados", tipo: "privado",
    },
  ],
  salud: [
    {
      nombre: "CeSAC — Centro de Salud gratuito en tu barrio",
      descripcionCorta: "Atención médica, pediatría, salud mental y más. Sin obra social.",
      url: "https://buenosaires.gob.ar/salud/centros-de-salud-y-hospitales",
      telefono: "0800-222-5462",
      accion: "Encontrar el CeSAC más cercano", tipo: "publico",
    },
    {
      nombre: "Programa SUMAR — Cobertura de salud gratuita",
      descripcionCorta: "Para personas sin obra social. Cubre controles, vacunas y más.",
      url: "https://www.argentina.gob.ar/salud/sumar",
      accion: "Inscribirme al SUMAR", tipo: "publico",
    },
    {
      nombre: "Salud Mental — Línea gratuita CABA",
      descripcionCorta: "Atención y orientación en salud mental las 24hs.",
      telefono: "0800-333-1665",
      accion: "Llamar gratis", tipo: "publico",
    },
    {
      nombre: "Médicos del Mundo Argentina",
      descripcionCorta: "ONG con atención médica gratuita en barrios vulnerables de Buenos Aires.",
      url: "https://www.medicosdelmundo.org.ar",
      accion: "Ver puntos de atención", tipo: "ong",
    },
    {
      nombre: "Fundación Garrahan — Salud infantil",
      descripcionCorta: "Apoyo y recursos para familias con niños con enfermedades complejas.",
      url: "https://www.fundaciongarrahan.org.ar",
      accion: "Ver programas", tipo: "ong",
    },
  ],
  vivienda: [
    {
      nombre: "Asistencia Habitacional CABA (Subsidio 690)",
      descripcionCorta: "Para familias en situación de calle o riesgo habitacional.",
      url: "https://buenosaires.gob.ar/desarrollohumanoyhabitat/inclusion-social-y-atencion-inmediata/asistencia-habitacional",
      telefono: "0800-333-3190",
      accion: "Consultar cómo acceder", tipo: "publico",
    },
    {
      nombre: "PROMEBA — Mejoramiento de barrios",
      descripcionCorta: "Programa nacional para mejoras en infraestructura del hogar.",
      url: "https://www.argentina.gob.ar/habitat/promeba",
      accion: "Ver si aplica en mi barrio", tipo: "publico",
    },
    {
      nombre: "Línea 147 — Reclamos de servicios urbanos CABA",
      descripcionCorta: "Reclamos por agua, gas, electricidad, residuos e iluminación.",
      telefono: "147",
      accion: "Hacer un reclamo ahora", tipo: "publico",
    },
    {
      nombre: "TECHO Argentina — Mejoramiento habitacional",
      descripcionCorta: "ONG con programas de construcción y mejora de viviendas en asentamientos.",
      url: "https://techo.org/argentina",
      accion: "Ver programas", tipo: "ong",
    },
    {
      nombre: "Turo — Microcréditos para el hogar",
      descripcionCorta: "Microcréditos accesibles para mejoras del hogar sin garantías.",
      url: "https://www.turo.com.ar",
      accion: "Ver opciones", tipo: "privado",
    },
  ],
  prevision: [
    {
      nombre: "ANSES — Turno online",
      descripcionCorta: "AUH, jubilaciones, Potenciar Trabajo y más. Sacá turno sin salir de casa.",
      url: "https://www.anses.gob.ar/turnos",
      telefono: "130",
      accion: "Sacar turno en ANSES", tipo: "publico",
    },
    {
      nombre: "mi ANSES — Trámites online",
      descripcionCorta: "Consultá y gestioná tus beneficios desde el celular.",
      url: "https://mi.anses.gob.ar",
      accion: "Ingresar a mi ANSES", tipo: "publico",
    },
    {
      nombre: "Fondo de Impacto Social — Microcréditos",
      descripcionCorta: "Microcréditos para emprendedores y familias de bajos ingresos.",
      url: "https://www.fondodeimpactosocial.org.ar",
      accion: "Ver opciones", tipo: "ong",
    },
    {
      nombre: "Mercado Pago — Cuenta gratuita",
      descripcionCorta: "Abrí tu cuenta digital gratis para cobrar, pagar y ahorrar.",
      url: "https://www.mercadopago.com.ar",
      accion: "Abrir cuenta gratis", tipo: "privado",
    },
    {
      nombre: "Ualá — Cuenta y tarjeta sin costo",
      descripcionCorta: "Cuenta bancaria digital gratuita con tarjeta Mastercard incluida.",
      url: "https://www.uala.com.ar",
      accion: "Abrir cuenta gratis", tipo: "privado",
    },
  ],
  red: [
    {
      nombre: "Centros Culturales Barriales CABA",
      descripcionCorta: "Actividades gratuitas de arte, deporte y comunidad en tu barrio.",
      url: "https://buenosaires.gob.ar/cultura/centros-culturales",
      accion: "Ver centros cerca mío", tipo: "publico",
    },
    {
      nombre: "Puntos de Encuentro Comunitario",
      descripcionCorta: "Espacios de participación vecinal y talleres gratuitos.",
      url: "https://www.argentina.gob.ar/cultura",
      accion: "Encontrar espacios", tipo: "publico",
    },
    {
      nombre: "Línea 102 — Infancia y Adolescencia",
      descripcionCorta: "Orientación y apoyo para familias con niños y adolescentes.",
      telefono: "102",
      accion: "Llamar gratis", tipo: "publico",
    },
    {
      nombre: "Asociación Civil El Arca",
      descripcionCorta: "Red comunitaria con talleres, comedores y acompañamiento en barrios de CABA.",
      url: "https://www.elarca.org.ar",
      accion: "Ver actividades", tipo: "ong",
    },
    {
      nombre: "Meetup — Grupos y actividades comunitarias",
      descripcionCorta: "Encontrá grupos de interés, actividades y redes de contacto en tu zona.",
      url: "https://www.meetup.com/es-ES",
      accion: "Explorar grupos", tipo: "privado",
    },
  ],
};
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
  prevision: [
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

export function calcularScores(answers: Record<string, string>, situacionLaboral?: string): DimensionScore[] {
  const activeIndicators = getActiveIndicatorsSafe(situacionLaboral);

  return INSTRUMENT.dimensions.map(d => {
    const dimIndicators = activeIndicators.filter(i => i.dimension === d.id);
    const total = dimIndicators.length;
    if (total === 0) {
      return { dimensionId: d.id, dimensionName: d.name, emoji: d.emoji, score: 0, total: 0, verde: 0, amarillo: 0, rojo: 0, color: "verde" as const, promedio: 0 };
    }

    // Para indicadores invertidos (ej: "tengo deudas"): verde=rojo, rojo=verde
    const valorNumerico = (ind: typeof dimIndicators[0], resp: string): number => {
      if (ind.invert) {
        if (resp === "verde") return 2;   // positivo en pregunta invertida = problema
        if (resp === "amarillo") return 1;
        if (resp === "rojo") return 0;    // negativo en pregunta invertida = OK
      }
      if (resp === "verde") return 0;
      if (resp === "amarillo") return 1;
      if (resp === "rojo") return 2;
      return 1; // sin respuesta = neutro
    };

    let verde = 0, amarillo = 0, rojo = 0;
    let suma = 0;
    dimIndicators.forEach(ind => {
      const resp = answers[ind.id] || "amarillo";
      const v = valorNumerico(ind, resp);
      suma += v;
      // Contar colores efectivos (post-invert)
      if (v === 0) verde++;
      else if (v === 1) amarillo++;
      else rojo++;
    });

    const promedio = suma / total;
    // promedio >= 1.5 → ROJO, >= 0.5 → AMARILLO, < 0.5 → VERDE
    const color: "rojo" | "amarillo" | "verde" =
      promedio >= 1.5 ? "rojo" : promedio >= 0.5 ? "amarillo" : "verde";

    return {
      dimensionId: d.id,
      dimensionName: d.name,
      emoji: d.emoji,
      score: verde,
      total,
      verde,
      amarillo,
      rojo,
      color,
      promedio: Math.round(promedio * 100) / 100,
    };
  });
}

// Nueva lógica de priorización según el documento
// Selecciona hasta 2 áreas prioritarias por factor bloqueante
export function getPrioridadesBloqueantes(scores: DimensionScore[]): DimensionScore[] {
  const rojas = scores.filter(s => s.color === "rojo")
    .sort((a, b) => (PRIORIDAD_BLOQUEANTE[a.dimensionId] || 3) - (PRIORIDAD_BLOQUEANTE[b.dimensionId] || 3));

  if (rojas.length >= 2) return rojas.slice(0, 2);

  // Completar con amarillas si hay menos de 2 rojas
  const amarillas = scores.filter(s => s.color === "amarillo")
    .sort((a, b) => (PRIORIDAD_BLOQUEANTE[a.dimensionId] || 3) - (PRIORIDAD_BLOQUEANTE[b.dimensionId] || 3));

  return [...rojas, ...amarillas].slice(0, 2);
}

export function generatePlanDesdeScores(answers: Record<string, string>, topN: number = 5, situacionLaboral?: string): PlanItem[] {
  const scores = calcularScores(answers, situacionLaboral);
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
