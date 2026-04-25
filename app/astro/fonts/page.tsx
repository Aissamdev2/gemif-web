import SectionWrapper from "../components/SectionWrapper";

export default function FontsPage() {
  const references = [
    {
      title: "Testing the nature of compact objects and the black hole paradigm",
      authors: "De Laurentis, M., & Pani, P.",
      journal: "General Relativity and Gravitation, 57, 39",
      year: "2025",
      type: "Review Paper",
      file: "/papers/36 Testing the nature of compact objects and the black hole paradigm.pdf"
    },
    {
      title: "Black hole spectroscopy and tests of general relativity with GW250114",
      authors: "Abac, A. G., et al. (LIGO-Virgo-KAGRA Collaboration)",
      journal: "arXiv",
      year: "2025",
      type: "Spectroscopy Analysis",
      file: "/papers/2509.08099v1.pdf"
    },
    {
      title: "No Love for black holes: tightest constraints on tidal Love numbers of black holes from GW250114",
      authors: "Andrés-Carcasona, M., & Caneva Santoro, G.",
      journal: "arXiv",
      year: "2025",
      type: "Love Numbers Study",
      file: "/papers/2512.01918v1.pdf"
    },
    {
      title: "Observational features of massive boson stars with thin disk accretion",
      authors: "Li, G.-P., Wu, M.-Q., He, K.-J., & Jiang, Q.-Q.",
      journal: "arXiv",
      year: "2025",
      type: "Imaging & Accretion",
      file: "/papers/2505.14734v1.pdf"
    },
    {
      title: "Implications of GW241011 for rotating exotic compact objects",
      authors: "Krishnendu, N. V., et al.",
      journal: "arXiv",
      year: "2025",
      type: "Exotic Objects Analysis",
      file: "/papers/2511.17341v1.pdf"
    }
  ];

  return (
    <SectionWrapper>
      <article className="max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-8 border-b-4 border-blue-500 pb-2 inline-block">
          FONTS I REFERÈNCIES
        </h1>
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6 uppercase tracking-wide">
          Biblioteca Documental de la Recerca
        </h2>

        <p className="mb-10 text-lg">
          Aquesta secció recull les fonts documentals i els papers científics originals que han servit de base per a l'elaboració d'aquest treball. 
          Pots consultar les cites acadèmiques exactes i descarregar els documents per a una anàlisi detallada de les dades.
        </p>

        <div className="space-y-6">
          {references.map((ref, i) => (
            <div key={i} className="group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-900/50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-grow">
                  <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
                    {ref.type}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {ref.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">
                    {ref.authors}
                  </p>
                  <p className="text-xs text-slate-500 italic">
                    {ref.journal} ({ref.year})
                  </p>
                </div>
                
                <div className="flex-shrink-0 w-full md:w-auto">
                  <a 
                    href={ref.file} 
                    download 
                    className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all gap-3 text-sm shadow-xl shadow-slate-200 dark:shadow-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>
    </SectionWrapper>
  );
}
