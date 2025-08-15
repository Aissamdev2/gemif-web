// components/header-banner.tsx (Server Component)
import { getUser } from "@/app/lib/actions/user/actions";

export default async function HeaderBanner() {
  const res = await getUser();
  const userName = res?.data?.publicname ?? "Usuario";

  return (
    <section className="bg-[#f4f9ff] border border-[#DCEBFF] rounded-2xl p-5 flex items-center justify-between">
      <h1 className="text-3xl font-extrabold text-slate-700">
        Hola, {userName}
      </h1>
      <a
        href="/gemif/weekly-challenges"
        className="py-2 px-3 rounded-2xl hover:bg-[#d3e5ff] transition-colors"
      >
        <p className="text-md font-bold text-slate-700">Atrévete con los</p>
        <p className="text-md font-bold text-slate-700">Desafíos semanales 🔥</p>
      </a>
    </section>
  );
}
