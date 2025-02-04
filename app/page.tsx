import Link from "next/link";
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function Home() {
  return (
    <main className="relative flex flex-col justify-center items-center gap-20 md:gap-32 h-screen w-screen bg-white overflow-hidden" >
      <div className="absolute top-[5%] left-[20%] lg:top-[10%] lg:right-1/2 lg:translate-x-1/2 rotate-[-10deg] opacity-50">
        <BlockMath math="\frac{\partial \mathcal{L}}{\partial q} - \frac{d}{dt}\left( \frac{\partial \mathcal{L}}{\partial \dot{q}} \right) = 0" />
      </div>
      <div className="absolute flex flex-col left-[50%] top-[25%] -translate-y-1/2 lg:left-[10%] lg:top-1/2 lg:-translate-y-1/2 rotate-[10deg] opacity-50">
        <BlockMath math="\vec{\nabla} \cdot \vec{E} = \frac{\rho}{\varepsilon_{0}}" />
        <BlockMath math="\vec{\nabla} \cdot \vec{B} = 0" />
        <BlockMath math="\vec{\nabla} \times \vec{E} = -\frac{\partial \vec{B}}{\partial t}" />
        <BlockMath math="\vec{\nabla} \times \vec{B} = \mu_0 \vec{J} + \mu_0\varepsilon_0\frac{\partial \vec{E}}{\partial t}" />
      </div>
      <div className="absolute right-0 top-[55%] lg:right-[10%] lg:top-1/2 lg:-translate-y-1/2 rotate-[10deg] opacity-50">
        <BlockMath math="\frac{df}{dx} = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}" />
      </div>
      <div className="absolute top-[42%] right-[100%] lg:right-[10%] lg:top-3/4 lg:-translate-y-1/2 rotate-[-10deg] opacity-50">
        <BlockMath math="A\vec{v} = \lambda\vec{v}" />
      </div>
      <div className="absolute left-0 top-[60%] lg:top-[80%] rotate-[40deg] lg:right-1/2 lg:translate-x-1/2 lg:rotate-0 opacity-50">
        <BlockMath math="\oiint_{V} \vec{F} \cdot d\vec{A} = \int_{\partial V} \vec{F} \cdot \vec{n} dA" />
      </div>
      <div className="absolute top-[20%] left-0 lg:top-[10%] lg:left-3/4 lg:translate-x-1/2 rotate-[10deg] opacity-50">
        <BlockMath math="\hat{H} \psi = E \psi" />
      </div>
      <div className="absolute bottom-[5%] left-0 lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 rotate-[-10deg] opacity-50">
        <BlockMath math="S(E) = k_B ln\left( \Omega(E,N,V) \right)" />
      </div>
      <div className="absolute bottom-[10%] right-0 rotate-[30deg] lg:top-[10%] lg:left-1/4 lg:-translate-x-1/2 lg:rotate-0 opacity-50">
        <BlockMath math="\rho \frac{\partial \vec{v}}{\partial t} + \rho \vec{v} \cdot \vec{\nabla} \vec{v} = \vec{\nabla} p + \mu \vec{\nabla}^2 \vec{v} + \vec{F} " />
      </div>
      <div className="flex flex-col justify-center items-center gap-4 z-10">
        <h1 className="text-8xl md:text-9xl font-bold text-[#4d30e0] ">GEMiF</h1>
        <div className="flex flex-col md:flex-row gap-1 justify-center items-center">
          <h2 className="text-xl font-semibold">Grado en Ingeniería </h2>
          <h2 className="text-xl font-semibold">Matemática y Física</h2>
        </div>
      </div>
      <Link href="/login" className="z-10 py-2 px-5 md:py-4 md:px-8 text-xl bg-[#4d30e0] text-white rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 hover:bg-indigo-700">
        Acceder
      </Link>
    </main>
  );
}
