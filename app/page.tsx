import Link from "next/link";


export default function Home() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center px-8 md:px-20">
      <div className="max-w-4xl text-center text-white">
        <h1 className="text-6xl md:text-7xl font-extrabold leading-tight tracking-tight drop-shadow-lg">
          Grado en Ingeniería
          <br />
          <span className="text-blue-300">Matemática</span> y <span className="text-blue-300">Física</span>
        </h1>

        <p className="mt-6 text-xl md:text-2xl font-medium text-blue-200 drop-shadow">
          Recursos para estudiantes de GEMiF
        </p>

        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-8">
          <Link
            href="/login"
            className="inline-block px-8 py-3 text-lg font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg hover:from-blue-600 hover:to-blue-700 transition-colors duration-300"
          >
            Acceder
          </Link>

          <Link
            href="/register"
            className="inline-block px-8 py-3 text-lg font-semibold rounded-lg border-2 border-blue-300 text-blue-300 hover:bg-blue-300 hover:text-blue-900 transition-colors duration-300"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </main>
  );
}

