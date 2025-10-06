import { Suspense } from "react";
import React from "react";
import { CheckCheck, Clock } from "lucide-react";
import InitialSetupSubjectsServer from "./components/initial-setup-subjects-server";
import InfoBox from "@/app/components/info-box";

export default async function Page() {
  
  return (
      <main className="section p-1 flex flex-col items-center h-full min-h-0">
      <section className="panel w-sm sm:w-lg md:w-3xl lg:w-5xl px-4 h-full flex flex-col">
        <h1 className="panel-header text-center w-full heading-md border-b border-border">Configuración inicial</h1>
          <Suspense fallback={<Skeleton />} >
            <InitialSetupSubjectsServer />
          </Suspense>
      </section>
    </main>
  );
}

function Skeleton() {
  return (
    <div className='flex-1 flex flex-col min-h-0'>
      <div className='panel-body w-full flex-1 overflow-y-auto p-3 flex flex-col gap-2'>
        <div className="flex flex-col items-start text-body p-1 bg-gray-100 rounded">
          <InfoBox>
            Este es un procedimiento obligatorio. Sin embargo, toda la información que introduzcas podrá ser modificada más adelante.
          </InfoBox>
          <InfoBox>
            Para añadir todo un bloque (año o quadrimestre) a otra columna, usa los botones al lado de las etiquetas.
          </InfoBox>
        </div>
        <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4 h-full">
          <Column title="Por cursar" length={6} yearSeparators={[0]} quadriSeparators={[0,4]} />
          <Column title="Cursando" length={0} />
          <Column title="Superadas" length={0} />
        </div>
      </div>
      <div className="panel-footer w-full flex-none flex justify-end gap-2 items-end border-t border-border p-3">
        <button
          disabled
          className="btn btn-primary opacity-60 pointer-events-none"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}

function Column({ title, length, yearSeparators, quadriSeparators }: { title: string, length: number, yearSeparators?: number[], quadriSeparators?: number[] }) {
  return (
    <div className="flex flex-col gap-3 max-h-[calc(100vh-300px)] h-full p-2 overflow-hidden">
      <p className="heading-md border-b border-border">{title}</p>
      <div
        className={`flex flex-col h-full gap-2 overflow-y-auto rounded-md p-2 transition-[background-color] bg-gray-100`}
      >
        {
          Array.from({ length }).map((_, i)  => {
            return (
              <React.Fragment key={`skeleton-${i}`}>
                {
                  yearSeparators?.includes(i) && (
                    <YearSeparator />
                  )
                }
                {
                  quadriSeparators?.includes(i) && (
                    <QuadriSeparator />
                  )
                }
                <div
                  className="max-w-full flex justify-between items-center rounded-md bg-bg border border-border shadow-sm hover:shadow-md hover:border-primary transition-all duration-200 ease-in-out p-2"
                >
                  <span className="skeleton w-32 h-[16px]" />
                </div>
              </React.Fragment>
            )
          })
        }
      </div>
    </div>
  )
}

function YearSeparator() {
  return (
    <div className="bg-gray-200 px-2 py-1 mt-3 -mx-2 border-y border-gray-300 flex justify-between items-center">
    <div className="font-bold text-gray-700 flex items-center text-sm uppercase">
      Año{` `}<div className="skeleton w-4 h-[16px]" />
    </div>
    {/* Button to move all subjects of this year to a column */}
    <div className="flex gap-1">
      <button
        disabled
        className="btn btn-sm btn-secondary "
      >
        <Clock size={12} />
      </button>
      <button
        disabled
        className="btn btn-sm btn-secondary"
      >
        <CheckCheck size={12} />
      </button>
    </div>
  </div>
  )
}

function QuadriSeparator() {
  return (
    <div className="pt-2 flex justify-between items-center">
      <div className="font-semibold flex items-center text-xs text-gray-500 pl-1 uppercase">
        {"Cuatrimestre"}<div className="skeleton w-4 h-[16px]" />
      </div>
      <div className="flex gap-1">
        <button
          disabled
          className="btn btn-sm btn-secondary "
        >
          <Clock size={12} />
        </button>
        <button
          disabled
          className="btn btn-sm btn-secondary"
        >
          <CheckCheck size={12} />
        </button>
      </div>
    </div>
  )
}