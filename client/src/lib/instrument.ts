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
  invert?: boolean;
}

export const INSTRUMENT = {
  dimensions: [
    { id: "empleo",    name: "Empleo",          emoji: "💼", description: "Trabajo, ingresos y condiciones laborales" },
    { id: "educacion", name: "Educación",        emoji: "📚", description: "Trayectoria educativa y formación" },
    { id: "salud",     name: "Salud",            emoji: "🩺", description: "Bienestar físico y acceso a servicios" },
    { id: "vivienda",  name: "Vivienda",         emoji: "🏠", description: "Situación habitacional y servicios básicos" },
    { id: "ingresos",  name: "Ingresos",         emoji: "🧾", description: "Situación económica y programas de apoyo" },
    { id: "red",       name: "Red / Vínculos",   emoji: "🤝", description: "Redes de apoyo y participación comunitaria" },
  ] as Dimension[],

  indicators: [
    // EMPLEO (8)
    { id: "empleo_01", dimension: "empleo", label: "Tengo ingresos estables mes a mes" },
    { id: "empleo_02", dimension: "empleo", label: "Trabajo en condiciones seguras y dignas" },
    { id: "empleo_03", dimension: "empleo", label: "Mi ingreso me alcanza para cubrir los gastos básicos" },
    { id: "empleo_04", dimension: "empleo", label: "Tengo aportes jubilatorios y obra social" },
    { id: "empleo_05", dimension: "empleo", label: "El tiempo que tardo en llegar al trabajo es razonable" },
    { id: "empleo_06", dimension: "empleo", label: "No sufro discriminación en el ámbito laboral" },
    { id: "empleo_07", dimension: "empleo", label: "Tengo las herramientas necesarias para trabajar" },
    { id: "empleo_08", dimension: "empleo", label: "Accedo a capacitaciones para mejorar mi empleo" },

    // EDUCACION (8)
    { id: "educacion_01", dimension: "educacion", label: "Completé el secundario" },
    { id: "educacion_02", dimension: "educacion", label: "Tengo acceso a internet para estudiar o capacitarme" },
    { id: "educacion_03", dimension: "educacion", label: "Los chicos de mi casa asisten a la escuela regularmente" },
    { id: "educacion_04", dimension: "educacion", label: "Cuento con un lugar tranquilo para estudiar en casa" },
    { id: "educacion_05", dimension: "educacion", label: "Tengo acceso a libros y material educativo" },
    { id: "educacion_06", dimension: "educacion", label: "Me interesa capacitarme en algún oficio o actividad" },
    { id: "educacion_07", dimension: "educacion", label: "Tengo disponibilidad para estudiar o capacitarme" },
    { id: "educacion_08", dimension: "educacion", label: "Participo o me interesa participar en talleres o cursos" },

    // SALUD (8)
    { id: "salud_01", dimension: "salud", label: "Me alimento bien todos los días" },
    { id: "salud_02", dimension: "salud", label: "Tengo acceso rápido a atención médica cuando la necesito" },
    { id: "salud_03", dimension: "salud", label: "Cuento con los medicamentos que necesito" },
    { id: "salud_04", dimension: "salud", label: "Realizo controles preventivos de salud" },
    { id: "salud_05", dimension: "salud", label: "Tengo acceso a apoyo en salud mental si lo necesito" },
    { id: "salud_06", dimension: "salud", label: "Tengo mis vacunas al día" },
    { id: "salud_07", dimension: "salud", label: "Tengo cobertura médica (obra social, PAMI u otra)" },
    { id: "salud_08", dimension: "salud", label: "Puedo acercarme a un centro de salud si lo necesito" },

    // VIVIENDA (8)
    { id: "vivienda_01", dimension: "vivienda", label: "Mi casa es segura (techo, paredes, piso)" },
    { id: "vivienda_02", dimension: "vivienda", label: "Tengo agua potable y saneamiento en mi hogar" },
    { id: "vivienda_03", dimension: "vivienda", label: "Me siento seguro/a en mi barrio" },
    { id: "vivienda_04", dimension: "vivienda", label: "Tengo acceso regular a recolección de residuos" },
    { id: "vivienda_05", dimension: "vivienda", label: "Hay iluminación pública en mi calle" },
    { id: "vivienda_06", dimension: "vivienda", label: "Mi vivienda tiene buena ventilación y luz natural" },
    { id: "vivienda_07", dimension: "vivienda", label: "No hay hacinamiento en mi hogar" },
    { id: "vivienda_08", dimension: "vivienda", label: "No estoy en riesgo de perder mi vivienda" },

    // INGRESOS (8)
    { id: "ingresos_01", dimension: "ingresos", label: "Tengo ingresos actualmente" },
    { id: "ingresos_02", dimension: "ingresos", label: "Mis ingresos son estables" },
    { id: "ingresos_03", dimension: "ingresos", label: "Recibo algún programa o ayuda del Estado" },
    { id: "ingresos_04", dimension: "ingresos", label: "Mis ingresos alcanzan para cubrir los gastos básicos" },
    { id: "ingresos_05", dimension: "ingresos", label: "Puedo afrontar un gasto inesperado" },
    { id: "ingresos_06", dimension: "ingresos", label: "Puedo planificar mis gastos con anticipación" },
    { id: "ingresos_07", dimension: "ingresos", label: "No tengo deudas que no pueda pagar" },
    { id: "ingresos_08", dimension: "ingresos", label: "Cuento con apoyo familiar ante una crisis económica" },

    // RED / VINCULOS (8)
    { id: "red_01", dimension: "red", label: "Tengo alguien que puede ayudarme en una urgencia" },
    { id: "red_02", dimension: "red", label: "Tengo alguien que puede recomendarme para un trabajo" },
    { id: "red_03", dimension: "red", label: "Participo en algún espacio comunitario o grupal" },
    { id: "red_04", dimension: "red", label: "Me siento parte de mi barrio o comunidad" },
    { id: "red_05", dimension: "red", label: "Tengo personas de confianza con quienes hablar" },
    { id: "red_06", dimension: "red", label: "Hay respeto y convivencia sana en mi entorno" },
    { id: "red_07", dimension: "red", label: "Accedo a actividades recreativas o culturales cerca" },
    { id: "red_08", dimension: "red", label: "Me siento contenido/a por mi red de vínculos" },
  ] as Indicator[]
};

export const CITIES = [
  // GBA Sur
  "Berazategui", "Quilmes", "Florencio Varela", "Ezpeleta", "Bernal", "Avellaneda",
  "Lanús", "Lomas de Zamora", "Banfield", "Temperley", "Adrogué", "Monte Grande",
  // GBA Norte
  "San Isidro", "San Fernando", "Tigre", "Vicente López", "Olivos", "Martínez",
  // GBA Oeste
  "Morón", "Ituzaingó", "Castelar", "Merlo", "Moreno", "La Matanza", "Ramos Mejía",
  // CABA
  "Palermo", "Flores", "Caballito", "Villa Lugano", "Barracas", "La Boca", "Balvanera",
  "Villa Soldati", "Mataderos", "Liniers", "Parque Patricios", "Nueva Pompeya",
  // Interior
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
