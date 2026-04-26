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
    <div className="relative w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center overflow-hidden bg-slate-50 py-8">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-[30%] h-[30%] rounded-full bg-blue-100/30 blur-3xl" />
        <div className="absolute bottom-[10%] right-[5%] w-[30%] h-[30%] rounded-full bg-indigo-100/30 blur-3xl" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.01]"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[1400px] px-6 flex flex-col items-center">
        
        {/* Top Header - More Compact */}
        <header className="w-full text-center mb-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-none uppercase inline-block">
            L'ENIGMA DE L'<span className="text-blue-600">UNIVERS FOSC</span>
          </h1>
          <div className="w-48 h-1 bg-blue-600 mt-4 mx-auto rounded-full opacity-40"></div>
        </header>

        {/* Middle Row: Left Sections | Subtitle | Right Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_1fr] items-center gap-6 w-full">
          
          {/* Left Column */}
          <div className="flex flex-col gap-2 order-2 lg:order-1">
            {leftSections.map((section) => {
              const Icon = iconMap[section.id] || HelpCircle;
              return (
                <Link
                  key={section.id}
                  href={section.path}
                  className="group relative p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-300 transform hover:-translate-x-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {section.label}
                      </h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Center Column - Subtitle */}
          <div className="flex flex-col items-center text-center order-1 lg:order-2 px-4">
            <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed italic max-w-md">
              "La crisi dels forats negres i la cerca d'objectes compactes exòtics en la frontera de la física."
            </p>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-2 order-3">
            {rightSections.map((section) => {
              const Icon = iconMap[section.id] || HelpCircle;
              return (
                <Link
                  key={section.id}
                  href={section.path}
                  className="group relative p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-300 transform hover:translate-x-1"
                >
                  <div className="flex items-center gap-3 lg:flex-row-reverse">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="text-left lg:text-right w-full">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {section.label}
                      </h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom - Fonts Section */}
        <div className="mt-10 flex flex-col items-center">
          {referenceSections.map((section) => (
            <Link
              key={section.id}
              href={section.path}
              className="group flex items-center gap-3 px-6 py-2.5 bg-slate-950 hover:bg-blue-600 text-white rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <BookOpen size={16} />
              <span className="text-xs font-black tracking-widest uppercase">{section.label} i Referències</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-6 opacity-40">
            GEMiF • Divulgació Científica
          </p>
        </div>
      </div>
    </div>
  );
}
