import Footer from "@/app/ui/footer/footer";
import { Suspense } from "react";
import PostsDashboardServer from "./components/posts-dashboard-server";
import AddPostButton from "./components/add-post-button";



export default async function Page() {

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <main className="flex flex-col h-full w-full bg-bg text-text-primary overflow-hidden">
        <section className="panel flex flex-col gap-3 flex-1 w-full h-full p-3 sm:p-6 overflow-hidden">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <h1 className="heading-md">
                Publicaciones Académicas de GEMiF
              </h1>
              <p className="text-muted">Información, apuntes, resúmenes y material de estudio creado por estudiantes.</p>
            </div>
            <AddPostButton />
          </div>
          <Suspense fallback={<DashboardSkeleton />}>
            <PostsDashboardServer />
          </Suspense>
        </section>
      </main>
      <Footer id="footer" />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="panel-body flex flex-col gap-1 flex-1 min-h-0 overflow-hidden">
      <div className="flex w-full items-end gap-3 mb-3">
        <div className="w-full">
          <label htmlFor="subject-select" className="block ml-1 text-xs font-medium text-gray-900"> Asignatura </label>
          <div className="w-full skeleton skeleton-md" />
        </div>
        <span className="min-w-[53.11px] skeleton skeleton-md" />
      </div>

      <div className="h-full flex-1 min-h-0 flex flex-col p-1 bg-gray-100 rounded">
        <div className="flex-1 overflow-y-auto min-h-0">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="card flex items-center gap-4">
                <div className="w-7 h-7 bg-surface-hover-dark rounded-md skeleton" />
                <div className="flex flex-col justify-center gap-1.5 grow overflow-hidden min-w-0">
                  <div className="h-4 w-36 rounded-xl skeleton" />
                  <div className="h-[13.34px] w-24 rounded-xl skeleton" />
                </div>
                <div className="h-[30px] w-8 rounded skeleton" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}