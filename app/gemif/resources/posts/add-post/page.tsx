import FileLinkInputClient from "./components/file-link-input-client"
import SubjectSelectServer from "./components/subject-select-server"
import FormFooterServer from "./components/form-footer-server"
import { Suspense } from "react"

export default async function Page() {

  return (
      <div className="section p-1 flex flex-col items-start h-full min-h-0">
      <form className="panel w-full h-full flex flex-col items-start ">
        
        {/* Title */}
        <div className=" panel-header w-full heading-md border-b border-border">
          Añadir Recurso
        </div>

        {/* Scrollable Form */}
        <div
          className="panel-body w-full flex-1 overflow-y-auto p-3 flex flex-col md:flex-row gap-10"
        >

          {/* Title/Description/Subject */}
          <div className="flex flex-col gap-4">
            <div className="sm:min-w-36 md:min-w-56">
              <label htmlFor="name" className="label">
                <div>
                  <p>Título </p>
                  <p className="text-[11px] text-muted">El nombre principal de la publicación</p>
                </div>
              </label>
              <input id="name" name="name" required className="input input-md w-full" placeholder="Ej. Horario" />
            </div>
            <div>
              <label htmlFor="description" className="label">
                <div>
                  <p>Descripción <span className="text-[11px] text-muted">(opcional)</span></p>
                  <p className="text-[11px] text-muted">Una descripción más detallada de la publicación</p>
                </div>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="input input-md w-full"
                placeholder="Ej. Horario de clases GEMiF 2025/2026"
              />
            </div>
            <Suspense fallback={<SubjectSelectSkeleton />}>
              <SubjectSelectServer />
            </Suspense>
          </div>
          {/* File or Link */}
          <FileLinkInputClient />
        </div>

        {/* Fixed Footer */}
        <div className="panel-footer w-full flex-none flex justify-start gap-2 items-center border-t border-border">
          <Suspense fallback={<FormFooterSkeleton />}>
            <FormFooterServer />
          </Suspense>
        </div>
      </form>
    </div>
  )
}

function SubjectSelectSkeleton() {
  
  return (
    <div>
      <label htmlFor="subject" className="label">
        <div>
          <p className="skeleton h-4 w-24 rounded"></p>
          <p className="skeleton h-3 w-52 rounded mt-1"></p>
        </div>
      </label>
      <div className="select select-md w-full">
        <div className="skeleton h-5 w-28 rounded"></div>
      </div>
    </div>
  )
}


function FormFooterSkeleton() {
  return (
    <>
      <button type="button" disabled className="btn btn-secondary">
        Cancelar
      </button>
      <button type="submit" disabled className="btn btn-primary">
        Crear publicación
      </button>
    </>
  )
}