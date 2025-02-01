'use client'
import AccountButton from "./account-button";
import { useUser } from "../lib/use-user";
import Link from "next/link";

export default function Header() {
    
  const { user, isLoading } = useUser();

  return (
    <header className="w-full absolute top-0 z-20 p-3">
    <nav className=" h-full border-solid border-gray-200 w-full border-b rounded-lg z-50 bg-indigo-500">
      <div className=" w-full h-full">
        <div className="w-full flex">
          <div className="w-full flex justify-between items-center flex-row">
            <ul className="flex items-center mx-[30px] gap-2">
              <li className=" flex items-center cursor-pointer rounded-lg text-white hover:bg-indigo-400 transition-[background-color] duration-300">
                <Link href={"/gemif"} className="py-1 flex items-center justify-center  text-sm lg:text-base font-medium  transition-all duration-500 mb-2 lg:mx-3 md:mb-0">Inicio</Link>
              </li>
              <li className=" cursor-pointer rounded-lg text-white hover:bg-indigo-400 transition-[background-color] duration-300">
                <Link href={"/gemif/calendar"} className="py-1 flex items-center justify-center text-sm lg:text-base font-medium transition-all duration-500 mb-2 lg:mx-3 md:mb-0 md:mr-3">Calendario</Link>
              </li>
              <li className=" cursor-pointer rounded-lg text-white hover:bg-indigo-400 transition-[background-color] duration-300">
                <a className="py-1 flex items-center justify-center text-sm lg:text-base font-medium transition-all duration-500 mb-2 lg:mx-3 md:mb-0 md:mr-3">Asignaturas</a>
              </li>
            </ul>
            <ul className="py-3">
              <li>
                <AccountButton user={user} />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>                            
    </header>
);
}