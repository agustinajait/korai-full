// Recursos por municipio — se expande a medida que se agregan recursos locales

export interface Recurso {
  nombre: string;
  descripcion: string;
  url?: string;
  telefono?: string;
  accion: string;
  local?: boolean; // true = recurso municipal específico
}

export type RecursosPorDimension = Record<string, Recurso[]>;

// ─── Recursos base (nacionales/provinciales) ──────────────────────────────────
const RECURSOS_BASE: RecursosPorDimension = {
  empleo: [
    { nombre: "Oficina de Empleo", descripcion: "Orientacion laboral, CV y busqueda de trabajo gratuita.", url: "https://www.argentina.gob.ar/trabajo/empleos/red-de-servicios-de-empleo", accion: "Encontrar la mas cercana" },
    { nombre: "Potenciar Trabajo", descripcion: "Programa nacional de empleo y capacitacion.", url: "https://www.argentina.gob.ar/desarrollosocial/potenciartrabajo", accion: "Ver si califico" },
    { nombre: "Portal Empleo Argentina", descripcion: "Ofertas laborales de todo el pais.", url: "https://www.empleo.gob.ar", accion: "Buscar ofertas" },
  ],
  educacion: [
    { nombre: "Plan FinEs", descripcion: "Termina el secundario gratis en tu barrio.", url: "https://www.argentina.gob.ar/educacion/fines", accion: "Ver sedes cercanas" },
    { nombre: "Becas Progresar", descripcion: "Apoyo economico para seguir estudiando.", url: "https://www.argentina.gob.ar/educacion/progresar", accion: "Ver si califico" },
    { nombre: "Argentina Programa", descripcion: "Capacitacion digital gratuita.", url: "https://www.argentina.gob.ar/economia/conocimiento/argentina-programa", accion: "Inscribirme gratis" },
  ],
  salud: [
    { nombre: "CAPS / Centro de Salud", descripcion: "Atencion medica gratuita en tu barrio.", url: "https://www.gba.gob.ar/salud/centros_de_salud", telefono: "0800-222-5462", accion: "Encontrar el mas cercano" },
    { nombre: "Programa SUMAR", descripcion: "Cobertura de salud gratuita sin obra social.", url: "https://www.argentina.gob.ar/salud/sumar", accion: "Inscribirme" },
    { nombre: "IOMA — Provincia", descripcion: "Obra social provincial para trabajadores bonaerenses.", url: "https://www.ioma.gba.gov.ar", accion: "Ver coberturas" },
  ],
  vivienda: [
    { nombre: "IVBA — Instituto de Vivienda PBA", descripcion: "Programas habitacionales de la Provincia de Buenos Aires.", url: "https://www.gba.gob.ar/ivba", accion: "Ver programas" },
    { nombre: "PROMEBA", descripcion: "Mejoramiento de barrios populares.", url: "https://www.argentina.gob.ar/habitat/promeba", accion: "Ver si aplica a mi barrio" },
    { nombre: "Defensa del Consumidor PBA", descripcion: "Problemas con alquiler, servicios o proveedores.", url: "https://www.gba.gob.ar/defensa_del_consumidor", telefono: "0800-222-9042", accion: "Hacer un reclamo" },
  ],
  ingresos: [
    { nombre: "ANSES — Turno online", descripcion: "AUH, jubilaciones, Potenciar Trabajo y mas.", url: "https://turnos.anses.gob.ar", telefono: "130", accion: "Sacar turno" },
    { nombre: "mi ANSES", descripcion: "Consulta y gestiona tus beneficios desde el celular.", url: "https://mi.anses.gob.ar", accion: "Ingresar" },
    { nombre: "AFIP — Monotributo Social", descripcion: "Formalizate con el minimo costo posible.", url: "https://www.afip.gob.ar/monotributo-social", accion: "Ver requisitos" },
  ],
  red: [
    { nombre: "Centro de Integracion Comunitaria (CIC)", descripcion: "Espacios de encuentro, talleres y actividades gratuitas.", url: "https://www.argentina.gob.ar/desarrollosocial/cic", accion: "Encontrar el mas cercano" },
    { nombre: "Linea 102 — Ninez y Adolescencia", descripcion: "Asistencia a familias con ninos y adolescentes.", telefono: "102", url: "https://www.argentina.gob.ar/desarrollosocial/linea102", accion: "Llamar gratis" },
    { nombre: "Linea 144 — Violencia de Genero", descripcion: "Atencion, apoyo y orientacion en situaciones de violencia.", telefono: "144", url: "https://www.argentina.gob.ar/generos/linea144", accion: "Llamar gratis" },
  ],
};

// ─── Recursos municipales específicos ─────────────────────────────────────────

const RECURSOS_VICENTE_LOPEZ: RecursosPorDimension = {
  empleo: [
    { nombre: "Oficina de Empleo Vicente Lopez", descripcion: "Orientacion laboral gratuita para vecinos de Vicente Lopez.", url: "https://www.vicentelopez.gov.ar/empleo", accion: "Sacar turno", local: true },
    { nombre: "Capacitacion municipal VL", descripcion: "Cursos y talleres de formacion laboral municipales.", url: "https://www.vicentelopez.gov.ar/capacitacion", accion: "Ver cursos disponibles", local: true },
  ],
  salud: [
    { nombre: "Hospital Municipal Dr. Bernardo Houssay", descripcion: "Hospital municipal gratuito en Vicente Lopez.", url: "https://www.vicentelopez.gov.ar/salud", telefono: "4837-0000", accion: "Ver turnos y especialidades", local: true },
    { nombre: "CAPS Vicente Lopez", descripcion: "Centros de atencion primaria de salud en el municipio.", url: "https://www.vicentelopez.gov.ar/salud/caps", accion: "Encontrar el mas cercano", local: true },
  ],
  educacion: [
    { nombre: "Formacion Profesional VL", descripcion: "Centros de formacion profesional gratuitos en Vicente Lopez.", url: "https://www.vicentelopez.gov.ar/educacion", accion: "Ver ofertas educativas", local: true },
  ],
  vivienda: [
    { nombre: "Servicios Sociales VL", descripcion: "Asistencia habitacional y social del municipio.", url: "https://www.vicentelopez.gov.ar/social", telefono: "4795-2000", accion: "Pedir atencion", local: true },
  ],
  ingresos: [],
  red: [
    { nombre: "Centros Culturales VL", descripcion: "Actividades culturales y comunitarias gratuitas.", url: "https://www.vicentelopez.gov.ar/cultura", accion: "Ver actividades", local: true },
    { nombre: "Direccion de Genero VL", descripcion: "Asistencia en situaciones de violencia de genero.", url: "https://www.vicentelopez.gov.ar/genero", telefono: "4795-2000", accion: "Pedir asistencia", local: true },
  ],
};

const RECURSOS_SAN_ISIDRO: RecursosPorDimension = {
  empleo: [
    { nombre: "Oficina de Empleo San Isidro", descripcion: "Orientacion laboral gratuita para vecinos de San Isidro.", url: "https://www.sanisidro.gob.ar/empleo", accion: "Sacar turno", local: true },
  ],
  salud: [
    { nombre: "Hospital Central San Isidro", descripcion: "Hospital municipal gratuito en San Isidro.", url: "https://www.sanisidro.gob.ar/salud", telefono: "4512-3800", accion: "Ver turnos", local: true },
    { nombre: "CAPS San Isidro", descripcion: "Centros de atencion primaria en el municipio.", url: "https://www.sanisidro.gob.ar/salud/caps", accion: "Encontrar el mas cercano", local: true },
  ],
  educacion: [
    { nombre: "Formacion Profesional San Isidro", descripcion: "Cursos y talleres municipales gratuitos.", url: "https://www.sanisidro.gob.ar/educacion", accion: "Ver oferta educativa", local: true },
  ],
  vivienda: [
    { nombre: "Servicios Sociales San Isidro", descripcion: "Asistencia habitacional y social del municipio.", url: "https://www.sanisidro.gob.ar/social", telefono: "4512-3000", accion: "Pedir atencion", local: true },
  ],
  ingresos: [],
  red: [
    { nombre: "Centros Culturales San Isidro", descripcion: "Actividades culturales y comunitarias gratuitas.", url: "https://www.sanisidro.gob.ar/cultura", accion: "Ver actividades", local: true },
    { nombre: "Direccion de Genero SI", descripcion: "Asistencia en situaciones de violencia de genero.", url: "https://www.sanisidro.gob.ar/genero", telefono: "4512-3000", accion: "Pedir asistencia", local: true },
  ],
};

// ─── Mapa de barrios a municipio ──────────────────────────────────────────────
const BARRIO_A_MUNICIPIO: Record<string, string> = {
  // Vicente López
  "Florida": "vicente_lopez",
  "Florida Oeste": "vicente_lopez",
  "La Lucila": "vicente_lopez",
  "Munro": "vicente_lopez",
  "Olivos": "vicente_lopez",
  "Vicente López": "vicente_lopez",
  "Villa Martelli": "vicente_lopez",
  // San Isidro
  "Béccar": "san_isidro",
  "Boulogne": "san_isidro",
  "Martínez": "san_isidro",
  "San Isidro": "san_isidro",
  "Villa Adelina": "san_isidro",
};

const RECURSOS_POR_MUNICIPIO: Record<string, RecursosPorDimension> = {
  vicente_lopez: RECURSOS_VICENTE_LOPEZ,
  san_isidro: RECURSOS_SAN_ISIDRO,
};

// ─── Función principal ────────────────────────────────────────────────────────
export function getRecursosPorBarrio(barrio: string, dimensionId: string): Recurso[] {
  const municipio = BARRIO_A_MUNICIPIO[barrio];
  const recursosLocales = municipio ? (RECURSOS_POR_MUNICIPIO[municipio]?.[dimensionId] || []) : [];
  const recursosBase = RECURSOS_BASE[dimensionId] || [];
  
  // Locales primero, después los nacionales
  return [...recursosLocales, ...recursosBase].slice(0, 3);
}

export function getMunicipioDeBarrio(barrio: string): string | null {
  const municipio = BARRIO_A_MUNICIPIO[barrio];
  if (!municipio) return null;
  const nombres: Record<string, string> = {
    vicente_lopez: "Vicente López",
    san_isidro: "San Isidro",
  };
  return nombres[municipio] || null;
}
