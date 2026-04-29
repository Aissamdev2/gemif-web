'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SECTIONS } from '../constants';

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/astro';

  const mainSections = SECTIONS.filter(s => s.id !== 'fonts');
  const fontSection = SECTIONS.find(s => s.id === 'fonts');

  return (
    <nav className={`${isHome ? 'absolute' : 'sticky'} top-0 w-full z-50 transition-all duration-500 ${
      isHome 
        ? 'bg-transparent border-none' 
        : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800'
    }`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Author */}
          <Link href="/astro" className="flex items-baseline gap-3 group">
            <span className={`font-black text-xl tracking-tighter transition-transform group-hover:scale-105 ${
              isHome ? 'text-white' : 'text-blue-600'
            }`}>
              FESTIVAL GALÀCTIC
            </span>
            <span className={`text-[10px] font-medium tracking-[0.2em] uppercase transition-colors hidden sm:inline ${
              isHome ? 'text-slate-300/60 group-hover:text-white' : 'text-slate-500 group-hover:text-blue-600'
            }`}>
              <span className="mx-1 opacity-20">|</span> Aissam Khadraoui
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-2">
            <div className={`flex items-center p-1 rounded-2xl border ${
              isHome ? 'bg-white/5 border-white/10 backdrop-blur-sm' : 'bg-slate-100/50 border-slate-200'
            }`}>
              {mainSections.map((section) => {
                const isActive = pathname === section.path;
                return (
                  <Link
                    key={section.id}
                    href={section.path}
                    className={`relative px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      isActive
                        ? isHome ? 'text-blue-400 bg-white/10 shadow-sm' : 'text-blue-600 bg-white shadow-sm'
                        : isHome
                          ? 'text-slate-300 hover:text-white hover:bg-white/5'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {section.label}
                    {isActive && (
                      <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full shadow-[0_0_8px_#3b82f6] ${
                        isHome ? 'bg-blue-400' : 'bg-blue-600'
                      }`}></span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Separated Fonts Link */}
            {fontSection && (
              <Link
                href={fontSection.path}
                className={`ml-4 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                  pathname === fontSection.path
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : isHome
                      ? 'border-white/20 text-slate-300 hover:bg-white hover:text-slate-900 hover:border-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500'
                }`}
              >
                {fontSection.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
