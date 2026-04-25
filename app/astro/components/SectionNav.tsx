'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SECTIONS } from '../constants';

export default function SectionNav() {
  const pathname = usePathname();
  const currentIndex = SECTIONS.findIndex((s) => s.path === pathname);

  const prev = currentIndex > 0 ? SECTIONS[currentIndex - 1] : null;
  const next = currentIndex < SECTIONS.length - 1 ? SECTIONS[currentIndex + 1] : null;

  if (currentIndex === -1 && pathname !== '/astro') return null;

  return (
    <div className="mt-12 py-8 border-t border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-center">
        <div>
          {prev ? (
            <Link
              href={prev.path}
              className="inline-flex items-center px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-lg transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Enrere: {prev.label}
            </Link>
          ) : (
            <Link
              href="/astro"
              className="inline-flex items-center px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-lg transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Inici
            </Link>
          )}
        </div>
        <div>
          {next ? (
            <Link
              href={next.path}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all transform hover:-translate-y-1"
            >
              Endavant: {next.label}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : pathname === '/astro' ? (
            <Link
              href={SECTIONS[0].path}
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] transition-all transform hover:-translate-y-1 text-lg"
            >
              Començar l'Exploració
              <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
