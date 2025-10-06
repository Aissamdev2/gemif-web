import Footer from "@/app/ui/footer/footer";
import InformationServer from "./components/information-server";


export default async function Page() {

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <main className="flex flex-col h-full w-full bg-bg text-text-primary overflow-hidden">
        <section className="panel flex flex-col gap-2 flex-1 w-full h-full p-3 sm:p-6 overflow-hidden">
          <h1 className="heading-md">
            Información sobre asignaturas
          </h1>
          <p className="text-muted">Revisa todo tipo de información sobre cada asignatura.</p>
          <InformationServer />
        </section>
      </main>
      <Footer id="footer" />
    </div>
  )
}