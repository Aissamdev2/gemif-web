import ImageSlot from "../components/ImageSlot";
import SectionWrapper from "../components/SectionWrapper";

export default function QuePage() {
  return (
    <SectionWrapper>
      <article className="max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
        {/* ... existing content ... */}
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-8 border-b-4 border-blue-500 pb-2 inline-block">
        SECCIÓ 1: QUÈ
      </h1>
      <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">
        L'Enigma de l'Univers Fosc i la Crisi dels Forats Negres
      </h2>

      <section className="mb-10 space-y-4">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
          El Paradigma Clàssic: Què dicta la norma?
        </h3>
        <p>
          Durant dècades, un dogma irrefutable en l'astrofísica moderna ha dictat que els <strong>objectes compactes</strong> 
          —cossos autogravitants amb una massa M i un radi R tals que la seva compacitat assoleix valors extrems de l'ordre de 
          <em className="font-serif"> GM/(c² R) ∼ 1</em>— han de ser obligatòriament estrelles de neutrons o forats negres.
        </p>
        <p>
          Aquesta afirmació no és un simple caprici teòric, sinó que ve predita de manera robusta per l'evolució estel·lar i 
          per la universalitat del col·lapse gravitacional dins del marc de la <strong>Teoria de la Relativitat General d'Albert Einstein</strong>. 
          Sota aquesta teoria, qualsevol objecte compacte amb una massa que superi unes quantes vegades la del Sol ha de ser 
          ineludiblement un forat negre clàssic, normalment descrit per la <em className="italic">mètrica de Kerr</em> (que defineix els forats negres en rotació).
        </p>
      </section>

      <section className="mb-10 p-6 bg-slate-100 dark:bg-slate-900 rounded-xl border-l-4 border-red-500">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
          La Crisi Teòrica: Per què qüestionem Einstein?
        </h3>
        <p>
          Tot i que els forats negres són actualment els pilars fonamentals de l'astrofísica d'altes energies, la cosmologia 
          i l'astronomia d'ones gravitacionals, les seves solucions úniques amaguen problemes tan profunds que posen en perill 
          la nostra comprensió de l'univers.
        </p>
        <ul className="space-y-4">
          <li>
            <strong>Misteri interior:</strong> L'interior de les estrelles ultradenses podria involucrar nous graus de llibertat 
            associats amb la matèria fosca (85% de la matèria de l'univers).
          </li>
          <li>
            <strong>Paradoxa de la informació:</strong> L'evaporació per radiació de Hawking és incompatible amb la unitarietat 
            de la mecànica quàntica.
          </li>
          <li>
            <strong>Singularitats:</strong> Els forats negres amaguen punts on la mateixa teoria d'Einstein es trenca de manera catastròfica.
          </li>
        </ul>
        <p className="mt-4 font-medium italic">
          "Quan es tenen en compte els efectes quàntics, la presència d'un 'horitzó d'esdeveniments' es torna altament problemàtica."
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {[
          "Existeixen a l'univers objectes compactes diferents dels forats negres i les estrelles de neutrons?",
          "Tots els forats negres de l'univers compleixen exactament amb les prediccions de la Relativitat General?",
          "Existeixen realment els forats negres clàssics?"
        ].map((q, i) => (
          <div key={i} className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-center font-medium">
            {q}
          </div>
        ))}
      </div>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
          Els Impostors: Què són els Objectes Compactes Exòtics (ECOs)?
        </h3>
        <p>
          Per tal de resoldre el problema de les singularitats i de la pèrdua d'informació, la comunitat teòrica ha desenvolupat 
          models d'allò que s'anomena <strong>Objectes Compactes Exòtics (ECOs)</strong> o "imitadors de forats negres".
        </p>
        
        <div className="space-y-6 mt-6">
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
            <h4 className="font-bold text-blue-500">Gravastars (Estrelles de Buit Gravitacional)</h4>
            <p className="text-sm mt-2">
              L'estrella pateix una transició de fase del buit quàntic a prop de l'horitzó. El seu interior està sostingut per 
              <strong>energia fosca</strong> amb pressió negativa (p=−ρ), eliminant la singularitat.
            </p>
          </div>
          
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
            <h4 className="font-bold text-blue-500">Estrelles de Bosons</h4>
            <p className="text-sm mt-2">
              Objectes sense horitzó formats per camps bosònics massius o camps escalars complexos. Es mantenen estables gràcies 
              a la repulsió dels seus propis camps.
            </p>
          </div>
          
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
            <h4 className="font-bold text-blue-500">Fuzzballs i Forats de Cusc (Wormholes)</h4>
            <p className="text-sm mt-2">
              Proposats per la teoria de cordes, els fuzzballs reparteixen els seus càrrecs entre múltiples centres sense horitzons. 
              Els forats de cuc connecten dues regions de l'espai-temps mitjançant matèria exòtica.
            </p>
          </div>
        </div>
      </section>

      <ImageSlot 
        src="/infografies/que_info.png"
        alt="Infografia comparativa d'Objectes Compactes Exòtics" 
        caption="Figura 1: El xoc entre el model de forat negre clàssic (amb singularitat) i els models teòrics alternatius (ECOs), posats a prova per la tecnologia actual."
      />

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
          Com podem desemmascarar-los?
        </h3>
        <p className="mb-4">
          Avui dia tenim dues grans eines d'avantguarda per posar aquestes teories a prova:
        </p>
        <ol className="list-decimal pl-5 space-y-4">
          <li>
            <strong>Les Ones Gravitacionals i el fenomen dels "Ecos":</strong> Quan dos cossos es fusionen, si el resultat és un 
            ECO ultra-compacte, es crea una "cavitat" que provoca <em>ecos gravitacionals</em> en la fase de ringdown.
          </li>
          <li>
            <strong>Imatges de Telescopis (EHT):</strong> Les imatges d'ECOs podrien mimetitzar els forats negres, però tindrien 
            diferències òptiques clares com la manca d'una "ombra interior" prominent i anells de llum en forma de mitja lluna.
          </li>
        </ol>
      </section>

      <footer className="bg-slate-900 text-white p-8 rounded-2xl mt-12">
        <h3 className="text-2xl font-bold mb-4 text-blue-400">En conclusió</h3>
        <p className="text-lg leading-relaxed">
          Ens trobem davant de la qüestió teòrica més gran del segle XXI. Descobrir si l'objecte supermassiu del centre de les 
          galàxies és un Forat Negre clàssic o un objecte governat per la gravetat quàntica sense horitzó (un ECO), significaria 
          una <strong>revolució total</strong> a les lleis de la física fonamental.
        </p>
      </footer>
    </article>
    </SectionWrapper>
  );
}
