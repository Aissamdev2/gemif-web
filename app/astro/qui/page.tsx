import ImageSlot from "../components/ImageSlot";
import SectionWrapper from "../components/SectionWrapper";

export default function QuiPage() {
  return (
    <SectionWrapper>
      <article className="max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
        {/* ... existing content ... */}
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-8 border-b-4 border-blue-500 pb-2 inline-block">
          SECCIÓ 3: QUI
        </h1>
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6 uppercase tracking-wide">
          Els Protagonistes: De Genis Solitaris a Col·laboracions Globals
        </h2>

        <p className="mb-10 text-lg">
          L'arquitectura del coneixement: Qui ha fet què? El viatge per comprendre els objectes més foscos i densos de l'univers no és l'obra d'una sola ment, 
          sinó una odissea col·lectiva que abasta més d'un segle. Per entendre aquest camp, hem de cartografiar els noms i les contribucions dels qui han construït 
          —i els qui ara qüestionen— el paradigma dels forats negres.
        </p>

        {/* 1. Els Pioners Clàssics */}
        <section className="mb-12">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
            Els Pioners Clàssics (Els pares del paradigma)
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <h4 className="font-bold text-slate-900 dark:text-white text-lg">Albert Einstein</h4>
              <p className="text-sm text-blue-500 font-medium mb-2 uppercase">El gran arquitecte</p>
              <p className="text-sm">
                El 1915 va publicar la Teoria de la Relativitat General. Irònicament, Einstein mateix va dubtar durant molt de temps que els forats negres poguessin existir realment a la natura.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <h4 className="font-bold text-slate-900 dark:text-white text-lg">Karl Schwarzschild i Roy Kerr</h4>
              <p className="text-sm text-blue-500 font-medium mb-2 uppercase">Les solucions exactes</p>
              <p className="text-sm">
                Schwarzschild (1916) va trobar la primera solució demostrant l'abisme esfèric. Roy Kerr (1963) va resoldre les equacions per al forat negre en rotació, el model real que observem avui.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm md:col-span-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-lg">Stephen Hawking i Roger Penrose</h4>
              <p className="text-sm text-blue-500 font-medium mb-2 uppercase">Singularitats i Paradoxes</p>
              <p className="text-sm">
                Van demostrar que les lleis de la física es trenquen en les singularitats. Hawking va descobrir que els forats negres s'evaporen, destapant la incòmoda "paradoxa de la pèrdua d'informació".
              </p>
            </div>
          </div>
        </section>

        {/* 2. Els Teòrics de l'Exòtic */}
        <section className="mb-12">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
            Els Teòrics de l'Exòtic (Cercadors d'alternatives)
          </h3>
          <div className="space-y-4">
            <div className="p-5 bg-slate-100 dark:bg-slate-900/50 border-l-4 border-blue-500 rounded-r-xl">
              <p className="text-sm">
                <strong>D.J. Kaup, R. Ruffini i S. Bonazzola (Anys 60):</strong> Van teoritzar que certs camps quàntics podrien agrupar-se per formar objectes ultra-densos sense horitzó (Estrelles de Bosons).
              </p>
            </div>
            <div className="p-5 bg-slate-100 dark:bg-slate-900/50 border-l-4 border-blue-500 rounded-r-xl">
              <p className="text-sm">
                <strong>M. Colpi, S.L. Shapiro i I. Wasserman (1986):</strong> Van demostrar que les estrelles de bosons podrien tenir masses comparables a les dels forats negres, convertint-se en autèntics "impostors".
              </p>
            </div>
            <div className="p-5 bg-slate-100 dark:bg-slate-900/50 border-l-4 border-blue-500 rounded-r-xl">
              <p className="text-sm">
                <strong>P.O. Mazur i E. Mottola (2001):</strong> Creadors del concepte de "Gravastar", un objecte amb un interior d'energia fosca i una escorça prima de matèria normal.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Les Veus del Review Principal */}
        <section className="mb-12 p-8 bg-blue-600 text-white rounded-3xl shadow-xl">
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <span className="bg-white text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-black">3</span>
            Les Veus del Review Principal
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-bold border-b border-blue-400 pb-2 mb-4">Mariafelicia De Laurentis</h4>
              <p className="text-sm text-blue-100 leading-relaxed">
                Catedràtica a la Universitat de Nàpols. Peça fonamental en teories de gravetat modificada i simulacions per interpretar les imatges del telescopi EHT.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold border-b border-blue-400 pb-2 mb-4">Paolo Pani</h4>
              <p className="text-sm text-blue-100 leading-relaxed">
                Professor a la Universitat "Sapienza" de Roma. Referent mundial en la física dels ECOs; pioner en l'ús dels ecos gravitacionals i Nombres de Love.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Els Gegants de l'Observació */}
        <section className="mb-12">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">4</span>
            Els Gegants de l'Observació
          </h3>
          <div className="grid gap-6">
            <div className="flex flex-col md:flex-row gap-6 items-start p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="md:w-1/3 font-bold text-blue-600 dark:text-blue-400">LIGO, Virgo i KAGRA (LVK)</div>
              <div className="md:w-2/3 text-sm text-slate-600 dark:text-slate-400">
                Milers de científics responsables dels interferòmetres làser. L'estudi detallat de GW250114 ha permès esclafar gran part dels models d'estrelles de bosons gràcies a la deformabilitat de marea.
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="md:w-1/3 font-bold text-blue-600 dark:text-blue-400">Event Horizon Telescope (EHT)</div>
              <div className="md:w-2/3 text-sm text-slate-600 dark:text-slate-400">
                Sincronització de ràdiotelescopis globals per actuar com un sol ull de la mida de la Terra, donant-nos les primeres "fotografies" de M87* i Sgr A*.
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="md:w-1/3 font-bold text-blue-600 dark:text-blue-400">GRAVITY (R. Abuter et al.)</div>
              <div className="md:w-2/3 text-sm text-slate-600 dark:text-slate-400">
                Observacions de precisió de les estrelles (com S2) que orbiten al voltant de Sgr A*, confirmant que l'objecte central és extremadament compacte i fosc.
              </div>
            </div>
          </div>
        </section>

        <ImageSlot 
          src="/infografies/qui_info.png"
          alt="Mapa de protagonistes i col·laboracions"
          caption="Figura 3: Mapa de protagonistes i col·laboracions clau en la investigació de la gravetat extrema. S'hi destaquen els pioners de la Relativitat General, els creadors dels primers models teòrics alternatius (com les estrelles de bosons i gravastars) i els grans consorcis d'observació d'avantguarda actuals (LVK, EHT i GRAVITY) que testegen empíricament aquests paradigmes."
        />
      </article>
    </SectionWrapper>
  );
}
