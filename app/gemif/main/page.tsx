
// app/dashboard/page.tsx
import { Suspense } from "react";
import HeaderBanner from "./components/header-banner";
import LinkCarousel from "./components/link-carousel";
import AddMainPostButton from "../resources/posts/components/add-post-button";
import PostsDashboardServer from "../resources/posts/components/posts-dashboard-server";



const LINK_ITEMS = [
  { href: "/gemif/weekly-challenges", label: "Desafíos semanales" },
  { href: "/dashboard/subjects/create", label: "Crear asignatura" },
  { href: "/dashboard/posts", label: "Mis publicaciones" },
  { href: "/dashboard/posts/create", label: "Crear publicación" },
]

export default async function Page() {


  return (
    <section className="section panel flex flex-col justify-between gap-0 h-full min-h-0">
      <div className="panel-header flex flex-col sm:flex-row items-center justify-between border-b border-border">
        <div className="min-w-0">
          <div className="heading-md flex items-start gap-1 max-w-full truncate">
            Hola{" "}
            <Suspense fallback={<HeaderSkeleton />}>
              <HeaderBanner />
            </Suspense>
          </div>
          <p className="text-muted font-bold mt-1">Bienvenido a tu panel principal.</p>
        </div>
        <div className="h-full flex flex-col items-center justify-center">
          <p className="text-body">Secciones de interés</p>
          <LinkCarousel items={LINK_ITEMS} />
        </div>
      </div>

    <div className="panel-header flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* header */}
      <div className=" flex items-center justify-between mb-1">
        <div>
          <h1 className="heading-md truncate">Recursos útiles</h1>
          <p className="text-muted mt-1">Acceso rápido a recursos organizados por asignatura.</p>
        </div>
        <AddMainPostButton />
      </div>
        <Suspense fallback={<DashboardSkeleton />}>
          <PostsDashboardServer />
        </Suspense>
    </div>
    </section>
  );
}

/* Header skeleton */
function HeaderSkeleton() {
  return (
    <span className="h-[20px] w-32 skeleton" />
  );
}

/* Dashboard skeleton: compact, posts area scrollable */
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