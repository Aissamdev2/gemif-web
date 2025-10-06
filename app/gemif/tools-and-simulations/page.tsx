import Footer from "@/app/ui/footer/footer";
import { Suspense } from "react";
import ToolsAndSimulationsServer from "./components/tools-and-simulations-server";


export default function ToolsAndSimulationsPage() {
  return (
    <div className="overflow-hidden h-screen">
      <div className="flex flex-col h-full overflow-y-scroll max-w-screen">
        <main className="flex flex-col h-full w-full bg-bg text-text-primary">
          <section className="panel flex flex-col gap-4 flex-1 h-fit w-full p-6">
            {/* Encabezado */}
            <header className="">
              <h1 className="heading-md">Recursos de GEMiF</h1>
              <p className="text-muted">
                Aquí podrá encontrar una gran variedad de recursos para cada
                asignatura.
              </p>
            </header>

            <Suspense fallback={<div>Cargando...</div>}>
              <ToolsAndSimulationsServer />
            </Suspense>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}
