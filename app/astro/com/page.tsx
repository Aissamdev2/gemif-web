import ImageSlot from "../components/ImageSlot";
import SectionWrapper from "../components/SectionWrapper";

export default function ComPage() {
  return (
    <SectionWrapper>
      <article className="max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
        {/* ... existing header ... */}
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-8 border-b-4 border-blue-500 pb-2 inline-block">
          SECCIÓ 4: COM
        </h1>
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6 uppercase tracking-wide">
          Mètodes i Eines: Desxifrant l'Invisible
        </h2>

        <section className="mb-12">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">La Nova Era de l'Astronomia Multimissatger</h3>
          <p className="mb-6">
            Fins fa molt poc, la humanitat només podia mirar l'univers utilitzant la llum. Però els forats negres, per la seva pròpia naturalesa, 
            no emeten llum. Aleshores, com podem estudiar-los o desemmascarar els seus possibles "impostors", els Objectes Compactes Exòtics (ECOs)? 
            La resposta rau en una revolució tecnològica sense precedents: avui dia no només "mirem" el cosmos, sinó que també l'"escoltem".
          </p>
          <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl border-l-4 border-blue-500">
            <p className="text-sm italic">
              "La física d'avantguarda utilitza diferents 'missatgers' astrofísics en paral·lel, combinant observacions visuals de superalta resolució, 
              anàlisi d'òrbites extremes i deteccions de la mateixa vibració de l'espai-temps."
            </p>
          </div>
        </section>

        <ImageSlot 
          src="/infografies/com_info.png"
          alt="Resum visual de les eines d'estudi"
          caption="Figura 4: Resum visual de les quatre grans eines per estudiar la gravetat extrema i desemmascarar objectes exòtics. S'hi inclouen els interferòmetres d'ones gravitacionals (per detectar Nombres de Love i ecos), la xarxa EHT (per capturar l'ombra i l'anell de fotons), l'instrument GRAVITY (dinàmica orbital d'estrelles) i les missions futures com LISA per captar el senyal pur de les EMRIs"
        />

        {/* 1. Ones Gravitacionals */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="bg-blue-600 text-white p-3 rounded-xl mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">1. Ones Gravitacionals (L'"oïda" còsmica)</h3>
          </div>
          
          <p className="mb-8">
            L'eina més revolucionària són els detectors com <strong>LIGO, Virgo i KAGRA</strong>. Detecten canvis en el teixit de l'espai-temps menors que l'amplada d'un protó. 
            Busquem anomalies en tres fronts clau:
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <h4 className="font-bold text-blue-500 mb-2">Nombres de Love</h4>
              <p className="text-xs">
                Mesuren la resistència a ser deformat. Segons Einstein, els forats negres tenen un Nombre de Love de <strong>zero</strong>. 
                Les estrelles de bosons, en canvi, tindrien una deformabilitat elàstica mesurable.
              </p>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <h4 className="font-bold text-blue-500 mb-2">Espectroscòpia</h4>
              <p className="text-xs">
                Analitza els "toms" o modes de vibració (QNMs) de l'objecte fusionat. Els ECOs trenquen la <strong>isospectralitat</strong> 
                i presenten "doublets" de modes que els delaten.
              </p>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <h4 className="font-bold text-blue-500 mb-2">Ecos Gravitacionals</h4>
              <p className="text-xs">
                Si no hi ha horitzó sinó una superfície física, les ones reboten en una cavitat interna creant un <strong>eco retardat</strong> 
                minuts o hores després de la fusió.
              </p>
            </div>
          </div>
        </section>

        {/* 2. La Xarxa de Telescopis */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="bg-blue-600 text-white p-3 rounded-xl mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">2. La Xarxa de Telescopis i Imatges (La "vista" còsmica)</h3>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Interferometria de Molt Llarga Base (VLBI)</h4>
              <p className="text-sm">
                L'EHT combina ràdiotelescopis per tot el planeta, creant un telescopi virtual de la mida de la Terra amb resolució suficient per veure una taronja a la Lluna.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <h5 className="font-bold text-blue-500 text-sm mb-2">Ombra i Ray-Tracing</h5>
                <p className="text-xs">
                  Simulem l'ombra projectada contra el disc d'acreció. Els ECOs sovint no tenen un "forat" negre tan fosc i formen 
                  sub-anells de llum en forma de <strong>mitja lluna</strong>.
                </p>
              </div>
              <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <h5 className="font-bold text-blue-500 text-sm mb-2">Polarització (EVPA)</h5>
                <p className="text-xs">
                  Estudiem com el camp magnètic interactua amb el plasma. La polarització de la llum delata geometries que només 
                  els forats negres poden sustentar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Dinàmica Orbital */}
        <section className="mb-16">
          <div className="flex items-center mb-6">
            <div className="bg-blue-600 text-white p-3 rounded-xl mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">3. Dinàmica Orbital Estel·lar Extrema</h3>
          </div>
          <p className="mb-4">
            Instrumental com el sistema <strong>GRAVITY</strong> (VLT, Xile) segueix el camí de les "Estrelles S" que orbiten Sagittarius A*.
          </p>
          <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            Mesurant el corriment cap al roig gravitacional d'estrelles com l'<strong>S2</strong>, comprovem si l'espai es corba segons les prediccions d'Einstein o si hi ha una estructura estesa (ECO) en lloc d'un punt infinit.
          </p>
        </section>

        {/* 4. El Futur */}
        <section className="mb-12 bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <span className="text-blue-400 mr-3">✦</span>
            4. El Futur: Les "EMRIs" i LISA
          </h3>
          <p className="text-sm leading-relaxed mb-6">
            La missió espacial <strong>LISA</strong> observarà les Extreme Mass-Ratio Inspirals: petits forats negres atrapats pel monstre supermassiu central. 
            Aquests petits objectes sondegen el camp gravitatori com una <strong>"agulla tocadiscos"</strong>.
          </p>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <h5 className="font-bold text-blue-300 text-xs uppercase tracking-widest mb-2">Escalfament de Marea (Tidal Heating)</h5>
            <p className="text-xs">
              Sols les òrbites EMRI ens permetran confirmar si l'energia s'absorbeix completament (horitzó) o si la dissipació 
              és ridículament baixa (Estrella de Bosons). Només llavors sabrem si la frontera del no-retorn és real.
            </p>
          </div>
        </section>
      </article>
    </SectionWrapper>
  );
}
