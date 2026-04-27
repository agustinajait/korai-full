export type IndicatorId = string;
export type DimensionId = string;

export interface Dimension {
  id: DimensionId;
  name: string;
  emoji: string;
  description?: string;
}

export interface Indicator {
  id: IndicatorId;
  dimension: DimensionId;
  label: string;
  invert?: boolean;
  // Si está definido, solo se muestra cuando situacion_laboral coincide
  soloSi?: "tengo_trabajo" | "no_tengo_trabajo";
}

export const INSTRUMENT = {
  dimensions: [
    { id: "empleo",    name: "Empleo",        emoji: "💼", description: "Trabajo y condiciones laborales" },
    { id: "prevision", name: "Previsión",      emoji: "🧾", description: "Situación económica y respaldo financiero" },
    { id: "vivienda",  name: "Vivienda",       emoji: "🏠", description: "Situación habitacional y servicios básicos" },
    { id: "salud",     name: "Salud",          emoji: "🩺", description: "Bienestar físico y acceso a servicios" },
    { id: "educacion", name: "Educación",      emoji: "📚", description: "Trayectoria educativa y formación" },
    { id: "red",       name: "Red / Vínculos", emoji: "🤝", description: "Redes de apoyo y participación comunitaria" },
  ] as Dimension[],

  indicators: [
    // ─── EMPLEO — condicional por situación laboral ───────────────────────────
    // Si TIENE trabajo (4 preguntas)
    { id: "empleo_01", dimension: "empleo", label: "Mi trabajo es estable",                          soloSi: "tengo_trabajo" },
    { id: "empleo_02", dimension: "empleo", label: "Trabajo en condiciones seguras y dignas",         soloSi: "tengo_trabajo" },
    { id: "empleo_03", dimension: "empleo", label: "Tengo aportes o estoy en blanco",                soloSi: "tengo_trabajo" },
    { id: "empleo_04", dimension: "empleo", label: "Mi ingreso me alcanza para cubrir lo básico",     soloSi: "tengo_trabajo" },
    // Si NO tiene trabajo (4 preguntas)
    { id: "empleo_05", dimension: "empleo", label: "Tengo alguna fuente de ingresos actualmente",    soloSi: "no_tengo_trabajo" },
    { id: "empleo_06", dimension: "empleo", label: "Estoy buscando trabajo activamente",             soloSi: "no_tengo_trabajo" },
    { id: "empleo_07", dimension: "empleo", label: "Tengo experiencia laboral previa",               soloSi: "no_tengo_trabajo" },
    { id: "empleo_08", dimension: "empleo", label: "Estoy disponible para empezar a trabajar",       soloSi: "no_tengo_trabajo" },

    // ─── PREVISIÓN (antes "ingresos" — ahora separado de empleo) ─────────────
    { id: "prevision_01", dimension: "prevision", label: "Puedo afrontar un gasto inesperado" },
    { id: "prevision_02", dimension: "prevision", label: "Puedo organizar mis gastos mes a mes" },
    { id: "prevision_03", dimension: "prevision", label: "Tengo deudas que no puedo pagar", invert: true },
    { id: "prevision_04", dimension: "prevision", label: "Tengo algún respaldo económico (ahorro, ayuda, etc.)" },

    // ─── VIVIENDA ─────────────────────────────────────────────────────────────
    { id: "vivienda_01", dimension: "vivienda", label: "Mi vivienda es segura (estructura)" },
    { id: "vivienda_02", dimension: "vivienda", label: "Tengo acceso a agua potable y saneamiento" },
    { id: "vivienda_03", dimension: "vivienda", label: "En mi hogar no hay hacinamiento" },
    { id: "vivienda_04", dimension: "vivienda", label: "Tengo dificultades para mantener mi vivienda", invert: true },

    // ─── SALUD ────────────────────────────────────────────────────────────────
    { id: "salud_01", dimension: "salud", label: "Tengo acceso a atención médica" },
    { id: "salud_02", dimension: "salud", label: "Puedo conseguir medicamentos cuando los necesito" },
    { id: "salud_03", dimension: "salud", label: "Tengo cobertura médica" },
    { id: "salud_04", dimension: "salud", label: "Tengo problemas de salud sin tratar", invert: true },
    { id: "salud_05", dimension: "salud", label: "Tengo problemas dentales que me dificultan comer o hablar", invert: true },

    // ─── EDUCACIÓN ────────────────────────────────────────────────────────────
    { id: "educacion_01", dimension: "educacion", label: "Completé el secundario" },
    { id: "educacion_02", dimension: "educacion", label: "Tengo acceso a internet" },
    { id: "educacion_03", dimension: "educacion", label: "Tengo tiempo para capacitarme" },
    { id: "educacion_04", dimension: "educacion", label: "Me interesa capacitarme" },

    // ─── RED / VÍNCULOS ───────────────────────────────────────────────────────
    { id: "red_01", dimension: "red", label: "Tengo alguien que me ayude en una urgencia" },
    { id: "red_02", dimension: "red", label: "Tengo alguien que me ayude a conseguir trabajo" },
    { id: "red_03", dimension: "red", label: "Me siento acompañado/a" },
    { id: "red_04", dimension: "red", label: "Participo en espacios comunitarios" },
  ] as Indicator[]
};

export function getActiveIndicatorsSafe(situacionLaboral?: string): typeof INSTRUMENT.indicators {
  const tieneTabajo = situacionLaboral === "tengo_trabajo";
  return INSTRUMENT.indicators.filter(ind => {
    if (!ind.soloSi) return true;
    if (ind.soloSi === "tengo_trabajo") return tieneTabajo;
    if (ind.soloSi === "no_tengo_trabajo") return !tieneTabajo;
    return true;
  });
}

export const CITIES = [
  "Berazategui", "Quilmes", "Florencio Varela", "Ezpeleta", "Bernal", "Avellaneda",
  "Lanús", "Lomas de Zamora", "Banfield", "Temperley", "Adrogué", "Monte Grande",
  "San Isidro", "San Fernando", "Tigre", "Vicente López", "Olivos", "Martínez",
  "Morón", "Ituzaingó", "Castelar", "Merlo", "Moreno", "La Matanza", "Ramos Mejía",
  "Palermo", "Flores", "Caballito", "Villa Lugano", "Barracas", "La Boca", "Balvanera",
  "Villa Soldati", "Mataderos", "Liniers", "Parque Patricios", "Nueva Pompeya",
  "Córdoba Capital", "Rosario", "Mendoza Capital", "Tucumán Capital", "Mar del Plata",
  "La Plata", "Bahía Blanca", "Salta Capital", "Resistencia", "Posadas",
];

export const BARRIOS_CABA = [
  "Palermo", "Flores", "Caballito", "Villa Lugano", "Barracas", "La Boca",
  "Balvanera", "Villa Soldati", "Mataderos", "Liniers", "Parque Patricios",
  "Nueva Pompeya", "Villa Urquiza", "Saavedra", "Núñez", "Belgrano",
  "Coghlan", "Colegiales", "Chacarita", "Villa Crespo", "Almagro",
  "Boedo", "San Cristóbal", "Constitución", "San Telmo", "Monserrat",
  "Puerto Madero", "Retiro", "Recoleta", "Villa Pueyrredón", "Agronomía",
  "Versalles", "Villa Real", "Monte Castro", "Floresta", "Vélez Sársfield",
  "Villa Devoto", "Villa del Parque", "Villa Santa Rita", "Villa Gral. Mitre",
];

export const CHOICE_COLORS = {
  rojo: "hsl(0, 84%, 60%)",
  amarillo: "hsl(38, 92%, 50%)",
  verde: "hsl(142, 71%, 45%)"
};
