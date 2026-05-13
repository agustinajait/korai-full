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
  esPrioritaria?: boolean; // Ã¡rea bloqueante segÃºn nueva lÃ³gica
}

// Nueva lÃ³gica de priorizaciÃ³n
// 1. CrÃ­tico: salud, vivienda
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
    "Consultar cursos gratuitos de formaciÃ³n profesional en mi barrio.",
  ],
  prevision: [
    "Consultar en ANSES sobre asignaciones y prestaciones disponibles.",
    "Armar un presupuesto mensual simple para organizar mis gastos.",
    "Ver si califico para algÃºn programa de asistencia econÃ³mica.",
  ],
  educacion: [
    "Consultar sobre el Plan FinEs para terminar el secundario.",
    "Inscribirme en 1 curso o taller gratuito disponible en mi zona.",
    "Buscar becas disponibles (Progresar, FinEs).",
  ],
  salud: [
    "Acercarme al CeSAC de mi barrio esta semana.",
    "Verificar mi calendario de vacunaciÃ³n y completar las pendientes.",
    "Consultar sobre el Programa SUMAR si no tengo obra social.",
  ],
  vivienda: [
    "Llamar al 147 para hacer un reclamo formal sobre servicios.",
    "Consultar programas de mejoramiento habitacional.",
    "Verificar mi acceso a servicios bÃ¡sicos (agua, gas, electricidad).",
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
  vivienda:  "Hacer 1 reclamo formal sobre la necesidad mÃ¡s urgente en mi hogar.",
  red:       "Asistir a 1 actividad comunitaria o cultural este mes.",
};

const METAS_MEDIANO: Record<string, string> = {
  empleo:    "Lograr un empleo con mejores condiciones o formalizar mi actividad actual.",
  prevision: "Tener un fondo de emergencia equivalente a 1 mes de gastos bÃ¡sicos.",
  educacion: "Terminar un ciclo educativo (secundario o formaciÃ³n tÃ©cnica) en los prÃ³ximos 2 aÃ±os.",
  salud:     "Completar todos los controles mÃ©dicos preventivos y vacunas pendientes.",
  vivienda:  "Resolver al menos 2 problemas crÃ­ticos de infraestructura de mi hogar.",
  red:       "Participar activamente en una organizaciÃ³n barrial o proyecto comunitario.",
};

const METAS_LARGO: Record<string, string> = {
  empleo:    "Tener empleo estable, con aportes y condiciones dignas.",
  prevision: "Contar con ingresos estables y planificaciÃ³n financiera que brinde tranquilidad.",
  educacion: "Alcanzar el nivel educativo deseado y mantener formaciÃ³n continua.",
  salud:     "Mantener un estado de salud estable con controles regulares y acceso pleno.",
  vivienda:  "Vivir en una casa segura, con todos los servicios bÃ¡sicos resueltos.",
  red:       "Ser parte activa de la vida cultural y social del barrio, con redes de apoyo sÃ³lidas.",
};

const RECURSOS_MUNICIPALES: Record<string, { nombre: string; descripcionCorta?: string; url?: string; telefono?: string; accion?: string; tipo?: "publico" | "privado" | "ong" }[]> = {
  empleo: [
    {
      nombre: "Centro de IntegraciÃ³n Laboral (CIL)",
      descripcionCorta: "SacÃ¡ turno para hacer tu CV y acceder a programas de empleo. LlevÃ¡ DNI y CUIL.",
      url: "https://formulario-sigeci.buenosaires.gob.ar/InicioTramiteComun?idPrestacion=1422",
      accion: "Sacar turno online ahora", tipo: "publico",
    },
    {
      nombre: "TrabajoBA â€” Portal de Empleo CABA",
      descripcionCorta: "Registrate y accedÃ© a ofertas laborales en la Ciudad.",
      url: "https://trabajoba.buenosaires.gob.ar",
      accion: "Registrarme y buscar trabajo", tipo: "publico",
    },
    {
      nombre: "LinkedIn â€” Perfil profesional gratuito",
      descripcionCorta: "CreÃ¡ tu perfil, sumÃ¡ habilidades y conectate con empleadores.",
      url: "https://www.linkedin.com/signup",
      accion: "Crear mi perfil gratis", tipo: "privado",
    },
    {
      nombre: "FormaciÃ³n Profesional CABA â€” Cursos gratuitos",
      descripcionCorta: "MÃ¡s de 3.400 cursos gratuitos en 50+ centros en toda la Ciudad.",
      url: "https://buenosaires.gob.ar/educacion/agencia-de-habilidades-para-el-futuro/sedes-de-formacion-profesional",
      accion: "Buscar cursos cerca de mi barrio", tipo: "publico",
    },
    {
      nombre: "FundaciÃ³n Forge â€” Beca Tu Futuro",
      descripcionCorta: "Beca 100% gratuita para jÃ³venes de 18 a 24 aÃ±os. FormaciÃ³n en habilidades laborales y empleabilidad. InscripciÃ³n online.",
      url: "http://inscripcion.fundacionforge.org",
      accion: "Inscribirme a la beca", tipo: "ong",
    },
    {
      nombre: "Junior Achievement â€” PlanificÃ¡ tu futuro",
      descripcionCorta: "Programa gratuito para jÃ³venes de 16 a 25 aÃ±os. OrientaciÃ³n laboral, CV y LinkedIn. 100% online, 3 semanas.",
      url: "https://junior.org.ar/planificatufuturo/",
      accion: "Inscribirme gratis", tipo: "ong",
    },
    {
      nombre: "Google Career Certificates â€” Cursos gratuitos",
      descripcionCorta: "Certificados profesionales gratuitos en IT, datos y UX. Sin experiencia previa necesaria.",
      url: "https://grow.google/intl/es-419/google-career-certificates",
      accion: "Ver certificados", tipo: "privado",
    },
  ],
  educacion: [
    {
      nombre: "Plan FinEs â€” TerminÃ¡ el secundario gratis",
      descripcionCorta: "Programa nacional para adultos. Se cursa cerca de tu casa.",
      url: "https://www.argentina.gob.ar/educacion/fines/inscripcion",
      accion: "Inscribirme al FinEs", tipo: "publico",
    },
    {
      nombre: "Becas Progresar",
      descripcionCorta: "Apoyo econÃ³mico mensual para seguir estudiando o capacitarte.",
      url: "https://www.argentina.gob.ar/educacion/progresar/requisitos",
      accion: "Ver si califico ahora", tipo: "publico",
    },
    {
      nombre: "Centros de FormaciÃ³n Profesional por barrio",
      descripcionCorta: "Cursos gratuitos en AgronomÃ­a, Balvanera, Flores, Lugano, Palermo y mÃ¡s.",
      url: "https://buenosaires.gob.ar/educacion/agencia-de-habilidades-para-el-futuro/sedes-de-formacion-profesional",
      accion: "Buscar el centro mÃ¡s cercano", tipo: "publico",
    },
    {
      nombre: "Argentina Programa â€” Cursos IT gratuitos",
      descripcionCorta: "Programa del Estado con cursos gratuitos de programaciÃ³n y tecnologÃ­a para cualquier persona.",
      url: "https://www.argentina.gob.ar/economia/conocimiento/argentina-programa",
      accion: "Ver cursos disponibles", tipo: "publico",
    },
    {
      nombre: "Coursera â€” Cursos online gratuitos",
      descripcionCorta: "Miles de cursos gratuitos de universidades y empresas lÃ­deres.",
      url: "https://www.coursera.org",
      accion: "Explorar cursos gratis", tipo: "privado",
    },
    {
      nombre: "Junior Achievement â€” Cursos en alianza con el Estado",
      descripcionCorta: "Cursos gratuitos de finanzas personales y habilidades digitales certificados. Online, 15 horas.",
      url: "https://www.argentina.gob.ar/cursos-en-alianza-con-junior-achievement",
      accion: "Ver cursos gratis", tipo: "ong",
    },
  ],
  salud: [
    {
      nombre: "CeSAC â€” Centro de Salud gratuito en tu barrio",
      descripcionCorta: "AtenciÃ³n mÃ©dica, pediatrÃ­a, salud mental y mÃ¡s. Sin obra social.",
      url: "https://buenosaires.gob.ar/salud/centros-de-salud-y-hospitales",
      telefono: "0800-222-5462",
      accion: "Encontrar el CeSAC mÃ¡s cercano", tipo: "publico",
    },
    {
      nombre: "Programa SUMAR â€” Cobertura de salud gratuita",
      descripcionCorta: "Para personas sin obra social. Cubre controles, vacunas y mÃ¡s.",
      url: "https://www.argentina.gob.ar/salud/sumar/como-afiliarse",
      accion: "Afiliarme al SUMAR ahora", tipo: "publico",
    },
    {
      nombre: "Salud Mental â€” LÃ­nea gratuita CABA",
      descripcionCorta: "AtenciÃ³n y orientaciÃ³n en salud mental las 24hs.",
      telefono: "0800-333-1665",
      accion: "Llamar gratis", tipo: "publico",
    },


  ],
  vivienda: [
    {
      nombre: "Asistencia Habitacional CABA (Subsidio 690)",
      descripcionCorta: "Para familias en situaciÃ³n de calle o riesgo habitacional.",
      url: "https://buenosaires.gob.ar/desarrollohumanoyhabitat/inclusion-social-y-atencion-inmediata/asistencia-habitacional",
      telefono: "0800-333-3190",
      accion: "Llamar o consultar cÃ³mo acceder", tipo: "publico",
    },
    {
      nombre: "PROMEBA â€” Mejoramiento de barrios",
      descripcionCorta: "Programa nacional para mejoras en infraestructura del hogar.",
      url: "https://www.argentina.gob.ar/habitat/promeba",
      accion: "Ver si aplica en mi barrio", tipo: "publico",
    },
    {
      nombre: "LÃ­nea 147 â€” Reclamos de servicios urbanos CABA",
      descripcionCorta: "Reclamos por agua, gas, electricidad, residuos e iluminaciÃ³n.",
      telefono: "147",
      accion: "Hacer un reclamo ahora", tipo: "publico",
    },
    {
      nombre: "Banco NaciÃ³n â€” CrÃ©dito Argenta",
      descripcionCorta: "CrÃ©ditos para mejoras del hogar a tasa preferencial para jubilados y beneficiarios de ANSES.",
      url: "https://www.bna.com.ar/Personas/Prestamos",
      accion: "Ver condiciones", tipo: "privado",
    },
  ],
  prevision: [
    {
      nombre: "ANSES â€” Turno online",
      descripcionCorta: "AUH, jubilaciones, Potenciar Trabajo y mÃ¡s. SacÃ¡ turno sin salir de casa.",
      url: "https://turnos.anses.gob.ar",
      telefono: "130",
      accion: "Sacar turno en ANSES ahora", tipo: "publico",
    },
    {
      nombre: "mi ANSES â€” TrÃ¡mites online",
      descripcionCorta: "ConsultÃ¡ y gestionÃ¡ tus beneficios desde el celular.",
      url: "https://mi.anses.gob.ar",
      accion: "Ingresar a mi ANSES", tipo: "publico",
    },
    {
      nombre: "CAME â€” MicrocrÃ©ditos para emprendedores",
      descripcionCorta: "La ConfederaciÃ³n Argentina de la Mediana Empresa ofrece microcrÃ©ditos para pequeÃ±os emprendedores.",
      url: "https://www.came.org.ar/microcreditos",
      accion: "Ver microcrÃ©ditos", tipo: "privado",
    },


  ],
  red: [
    {
      nombre: "Centros Culturales Barriales CABA",
      descripcionCorta: "Actividades gratuitas de arte, deporte y comunidad en tu barrio.",
      url: "https://buenosaires.gob.ar/cultura/centros-culturales",
      accion: "Ver centros cerca de mÃ­", tipo: "publico",
    },
    {
      nombre: "Puntos de Encuentro Comunitario",
      descripcionCorta: "Espacios de participaciÃ³n vecinal y talleres gratuitos.",
      url: "https://www.argentina.gob.ar/cultura/puntos-de-cultura",
      accion: "Buscar espacios en mi zona", tipo: "publico",
    },
    {
      nombre: "LÃ­nea 102 â€” Infancia y Adolescencia",
      descripcionCorta: "OrientaciÃ³n y apoyo para familias con niÃ±os y adolescentes.",
      telefono: "102",
      accion: "Llamar gratis", tipo: "publico",
    },
    {
      nombre: "AsociaciÃ³n Civil El Arca",
      descripcionCorta: "Red comunitaria con talleres, comedores y acompaÃ±amiento en barrios de CABA.",
      url: "https://www.elarca.org.ar",
      accion: "Ver actividades", tipo: "ong",
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
    // promedio >= 1.5 â†’ ROJO, >= 0.5 â†’ AMARILLO, < 0.5 â†’ VERDE
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

// Nueva lÃ³gica de priorizaciÃ³n segÃºn el documento
// Selecciona hasta 2 Ã¡reas prioritarias por factor bloqueante
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
  const soloConProblemas = scores.filter(s => s.color !== "verde");
  const sorted = [...soloConProblemas].sort((a, b) => {
    const aPrio = idsPrioritarias.has(a.dimensionId) ? 0 : 1;
    const bPrio = idsPrioritarias.has(b.dimensionId) ? 0 : 1;
    if (aPrio !== bPrio) return aPrio - bPrio;
    return a.score - b.score;
  });

  return sorted.slice(0, topN).map((s, i) => {
    const faltantes = s.total - s.score;
    const cuando =
      s.color === "rojo" ? "PrÃ³ximas 2 semanas" :
      s.color === "amarillo" ? "PrÃ³ximos 60 dÃ­as" :
      "Sostener durante el aÃ±o";

    return {
      rank: i + 1,
      dimensionId: s.dimensionId,
      dimensionName: s.dimensionName,
      emoji: s.emoji,
      nivelColor: s.color,
      titulo: `Mejorar ${s.dimensionName}`,
      motivo: `En ${s.dimensionName} tenÃ©s ${s.score} de ${s.total} indicadores resueltos (faltan ${faltantes}).`,
      metaCorto:     METAS_CORTO[s.dimensionId]     || "Definir una acciÃ³n concreta este mes.",
      accionesCorto: ACCIONES_CORTO[s.dimensionId]  || ["Consultar con tu referente local para recibir orientaciÃ³n."],
      metaMediano:   METAS_MEDIANO[s.dimensionId]   || "Avanzar sostenidamente en los prÃ³ximos 1-3 aÃ±os.",
      metaLargo:     METAS_LARGO[s.dimensionId]     || "Alcanzar estabilidad plena en esta dimensiÃ³n.",
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

