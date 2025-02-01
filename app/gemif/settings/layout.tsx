'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [state, setState] = useState(pathname.split('/').pop()); 

  useEffect(() => {
    setState(pathname.split('/').pop())
  }, [pathname])

  const menu = ['Asignaturas', 'Colores', 'Cuenta'];
  const hrefMenu = ['subjects', 'colors', 'account'];


  return (
    <div className="w-full h-full flex flex-col lg:flex-row">
      <div className="lg:w-[15%] border-r border-[#a19aff6b] lg:p-4 pt-16 bg-white flex-row lg:flex-col justify-start items-start gap-6 inline-flex">
          <div className="w-full h-8 px-3 items-center hidden lg:flex ">
            <h6 className="text-gray-500 text-sm font-semibold leading-4">MENÚ DE AJUSTES</h6>
          </div>
          <ul className="flex-row lg:flex-col gap-1 flex ml-3 w-full">
            {
              hrefMenu.map((item, index) => (
                <Link key={index} href={`/gemif/settings/${hrefMenu[index]}`} className={`flex-col flex w-full p-3 ${state === item ? 'max-lg:border-t-[4px] lg:border-l-[4px] border-[#a19affb3] bg-[#f0f0ff]' : 'bg-white'} cursor-pointer`}>
                  <h2 className="text-gray-500 text-sm font-medium leading-snug">{menu[index]}</h2>
                </Link>
              ))
            }
          </ul>
      </div>
      {children}
    </div>
  );
}