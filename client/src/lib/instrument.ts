// Hardcoded instrument definition for the frontend logic
// This ensures instant navigation and UI rendering without waiting for API calls

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
  invert?: boolean; // if true, green/red logic is swapped (e.g. "Do you have debt?")
}

export const INSTRUMENT = {
  dimensions: [
    { id: "salud", name: "Salud", emoji: "🩺", description: "Bienestar físico y acceso a servicios" },
    { id: "educacion", name: "Educación", "emoji": "📚", description: "Acceso al conocimiento y formación" },
    { id: "trabajo", name: "Trabajo", "emoji": "💼", description: "Empleo, ingresos y seguridad social" },
    { id: "vivienda", name: "Vivienda", "emoji": "🏠", description: "Calidad del hogar y servicios básicos" },
    { id: "prevision", name: "Previsión", "emoji": "🧾", description: "Capacidad de ahorro y futuro" },
    { id: "cultura", name: "Cultura", "emoji": "🤝", description: "Vida social y recreación" }
  ] as Dimension[],
  
  indicators: [
    // SALUD
    { id: "salud_01", dimension: "salud", label: "Nos alimentamos bien todos los días" },
    { id: "salud_02", dimension: "salud", label: "Tenemos acceso rápido a atención médica" },
    { id: "salud_03", dimension: "salud", label: "Contamos con medicamentos cuando los necesitamos" },
    
    // EDUCACION
    { id: "educacion_01", dimension: "educacion", label: "Los niños/jóvenes asisten a la escuela regularmente" },
    { id: "educacion_02", dimension: "educacion", label: "Tenemos acceso a internet para estudiar/aprender" },
    { id: "educacion_03", dimension: "educacion", label: "Los adultos tienen primaria/secundaria completa" },

    // TRABAJO
    { id: "trabajo_01", dimension: "trabajo", label: "Tenemos ingresos estables mes a mes" },
    { id: "trabajo_02", dimension: "trabajo", label: "Trabajamos en condiciones seguras y dignas" },
    { id: "trabajo_03", dimension: "trabajo", label: "El ingreso nos alcanza para cubrir gastos básicos" },

    // VIVIENDA
    { id: "vivienda_01", dimension: "vivienda", label: "Nuestra casa es segura (techos, paredes)" },
    { id: "vivienda_02", dimension: "vivienda", label: "Tenemos agua potable y saneamiento" },
    { id: "vivienda_03", dimension: "vivienda", label: "Nos sentimos seguros en nuestro barrio" },

    // PREVISION
    { id: "prevision_01", dimension: "prevision", label: "Podemos afrontar un gasto inesperado" },
    { id: "prevision_02", dimension: "prevision", label: "Tenemos ahorros para el futuro" },

    // CULTURA
    { id: "cultura_01", dimension: "cultura", label: "Participamos en actividades del barrio" },
    { id: "cultura_02", dimension: "cultura", label: "Tenemos momentos de descanso y recreación" }
  ] as Indicator[]
};

export const CITIES = ["Berazategui", "Quilmes", "Florencio Varela", "Ezpeleta", "Bernal"];

export const CHOICE_COLORS = {
  rojo: "hsl(0, 84%, 60%)",
  amarillo: "hsl(38, 92%, 50%)",
  verde: "hsl(142, 71%, 45%)"
};
