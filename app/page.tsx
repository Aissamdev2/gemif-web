import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col justify-center items-center gap-20 md:gap-32 h-screen w-screen bg-fullscreen" >
      <div className="flex flex-col justify-center items-center gap-4">
        <h1 className="text-8xl md:text-9xl font-bold text-[#4d30e0] ">GEMiF</h1>
        <div className="flex flex-col md:flex-row gap-1 justify-center items-center">
          <h2 className="text-xl font-semibold">Grado en Ingeniería </h2>
          <h2 className="text-xl font-semibold">Matemática y Física</h2>
        </div>
      </div>
      <Link href="/login" className="py-2 px-5 md:py-4 md:px-8 text-xl bg-[#4d30e0] text-white rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 hover:bg-indigo-700">
        Acceder
      </Link>
    </main>
  );
}
