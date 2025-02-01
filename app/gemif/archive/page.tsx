'use client'

import { useFiles } from "@/app/lib/use-files";
import FileTree from "@/app/ui/file-tree";
import Loader from "@/app/ui/loader";
import React from "react";
import { OctagonAlert } from "lucide-react";
export default function FilesPage() {
  const { files, error, isLoading } = useFiles();

  if (error) return <div>Error: {error.message}</div>;

  return (
    <section className="z-50 w-full h-full flex flex-col lg:mb-0 px-2 lg:px-10 gap-24 pt-[80px] pb-[20px] lg:gap-12 lg:flex-row">
    <div className="p-5 grow  bg-white rounded-2xl flex flex-col gap-4">
      <h2 className="text-3xl font-extrabold tracking-tight text-black leading-tight md:text-3xl">
        Archivo de GEMiF
      </h2>
      <h3>Aquí se muestra el registro de los archivos subidos al moodle en años anteriores</h3>
      {
        files && files?.error === 'Rate limit exceeded' && (
          <div className="flex items-center gap-1 p-3 rounded-lg bg-red-100">
            <div className="flex items-center justify-center basis-6 shrink-0">
              <OctagonAlert className="text-red-400 w-6 h-6" />
            </div>
            <h4 className="text-red-500 text-sm">Límite de acceso excedido, espere menos de una hora a que se reinicie el contador</h4>
          </div>
        )
      }
      { 
        !files || isLoading ? (
          <div className="w-full pt-8 flex flex-col justify-center items-center ">
            <Loader />
            <p className="text-gray-400 text-sm">Esto puede tardar un poco</p>
          </div>
        ) : (
          files.error !== 'Rate limit exceeded' && (
          <div className="overflow-scroll scrollbar-hidden">
            <FileTree structure={files.structure} />
          </div>
          )
        )
      }
    </div>
    </section>
  );
}
