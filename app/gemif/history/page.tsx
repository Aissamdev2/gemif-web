'use client'

import { useHistory } from "@/app/lib/use-history";
import FileTree from "@/app/ui/file-tree";
import Loader from "@/app/ui/loader";
import React, { useState } from "react";
import { OctagonAlert } from "lucide-react";
import ErrorPage from "@/app/ui/error";
import Link from "next/link";
export default function HistoryPage() {

  const TITLES = {
    'files': 'Archivos de Moodle',
    'exams': 'Exámenes anteriores'
  }

  const DESCRIPTIONS = {
    'files': 'Aquí se muestra el registro de los archivos subidos al moodle en años anteriores',
    'exams': 'Aquí se muestra el registro de los exámenes de años anteriores'
  }

  const [selected, setSelected] = useState<'files' | 'exams'>('exams')
  const { history, error, isLoading } = useHistory({ section: selected});

  if (error) return <ErrorPage error={error?.message} />
  return (
    <section className="z-50 w-full h-full flex flex-col lg:mb-0 px-2 lg:px-10 gap-24 pt-[80px] pb-[20px] lg:gap-12 lg:flex-row">
    <div className="p-5 grow bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 rounded-2xl flex flex-col gap-4">
      <div className="flex max-md:flex-col justify-between items-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-700 leading-tight md:text-3xl">
          {TITLES[selected]}
        </h2>
        <div className="flex justify-center">
          <div className="flex w-fit overflow-hidden rounded-full border border-gray-300 shadow-sm">
            <button
              onClick={() => setSelected('exams')}
              className={`px-4 py-2 max-md:px-2 max-md:py-1 text-sm max-md:text-xs font-medium transition-colors duration-200 ${
                selected === 'exams'
                  ? 'bg-[#2C5AA0] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Exámenes
            </button>
            <button
              onClick={() => setSelected('files')}
              className={`px-4 py-2 max-md:px-2 max-md:py-1 text-sm max-md:text-xs font-medium transition-colors duration-200 ${
                selected === 'files'
                  ? 'bg-[#2C5AA0] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Archivos moodle
            </button>
          </div>
        </div>
      </div>
      <h3 className="text-slate-700">{DESCRIPTIONS[selected]}</h3>
      {
        error === 'Rate limit exceeded' && (
          <div className="flex items-center gap-1 p-3 rounded-lg bg-red-100">
            <div className="flex items-center justify-center basis-6 shrink-0">
              <OctagonAlert className="text-red-400 w-6 h-6" />
            </div>
            <h4 className="text-red-500 text-sm">Límite de acceso excedido, espere menos de una hora a que se reinicie el contador</h4>
          </div>
        )
      }
      { 
        !history || isLoading ? (
          <div className="w-full pt-8 flex flex-col justify-center items-center ">
            <div className="flex justify-center items-center w-full min-h-[4rem]">
              <div className="w-[40px] h-[30px]">
                <Loader />
              </div>
            </div>
            <p className="text-slate-500 text-sm">Esto puede tardar un poco</p>
          </div>
        ) : (
          error?.message !== 'Rate limit exceeded' && (
          <div className="overflow-scroll scrollbar-hidden">
            <FileTree structure={history} />
          </div>
          )
        )
      }
    </div>
    </section>
  );
}
