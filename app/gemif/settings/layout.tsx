'use client'

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLLIElement | null>>({});
  
  const menu = ['Asignaturas', 'Colores', 'Cuenta'];
  const hrefMenu = ['subjects', 'colors', 'account'];
  const currentPath = pathname.split('/').pop();

  useEffect(() => {
    setActiveItem(currentPath || null);
  }, [currentPath]);

  useEffect(() => {
    if (!activeItem || !indicatorRef.current) return;
    const activeEl = buttonRefs.current[activeItem];
    if (activeEl) {
      indicatorRef.current.style.top = `${activeEl.offsetTop}px`;
      indicatorRef.current.style.height = `${activeEl.offsetHeight}px`;
    }
  }, [activeItem]);

  return (
    <div className="w-full h-full flex flex-col lg:flex-row">
      <div className="lg:w-[15%] border-[#a19aff6b] lg:p-4 pt-16 bg-white flex-row lg:flex-col justify-start items-start gap-6 inline-flex">
        <div className="w-full h-8 px-3 items-center hidden lg:flex">
          <h6 className="text-gray-500 text-sm font-semibold leading-4">MENÚ DE AJUSTES</h6>
        </div>
        
        <ul className="flex-row lg:flex-col gap-1 flex ml-3 w-full relative">
          {/* Sliding indicator */}
          <div
            ref={indicatorRef}
            className="hidden lg:block absolute left-0 w-[4px] z-[11] bg-[#76aae6] rounded transition-all duration-300 ease-in-out"
          />
          
          {hrefMenu.map((item, index) => {
            const isActive = activeItem === item;
            return (
              <li
                key={index}
                ref={(el) => { buttonRefs.current[item] = el }}
                className={`relative w-full text-slate-700 ${
                  isActive ? 'font-semibold text-blue-900' : ''
                }`}
              >
                <Link
                  href={`/gemif/settings/${item}`}
                  className={`flex w-full p-3 text-sm leading-4 relative z-[10] after:opacity-0 after:transition-opacity after:duration-500 after:delay-500 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-full after:z-[1] ${
                    isActive ? "after:opacity-100 after:bg-[linear-gradient(to_right,#ddebfc,transparent)]" : ""
                  }`}
                >
                  <span className="block w-full z-[10] relative">
                    <h2 className="text-sm font-medium leading-snug">
                      {menu[index]}
                    </h2>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {children}
    </div>
  );
}