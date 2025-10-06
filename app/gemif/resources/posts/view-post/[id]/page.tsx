import { Suspense } from "react";
import ViewPostServer from "../components/view-post-server";


export default async function ViewPostPage({ params }: any) {

  const { id } = await params;

  return (
    <div className="section p-1 flex flex-col items-start h-full min-h-0">
      <div className="panel w-full h-full flex flex-col items-start ">
        
        {/* Title */}
        <div className=" panel-header w-full heading-md border-b border-border">
          Información de la publicación
        </div>
        <Suspense fallback={<p>Cargando...</p>}>
          <ViewPostServer id={id} />
        </Suspense>
      </div>
    </div>
  )
}




function Skeleton() {
  return (
    <div className="section p-1 flex flex-col items-start h-full min-h-0">
      <div className="panel w-full h-full flex flex-col items-start">
          
          <div className="panel-header w-full heading-md border-b border-border">
              Información de la publicación
          </div>

          <div className="panel-body w-full flex-1 overflow-y-auto p-3 flex gap-10">
              
              <div className="flex-1 overflow-y-auto p-6 bg-white text-black">

                  <div className="flex flex-col md:flex-row md:justify-between gap-8 w-full">

                      <div className="flex-1 flex flex-col gap-4">
                          
                          <div className="flex flex-col gap-1">
                              <p className="text-[11px] font-semibold text-gray-500">Título</p>
                              <div className="skeleton h-5 w-4/5 rounded"></div>
                          </div>

                          <div className="flex flex-col gap-1">
                              <p className="text-[11px] font-semibold text-gray-500">Descripción</p>
                              <div className="skeleton h-9 w-full rounded"></div>
                          </div>

                          <div className="flex flex-col gap-1">
                              <p className="text-[11px] font-semibold text-gray-500">Asignatura</p>
                              <div className="skeleton h-[17.6px] w-[298.6px] rounded"></div>
                          </div>

                      </div>

                      <div className="flex-1 flex flex-col gap-4">

                          <div className="flex flex-col gap-1">
                              <p className="text-[11px] font-semibold text-gray-500">Archivos</p>
                              <ul className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                                  <li className="skeleton h-6 w-full rounded"></li>
                                  <li className="skeleton h-6 w-4/5 rounded"></li>
                                  <li className="skeleton h-6 w-11/12 rounded"></li>
                              </ul>
                          </div>

                          <div className="flex flex-col gap-1">
                              <p className="text-[11px] font-semibold text-gray-500">Links</p>
                              <ul className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                                  <li className="skeleton h-6 w-full rounded"></li>
                                  <li className="skeleton h-6 w-3/4 rounded"></li>
                              </ul>
                          </div>
                      </div>

                  </div>
              </div>

          </div>

          <div className="panel-footer w-full flex-none flex justify-start gap-2 items-center border-t border-border">
              <button type="button" className="btn btn-secondary">
                  Cancelar
              </button>
              <button type="submit" disabled className="btn btn-danger">
                  Eliminar publicación
              </button>
              <a href="#" className="btn btn-primary">
                  Editar publicación
              </a>
          </div>
      </div>
  </div>
  )
}