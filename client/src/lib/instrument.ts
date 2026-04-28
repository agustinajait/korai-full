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
    { id: "empleo_01", dimension: "empleo", label: "Mi trabajo es estable y puedo contar con él", soloSi: "tengo_trabajo" },
    { id: "empleo_02", dimension: "empleo", label: "Trabajo en condiciones seguras y dignas", soloSi: "tengo_trabajo" },
    { id: "empleo_03", dimension: "empleo", label: "Tengo aportes, obra social o alguna cobertura por mi trabajo", soloSi: "tengo_trabajo" },
    { id: "empleo_04", dimension: "empleo", label: "Lo que gano me alcanza para cubrir lo básico del mes", soloSi: "tengo_trabajo" },
    // Si NO tiene trabajo (4 preguntas)
    { id: "empleo_05", dimension: "empleo", label: "Tengo alguna entrada de dinero, aunque sea irregular", soloSi: "no_tengo_trabajo" },
    { id: "empleo_06", dimension: "empleo", label: "Estoy buscando trabajo o changas activamente", soloSi: "no_tengo_trabajo" },
    { id: "empleo_07", dimension: "empleo", label: "Tengo un oficio, habilidad o experiencia que puedo convertir en trabajo", soloSi: "no_tengo_trabajo" },
    { id: "empleo_08", dimension: "empleo", label: "Puedo empezar a trabajar si surge una oportunidad", soloSi: "no_tengo_trabajo" },

    // ─── PREVISIÓN ─────────────────────────────────────────────────────────────
    { id: "prevision_01", dimension: "prevision", label: "Podría afrontar un gasto inesperado sin caer en deuda" },
    { id: "prevision_02", dimension: "prevision", label: "Puedo organizarme para saber en qué se va la plata cada mes" },
    { id: "prevision_03", dimension: "prevision", label: "Puedo manejar mis deudas o directamente no tengo deudas" },
    { id: "prevision_04", dimension: "prevision", label: "Tengo DNI, cuenta bancaria o billetera virtual para cobrar y hacer trámites" },
    { id: "prevision_05", dimension: "prevision", label: "En mi hogar puedo tomar decisiones sin violencia ni control económico" },
    { id: "prevision_06", dimension: "prevision", label: "Puedo pagar o sostener los gastos fijos del hogar (alquiler, servicios, transporte)" },

    // ─── VIVIENDA ─────────────────────────────────────────────────────────────
    { id: "vivienda_01", dimension: "vivienda", label: "Mi vivienda me protege del frío, calor, lluvia y humedad" },
    { id: "vivienda_02", dimension: "vivienda", label: "Tengo agua potable en mi vivienda" },
    { id: "vivienda_03", dimension: "vivienda", label: "Tengo conexión eléctrica segura y estable" },
    { id: "vivienda_04", dimension: "vivienda", label: "En mi hogar hay espacio para dormir y convivir sin hacinamiento" },
    { id: "vivienda_05", dimension: "vivienda", label: "Me siento seguro/a en mi barrio, especialmente de noche" },
    { id: "vivienda_06", dimension: "vivienda", label: "Tengo heladera u elementos básicos para conservar comida" },
    { id: "vivienda_07", dimension: "vivienda", label: "Tengo teléfono, datos o internet para comunicarme y hacer trámites" },
    { id: "vivienda_08", dimension: "vivienda", label: "Tengo privacidad y espacio propio en mi vivienda" },

    // ─── SALUD ────────────────────────────────────────────────────────────────
    { id: "salud_01", dimension: "salud", label: "Puedo alimentarme bien todos los días, no solo lo que se puede" },
    { id: "salud_02", dimension: "salud", label: "Cuando me enfermo puedo atenderme sin grandes trabas" },
    { id: "salud_03", dimension: "salud", label: "Puedo conseguir los medicamentos que necesito" },
    { id: "salud_04", dimension: "salud", label: "Estoy atendiendo mi salud sin cosas pendientes que tenga que postergar" },
    { id: "salud_05", dimension: "salud", label: "Mis dientes no me generan problemas para comer, hablar o trabajar" },
    { id: "salud_06", dimension: "salud", label: "Tengo la vista sana o con el control/anteojos que necesito" },
    { id: "salud_07", dimension: "salud", label: "Puedo cuidar mi higiene personal y la de mi hogar" },
    { id: "salud_08", dimension: "salud", label: "Si tengo niños a cargo, tienen vacunas y controles al día" },

    // ─── EDUCACIÓN ────────────────────────────────────────────────────────────
    { id: "educacion_01", dimension: "educacion", label: "Puedo leer, escribir y manejarme con trámites y mensajes importantes" },
    { id: "educacion_02", dimension: "educacion", label: "Manejo WhatsApp, mail, formularios u otras herramientas digitales básicas" },
    { id: "educacion_03", dimension: "educacion", label: "Tengo conocimientos o habilidades que hoy me ayudan a conseguir oportunidades" },
    { id: "educacion_04", dimension: "educacion", label: "Si hay chicos en el hogar, pueden sostener la escuela todos los días" },
    { id: "educacion_05", dimension: "educacion", label: "Tengo cerca una escuela, curso o centro de formación accesible" },
    { id: "educacion_06", dimension: "educacion", label: "Podría capacitarme o terminar estudios si tuviera la oportunidad" },
    { id: "educacion_07", dimension: "educacion", label: "Tengo celular, datos o internet para estudiar o capacitarme" },
    { id: "educacion_08", dimension: "educacion", label: "Me llega información sobre programas, cursos o actividades disponibles cerca" },

    // ─── RED / VÍNCULOS ───────────────────────────────────────────────────────
    { id: "red_01", dimension: "red", label: "Tengo alguien a quien recurrir si necesito ayuda urgente" },
    { id: "red_02", dimension: "red", label: "Tengo alguien que podría recomendarme o ayudarme a conseguir trabajo" },
    { id: "red_03", dimension: "red", label: "Me siento respetado/a en mi entorno, sin discriminación" },
    { id: "red_04", dimension: "red", label: "Siento que puedo tomar decisiones importantes sobre mi vida y mi futuro" },
    { id: "red_05", dimension: "red", label: "Participo o me gustaría participar en algún espacio comunitario" },
    { id: "red_06", dimension: "red", label: "Tengo algún momento de disfrute o actividad que me ayuda a sostenerme" },
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
