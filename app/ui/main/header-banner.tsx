// components/header-banner.tsx (Server Component)
import { getUser } from "@/app/lib/actions/user/actions";

export default async function HeaderBanner() {
  const res = await getUser();
  const userName = res?.data?.publicname ?? "Usuario";

  return (
      <h1 className="text-3xl font-extrabold text-slate-700">
        Hola, {userName}
      </h1>
  );
}
