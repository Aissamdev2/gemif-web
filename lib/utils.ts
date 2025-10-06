import { ErrorCode, SimplePrim } from "@/app/lib/definitions";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { AppError } from "./errors/types";
import { redirect } from "next/navigation";
import { year } from "drizzle-orm/mysql-core";
import { PgTableWithColumns } from "drizzle-orm/pg-core";

export const PREDEFINED_COLORS = [
  { name: "Red", hex: "#EF4444" },         // Tailwind Red 500
  { name: "Orange", hex: "#F97316" },      // Orange 500
  { name: "Amber", hex: "#F59E0B" },       // Amber 500
  { name: "Yellow", hex: "#EAB308" },      // Yellow 500
  { name: "Lime", hex: "#84CC16" },        // Lime 500
  { name: "Green", hex: "#22C55E" },       // Green 500
  { name: "Emerald", hex: "#10B981" },     // Emerald 500
  { name: "Teal", hex: "#14B8A6" },        // Teal 500
  { name: "Cyan", hex: "#06B6D4" },        // Cyan 500
  { name: "Sky", hex: "#0EA5E9" },         // Sky 500
  { name: "Blue", hex: "#3B82F6" },        // Blue 500
  { name: "Indigo", hex: "#6366F1" },      // Indigo 500
  { name: "Violet", hex: "#8B5CF6" },      // Violet 500
  { name: "Purple", hex: "#A855F7" },      // Purple 500
  { name: "Fuchsia", hex: "#D946EF" },     // Fuchsia 500
  { name: "Pink", hex: "#EC4899" },        // Pink 500
  { name: "Rose", hex: "#F43F5E" },        // Rose 500
  { name: "Gray", hex: "#6B7280" },        // Gray 500
  { name: "Slate", hex: "#64748B" },       // Slate 500
  { name: "Neutral", hex: "#737373" },     // Neutral 500
];


export const SBJ_FINAL = [
  // {name: 'Otro', color: '#734d1d', bgcolor: '#fff4e9', bordercolor: '#cba152', id: '00000000'},
  // Year 1, Quadri 1
  {professors: ['Hebert Pérez Rosés', 'Carlos García Gómez'], emails: ['hebert.perez@urv.cat', 'carlos.garciag@urv.cat'], credits: 7.5, name: 'Álgebra Lineal', color: '#ff0000', bgcolor: '#fef2f2', bordercolor: '#f87171', year: 1, quadri: 1, id: '17274001' },
  {professors: ['Alejandro Arenas Moreno', 'Sergio Gómez Jiménez'], emails: ['alexandre.arenas@urv.cat', 'sergio.gomez@urv.cat'], credits: 7.5, name: 'Análisis Matemático I', color: '#4f46e5', bgcolor: '#eef2ff', bordercolor: '#818cf8', year: 1, quadri: 1, id: '17274002' },
  {professors: ['Francisco Manuel Díaz González', 'Josefa Gavaldà Martínez', 'Rosa Maria Solé Cartaña', 'Jaime Masons Bosch'], emails: ['f.diaz@urv.cat', 'fina.gavalda@urv.cat', 'rosam.sole@urv.cat', 'jaume.masons@urv.cat'], credits: 9, name: 'Física I', color: '#059669', bgcolor: '#ecfdf5', bordercolor: '#34d399', year: 1, quadri: 1, id: '17274003' },
  {professors: ['Clara Granell Martorell'], emails: ['clara.granell@urv.cat'], credits: 6, name: 'Programación Científica', color: '#374151', bgcolor: '#f3f4f6', bordercolor: '#9ca3af', year: 1, quadri: 1, id: '17274004' },
  {professors: ['Alejandro Arenas Moreno', 'Sergio Gómez Jiménez'], emails: ['alexandre.arenas@urv.cat', 'sergio.gomez@urv.cat'], credits: 7.5, name: 'Análisis Matemático II', color: '#4f46e5', bgcolor: '#eef2ff', bordercolor: '#818cf8', year: 1, quadri: 2, id: '17274005' },
  {professors: ['Carlos Barberà Escoí'], emails: ['carlos.barbera@urv.cat'], credits: 6, name: 'Ecuaciones Diferenciales I', color: '#d946ef', bgcolor: '#fdf4ff', bordercolor: '#e879f9', year: 1, quadri: 2, id: '17274006' },
  {professors: ['Roger Cabré Rodon', 'Benjamin Iñiguez Nicolau'], emails: ['roger.cabre@urv.cat', 'benjamin.iniguez@urv.cat'], credits: 9, name: 'Física II', color: '#059669', bgcolor: '#ecfdf5', bordercolor: '#34d399', year: 1, quadri: 2, id: '17274007' },
  {professors: ['Juan Alberto Rodríguez Velázquez'], emails: ['juanalberto.rodriguez@urv.cat'], credits: 7.5, name: 'Geometría', color: '#ff0000', bgcolor: '#fef2f2', bordercolor: '#f87171', year: 1, quadri: 2, id: '17274008' },
  {professors: ['Hebert Pérez Rosés'], emails: ['hebert.perez@urv.cat'], credits: 6, name: 'Combinatoria y Probabilidad', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: 2, quadri: 1, id: '17274102' },
  {professors: ['Xavier Rivas Guijarro'], emails: ['xavier.rivas@urv.cat'], credits: 6, name: 'Computación algebraica', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: 2, quadri: 1, id: '17274103' },
  {professors: ['Josep Maria López Besora', 'Gerard Fortuny Anguera'], emails: ['josep.m.lopez@urv.cat', 'gerard.fortuny@urv.cat'], credits: 6, name: 'Ecuaciones Diferenciales II', color: '#961299', bgcolor: '#fbc7fc', bordercolor: '#c131c4', year: 2, quadri: 1, id: '17274105' },
  {professors: ['Roger Cabré Rodon', 'Benjamin Iñiguez Nicolau'], emails: ['roger.cabre@urv.cat', 'benjamin.iniguez@urv.cat'], credits: 6, name: 'Electromagnetismo', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: 2, quadri: 1, id: '17274104' },
  {professors: ['Roger Guimera Manrique'], emails: ['roger.guimera@urv.cat'], credits: 6, name: 'Mecánica Clásica', color: '#910f2d', bgcolor: '#fccad6', bordercolor: '#c72c50', year: 2, quadri: 1, id: '17274106' },
  {professors: ['Carlos Barberà Escoí', 'Maria del Carme Olivé Farré'], emails: ['carlos.barbera@urv.cat', 'carme.olive@urv.cat'], credits: 6, name: 'Estadística', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: 2, quadri: 2, id: '17274107' },
  {professors: ['Cornelis de Graaf'], emails: ['coen.degraaf@urv.cat'], credits: 6, name: 'Física Cuántica', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: 2, quadri: 2, id: '17274108' },
  {professors: ['Carlos García Gómez'], emails: ['carlos.garciag@urv.cat'], credits: 6, name: 'Métodos Numéricos', color: '#961299', bgcolor: '#fbc7fc', bordercolor: '#c131c4', year: 2, quadri: 2, id: '17274109' },
  {professors: ['Juan Alberto Rodríguez Velázquez','Alejandro Estrada Moreno'], emails: ['juanalberto.rodriguez@urv.cat', 'alejandro.estrada@urv.cat'], credits: 6, name: 'Teoría de Grafos', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: 2, quadri: 2, id: '17274111' },
  {professors: ['Joan Rosell Llompart'], emails: ['joan.rosell@urv.cat'], credits: 6, name: 'Termodinámica', color: '#910f2d', bgcolor: '#fccad6', bordercolor: '#c72c50', year: 2, quadri: 2, id: '17274112' },
  {professors: ['Antonio Garijo Real'], emails: ['antonio.garijo@urv.cat'], credits: 6, name: 'Análisis Complejo', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: 3, quadri: 1, id: '17274101' },
  {professors: ['Victor Llamas Martinez', 'Francisco Manuel Díaz González'], emails: ['victor.llamas@urv.cat', 'f.diaz@urv.cat'], credits: 6, name: 'Biofísica', color: '#910f2d', bgcolor: '#fccad6', bordercolor: '#c72c50', year: 3, quadri: 1, id: '17274113' },
  {professors: ['Clara Salueña Pérez'], emails: ['clara.saluena@urv.cat'], credits: 6, name: 'Física de Fluidos', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: 3, quadri: 1, id: '17274114' },
  {professors: ['Francisco Manuel Díaz González', 'Magdalena Aguiló Díaz', 'Josep Maria Serres Serres', 'Luca Guerrini'], emails: ['f.diaz@urv.cat', 'magdalena.aguilo@urv.cat', 'josepmaria.serres@urv.cat', 'luca.guerrini@urv.cat'], credits: 6, name: 'Física del Estado Sólido y Superfícies', color: '#961299', bgcolor: '#fbc7fc', bordercolor: '#c131c4', year: 3, quadri: 1, id: '17274115' },
  {professors: ['Alejandro Arenas Moreno', 'Marta Sales Pardo'], emails: ['alexandre.arenas@urv.cat', 'marta.sales@urv.cat'], credits: 6, name: 'Mecánica Estatística', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: 3, quadri: 1, id: '17274116' },
  {professors: ['Benjamin Iñiguez Nicolau'], emails: ['benjamin.iniguez@urv.cat'], credits: 6, name: 'Electrónica Física', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: 3, quadri: 2, id: '17274117' },
  {professors: ['Oriol Farràs Ventura', 'Xavier Rivas Guijarro'], emails: ['oriol.farras@urv.cat', 'xavier.rivas@urv.cat'], credits: 6, name: 'Estructuras Algebraicas', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: 3, quadri: 2, id: '17274118' },
  {professors: ['Blas Herrera Gómez'], emails: ['blas.herrera@urv.cat'], credits: 6, name: 'Geometría Diferencial y Aplicaciones', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: 3, quadri: 2, id: '17274119' },
  {professors: ['Antonio Garijo Real'], emails: ['antonio.garijo@urv.cat'], credits: 6, name: 'Sistemas Dinámicos', color: '#961299', bgcolor: '#fbc7fc', bordercolor: '#c131c4', year: 3, quadri: 2, id: '17274110' },
  {professors: ['Eduard Llobet Valero'], emails: ['eduard.llobet@urv.cat'], credits: 6, id: '17274120', name: 'Electrónica Aplicada', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: 4, quadri: 1 },
  {professors: ['Xavier Mateos Ferré', 'Nicolás Carlos Pazos Pérez'], emails: ['xavier.mateos@urv.cat', 'nicolas.pazos@urv.cat'], credits: 6, id: '17274121', name: 'Óptica y Fotónica', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: 4, quadri: 1 },
  {professors: ['Francisco Manuel Díaz González', 'Joan Ramon Alabart Córdoba', 'Roger Cabré Rodon', 'Carlos García Gómez', 'Juan Alberto Rodríguez Velázquez', 'Oriol Farràs Ventura'], emails: ['f.diaz@urv.cat', 'joanramon.alabart@urv.cat', 'roger.cabre@urv.cat', 'carlos.garciag@urv.cat', 'juanalberto.rodriguez@urv.cat', 'oriol.farras@urv.cat'], credits: 6, id: '17274122', name: 'Proyectos de Ingeniería', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: 4, quadri: 1 },
  {professors: ['María Montserrat García Famoso'], emails: ['montse.garcia@urv.cat'], credits: 12, id: '17274301', name: 'Trabajo de Fin de Grado', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: 4, quadri: 2 },
  {professors: ['Javier Borge Holthoefer'], emails: ['javier.borge@urv.cat'], credits: 6, id: '17274201', name: 'Algorítmica', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb', year: null, quadri: 1 },
  {professors: ['Carlos Aliagas Castell', 'Carlos María Molina Clemente'], emails: ['carles.aliagas@urv.cat', 'carlos.molina@urv.cat'], credits: 6, id: '17274203', name: 'Arquitectura de Computadores', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb', year: null, quadri: 1 },
  {professors: ['Juan Carlos Ronda Bargalló', 'Oscar Pamies Olle', 'Maria Cinta Pujol Baiges', 'Maria Angels Serra Albet', 'Xavier Mateos Ferré', 'Joan Josep Carvajal Martí', 'Álvaro Velasco Rubio'], emails: ['juancarlos.ronda@urv.cat', 'oscar.pamies@urv.cat', 'mariacinta.pujol@urv.cat', 'angels.serra@urv.cat', 'xavier.mateos@urv.cat', 'joanjosep.carvajal@urv.cat', 'alvaro.velasco@urv.cat'], credits: 6, id: '17274204', name: 'Ciencia de Materiales', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86', year: null, quadri: 1 },
  {professors: ['Alfonso José Romero Nevado', 'José Luis Ramírez Falo', 'Javier Vilanova Salas', 'Alexandra Blanch Fortuna'], emails: ['alfonsojose.romero@urv.cat', 'joseluis.ramirez@urv.cat', 'xavier.vilanova@urv.cat', 'alexandra.blanch@urv.cat'], credits: 6, id: '17274207', name: 'Electrónica Analógica', color: '#734b1d', bgcolor: '#fffae9', bordercolor: '#cb9762', year: null, quadri: 1 },
  {professors: [], emails: [], credits: 3, id: '17274221', name: 'Estudios en el Marco de Convenios de Movilidad I', color: '#73401d', bgcolor: '#ffece9', bordercolor: '#cb8052', year: null, quadri: 1 },
  {professors: ['Frances Xavier Farriol Roigés'], emails: ['xavier.farriol@urv.cat'], credits: 6, id: '17274209', name: 'Fenómenos de Transporte', color: '#73661d', bgcolor: '#fff8e9', bordercolor: '#cbab52', year: null, quadri: 1 },
  {professors: ['Ramon Leyva Grasa'], emails: ['ramon.leyva@urv.cat'], credits: 6, id: '17274213', name: 'Modelado de Sistemas y Control de Procesos', color: '#404d73', bgcolor: '#f0f4ff', bordercolor: '#7381cb', year: null, quadri: 1 },
  {professors: ['José Luis Santacruz Muñoz'], emails: ['joseluis.santacruz@urv.cat'], credits: 6, id: '17274212', name: 'Modelización y Visualización', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb', year: null, quadri: 1 },
  {professors: ['Maria Cinta Pujol Baiges', 'Joan Josep Carvajal Martí'], emails: ['mariacinta.pujol@urv.cat', 'joanjosep.carvajal@urv.cat'], credits: 3, id: '17274215', name: 'Nucleación y Crecimiento de Cristales', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86', year: null, quadri: 1 },
  {professors: ['Maria Cinta Pujol Baiges', 'Xavier Mateos Ferré', 'Joan Josep Carvajal Martí'], emails: ['mariacinta.pujol@urv.cat', 'xavier.mateos@urv.cat', 'joanjosep.carvajal@urv.cat'], credits: 3, id: '17274214', name: 'Nuevos Materiales y Nanociencia', color: '#733f1d', bgcolor: '#ffece9', bordercolor: '#cb7f52', year: null, quadri: 1 },
  {professors: ['Aïda Valls Mateu', 'Maria Ferré Bergadà', 'Neus Budesca Hernando', 'Esteban Herreros Suarez', 'Elena Mercedes Figueroa Cabrera'], emails: ['aida.valls@urv.cat', 'maria.ferre@urv.cat', 'neus.budesca@urv.cat', 'esteban.herreros@urv.cat', 'elenamercedes.figueroa@urv.cat'], credits: 6, id: '17274216', name: 'Programación', color: '#734d1d', bgcolor: '#fff4e9', bordercolor: '#cba152', year: null, quadri: 1 },
  {professors: ['Manuel Sanromà Lucia', 'Maria Dolores Puigjaner Riba'], emails: ['manuel.sanroma@urv.cat', 'dolors.puigjaner@urv.cat'], credits: 6, id: '17274227', name: 'Revoluciones en Física y Matemáticas', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb', year: null, quadri: 1 },
  {professors: ['Alejandro Arenas Moreno', 'Sergio Gómez Jiménez'], emails: ['alexandre.arenas@urv.cat', 'sergio.gomez@urv.cat'], credits: 6, id: '17274220', name: 'Aprendizaje Automático y Minería de Datos', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86', year: null, quadri: 2 },
  {professors: ['Carlos Aliagas Castell'], emails: ['carles.aliagas@urv.cat'], credits: 6, id: '17274205', name: 'Computación Paralela y Masiva', color: '#73401d', bgcolor: '#ffece9', bordercolor: '#cb8052', year: null, quadri: 2 },
  {professors: ['Albert Oller Pujol', 'Raúl Calavia Boldú', 'Daniel Flores Elias'], emails: ['albert.oller@urv.cat', 'raul.calavia@urv.cat', 'daniel.flores@urv.cat'], credits: 6, id: '17274206', name: 'Control Automático', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb', year: null, quadri: 2 },
  {professors: ['Amadeu Vives Ventura', 'Génesis María Guarimata Salinas'], emails: ['amadeu.vives@urv.cat', 'genesis.guarimata@urv.cat'], credits: 6, id: '17274225', name: 'Economía y Organización de Empresas', color: '#734d1d', bgcolor: '#fff4e9', bordercolor: '#cba152', year: null, quadri: 2 },
  {professors: ['Jordi Duch Gavaldà', 'David Gámez Alari', 'Marc Ruiz Rodríguez', 'Ramon Castells Amat', 'Juan Baustista Pérez Mingot'], emails: ['jordi.duch@urv.cat', 'david.gameza@urv.cat', 'marc.ruiz@urv.cat', 'ramon.castells@urv.cat', 'juanbaustista.perez@urv.cat'], credits: 6, id: '17274208', name: 'Estructuras de Datos', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb', year: null, quadri: 2 },
  {professors: [], emails: [], credits: 3, id: '17274222', name: 'Estudios en el Marco de Convenios de Movilidad II', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86', year: null, quadri: 2 },
  {professors: ['Carlos Aliagas Castell', 'Maria dels Àngels Moncusí Mercadé', 'Carles Anglés Tafalla', 'Jordi Massaguer Pla', 'Stephane Salaet Fernández'], emails: ['carles.aliagas@urv.cat', 'angels.mocusi@urv.cat', 'carles.angles@urv.cat', 'jordi.massaguer@urv.cat', 'stephane.salaet@urv.cat'], credits: 6, id: '17274210', name: 'Fundamentos de Sistemas Operativos', color: '#734b1d', bgcolor: '#fffae9', bordercolor: '#cb9762', year: null, quadri: 2 },
  {professors: ['Hatem Abdellatif Fatahallah Ibrahim Mahmoud'], emails: ['hatem.abdellatif@urv.cat'], credits: 6, id: '17274228', name: 'Infraestructuras para el Big Data', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb', year: null, quadri: 2 },
  {professors: ['Antonio Moreno Ribas', 'David Sánchez Ruenes', 'Roger Mallol Parera'], emails: ['antonio.moreno@urv.cat', 'david.sanchez@urv.cat', 'roger.mallol@urv.cat'], credits: 6, id: '17274211', name: 'Inteligencia Artificial', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb', year: null, quadri: 2 },
  {professors: ['Manuel Sanromà Lucia', 'Carlos García Gómez'], emails: ['manuel.sanroma@urv.cat', 'carlos.garciag@urv.cat'], credits: 6, id: '17274226', name: 'Introducción a la Astrofísica', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb', year: null, quadri: 2 },
  {professors: ['Jordi Castellà Roca', 'Antoni Cortès Martínez', 'Cristofol Dauden Esmel'], emails: ['jordi.castella@urv.cat', 'toni.cortes@urv.cat', 'cristofol.dauden@urv.cat'], credits: 6, id: '17274217', name: 'Seguridad en Redes', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86', year: null, quadri: 2 },
  {professors: ['Marta Moya Arevalo', 'Oriol Farràs Ventura', 'Carlos Andres Lara Niño'], emails: ['marta.moya@urv.cat', 'oriol.farras@urv.cat', 'carlos.lara@urv.cat'], credits: 6, id: '17274218', name: 'Teoría de la Codificación', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb', year: null, quadri: 2 },
  {professors: ['Carlos Barberà Escoí'], emails: ['carlos.barbera@urv.cat'], credits: 6, id: '17274501', name: 'Prácticas Externas I', color: '#734b1d', bgcolor: '#fffae9', bordercolor: '#cb9762', year: null, quadri: 1 },
  {professors: ['Carlos Barberà Escoí'], emails: ['carlos.barbera@urv.cat'], credits: 6, id: '17274502', name: 'Prácticas Externas II', color: '#733f1d', bgcolor: '#ffece9', bordercolor: '#cb7f52', year: null, quadri: 2 },
]

export function parseFormValue(
  value: FormDataEntryValue | null,
  stringNumbers: boolean = true
): any {
  if (value === null) return null;

  const str = String(value).trim();
  if (str === "") return null;

  try {
    const parsed = JSON.parse(str);

    // empty object → return {}
    if (parsed && typeof parsed === "object" && Object.keys(parsed).length === 0) {
      return {}; // ✅ changed from null to {}
    }

    // handle numbers depending on flag
    if (typeof parsed === "number" && stringNumbers) {
      return str; // return original string
    }

    return parsed;
  } catch {
    // not valid JSON → return as string
    return str;
  }
}


// export function stripUserIdIfAnonymous<
//   T extends { anonymous: boolean; userName?: unknown }
// >(
//   obj: T
// ): T extends { anonymous: true }
//   ? Omit<T, "user_name">
//   : T {
//   if (obj.anonymous) {
//     const { userName, ...rest } = obj;
//     return rest as any;
//   }
//   return obj as any;
// }




// STRING UTILS

export function normalizeString(str: string): string {
  return str
    .normalize("NFD")           // decompose accents
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .toLowerCase()             // ignore case
    .replace(/\s+/g, " ")      // collapse whitespace
    .trim();                   // trim leading/trailing whitespace
}

export function compareStringsIgnoreCaseAndAccents(a: string, b: string) {
  const normalize = (str: string) =>
    str
      .normalize("NFD")           // decompose accents
      .replace(/[\u0300-\u036f]/g, "") // remove diacritics
      .toLowerCase();             // ignore case

  return normalize(a) === normalize(b);
}


// GENERAL UTILS

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



// URLS AND ROUTES


export function redirectErrorUrl(error: AppError): never  {
  const params = new URLSearchParams({
    error: error.message,
    errorCode: error.code,
    details: error.details,
  });

  const url = `/error?${params.toString()}`;

  redirect(url)
}



// SUBJECTS


// Sorting function updated to handle null years, pushing them to the end.
export const sortSubjects = (subjects: SimplePrim[]): SimplePrim[] => {
  return [...subjects].sort((a, b) => {
    // Treat null years as "Infinity" to sort them after numbered years
    const yearA = a.year === null ? Infinity : a.year;
    const yearB = b.year === null ? Infinity : b.year;
    if (yearA !== yearB) return yearA - yearB;

    // Treat null quadris as "Infinity" to sort them after numbered quadris
    const quadriA = a.quadri === null ? Infinity : a.quadri;
    const quadriB = b.quadri === null ? Infinity : b.quadri;
    if (quadriA !== quadriB) return quadriA - quadriB;

    // Fallback to sorting by name for consistent order
    return a.name.localeCompare(b.name);
  });
};


// CALENDAR

export const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const compareDates = (a: Date, b: Date) => {
  const condition = a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  return condition;
};


export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

export function getDaysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return MONTH_DAYS[month - 1];
}

export function getCalendarDates(year: number, month: number) {
  const dates = [];
  const daysInCurrentMonth = getDaysInMonth(year, month);
  const today = new Date();

  // Calculate the first day of the month (0: Monday, 1: Tuesday, ..., 6: Sunday)
  let firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  firstDayOfMonth = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

  // Determine the number of days in the previous month
  const previousMonth = month - 1 < 1 ? 12 : month - 1;
  const previousMonthYear = month - 1 < 1 ? year - 1 : year;
  const daysInPreviousMonth = getDaysInMonth(previousMonthYear, previousMonth);

  // Add days from the previous month to fill the calendar until the first day of the current month
  for (let i = firstDayOfMonth; i > 0; i--) {
    dates.push({
      date: new Date(previousMonthYear, previousMonth - 1, daysInPreviousMonth - i + 1),
      isCurrentMonth: false,
      isToday: compareDates(today, new Date(previousMonthYear, previousMonth - 1, daysInPreviousMonth - i + 1)),
    });
  }

  // Add all days of the current month
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    dates.push({
      date: new Date(year, month - 1, i),
      isCurrentMonth: true,
      isToday: compareDates(today, new Date(year, month - 1, i)),
    });
  }

  // Calculate the total number of weeks to display (should be 6 to cover all cases)
  const totalWeeks = 6;
  const daysInCalendar = totalWeeks * 7;
  const daysToAdd = daysInCalendar - dates.length;

  // Add days from the next month to complete the weeks
  for (let i = 1; i <= daysToAdd; i++) {
    dates.push({
      date: new Date(year, month, i),
      isCurrentMonth: false,
      isToday: compareDates(today, new Date(year, month, i)),
    });
  }

  return dates;
}



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}





/**
 * Determines the optimal upload configuration based on the user's environment.
 * @returns {{concurrency: number, chunkSize: number}}
 */
// export function getUploadConfig() {
//   const MB = 1024 * 1024;

//   // --- Default sane values ---
//   let concurrency = 4;
//   let chunkSize = 5 * MB;

//   // 1. Adjust based on CPU cores
//   // A good starting point is half the logical processors, capped between 2 and 8.
//   const hardwareConcurrency = navigator.hardwareConcurrency;
//   if (hardwareConcurrency) {
//     concurrency = Math.max(2, Math.min(Math.floor(hardwareConcurrency / 2), 8));
//   }

//   // 2. Adjust based on Network Information API
//   const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
//   if (connection) {
//     // effectiveType is a good indicator of the general network quality
//     switch (connection.effectiveType) {
//       case 'slow-2g':
//         concurrency = 1;
//         chunkSize = 2 * MB; // Smaller chunks for unreliable networks
//         break;
//       case '2g':
//         concurrency = 2;
//         chunkSize = 3 * MB;
//         break;
//       case '3g':
//         concurrency = 3;
//         chunkSize = 5 * MB;
//         break;
//       case '4g':
//         // For fast networks, we can increase concurrency and chunk size
//         concurrency = Math.max(concurrency, 6); // Use the higher of CPU-based or this
//         chunkSize = 10 * MB; // Larger chunks mean fewer requests
//         break;
//       default:
//         // Keep defaults for unknown or very fast connections
//         break;
//     }

//     // `downlink` provides a more direct bandwidth estimate in Mbps
//     if (connection.downlink && connection.downlink < 5) {
//       // If bandwidth is known to be slow (<5 Mbps), cap concurrency
//       concurrency = Math.min(concurrency, 3);
//     }
//   }
  
//   
  
//   return { concurrency, chunkSize };
// }


// robust uploadWithConcurrency — replace the existing function with this
export async function uploadWithConcurrency<T>(
  taskFactories: Array<() => Promise<T>>,
  concurrency = 5
): Promise<T[]> {
  if (!Array.isArray(taskFactories)) return [];

  const results: T[] = new Array(taskFactories.length);
  let nextIndex = 0;
  const running = new Set<Promise<void>>();

  const startTask = (i: number) => {
    // wrap the factory call so we can track completion and store result
    const p = Promise.resolve()
      .then(() => taskFactories[i]())
      .then((res) => {
        results[i] = res;
      })
      .catch((err) => {
        // store the error object so caller can inspect it; don't rethrow here
        results[i] = err as unknown as T;
      })
      .finally(() => {
        running.delete(p);
      });

    running.add(p);
    return p;
  };

  // start initial batch (no awaits inside this loop)
  while (nextIndex < taskFactories.length && running.size < concurrency) {
    startTask(nextIndex++);
  }

  // while there are still queued tasks, wait for any running to finish then start next(s)
  while (nextIndex < taskFactories.length) {
    await Promise.race(Array.from(running));
    while (nextIndex < taskFactories.length && running.size < concurrency) {
      startTask(nextIndex++);
    }
  }

  // wait for the remaining running tasks
  await Promise.all(Array.from(running));
  return results;
}
