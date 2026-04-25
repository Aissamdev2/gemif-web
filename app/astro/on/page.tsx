import ImageSlot from "../components/ImageSlot";
import SectionWrapper from "../components/SectionWrapper";

export default function OnPage() {
  return (
    <SectionWrapper>
      <article className="max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
        {/* ... (rest of header remains the same) */}
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-8 border-b-4 border-blue-500 pb-2 inline-block">
          SECCIÓ 5: ON
        </h1>
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6 uppercase tracking-wide">
          El Context Científic i Institucional: Una Xarxa a Escala Planetària
        </h2>

        <section className="mb-12">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 text-center md:text-left">La Ciència sense Fronteres: El món com a laboratori</h3>
          <p className="mb-6">
            Durant segles, l'astronomia va ser una ciència solitària. Avui dia, la recerca per posar a prova l'existència dels forats negres i buscar Objectes Compactes Exòtics (ECOs) desafia els límits geogràfics. El laboratori modern abasta tot el globus terrestre (i aviat, l'espai exterior).
          </p>
          <div className="p-6 bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-blue-800 rounded-3xl text-center italic font-medium">
            "La resposta a l'enigma no sorgirà d'un sol laboratori amagat en un soterrani; és una aliança colossal que teixeix les nostres eines a Louisiana, els boscos d'Europa, la roca de les mines japoneses i els cels de Xile i Hawaii."
          </div>
        </section>

        <ImageSlot 
          src="/infografies/on_info.png"
          alt="Mapa global d'instal·lacions i institucions"
          caption="Figura 5: Mapa de les principals instal·lacions d'avantguarda i institucions globals en la recerca de la gravetat extrema. S'hi ubiquen els interferòmetres d'ones gravitacionals de la xarxa LVK, els nodes de l'Event Horizon Telescope (EHT), l'observatori VLT (GRAVITY) i els centres de física teòrica líders."
        />

        {/* 1. L'Anell de l'Escolita */}
        <section className="mb-16">
          <div className="flex items-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="bg-blue-600 text-white p-2 rounded-lg mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">1. L'Anell de l'Escolita: Els Observatoris d'Ones Gravitacionals</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <h4 className="font-bold text-blue-600 mb-2">Estats Units (LIGO)</h4>
              <p className="text-xs leading-relaxed">
                Dos observatoris bessons a <strong>Hanford</strong> (Washington) i <strong>Livingston</strong> (Louisiana) amb braços de 4km. Operats per <strong>Caltech</strong> i el <strong>MIT</strong>, financats per la NSF.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <h4 className="font-bold text-blue-600 mb-2">Itàlia (Virgo)</h4>
              <p className="text-xs leading-relaxed">
                Situat a <strong>Cascina</strong> (Pisa). Braços de 3km liderats per l'<strong>INFN</strong> italià i el <strong>CNRS</strong> francès sota el paraigua de l'EGO.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <h4 className="font-bold text-blue-600 mb-2">Japó (KAGRA)</h4>
              <p className="text-xs leading-relaxed">
                Operat sota terra a la mina de <strong>Kamioka</strong>. Utilitza túnels criogènics per reduir el soroll tèrmic al mínim, una proesa de l'enginyeria nipona.
              </p>
            </div>
          </div>
        </section>

        {/* 2. L'Ull de la Terra */}
        <section className="mb-16">
          <div className="flex items-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="bg-blue-600 text-white p-2 rounded-lg mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h.5A2.5 2.5 0 0018 9.5V8a2 2 0 012-2h1.065" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">2. L'Ull de la Terra: La Xarxa de l'EHT</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="p-5 bg-slate-100 dark:bg-slate-900 rounded-2xl">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Xile (Desert d'Atacama)</h4>
                <p className="text-xs">Llar de l'<strong>ALMA</strong>, amb els cels més secs i transparents del món.</p>
              </div>
              <div className="p-5 bg-slate-100 dark:bg-slate-900 rounded-2xl">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Hawaii (Mauna Kea)</h4>
                <p className="text-xs">Telescopis de ràdio en altitud com el <strong>James Clerk Maxwell (JCMT)</strong>.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-5 bg-slate-100 dark:bg-slate-900 rounded-2xl">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Espanya (Pico Veleta)</h4>
                <p className="text-xs">Estació de l'<strong>IRAM</strong> al sud del país, clau per a la xarxa mil·limètrica.</p>
              </div>
              <div className="p-5 bg-slate-100 dark:bg-slate-900 rounded-2xl">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Pol Sud</h4>
                <p className="text-xs">El <strong>South Pole Telescope</strong>, sincronitzat des de les glaçades planures antàrtiques.</p>
              </div>
            </div>
          </div>
          <p className="mt-6 text-xs text-slate-500 text-center">
            Les dades es processen en superordinadors de centres com el <strong>Max Planck</strong> (Alemanya) i l'<strong>Observatori Haystack</strong> de l'MIT.
          </p>
        </section>

        {/* 3. Cels Clars */}
        <section className="mb-16 p-8 bg-slate-900 text-white rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full"></div>
          <h3 className="text-2xl font-bold mb-4">3. Cels Clars i Dinàmica Estel·lar: GRAVITY</h3>
          <p className="text-sm leading-relaxed mb-4">
            L'instrument <strong>GRAVITY</strong> s'aplica fonamentalment al complex europeu del <strong>VLT (Very Large Telescope)</strong> operat per l'ESO a <strong>Cerro Paranal (Xile)</strong>. 
          </p>
          <p className="text-sm leading-relaxed">
            Aquesta instal·lació és la llar austral necessària per seguir estrelles individuals mentre voregen el límit del no retorn al voltant de <strong>Sagittarius A*</strong>.
          </p>
        </section>

        {/* 4. Les Ments del Misteri */}
        <section className="mb-12">
          <div className="flex items-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="bg-blue-600 text-white p-2 rounded-lg mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">4. Les Ments del Misteri: Centres Teòrics</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3">Itàlia (Sapienza, Nàpols)</h4>
              <p className="text-xs">Bressol de la investigació del review. Equips liderats per <strong>P. Pani</strong> i <strong>M. De Laurentis</strong>, punta de llança en la proposta d'ECOs.</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3">Alemanya (Max Planck)</h4>
              <p className="text-xs">L'<strong>Institut Albert Einstein</strong> a Hannover i Potsdam, essencials en la modelització teòrica de formes d'ona.</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3">Amèrica del Nord</h4>
              <p className="text-xs"><strong>Harvard</strong> (CfA), l'<strong>Institut Perimeter</strong> al Canadà i entitats icòniques dels Estats Units.</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3">Països Baixos</h4>
              <p className="text-xs">La <strong>Universitat de Radboud</strong>, peça clau en el processament d'imatges de la col·laboració EHT.</p>
            </div>
          </div>
        </section>
      </article>
    </SectionWrapper>
  );
}
