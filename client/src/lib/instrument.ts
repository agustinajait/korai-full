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
    // SALUD (8)
    { id: "salud_01", dimension: "salud", label: "Nos alimentamos bien todos los días" },
    { id: "salud_02", dimension: "salud", label: "Tenemos acceso rápido a atención médica" },
    { id: "salud_03", dimension: "salud", label: "Contamos con medicamentos cuando los necesitamos" },
    { id: "salud_04", dimension: "salud", label: "Realizamos controles preventivos anuales" },
    { id: "salud_05", dimension: "salud", label: "Tenemos acceso a salud mental/apoyo psicológico" },
    { id: "salud_06", dimension: "salud", label: "Contamos con vacunación al día" },
    { id: "salud_07", dimension: "salud", label: "No hay contaminación ambiental cerca de casa" },
    { id: "salud_08", dimension: "salud", label: "Tenemos espacios verdes para actividad física" },
    
    // EDUCACION (8)
    { id: "educacion_01", dimension: "educacion", label: "Los niños/jóvenes asisten a la escuela regularmente" },
    { id: "educacion_02", dimension: "educacion", label: "Tenemos acceso a internet para estudiar/aprender" },
    { id: "educacion_03", dimension: "educacion", label: "Los adultos tienen primaria/secundaria completa" },
    { id: "educacion_04", dimension: "educacion", label: "Contamos con lugar tranquilo para estudiar" },
    { id: "educacion_05", dimension: "educacion", label: "Accedemos a libros y material educativo" },
    { id: "educacion_06", dimension: "educacion", label: "Hay jardines de infantes cerca de casa" },
    { id: "educacion_07", dimension: "educacion", label: "Los jóvenes tienen acceso a formación técnica/universitaria" },
    { id: "educacion_08", dimension: "educacion", label: "Participamos en talleres o cursos de oficio" },

    // TRABAJO (8)
    { id: "trabajo_01", dimension: "trabajo", label: "Tenemos ingresos estables mes a mes" },
    { id: "trabajo_02", dimension: "trabajo", label: "Trabajamos en condiciones seguras y dignas" },
    { id: "trabajo_03", dimension: "trabajo", label: "El ingreso nos alcanza para cubrir gastos básicos" },
    { id: "trabajo_04", dimension: "trabajo", label: "Tenemos aportes jubilatorios y obra social" },
    { id: "trabajo_05", dimension: "trabajo", label: "El tiempo de viaje al trabajo es razonable" },
    { id: "trabajo_06", dimension: "trabajo", label: "No sufrimos discriminación en el ámbito laboral" },
    { id: "trabajo_07", dimension: "trabajo", label: "Tenemos herramientas necesarias para trabajar" },
    { id: "trabajo_08", dimension: "trabajo", label: "Accedemos a capacitaciones para mejorar el empleo" },

    // VIVIENDA (8)
    { id: "vivienda_01", dimension: "vivienda", label: "Nuestra casa es segura (techos, paredes)" },
    { id: "vivienda_02", dimension: "vivienda", label: "Tenemos agua potable y saneamiento" },
    { id: "vivienda_03", dimension: "vivienda", label: "Nos sentimos seguros en nuestro barrio" },
    { id: "vivienda_04", dimension: "vivienda", label: "Contamos con recolección de residuos regular" },
    { id: "vivienda_05", dimension: "vivienda", label: "Hay iluminación pública en nuestra calle" },
    { id: "vivienda_06", dimension: "vivienda", label: "La vivienda tiene ventilación y luz natural" },
    { id: "vivienda_07", dimension: "vivienda", label: "No hay hacinamiento (suficientes cuartos)" },
    { id: "vivienda_08", dimension: "vivienda", label: "Tenemos acceso a gas de red o seguro" },

    // PREVISION (8)
    { id: "prevision_01", dimension: "prevision", label: "Podemos afrontar un gasto inesperado" },
    { id: "prevision_02", dimension: "prevision", label: "Tenemos ahorros para el futuro" },
    { id: "prevision_03", dimension: "prevision", label: "Contamos con seguros de vida o accidentes" },
    { id: "prevision_04", dimension: "prevision", label: "Podemos planificar gastos a 6 meses" },
    { id: "prevision_05", dimension: "prevision", label: "No tenemos deudas que no podamos pagar" },
    { id: "prevision_06", dimension: "prevision", label: "Contamos con apoyo familiar ante crisis" },
    { id: "prevision_07", dimension: "prevision", label: "Tenemos conocimiento de educación financiera" },
    { id: "prevision_08", dimension: "prevision", label: "Nuestros bienes están protegidos" },

    // CULTURA (8)
    { id: "cultura_01", dimension: "cultura", label: "Participamos en actividades del barrio" },
    { id: "cultura_02", dimension: "cultura", label: "Tenemos momentos de descanso y recreación" },
    { id: "cultura_03", dimension: "cultura", label: "Accedemos a centros culturales o bibliotecas" },
    { id: "cultura_04", dimension: "cultura", label: "Nos sentimos parte de la identidad local" },
    { id: "cultura_05", dimension: "cultura", label: "Hay respeto por la diversidad cultural" },
    { id: "cultura_06", dimension: "cultura", label: "Podemos practicar deportes gratuitamente" },
    { id: "cultura_07", dimension: "cultura", label: "Hay oferta de eventos culturales en la zona" },
    { id: "cultura_08", dimension: "cultura", label: "Contamos con redes de apoyo vecinal" }
  ] as Indicator[]
};

export const CITIES = ["Berazategui", "Quilmes", "Florencio Varela", "Ezpeleta", "Bernal", "Avellaneda"];

export const CHOICE_COLORS = {
  rojo: "hsl(0, 84%, 60%)",
  amarillo: "hsl(38, 92%, 50%)",
  verde: "hsl(142, 71%, 45%)"
};
