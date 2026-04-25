import ImageSlot from "../components/ImageSlot";
import SectionWrapper from "../components/SectionWrapper";

export default function PerquePage() {
  return (
    <SectionWrapper>
      <article className="max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-8 border-b-4 border-blue-500 pb-2 inline-block">
          SECCIÓ 6: PER QUÈ
        </h1>
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6 uppercase tracking-wide">
          Importància i Futur: A les Portes d'una Nova Física
        </h2>

        {/* 1. Més enllà de l'Astrofísica */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Més enllà de l'Astrofísica: El xoc de dos mons</h3>
          <p className="mb-6">
            Aquest camp de recerca representa el camp de batalla on es lliura el conflicte més profund de la ciència moderna: 
            la <strong>incompatibilitat entre la Teoria de la Relativitat General i la Mecànica Quàntica</strong>.
          </p>

          <ImageSlot 
            src="/infografies/perque_info.png"
            alt="Esquema d'impacte fonamental i futur"
            caption="Figura 6: Esquema visual sobre l'impacte fonamental i el futur de la recerca en gravetat extrema. S'il·lustra la tensió entre la validació contínua de la Relativitat General (amb observacions com GW250114 limitant de manera dràstica els Nombres de Love) i la necessitat de trobar una teoria de la Gravetat Quàntica per resoldre l'enigma de les singularitats, amb l'esperança posada en detectors de pròxima generació com LISA."
          />

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl">
              <h4 className="font-bold text-red-600 dark:text-red-400 mb-2 italic">La Singularitat</h4>
              <p className="text-sm">
                La teoria d'Einstein prediu la seva pròpia destrucció al cor del forat negre. Les matemàtiques fallen i ens deixen cecs davant la realitat física.
              </p>
            </div>
            <div className="p-6 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl">
              <h4 className="font-bold text-orange-600 dark:text-orange-400 mb-2 italic">Pèrdua d'Informació</h4>
              <p className="text-sm">
                Si la informació es destrueix dins l'horitzó, es violen els principis quàntics de la <strong>unitarietat</strong>. Els ECOs podrien ser la solució a aquesta paradoxa.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Connexions Inesperades */}
        <section className="mb-12">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Connexions Inesperades: Matèria Fosca i Teoria de Cordes</h3>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 p-6 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-2xl">
              <div className="md:w-1/4 font-bold text-purple-600 dark:text-purple-400 uppercase tracking-tighter text-sm">Matèria Fosca</div>
              <div className="md:w-3/4 text-sm">
                Les <strong>Estrelles de Bosons</strong> podrien estar fetes de matèria fosca (85% de l'univers). Detectar-les resoldria dos misteris d'un sol cop: què substitueix les singularitats i de què està fet el cosmos.
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl">
              <div className="md:w-1/4 font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter text-sm">Teoria de Cordes</div>
              <div className="md:w-3/4 text-sm">
                Models com els <strong>fuzzballs</strong> suggereixen que l'horitzó no és un buit, sinó una "superfície" borrosa on la informació es conserva en estats quàntics fonamentals.
              </div>
            </div>
          </div>
        </section>

        {/* 3. L'Estat Actual */}
        <section className="mb-12">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">L'Estat Actual: La victòria momentània d'Einstein</h3>
          <p className="mb-6">
            L'anàlisi de <strong>GW250114</strong> ha imposat restriccions severíssimes. Amb un límit de Love quasi zero, s'ha descartat amb un 90% de confiança l'existència d'Estrelles de Bosons en aquest sistema.
          </p>
          <div className="p-5 bg-blue-600 text-white rounded-2xl text-center shadow-lg">
            <p className="font-bold text-lg italic">"El paradigma d'Einstein s'ha reforçat, però... és una victòria definitiva?"</p>
          </div>
        </section>

        {/* 4. El Futur */}
        <section className="mb-12">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">El Futur: Escoltant els xiuxiuejos de la Gravetat Quàntica</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative p-6 bg-slate-100 dark:bg-slate-900 border-t-4 border-blue-500 rounded-b-2xl">
              <h4 className="font-bold mb-3">Detectors de 3a Generació (3G)</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                <strong>Einstein Telescope</strong> i <strong>Cosmic Explorer</strong> detectaran col·lisions tan nítides que podrem resoldre els "doblets" de freqüències anòmals que delatarien els ECOs.
              </p>
            </div>
            <div className="relative p-6 bg-slate-100 dark:bg-slate-900 border-t-4 border-blue-500 rounded-b-2xl">
              <h4 className="font-bold mb-3">LISA i les EMRIs</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                LISA sondejarà cada centímetre de la geometria de l'espai-temps. Si detectem petites ressonàncies anòmales, demostrarem que l'horitzó no és un abisme perfecte.
              </p>
            </div>
          </div>
        </section>

        {/* Reflexió Final */}
        <footer className="mt-16 mb-8 p-10 bg-slate-900 text-white rounded-[3rem] text-center border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          <h3 className="text-2xl font-black mb-6 tracking-tight text-blue-400">Reflexió Crítica Final</h3>
          <p className="text-lg leading-relaxed mb-8 max-w-3xl mx-auto font-light">
            Acceptar cegament les singularitats infinites suposa rendir-nos davant el col·lapse de les nostres lleis. 
            Tant si els forats negres obeeixen fil per randa a Einstein, com si descobrim estranys miratges quàntics, 
            aquest camp d'estudi haurà redefinit la nostra comprensió de la realitat.
          </p>
          <div className="inline-block px-8 py-3 bg-blue-600 rounded-full font-bold text-sm tracking-widest uppercase">
            Cap a la Gravetat Quàntica
          </div>
        </footer>
      </article>
    </SectionWrapper>
  );
}
