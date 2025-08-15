// app/dashboard/page.tsx (Server Component)
import { Suspense } from "react";
import HeaderBanner from "@/app/ui/main/header-banner";
import SubjectSelect from "@/app/ui/main/subject-select-server";
import PostsListServer from "@/app/ui/main/posts-list-server";
import AddMainPostButton from "@/app/ui/main/add-main-post-button";

export default function MainStatic() {
  return (
    <section className="min-h-screen flex flex-col gap-6 p-6">
      <header className="bg-[#f4f9ff] border border-[#DCEBFF] rounded-2xl p-5 flex items-center justify-between">
        <Suspense fallback={<div className="h-12 w-64 bg-blue-300 animate-pulse rounded" />}>
          <HeaderBanner />
        </Suspense>
        <a
          href="/gemif/weekly-challenges"
          className="py-2 px-3 rounded-2xl hover:bg-[#d3e5ff] transition-colors"
        >
          <p className="text-md font-bold text-slate-700">Atrévete con los</p>
          <p className="text-md font-bold text-slate-700">Desafíos semanales 🔥</p>
        </a>
      </header>
      

      <div className="flex flex-col gap-5 bg-[#f4f9ff] border border-[#DCEBFF] rounded-2xl p-5">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-slate-700">Recursos útiles</h2>
          <div className="flex gap-4 flex-wrap">
            <Suspense fallback={<div className="w-40 h-9 bg-blue-300 animate-pulse rounded" />}>
              <SubjectSelect />
            </Suspense>
            <AddMainPostButton />
          </div>
        </div>

        <Suspense fallback={<div className="h-32 w-full bg-blue-300 animate-pulse rounded" />}>
          <PostsListServer />
        </Suspense>
      </div>
    </section>
  );
}
