import { Suspense } from "react";
import EditMainPostServer from "../components/edit-main-post-server";
import SubjectSelectServer from "../components/subject-select-server";
import FileLinkInputServer from "../components/file-link-input-server";
import FormFooterServer from "../components/form-footer-server";


export default async function Page({ params }: any) {

  const { id } = await params;

  return (
    <div className="section p-1 flex flex-col items-start h-full min-h-0">
    <form className="panel w-full h-full flex flex-col items-start">

    {/* Header */}
    <div className="panel-header w-full heading-md border-b border-border">
      Editar Publicación
    </div>

    {/* Scrollable Form Body */}
    <div className="panel-body w-full flex-1 overflow-y-auto p-3 flex flex-col md:flex-row gap-10">

      {/* Left Column: Title/Description/Subject */}
      <div className="flex flex-col gap-4">
        <Suspense >
          <EditMainPostServer id={id} />
        </Suspense>
        <Suspense fallback={<SubjectSelectSkeleton />}>
          <SubjectSelectServer id={id} />
        </Suspense>
      </div>

      <div className="flex flex-col gap-3">
        <Suspense >
          <FileLinkInputServer id={id} />
        </Suspense>
      </div>
    </div>
    <div className="panel-footer w-full flex-none flex justify-start gap-2 items-center border-t border-border">
      <Suspense fallback={<FormFooterSkeleton />} >
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
        Guardar cambios
      </button>
    </>
  )
}