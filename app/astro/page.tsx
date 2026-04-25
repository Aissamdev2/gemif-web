import Link from 'next/link';
import { SECTIONS } from './constants';

export default function Home() {
  const contentSections = SECTIONS.filter(s => s.id !== 'fonts');
  const referenceSections = SECTIONS.filter(s => s.id === 'fonts');

  return (
    <div className="relative w-full min-h-screen -mt-20 flex flex-col items-center justify-center overflow-hidden">
      {/* Astrophysical Background */}
      <div className="absolute inset-0 bg-slate-950 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.4)_0%,rgba(15,23,42,1)_100%)]"></div>
        <div className="absolute inset-0 opacity-20">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                top: `${(i * 137.5) % 100}%`,
                left: `${(i * 23.5) % 100}%`,
                width: `${1 + (i % 2)}px`,
                height: `${1 + (i % 2)}px`,
                opacity: 0.3 + (i % 5) / 10,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Content Container - Compacted */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 w-full max-w-4xl py-10">
        <header className="mb-8">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tighter drop-shadow-2xl uppercase">
            L'ENIGMA DE L'<span className="text-blue-500">UNIVERS FOSC</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto font-light leading-snug">
            La crisi dels forats negres i la cerca d'objectes compactes exòtics.
          </p>
        </header>

        {/* Main Content Sections - Compact Grid */}
        <section className="w-full mb-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h2 className="text-[10px] font-black tracking-[0.4em] text-blue-500/70 uppercase">
              Recorregut Científic
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {contentSections.map((section) => (
              <Link
                key={section.id}
                href={section.path}
                className="group relative px-4 py-3 bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-xl hover:border-blue-500/50 transition-all hover:bg-slate-800/60"
              >
                <div className="flex flex-col items-center">
                  <h3 className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                    {section.label}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* References Section - Ultra Compact */}
        <section className="w-full max-w-md">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-800 to-transparent mb-6"></div>
          <div className="flex justify-center">
            {referenceSections.map((section) => (
              <Link
                key={section.id}
                href={section.path}
                className="group flex items-center gap-2 px-6 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-full transition-all text-blue-400 hover:text-blue-300"
              >
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-xs font-black tracking-widest uppercase">{section.label} i Referències</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
