import Footer from "@/app/ui/footer/footer";
import ParallelTransportSimulation from "./components/first-simulation";



export default function ToolsAndSimulationsPage() {


  return (
    <>
      <main className="overflow-hidden h-fit sm:h-full w-screen p-4 bg-bg overflow-y-scroll">
        <ParallelTransportSimulation />
      </main>
      <Footer />
    </>
  )
}