import ImageSlot from "../components/ImageSlot";
import SectionWrapper from "../components/SectionWrapper";

export default function QuanPage() {
  const timeline = [
    {
      year: "1915 - 1916",
      title: "El naixement de la Relativitat i l'Abisme de Schwarzschild",
      content: "La història arrenca a finals de l'any 1915, quan Albert Einstein va publicar la seva revolucionària Teoria de la Relativitat General. Sorprenentment, tan sols uns mesos després, Karl Schwarzschild va trobar el 1916 la primera solució matemàtica exacta. Aquesta mètrica preveia l'existència teòrica de cossos tan densos que ni la llum en podria escapar: havia nascut el concepte del forat negre clàssic."
    },
    {
      year: "1963",
      title: "El motor de l'Univers i la Mètrica de Kerr",
      content: "El matemàtic Roy Kerr va aconseguir un altre avenç fonamental: va descobrir la solució exacta per a un forat negre en rotació. Aquesta fita, coneguda com la 'mètrica de Kerr', és el model fonamental que s'utilitza actualment per descriure els forats negres reals observats. Va permetre extreure propietats inesperades com el procés de Penrose."
    },
    {
      year: "1960s - 1970s",
      title: "Paradoxes, Singularitats i les Primeres Alternatives",
      content: "Stephen Hawking i Roger Penrose van demostrar que el col·lapse gravitacional condueix inevitablement a singularitats on les lleis de la física es trenquen. El 1976, Hawking va postular la 'paradoxa de la pèrdua d'informació'. En aquesta època van sorgir les llavors dels models alternatius: Kaup (1968) i Ruffini (1969) van establir les bases de les 'Estrelles de Bosons'."
    },
    {
      year: "1986",
      title: "L'Aparició de les Estrelles de Bosons Massives",
      content: "Colpi, Shapiro i Wasserman van descobrir que introduint un 'potencial d'autointeracció quàrtica', les estrelles de bosons podien assolir masses comparables a les dels forats negres astrofísics. Això va obrir la porta a que l'univers pogués estar ple d'impostors indistingibles."
    },
    {
      year: "2015",
      title: "El Primer Crit Còsmic (GW150914)",
      content: "El 14 de setembre de 2015 s'inaugura l'astronomia d'ones gravitacionals. LIGO i Virgo observen directament les deformacions de l'espai-temps causades per la fusió de dos forats negres, demostrant que aquests binaris existeixen i xoquen segons la teoria d'Einstein."
    },
    {
      year: "2019 - 2022",
      title: "Imatges de l'Horitzó d'Esdeveniments (M87* i Sagittarius A*)",
      content: "L'EHT publica la primera imatge d'un forat negre supermassiu (M87*) el 2019, i de Sagittarius A* el 2022. Les ombres i anelles de fotons observades ofereixen una confirmació extraordinària de la Relativitat General en objectes gegantins."
    },
    {
      year: "Gener de 2025",
      title: "L'Era de l'Espectroscòpia d'Alta Precisió (GW250114)",
      content: "Es detecta l'esdeveniment GW250114 amb una relació senyal-soroll espectacular de 76. Aquesta precisió insòlita ha obert la porta a 'l'espectroscòpia de forats negres', aïllant harmònics i sobretons superiors (modes 221 i 440) per avaluar com ressona l'espai-temps."
    },
    {
      year: "Actualitat (2025/2026)",
      title: "La Caiguda dels Impostors (Nombres de Love)",
      content: "Fent ús de GW250114, s'han extret els Nombres de Love (deformabilitat de marea). El descobriment és rotund: els valors són tan pròxims a zero que exclouen gairebé del tot les estrelles de bosons, consolidant el paradigma de Kerr."
    }
  ];

  return (
    <SectionWrapper>
      <article className="max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-8 border-b-4 border-blue-500 pb-2 inline-block">
          SECCIÓ 2: QUAN
        </h1>
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6 uppercase tracking-wide">
          L'Evolució Històrica: D'una Curiositat Matemàtica a l'Espectroscòpia d'Alta Precisió
        </h2>

        <div className="mb-12 p-6 bg-blue-50 dark:bg-slate-900 rounded-2xl border-l-4 border-blue-500 italic">
          <p>
            "El llarg camí per entendre els abismes de l'Univers: El que va començar com una anomalia matemàtica a inicis del segle XX, 
            s'ha convertit avui en el camp de proves més extrem i rigorós de la ciència moderna."
          </p>
        </div>

        <ImageSlot 
          src="/infografies/quan_info.png"
          alt="Cronologia dels avenços en gravetat extrema"
          caption="Figura 2: Cronologia dels avenços fonamentals en l'estudi de la gravetat extrema. S'observa l'evolució des del marc teòric de la Relativitat General i les primeres hipòtesis de singularitat als anys 60-70, fins a l'era moderna de l'astronomia multimissatger (imatges de l'EHT i els detectors d'ones gravitacionals com LIGO/Virgo que culminen amb la precisió de l'esdeveniment GW250114)."
        />

        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-8 space-y-12 pb-8">
          {timeline.map((item, index) => (
            <div key={index} className="relative group">
              <div className="absolute -left-[41px] top-1 w-5 h-5 bg-blue-500 rounded-full border-4 border-white dark:border-slate-950 group-hover:scale-125 transition-transform"></div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-sm font-black text-blue-500 uppercase tracking-widest">{item.year}</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1 mb-3">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {item.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-12 p-6 bg-slate-900 text-white rounded-xl text-center">
          <p className="font-medium text-blue-400">El paradigma de Kerr es consolida, però l'escrutini matemàtic continua.</p>
        </footer>
      </article>
    </SectionWrapper>
  );
}
