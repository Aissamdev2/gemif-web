
const SUBJECTS_11: string[] = [
  'Álgebra Lineal',
  'Análisis Matemático I',
  'Física I',
  'Programación Científica'
]
 
const SUBJECTS_12: string[] = [
  'Análisis Matemático II',
  'Ecuaciones Diferenciales I',
  'Física II',
  'Geometría'
]

const SUBJECTS_21: string[] = [
  'Combinatoria y Probabilidad',
  'Computación algebraica',
  'Electromagnetismo',
  'Ecuaciones Diferenciales II',
  'Mecánica Clásica'
]

const SUBJECTS_22: string[] = [
  'Estadística',
  'Física Cuántica',
  'Métodos Numéricos',
  'Teoría de Grafos',
  'Termodinámica'
]

const SUBJECTS_31: string[] = [
  'Análisis Complejo',
  'Biofísica',
  'Física de Fluidos',
  'Física del Estado Sólido y Superfícies',
  'Mecánica Estatística'
]

const SUBJECTS_32: string[] = [
  'Electrónica Física',
  'Estructuras Algebraicas',
  'Geometría Diferencial y Aplicaciones',
  'Sistemas Dinámicos'
]

const SUBJECTS_41: string[] = [
  'Electrónica Aplicada',
  'Óptica y Fotónica',
  'Proyectos de Ingeniería'
]

const SUBJECTS_42: string[] = [
  'Trabajo de Fin de Grado'
]



const SUBJECTS_1 = [SUBJECTS_11, SUBJECTS_12];

const SUBJECTS_2: string[][] = [SUBJECTS_21, SUBJECTS_22]

const SUBJECTS_3: string[][] = [SUBJECTS_31, SUBJECTS_32]

const SUBJECTS_4: string[][] = [SUBJECTS_41, SUBJECTS_42]

export const SUBJECTS: string[][][] = [SUBJECTS_1, SUBJECTS_2, SUBJECTS_3, SUBJECTS_4]
export const OPTATIVES: string[] = [
  'Algorítmica',
  'Arquitectura de Computadores',
  'Ciencia de Materiales',
  'Electrónica Analógica',
  'Estudios en el Marco de Convenios de Movilidad I',
  'Fenómenos de Transporte',
  'Modelado de Sistemas y Control de Procesos',
  'Modelización y Visualización',
  'Nucleación y Crecimiento de Cristales',
  'Nuevos Materiales y Nanociencia',
  'Programación',
  'Revoluciones en Física y Matemáticas',
  'Aprendizaje Automático y Minería de Datos',
  'Computación Paralela y Masiva',
  'Control Automático',
  'Economía y Organización de Empresas',
  'Estructuras de Datos',
  'Estudios en el Marco de Convenios de Movilidad II',
  'Fundamentos de Sistemas Operativos',
  'Infraestructuras para el Big Data',
  'Inteligencia Artificial',
  'Introducción a la Astrofísica',
  'Seguridad en Redes',
  'Teoría de la Codificación',
  'Prácticas Externas I',
  'Prácticas Externas II'
];

export const OPTATIVES_COLORS_OBJ: Record<string, string> = {
  'Algorítmica': '#1d4a73',
  'Arquitectura de Computadores': '#5a1d73',
  'Ciencia de Materiales': '#1d7340',
  'Electrónica Analógica': '#734b1d',
  'Estudios en el Marco de Convenios de Movilidad I': '#73401d',
  'Fenómenos de Transporte': '#73661d',
  'Modelado de Sistemas y Control de Procesos': '#404d73',
  'Modelización y Visualización': '#1d4a73',
  'Nucleación y Crecimiento de Cristales': '#1d7340',
  'Nuevos Materiales y Nanociencia': '#733f1d',
  'Programación': '#734d1d',
  'Revoluciones en Física y Matemáticas': '#5a1d73',
  'Aprendizaje Automático y Minería de Datos': '#1d7340',
  'Computación Paralela y Masiva': '#73401d',
  'Control Automático': '#1d4a73',
  'Economía y Organización de Empresas': '#734d1d',
  'Estructuras de Datos': '#5a1d73',
  'Estudios en el Marco de Convenios de Movilidad II': '#1d7340',
  'Fundamentos de Sistemas Operativos': '#734b1d',
  'Infraestructuras para el Big Data': '#1d4a73',
  'Inteligencia Artificial': '#5a1d73',
  'Introducción a la Astrofísica': '#1d4a73',
  'Seguridad en Redes': '#1d7340',
  'Teoría de la Codificación': '#5a1d73',
  'Prácticas Externas I': '#734b1d',
  'Prácticas Externas II': '#733f1d'
};

export const OPTATIVES_BORDER_COLORS_OBJ: Record<string, string> = {
  'Algorítmica': '#5297cb',
  'Arquitectura de Computadores': '#a052cb',
  'Ciencia de Materiales': '#52cb86',
  'Electrónica Analógica': '#cb9762',
  'Estudios en el Marco de Convenios de Movilidad I': '#cb8052',
  'Fenómenos de Transporte': '#cbab52',
  'Modelado de Sistemas y Control de Procesos': '#7381cb',
  'Modelización y Visualización': '#5297cb',
  'Nucleación y Crecimiento de Cristales': '#52cb86',
  'Nuevos Materiales y Nanociencia': '#cb7f52',
  'Programación': '#cba152',
  'Revoluciones en Física y Matemáticas': '#a052cb',
  'Aprendizaje Automático y Minería de Datos': '#52cb86',
  'Computación Paralela y Masiva': '#cb8052',
  'Control Automático': '#5297cb',
  'Economía y Organización de Empresas': '#cba152',
  'Estructuras de Datos': '#a052cb',
  'Estudios en el Marco de Convenios de Movilidad II': '#52cb86',
  'Fundamentos de Sistemas Operativos': '#cb9762',
  'Infraestructuras para el Big Data': '#5297cb',
  'Inteligencia Artificial': '#a052cb',
  'Introducción a la Astrofísica': '#5297cb',
  'Seguridad en Redes': '#52cb86',
  'Teoría de la Codificación': '#a052cb',
  'Prácticas Externas I': '#cb9762',
  'Prácticas Externas II': '#cb7f52'
};

export const OPTATIVES_BG_COLORS_OBJ: Record<string, string> = {
  'Algorítmica': '#eaf4ff',
  'Arquitectura de Computadores': '#fbeaff',
  'Ciencia de Materiales': '#eafff4',
  'Electrónica Analógica': '#fffae9',
  'Estudios en el Marco de Convenios de Movilidad I': '#ffece9',
  'Fenómenos de Transporte': '#fff8e9',
  'Modelado de Sistemas y Control de Procesos': '#f0f4ff',
  'Modelización y Visualización': '#eaf4ff',
  'Nucleación y Crecimiento de Cristales': '#eafff4',
  'Nuevos Materiales y Nanociencia': '#ffece9',
  'Programación': '#fff4e9',
  'Revoluciones en Física y Matemáticas': '#fbeaff',
  'Aprendizaje Automático y Minería de Datos': '#eafff4',
  'Computación Paralela y Masiva': '#ffece9',
  'Control Automático': '#eaf4ff',
  'Economía y Organización de Empresas': '#fff4e9',
  'Estructuras de Datos': '#fbeaff',
  'Estudios en el Marco de Convenios de Movilidad II': '#eafff4',
  'Fundamentos de Sistemas Operativos': '#fffae9',
  'Infraestructuras para el Big Data': '#eaf4ff',
  'Inteligencia Artificial': '#fbeaff',
  'Introducción a la Astrofísica': '#eaf4ff',
  'Seguridad en Redes': '#eafff4',
  'Teoría de la Codificación': '#fbeaff',
  'Prácticas Externas I': '#fffae9',
  'Prácticas Externas II': '#ffece9'
};


export const OPTATIVES_COLORS = Object.values(OPTATIVES_BORDER_COLORS_OBJ)
export const OPTATIVES_BG_COLORS = Object.values(OPTATIVES_BG_COLORS_OBJ)
export const OPTATIVES_BORDER_COLORS = Object.values(OPTATIVES_BORDER_COLORS_OBJ)


export const SUBJECTS_COLORS_11: Record<string, string> = {
  'Álgebra Lineal': '#ff0000',
  'Análisis Matemático I': '#4f46e5',
  'Física I': '#059669',
  'Programación Científica': '#374151',
};

export const SUBJECTS_BORDER_COLORS_11: Record<string, string> = {
  'Álgebra Lineal': '#f87171',
  'Análisis Matemático I': '#818cf8',
  'Física I': '#34d399',
  'Programación Científica': '#9ca3af',
};

export const SUBJECTS_BG_COLORS_11: Record<string, string> = {
  'Álgebra Lineal': '#fef2f2',
  'Análisis Matemático I': '#eef2ff',
  'Física I': '#ecfdf5',
  'Programación Científica': '#f3f4f6',
};

export const SUBJECTS_COLORS_12: Record<string, string> = {
  'Análisis Matemático II': '#4f46e5',
  'Ecuaciones Diferenciales I': '#d946ef',
  'Física II': '#059669',
  'Geometría': '#ff0000',
};

export const SUBJECTS_BORDER_COLORS_12: Record<string, string> = {
  'Análisis Matemático II': '#818cf8',
  'Ecuaciones Diferenciales I': '#e879f9',
  'Física II': '#34d399',
  'Geometría': '#f87171',
};

export const SUBJECTS_BG_COLORS_12: Record<string, string> = {
  'Análisis Matemático II': '#eef2ff',
  'Ecuaciones Diferenciales I': '#fdf4ff',
  'Física II': '#ecfdf5',
  'Geometría': '#fef2f2',
};

export const SUBJECTS_COLORS_21: Record<string, string> = {
  'Combinatoria y Probabilidad': '#1d2ba8',
  'Computación algebraica': '#05850e',
  'Ecuaciones Diferenciales II': '#961299',
  'Electromagnetismo': '#7d7a04',
  'Mecánica Clásica': '#910f2d',
};

export const SUBJECTS_BORDER_COLORS_21: Record<string, string> = {
  'Combinatoria y Probabilidad': '#1525ad',
  'Computación algebraica': '#34c73e',
  'Ecuaciones Diferenciales II': '#c131c4',
  'Electromagnetismo': '#d6d32f',
  'Mecánica Clásica': '#c72c50',
};

export const SUBJECTS_BG_COLORS_21: Record<string, string> = {
  'Combinatoria y Probabilidad': '#cacffc',
  'Computación algebraica': '#ccffcf',
  'Ecuaciones Diferenciales II': '#fbc7fc',
  'Electromagnetismo': '#fcfcc7',
  'Mecánica Clásica': '#fccad6',
};

export const SUBJECTS_COLORS_22: Record<string, string> = {
  'Estadística': '#1d2ba8',
  'Física Cuántica': '#05850e',
  'Métodos Numéricos': '#961299',
  'Teoría de Grafos': '#7d7a04',
  'Termodinámica': '#910f2d',
};

export const SUBJECTS_BORDER_COLORS_22: Record<string, string> = {
  'Estadística': '#1525ad',
  'Física Cuántica': '#34c73e',
  'Métodos Numéricos': '#c131c4',
  'Teoría de Grafos': '#d6d32f',
  'Termodinámica': '#c72c50',
};

export const SUBJECTS_BG_COLORS_22: Record<string, string> = {
  'Estadística': '#cacffc',
  'Física Cuántica': '#ccffcf',
  'Métodos Numéricos': '#fbc7fc',
  'Teoría de Grafos': '#fcfcc7',
  'Termodinámica': '#fccad6',
};

export const SUBJECTS_COLORS_31: Record<string, string> = {
  'Análisis Complejo': '#05850e',
  'Biofísica': '#910f2d',
  'Física de Fluidos': '#7d7a04',
  'Física del Estado Sólido y Superfícies': '#961299',
  'Mecánica Estatística': '#1d2ba8',
};

export const SUBJECTS_BORDER_COLORS_31: Record<string, string> = {
  'Análisis Complejo': '#34c73e',
  'Biofísica': '#c72c50',
  'Física de Fluidos': '#d6d32f',
  'Física del Estado Sólido y Superfícies': '#c131c4',
  'Mecánica Estatística': '#1525ad',
};

export const SUBJECTS_BG_COLORS_31: Record<string, string> = {
  'Análisis Complejo': '#ccffcf',
  'Biofísica': '#fccad6',
  'Física de Fluidos': '#fcfcc7',
  'Física del Estado Sólido y Superfícies': '#fbc7fc',
  'Mecánica Estatística': '#cacffc',
};

export const SUBJECTS_COLORS_32: Record<string, string> = {
  'Electrónica Física': '#05850e',
  'Estructuras Algebraicas': '#7d7a04',
  'Geometría Diferencial y Aplicaciones': '#1d2ba8',
  'Sistemas Dinámicos': '#961299',
};

export const SUBJECTS_BORDER_COLORS_32: Record<string, string> = {
  'Electrónica Física': '#34c73e',
  'Estructuras Algebraicas': '#d6d32f',
  'Geometría Diferencial y Aplicaciones': '#1525ad',
  'Sistemas Dinámicos': '#c131c4',
};

export const SUBJECTS_BG_COLORS_32: Record<string, string> = {
  'Electrónica Física': '#ccffcf',
  'Estructuras Algebraicas': '#fcfcc7',
  'Geometría Diferencial y Aplicaciones': '#cacffc',
  'Sistemas Dinámicos': '#fbc7fc',
};

export const SUBJECTS_COLORS_41: Record<string, string> = {
  'Electrónica Aplicada': '#05850e',
  'Óptica y Fotónica': '#7d7a04',
  'Proyectos de Ingeniería': '#1d2ba8',
};

export const SUBJECTS_BORDER_COLORS_41: Record<string, string> = {
  'Electrónica Aplicada': '#34c73e',
  'Óptica y Fotónica': '#d6d32f',
  'Proyectos de Ingeniería': '#1525ad',
};

export const SUBJECTS_BG_COLORS_41: Record<string, string> = {
  'Electrónica Aplicada': '#ccffcf',
  'Óptica y Fotónica': '#fcfcc7',
  'Proyectos de Ingeniería': '#cacffc',
};

export const SUBJECTS_COLORS_42: Record<string, string> = {
  'Trabajo de Fin de Grado': '#05850e',
};

export const SUBJECTS_BORDER_COLORS_42: Record<string, string> = {
  'Trabajo de Fin de Grado': '#34c73e',
};

export const SUBJECTS_BG_COLORS_42: Record<string, string> = {
  'Trabajo de Fin de Grado': '#ccffcf',
};


export const SUBJECTS_OBJ = [
  // Year 1, Quadri 1
  { name: 'Álgebra Lineal', color: '#ff0000', bgcolor: '#fef2f2', bordercolor: '#f87171', year: '1', quadri: '1' },
  { name: 'Análisis Matemático I', color: '#4f46e5', bgcolor: '#eef2ff', bordercolor: '#818cf8', year: '1', quadri: '1' },
  { name: 'Física I', color: '#059669', bgcolor: '#ecfdf5', bordercolor: '#34d399', year: '1', quadri: '1' },
  { name: 'Programación Científica', color: '#374151', bgcolor: '#f3f4f6', bordercolor: '#9ca3af', year: '1', quadri: '1' },
  // Year 1, Quadri 2
  { name: 'Análisis Matemático II', color: '#4f46e5', bgcolor: '#eef2ff', bordercolor: '#818cf8', year: '1', quadri: '2' },
  { name: 'Ecuaciones Diferenciales I', color: '#d946ef', bgcolor: '#fdf4ff', bordercolor: '#e879f9', year: '1', quadri: '2' },
  { name: 'Física II', color: '#059669', bgcolor: '#ecfdf5', bordercolor: '#34d399', year: '1', quadri: '2' },
  { name: 'Geometría', color: '#ff0000', bgcolor: '#fef2f2', bordercolor: '#f87171', year: '1', quadri: '2' },
  // Year 2, Quadri 1
  { name: 'Combinatoria y Probabilidad', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: '2', quadri: '1' },
  { name: 'Computación algebraica', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: '2', quadri: '1' },
  { name: 'Ecuaciones Diferenciales II', color: '#961299', bgcolor: '#fbc7fc', bordercolor: '#c131c4', year: '2', quadri: '1' },
  { name: 'Electromagnetismo', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: '2', quadri: '1' },
  { name: 'Mecánica Clásica', color: '#910f2d', bgcolor: '#fccad6', bordercolor: '#c72c50', year: '2', quadri: '1' },
  // Year 2, Quadri 2
  { name: 'Estadística', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: '2', quadri: '2' },
  { name: 'Física Cuántica', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: '2', quadri: '2' },
  { name: 'Métodos Numéricos', color: '#961299', bgcolor: '#fbc7fc', bordercolor: '#c131c4', year: '2', quadri: '2' },
  { name: 'Teoría de Grafos', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: '2', quadri: '2' },
  { name: 'Termodinámica', color: '#910f2d', bgcolor: '#fccad6', bordercolor: '#c72c50', year: '2', quadri: '2' },
  // Year 3, Quadri 1
  { name: 'Análisis Complejo', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: '3', quadri: '1' },
  { name: 'Biofísica', color: '#910f2d', bgcolor: '#fccad6', bordercolor: '#c72c50', year: '3', quadri: '1' },
  { name: 'Física de Fluidos', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: '3', quadri: '1' },
  { name: 'Física del Estado Sólido y Superfícies', color: '#961299', bgcolor: '#fbc7fc', bordercolor: '#c131c4', year: '3', quadri: '1' },
  { name: 'Mecánica Estatística', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: '3', quadri: '1' },
  // Year 3, Quadri 2
  { name: 'Electrónica Física', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: '3', quadri: '2' },
  { name: 'Estructuras Algebraicas', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: '3', quadri: '2' },
  { name: 'Geometría Diferencial y Aplicaciones', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: '3', quadri: '2' },
  { name: 'Sistemas Dinámicos', color: '#961299', bgcolor: '#fbc7fc', bordercolor: '#c131c4', year: '3', quadri: '2' },
  // Year 4, Quadri 1
  { name: 'Electrónica Aplicada', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: '4', quadri: '1' },
  { name: 'Óptica y Fotónica', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: '4', quadri: '1' },
  { name: 'Proyectos de Ingeniería', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: '4', quadri: '1' },
  // Year 4, Quadri 2
  { name: 'Trabajo de Fin de Grado', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: '4', quadri: '2' },
];


export const OPTATIVES_OBJ = [
  { name: 'Algorítmica', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb' },
  { name: 'Arquitectura de Computadores', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb' },
  { name: 'Ciencia de Materiales', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86' },
  { name: 'Electrónica Analógica', color: '#734b1d', bgcolor: '#fffae9', bordercolor: '#cb9762' },
  { name: 'Estudios en el Marco de Convenios de Movilidad I', color: '#73401d', bgcolor: '#ffece9', bordercolor: '#cb8052' },
  { name: 'Fenómenos de Transporte', color: '#73661d', bgcolor: '#fff8e9', bordercolor: '#cbab52' },
  { name: 'Modelado de Sistemas y Control de Procesos', color: '#404d73', bgcolor: '#f0f4ff', bordercolor: '#7381cb' },
  { name: 'Modelización y Visualización', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb' },
  { name: 'Nucleación y Crecimiento de Cristales', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86' },
  { name: 'Nuevos Materiales y Nanociencia', color: '#733f1d', bgcolor: '#ffece9', bordercolor: '#cb7f52' },
  { name: 'Programación', color: '#734d1d', bgcolor: '#fff4e9', bordercolor: '#cba152' },
  { name: 'Revoluciones en Física y Matemáticas', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb' },
  { name: 'Aprendizaje Automático y Minería de Datos', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86' },
  { name: 'Computación Paralela y Masiva', color: '#73401d', bgcolor: '#ffece9', bordercolor: '#cb8052' },
  { name: 'Control Automático', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb' },
  { name: 'Economía y Organización de Empresas', color: '#734d1d', bgcolor: '#fff4e9', bordercolor: '#cba152' },
  { name: 'Estructuras de Datos', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb' },
  { name: 'Estudios en el Marco de Convenios de Movilidad II', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86' },
  { name: 'Fundamentos de Sistemas Operativos', color: '#734b1d', bgcolor: '#fffae9', bordercolor: '#cb9762' },
  { name: 'Infraestructuras para el Big Data', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb' },
  { name: 'Inteligencia Artificial', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb' },
  { name: 'Introducción a la Astrofísica', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb' },
  { name: 'Seguridad en Redes', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86' },
  { name: 'Teoría de la Codificación', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb' },
  { name: 'Prácticas Externas I', color: '#734b1d', bgcolor: '#fffae9', bordercolor: '#cb9762' },
  { name: 'Prácticas Externas II', color: '#733f1d', bgcolor: '#ffece9', bordercolor: '#cb7f52' }
];

export const SBJ_FINAL = [
  {name: 'Otro', color: '#734d1d', bgcolor: '#fff4e9', bordercolor: '#cba152', id: '00000000' },
  // Year 1, Quadri 1
  {professors: ['Hebert Pérez Rosés', 'Carlos García Gómez'], emails: ['hebert.perez@urv.cat', 'carlos.garciag@urv.cat'], credits: '7.5', name: 'Álgebra Lineal', color: '#ff0000', bgcolor: '#fef2f2', bordercolor: '#f87171', year: '1', quadri: '1', id: '17274001' },
  {professors: ['Alejandro Arenas Moreno', 'Sergio Gómez Jiménez'], emails: ['alexandre.arenas@urv.cat', 'sergio.gomez@urv.cat'], credits: '7.5', name: 'Análisis Matemático I', color: '#4f46e5', bgcolor: '#eef2ff', bordercolor: '#818cf8', year: '1', quadri: '1', id: '17274002' },
  {professors: ['Francisco Manuel Díaz González', 'Josefa Gavaldà Martínez', 'Rosa Maria Solé Cartaña', 'Jaime Masons Bosch'], emails: ['f.diaz@urv.cat', 'fina.gavalda@urv.cat', 'rosam.sole@urv.cat', 'jaume.masons@urv.cat'], credits: '9', name: 'Física I', color: '#059669', bgcolor: '#ecfdf5', bordercolor: '#34d399', year: '1', quadri: '1', id: '17274003' },
  {professors: ['Clara Granell Martorell'], emails: ['clara.granell@urv.cat'], credits: '6', name: 'Programación Científica', color: '#374151', bgcolor: '#f3f4f6', bordercolor: '#9ca3af', year: '1', quadri: '1', id: '17274004' },
  {professors: ['Alejandro Arenas Moreno', 'Sergio Gómez Jiménez'], emails: ['alexandre.arenas@urv.cat', 'sergio.gomez@urv.cat'], credits: '7.5', name: 'Análisis Matemático II', color: '#4f46e5', bgcolor: '#eef2ff', bordercolor: '#818cf8', year: '1', quadri: '2', id: '17274005' },
  {professors: ['Carlos Barberà Escoí'], emails: ['carlos.barbera@urv.cat'], credits: '6', name: 'Ecuaciones Diferenciales I', color: '#d946ef', bgcolor: '#fdf4ff', bordercolor: '#e879f9', year: '1', quadri: '2', id: '17274006' },
  {professors: ['Roger Cabré Rodon', 'Benjamin Iñiguez Nicolau'], emails: ['roger.cabre@urv.cat', 'benjamin.iniguez@urv.cat'], credits: '9', name: 'Física II', color: '#059669', bgcolor: '#ecfdf5', bordercolor: '#34d399', year: '1', quadri: '2', id: '17274007' },
  {professors: ['Juan Alberto Rodríguez Velázquez'], emails: ['juanalberto.rodriguez@urv.cat'], credits: '7.5', name: 'Geometría', color: '#ff0000', bgcolor: '#fef2f2', bordercolor: '#f87171', year: '1', quadri: '2', id: '17274008' },
  {professors: ['Hebert Pérez Rosés'], emails: ['hebert.perez@urv.cat'], credits: '6', name: 'Combinatoria y Probabilidad', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: '2', quadri: '1', id: '17274102' },
  {professors: ['Xavier Rivas Guijarro'], emails: ['xavier.rivas@urv.cat'], credits: '6', name: 'Computación algebraica', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: '2', quadri: '1', id: '17274103' },
  {professors: ['Josep Maria López Besora', 'Gerard Fortuny Anguera'], emails: ['josep.m.lopez@urv.cat', 'gerard.fortuny@urv.cat'], credits: '6', name: 'Ecuaciones Diferenciales II', color: '#961299', bgcolor: '#fbc7fc', bordercolor: '#c131c4', year: '2', quadri: '1', id: '17274105' },
  {professors: ['Roger Cabré Rodon', 'Benjamin Iñiguez Nicolau'], emails: ['roger.cabre@urv.cat', 'benjamin.iniguez@urv.cat'], credits: '6', name: 'Electromagnetismo', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: '2', quadri: '1', id: '17274104' },
  {professors: ['Roger Guimera Manrique'], emails: ['roger.guimera@urv.cat'], credits: '6', name: 'Mecánica Clásica', color: '#910f2d', bgcolor: '#fccad6', bordercolor: '#c72c50', year: '2', quadri: '1', id: '17274106' },
  {professors: ['Carlos Barberà Escoí', 'Maria del Carme Olivé Farré'], emails: ['carlos.barbera@urv.cat', 'carme.olive@urv.cat'], credits: '6', name: 'Estadística', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: '2', quadri: '2', id: '17274107' },
  {professors: ['Cornelis de Graaf'], emails: ['coen.degraaf@urv.cat'], credits: '6', name: 'Física Cuántica', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: '2', quadri: '2', id: '17274108' },
  {professors: ['Carlos García Gómez'], emails: ['carlos.garciag@urv.cat'], credits: '6', name: 'Métodos Numéricos', color: '#961299', bgcolor: '#fbc7fc', bordercolor: '#c131c4', year: '2', quadri: '2', id: '17274109' },
  {professors: ['Juan Alberto Rodríguez Velázquez','Alejandro Estrada Moreno'], emails: ['juanalberto.rodriguez@urv.cat', 'alejandro.estrada@urv.cat'], credits: '6', name: 'Teoría de Grafos', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: '2', quadri: '2', id: '17274111' },
  {professors: ['Joan Rosell Llompart'], emails: ['joan.rosell@urv.cat'], credits: '6', name: 'Termodinámica', color: '#910f2d', bgcolor: '#fccad6', bordercolor: '#c72c50', year: '2', quadri: '2', id: '17274112' },
  {professors: ['Antonio Garijo Real'], emails: ['antonio.garijo@urv.cat'], credits: '6', name: 'Análisis Complejo', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: '3', quadri: '1', id: '17274101' },
  {professors: ['Victor Llamas Martinez', 'Francisco Manuel Díaz González'], emails: ['victor.llamas@urv.cat', 'f.diaz@urv.cat'], credits: '6', name: 'Biofísica', color: '#910f2d', bgcolor: '#fccad6', bordercolor: '#c72c50', year: '3', quadri: '1', id: '17274113' },
  {professors: ['Clara Salueña Pérez'], emails: ['clara.saluena@urv.cat'], credits: '6', name: 'Física de Fluidos', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: '3', quadri: '1', id: '17274114' },
  {professors: ['Francisco Manuel Díaz González', 'Magdalena Aguiló Díaz', 'Josep Maria Serres Serres', 'Luca Guerrini'], emails: ['f.diaz@urv.cat', 'magdalena.aguilo@urv.cat', 'josepmaria.serres@urv.cat', 'luca.guerrini@urv.cat'], credits: '6', name: 'Física del Estado Sólido y Superfícies', color: '#961299', bgcolor: '#fbc7fc', bordercolor: '#c131c4', year: '3', quadri: '1', id: '17274115' },
  {professors: ['Alejandro Arenas Moreno', 'Marta Sales Pardo'], emails: ['alexandre.arenas@urv.cat', 'marta.sales@urv.cat'], credits: '6', name: 'Mecánica Estatística', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: '3', quadri: '1', id: '17274116' },
  {professors: ['Benjamin Iñiguez Nicolau'], emails: ['benjamin.iniguez@urv.cat'], credits: '6', name: 'Electrónica Física', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: '3', quadri: '2', id: '17274117' },
  {professors: ['Oriol Farràs Ventura', 'Xavier Rivas Guijarro'], emails: ['oriol.farras@urv.cat', 'xavier.rivas@urv.cat'], credits: '6', name: 'Estructuras Algebraicas', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: '3', quadri: '2', id: '17274118' },
  {professors: ['Blas Herrera Gómez'], emails: ['blas.herrera@urv.cat'], credits: '6', name: 'Geometría Diferencial y Aplicaciones', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: '3', quadri: '2', id: '17274119' },
  {professors: ['Antonio Garijo Real'], emails: ['antonio.garijo@urv.cat'], credits: '6', name: 'Sistemas Dinámicos', color: '#961299', bgcolor: '#fbc7fc', bordercolor: '#c131c4', year: '3', quadri: '2', id: '17274110' },
  {professors: ['Eduard Llobet Valero'], emails: ['eduard.llobet@urv.cat'], credits: '6', id: '17274120', name: 'Electrónica Aplicada', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: '4', quadri: '1' },
  {professors: ['Xavier Mateos Ferré', 'Nicolás Carlos Pazos Pérez'], emails: ['xavier.mateos@urv.cat', 'nicolas.pazos@urv.cat'], credits: '6', id: '17274121', name: 'Óptica y Fotónica', color: '#7d7a04', bgcolor: '#fcfcc7', bordercolor: '#d6d32f', year: '4', quadri: '1' },
  {professors: ['Francisco Manuel Díaz González', 'Joan Ramon Alabart Córdoba', 'Roger Cabré Rodon', 'Carlos García Gómez', 'Juan Alberto Rodríguez Velázquez', 'Oriol Farràs Ventura'], emails: ['f.diaz@urv.cat', 'joanramon.alabart@urv.cat', 'roger.cabre@urv.cat', 'carlos.garciag@urv.cat', 'juanalberto.rodriguez@urv.cat', 'oriol.farras@urv.cat'], credits: '6', id: '17274122', name: 'Proyectos de Ingeniería', color: '#1d2ba8', bgcolor: '#cacffc', bordercolor: '#1525ad', year: '4', quadri: '1' },
  {professors: ['María Montserrat García Famoso'], emails: ['montse.garcia@urv.cat'], credits: '12', id: '17274301', name: 'Trabajo de Fin de Grado', color: '#05850e', bgcolor: '#ccffcf', bordercolor: '#34c73e', year: '4', quadri: '2' },
  {professors: ['Javier Borge Holthoefer'], emails: ['javier.borge@urv.cat'], credits: '6', id: '17274201', name: 'Algorítmica', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb', year: null, quadri: '1' },
  {professors: ['Carlos Aliagas Castell', 'Carlos María Molina Clemente'], emails: ['carles.aliagas@urv.cat', 'carlos.molina@urv.cat'], credits: '6', id: '17274203', name: 'Arquitectura de Computadores', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb', year: null, quadri: '1' },
  {professors: ['Juan Carlos Ronda Bargalló', 'Oscar Pamies Olle', 'Maria Cinta Pujol Baiges', 'Maria Angels Serra Albet', 'Xavier Mateos Ferré', 'Joan Josep Carvajal Martí', 'Álvaro Velasco Rubio'], emails: ['juancarlos.ronda@urv.cat', 'oscar.pamies@urv.cat', 'mariacinta.pujol@urv.cat', 'angels.serra@urv.cat', 'xavier.mateos@urv.cat', 'joanjosep.carvajal@urv.cat', 'alvaro.velasco@urv.cat'], credits: '6', id: '17274204', name: 'Ciencia de Materiales', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86', year: null, quadri: '1' },
  {professors: ['Alfonso José Romero Nevado', 'José Luis Ramírez Falo', 'Javier Vilanova Salas', 'Alexandra Blanch Fortuna'], emails: ['alfonsojose.romero@urv.cat', 'joseluis.ramirez@urv.cat', 'xavier.vilanova@urv.cat', 'alexandra.blanch@urv.cat'], credits: '6', id: '17274207', name: 'Electrónica Analógica', color: '#734b1d', bgcolor: '#fffae9', bordercolor: '#cb9762', year: null, quadri: '1' },
  {professors: [], emails: [], credits: 3, id: '17274221', name: 'Estudios en el Marco de Convenios de Movilidad I', color: '#73401d', bgcolor: '#ffece9', bordercolor: '#cb8052', year: null, quadri: '1' },
  {professors: ['Frances Xavier Farriol Roigés'], emails: ['xavier.farriol@urv.cat'], credits: '6', id: '17274209', name: 'Fenómenos de Transporte', color: '#73661d', bgcolor: '#fff8e9', bordercolor: '#cbab52', year: null, quadri: '1' },
  {professors: ['Ramon Leyva Grasa'], emails: ['ramon.leyva@urv.cat'], credits: '6', id: '17274213', name: 'Modelado de Sistemas y Control de Procesos', color: '#404d73', bgcolor: '#f0f4ff', bordercolor: '#7381cb', year: null, quadri: '1' },
  {professors: ['José Luis Santacruz Muñoz'], emails: ['joseluis.santacruz@urv.cat'], credits: '6', id: '17274212', name: 'Modelización y Visualización', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb', year: null, quadri: '1' },
  {professors: ['Maria Cinta Pujol Baiges', 'Joan Josep Carvajal Martí'], emails: ['mariacinta.pujol@urv.cat', 'joanjosep.carvajal@urv.cat'], credits: '3', id: '17274215', name: 'Nucleación y Crecimiento de Cristales', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86', year: null, quadri: '1' },
  {professors: ['Maria Cinta Pujol Baiges', 'Xavier Mateos Ferré', 'Joan Josep Carvajal Martí'], emails: ['mariacinta.pujol@urv.cat', 'xavier.mateos@urv.cat', 'joanjosep.carvajal@urv.cat'], credits: '3', id: '17274214', name: 'Nuevos Materiales y Nanociencia', color: '#733f1d', bgcolor: '#ffece9', bordercolor: '#cb7f52', year: null, quadri: '1' },
  {professors: ['Aïda Valls Mateu', 'Maria Ferré Bergadà', 'Neus Budesca Hernando', 'Esteban Herreros Suarez', 'Elena Mercedes Figueroa Cabrera'], emails: ['aida.valls@urv.cat', 'maria.ferre@urv.cat', 'neus.budesca@urv.cat', 'esteban.herreros@urv.cat', 'elenamercedes.figueroa@urv.cat'], credits: '6', id: '17274216', name: 'Programación', color: '#734d1d', bgcolor: '#fff4e9', bordercolor: '#cba152', year: null, quadri: '1' },
  {professors: ['Manuel Sanromà Lucia', 'Maria Dolores Puigjaner Riba'], emails: ['manuel.sanroma@urv.cat', 'dolors.puigjaner@urv.cat'], credits: '6', id: '17274227', name: 'Revoluciones en Física y Matemáticas', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb', year: null, quadri: '1' },
  {professors: ['Alejandro Arenas Moreno', 'Sergio Gómez Jiménez'], emails: ['alexandre.arenas@urv.cat', 'sergio.gomez@urv.cat'], credits: '6', id: '17274220', name: 'Aprendizaje Automático y Minería de Datos', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86', year: null, quadri: '2' },
  {professors: ['Carlos Aliagas Castell'], emails: ['carles.aliagas@urv.cat'], credits: '6', id: '17274205', name: 'Computación Paralela y Masiva', color: '#73401d', bgcolor: '#ffece9', bordercolor: '#cb8052', year: null, quadri: '2' },
  {professors: ['Albert Oller Pujol', 'Raúl Calavia Boldú', 'Daniel Flores Elias'], emails: ['albert.oller@urv.cat', 'raul.calavia@urv.cat', 'daniel.flores@urv.cat'], credits: '6', id: '17274206', name: 'Control Automático', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb', year: null, quadri: '2' },
  {professors: ['Amadeu Vives Ventura', 'Génesis María Guarimata Salinas'], emails: ['amadeu.vives@urv.cat', 'genesis.guarimata@urv.cat'], credits: '6', id: '17274225', name: 'Economía y Organización de Empresas', color: '#734d1d', bgcolor: '#fff4e9', bordercolor: '#cba152', year: null, quadri: '2' },
  {professors: ['Jordi Duch Gavaldà', 'David Gámez Alari', 'Marc Ruiz Rodríguez', 'Ramon Castells Amat', 'Juan Baustista Pérez Mingot'], emails: ['jordi.duch@urv.cat', 'david.gameza@urv.cat', 'marc.ruiz@urv.cat', 'ramon.castells@urv.cat', 'juanbaustista.perez@urv.cat'], credits: '6', id: '17274208', name: 'Estructuras de Datos', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb', year: null, quadri: '2' },
  {professors: [], emails: [], credits: '3', id: '17274222', name: 'Estudios en el Marco de Convenios de Movilidad II', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86', year: null, quadri: '2' },
  {professors: ['Carlos Aliagas Castell', 'Maria dels Àngels Moncusí Mercadé', 'Carles Anglés Tafalla', 'Jordi Massaguer Pla', 'Stephane Salaet Fernández'], emails: ['carles.aliagas@urv.cat', 'angels.mocusi@urv.cat', 'carles.angles@urv.cat', 'jordi.massaguer@urv.cat', 'stephane.salaet@urv.cat'], credits: '6', id: '17274210', name: 'Fundamentos de Sistemas Operativos', color: '#734b1d', bgcolor: '#fffae9', bordercolor: '#cb9762', year: null, quadri: '2' },
  {professors: ['Hatem Abdellatif Fatahallah Ibrahim Mahmoud'], emails: ['hatem.abdellatif@urv.cat'], credits: '6', id: '17274228', name: 'Infraestructuras para el Big Data', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb', year: null, quadri: '2' },
  {professors: ['Antonio Moreno Ribas', 'David Sánchez Ruenes', 'Roger Mallol Parera'], emails: ['antonio.moreno@urv.cat', 'david.sanchez@urv.cat', 'roger.mallol@urv.cat'], credits: '6', id: '17274211', name: 'Inteligencia Artificial', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb', year: null, quadri: '2' },
  {professors: ['Manuel Sanromà Lucia', 'Carlos García Gómez'], emails: ['manuel.sanroma@urv.cat', 'carlos.garciag@urv.cat'], credits: '6', id: '17274226', name: 'Introducción a la Astrofísica', color: '#1d4a73', bgcolor: '#eaf4ff', bordercolor: '#5297cb', year: null, quadri: '2' },
  {professors: ['Jordi Castellà Roca', 'Antoni Cortès Martínez', 'Cristofol Dauden Esmel'], emails: ['jordi.castella@urv.cat', 'toni.cortes@urv.cat', 'cristofol.dauden@urv.cat'], credits: '6', id: '17274217', name: 'Seguridad en Redes', color: '#1d7340', bgcolor: '#eafff4', bordercolor: '#52cb86', year: null, quadri: '2' },
  {professors: ['Marta Moya Arevalo', 'Oriol Farràs Ventura', 'Carlos Andres Lara Niño'], emails: ['marta.moya@urv.cat', 'oriol.farras@urv.cat', 'carlos.lara@urv.cat'], credits: '6', id: '17274218', name: 'Teoría de la Codificación', color: '#5a1d73', bgcolor: '#fbeaff', bordercolor: '#a052cb', year: null, quadri: '2' },
  {professors: ['Carlos Barberà Escoí'], emails: ['carlos.barbera@urv.cat'], credits: '6', id: '17274501', name: 'Prácticas Externas I', color: '#734b1d', bgcolor: '#fffae9', bordercolor: '#cb9762', year: null, quadri: null },
  {professors: ['Carlos Barberà Escoí'], emails: ['carlos.barbera@urv.cat'], credits: '6', id: '17274502', name: 'Prácticas Externas II', color: '#733f1d', bgcolor: '#ffece9', bordercolor: '#cb7f52', year: null, quadri: null },
]



export const SUBJECTS_COLORS_OBJ: Record<string, string> = {
  'Otros': '#000000',
  ...SUBJECTS_COLORS_11,
  ...SUBJECTS_COLORS_12,
  ...SUBJECTS_COLORS_21,
  ...SUBJECTS_COLORS_22,
  ...SUBJECTS_COLORS_31,
  ...SUBJECTS_COLORS_32,
  ...SUBJECTS_COLORS_41,
  ...SUBJECTS_COLORS_42
}
export const SUBJECTS_BORDER_COLORS_OBJ: Record<string, string> = {
  'Otros': '#000000',
  ...SUBJECTS_BORDER_COLORS_11,
  ...SUBJECTS_BORDER_COLORS_12,
  ...SUBJECTS_BORDER_COLORS_21,
  ...SUBJECTS_BORDER_COLORS_22,
  ...SUBJECTS_BORDER_COLORS_31,
  ...SUBJECTS_BORDER_COLORS_32,
  ...SUBJECTS_BORDER_COLORS_41,
  ...SUBJECTS_BORDER_COLORS_42
}
export const SUBJECTS_BG_COLORS_OBJ: Record<string, string> = {
  'Otros': '#ffffff',
  ...SUBJECTS_BG_COLORS_11,
  ...SUBJECTS_BG_COLORS_12,
  ...SUBJECTS_BG_COLORS_21,
  ...SUBJECTS_BG_COLORS_22,
  ...SUBJECTS_BG_COLORS_31,
  ...SUBJECTS_BG_COLORS_32,
  ...SUBJECTS_BG_COLORS_41,
  ...SUBJECTS_BG_COLORS_42
}


export const SUBJECTS_FINAL = SUBJECTS.flatMap((dim1, index1) => 
  dim1.flatMap((dim2, index2) => 
    dim2.map((subject) => ({
      name: subject,
      color: SUBJECTS_COLORS_OBJ[subject],
      bgcolor: SUBJECTS_BG_COLORS_OBJ[subject],
      bordercolor: SUBJECTS_BORDER_COLORS_OBJ[subject],
      year: String(index1 + 1),
      quadri: String(index2 + 1),
    }))
  )
);

export const OPTATIVES_FINAL = OPTATIVES.map((opt, ind) => {
  return {
    name: opt,
    color: OPTATIVES_COLORS_OBJ[opt],
    bgcolor: OPTATIVES_BG_COLORS_OBJ[opt],
    bordercolor: OPTATIVES_BORDER_COLORS_OBJ[opt],
  }
})

export const SBJ = [...SUBJECTS_FINAL, ...OPTATIVES_FINAL]

export const SUBJECTS_PLAIN: string[] = [
  'Otros',
  ...SUBJECTS.flat(2),
  ...OPTATIVES
]

export const SUBJECTS_PLAIN_WITHOUT_OTHERS: string[] = [
  ...SUBJECTS.flat(2),
  ...OPTATIVES
]

