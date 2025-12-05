import Footer from "@/app/ui/footer/footer";
import ThermalSimulation from "../components/thermal-simulation";



export default function ToolsAndSimulationsPage() {


  return (
    <>
      <main className="overflow-hidden h-fit sm:h-screen w-screen p-4 bg-bg overflow-y-hidden">
        <ThermalSimulation />
      </main>
    </>
  )
}