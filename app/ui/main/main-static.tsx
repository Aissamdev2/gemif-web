// app/dashboard/page.tsx (Server Component)
import { Suspense } from "react";
import HeaderBanner from "@/app/ui/main/header-banner";
import PostsDashboardServer from "./posts-dashboard-server";
import AddMainPostButton from "./add-main-post-button";


export default async function MainStatic() {
  
  return (
    <section className="min-h-screen max-h-full pt-[64px] flex flex-col gap-6 p-6">
      <Suspense fallback={<HeaderSkeleton />}>
        <HeaderSkeleton />
      </Suspense>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardSkeleton />
      </Suspense>
    </section>
  );
}

function HeaderSkeleton() {
  return (
    <section className="bg-[#f4f9ff] border border-[#DCEBFF] rounded-2xl p-5 flex items-center justify-between">
      <div className="bg-shimmer-gradient bg-[length:300%_100%] bg-[position:-200%_0] motion-safe:animate-shimmer block w-full max-w-xs h-[40px] rounded-lg" />
      <a
        href="/gemif/weekly-challenges"
        className="py-2 px-3 rounded-2xl hover:bg-[#d3e5ff] transition-colors"
      >
        <p className="text-md font-bold text-slate-700">Atrévete con los</p>
        <p className="text-md font-bold text-slate-700">Desafíos semanales 🔥</p>
      </a>
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5 bg-[#f4f9ff] border border-[#DCEBFF] rounded-2xl p-5 h-screen">
      {/* Header section */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-slate-700">Recursos útiles</h2>
        <div className="flex gap-4 flex-wrap">
          <div
            className="bg-shimmer-gradient bg-[length:300%_100%] bg-[position:-200%_0] motion-safe:animate-shimmer block w-full max-w-xs h-[40px] rounded-lg"
          />
          <AddMainPostButton />
        </div>
      </div>

      {/* Skeleton posts list taking remaining space */}
      <div className="flex-1 overflow-y-auto">
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <li
              key={index}
              className="bg-white h-[100px] flex items-center rounded-xl border p-3 overflow-hidden relative"
            >
              <div className="flex flex-col justify-center grow gap-2">
                <div
                  className="h-4 w-32 rounded bg-shimmer-gradient bg-[length:300%_100%] bg-[position:-200%_0] motion-safe:animate-shimmer"
                />
                <div
                  className="h-3 w-24 rounded bg-shimmer-gradient bg-[length:300%_100%] bg-[position:-200%_0] motion-safe:animate-shimmer"
                />
              </div>
              <div
                className="w-12 h-12 rounded-lg bg-shimmer-gradient bg-[length:300%_100%] bg-[position:-200%_0] motion-safe:animate-shimmer"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
