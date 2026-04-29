import Link from 'next/link';
import { SECTIONS } from './constants';
import { 
  HelpCircle, 
  Clock, 
  Users, 
  Settings, 
  MapPin, 
  Lightbulb, 
  BookOpen,
  ArrowRight
} from 'lucide-react';

const iconMap: Record<string, any> = {
  que: HelpCircle,
  quan: Clock,
  qui: Users,
  com: Settings,
  on: MapPin,
  perque: Lightbulb,
};

export default function Home() {
  const contentSections = SECTIONS.filter(s => s.id !== 'fonts');
  const referenceSections = SECTIONS.filter(s => s.id === 'fonts');

  // Split sections into two groups for the side columns
  const leftSections = contentSections.slice(0, 3);
  const rightSections = contentSections.slice(3, 6);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center overflow-x-hidden bg-slate-950">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {/* Main Hero Section - Fits in Viewport */}
      <div className="relative z-10 w-full max-w-[1400px] px-6 min-h-screen flex flex-col items-center justify-center py-20">
        
        {/* Top Header - More Compact */}
        <header className="w-full text-center mb-6">
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none uppercase inline-block drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            MÉS ENLLÀ DELS <span className="text-blue-400">FORATS NEGRES</span>
          </h1>
          <div className="w-32 h-1 bg-blue-500 mt-3 mx-auto rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
        </header>

        {/* Middle Row: Left Sections | Subtitle | Right Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr_1fr] items-center gap-4 w-full">
          
          {/* Left Column */}
          <div className="flex flex-col gap-2.5 order-2 lg:order-1">
            {leftSections.map((section) => {
              const Icon = iconMap[section.id] || HelpCircle;
              return (
                <Link
                  key={section.id}
                  href={section.path}
                  className="group relative p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-xl hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300 transform hover:-translate-x-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                        {section.label}
                      </h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Center Column - Subtitle */}
          <div className="flex flex-col items-center text-center order-1 lg:order-2 px-2 py-4">
            <div className="relative">
              <div className="absolute inset-0 w-48 h-48 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 border border-blue-500/10 rounded-full animate-[spin_20s_linear_infinite]" />
              <p className="relative z-10 text-lg md:text-xl text-slate-300 font-light leading-snug italic max-w-sm drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                "La crisi dels forats negres i la cerca d'objectes compactes exòtics en la frontera de la física."
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-2.5 order-3">
            {rightSections.map((section) => {
              const Icon = iconMap[section.id] || HelpCircle;
              return (
                <Link
                  key={section.id}
                  href={section.path}
                  className="group relative p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-xl hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300 transform hover:translate-x-1"
                >
                  <div className="flex items-center gap-3 lg:flex-row-reverse">
                    <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="text-left lg:text-right w-full">
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                        {section.label}
                      </h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <div className="w-1 h-6 bg-slate-500 rounded-full"></div>
        </div>
      </div>

      {/* Footer Section - Hidden below the fold */}
      <footer className="relative z-10 w-full bg-slate-950/80 backdrop-blur-xl border-t border-white/5 py-10 flex flex-col items-center">
        {referenceSections.map((section) => (
          <Link
            key={section.id}
            href={section.path}
            className="group flex items-center gap-3 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            <BookOpen size={18} />
            <span className="text-xs font-black tracking-widest uppercase">{section.label} i Referències</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        ))}
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.5em] mt-6">
          GEMiF • Divulgació Científica
        </p>
      </footer>
    </div>
  );
}
