import React from "react";
import Link from "next/link";
import Image from "next/image";
import LandingHero from "../public/landing-hero.jpg";
import Footer from "./ui/footer/footer";
import LandingFramer from "./components/landing-framer";

export default function GEMiFWebLanding() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-bg text-text-primary">
      {/* NAV */}
      <header className="w-full fixed top-0 left-0 z-40 flex justify-center">
        <nav className="min-w-md sm:min-w-xl md:min-w-3xl lg:min-w-5xl 2xl:min-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 p-4 relative bg-transparent">
          {/* Gradient overlay for blur fade */}
          <div
            className="absolute inset-0 bg-white/30 dark:bg-surface/30 backdrop-blur-sm pointer-events-none"
            style={{
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0))',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0))',
            }}
          ></div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="panel rounded p-2 flex items-center gap-3 border-border bg-surface">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold bg-primary text-text-on-accent">
                G
              </div>
              <div>
                <div className="heading-lg">GEMiFWeb</div>
                <div className="text-muted">Ingeniería Matemática y Física — URV</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <Link href="/login" className="btn btn-ghost btn-md">
              Iniciar sesión
            </Link>
            <Link href="/register" className="btn btn-primary btn-md">
              Registrarse
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-24">
        {/* HERO */}
        <section className="max-w-6xl mx-auto px-6 py-16 flex flex-col lg:flex-row items-center gap-10">
          <LandingFramer animation="fadeUp" custom={0}>
            <div className="flex-1">
              <h1 className="heading-2xl mb-4 typed-out">
                GEMiFWeb — Grado en Ingeniería Matemática y Física
              </h1>
              <p className="text-muted mb-6">
                GEMiFWeb es el espacio para compartir ejercicios, proyectos, recursos, debates y herramientas aplicadas a las matemáticas y la física. Diseñado por estudiantes, para estudiantes.
              </p>

              <div className="flex gap-3">
                <Link href="/register" className="btn btn-primary btn-lg">
                  Únete gratis
                </Link>
                <Link href="#about" className="btn btn-secondary btn-lg">
                  Saber más
                </Link>
              </div>

              <div className="mt-6 panel p-6 border-border bg-surface rounded-lg shadow-md">
                <div className="heading-md mb-3">Lo que encontrarás</div>
                <ul className="space-y-3 text-body ml-0 list-none">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>Repositorio de ejercicios resueltos y problemas de selectividad universitaria.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>Guías para programación científica (MATLAB, Python, C++) y despliegue web (Next.js, WASM).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>Foros y grupo de estudio por asignatura y proyecto.</span>
                  </li>
                </ul>
              </div>
            </div>
          </LandingFramer>

          <LandingFramer animation="scaleIn">
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-md rounded-lg overflow-hidden shadow-lg border border-border bg-surface">
                <Image src={LandingHero} alt="estudiantes trabajando" className="w-full h-64 object-cover" />
                <div className="p-4">
                  <div className="heading-md">Aprende colaborando</div>
                  <div className="text-muted">Recursos compartidos, información academica.</div>
                </div>
              </div>
            </div>
          </LandingFramer>
        </section>

        {/* ABOUT */}
        <section id="about" className="max-w-6xl mx-auto px-6 py-12">
          <LandingFramer animation="fadeUp" custom={1}>
            <div className="panel p-8 border-border bg-surface">
              <h2 className="heading-xl mb-2">¿Por qué GEMiFWeb?</h2>
              <p className="text-muted mb-4">
                Muchos de nuestros módulos combinan teoría compleja con implementaciones prácticas y proyectos de grupo. GEMiFWeb centraliza material didáctico, planes de trabajo, exposiciones y soluciones — además de ofrecer un espacio para practicar presentaciones y evaluar propuestas de proyectos.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <LandingFramer animation="fadeUp">
                  <div className="card">
                    <div className="heading-md">Recursos</div>
                    <div className="text-muted">Apuntes, notebooks, ejemplos interactivos y enlaces a WASM/MATLAB.</div>
                  </div>
                </LandingFramer>

                <LandingFramer animation="fadeUp">
                  <div className="card">
                    <div className="heading-md">Proyectos</div>
                    <div className="text-muted">Busca compañeros, explora ideas, publica tu propuesta y consigue feedback.</div>
                  </div>
                </LandingFramer>

                <LandingFramer animation="fadeUp">
                  <div className="card">
                    <div className="heading-md">Eventos</div>
                    <div className="text-muted">Seminarios, workshops y hackathons organizados por la facultad y estudiantes.</div>
                  </div>
                </LandingFramer>
              </div>
            </div>
          </LandingFramer>
        </section>

        {/* FEATURES */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <LandingFramer animation="fadeRight">
              <div className="mt-6 panel p-6 border-border bg-surface rounded-lg shadow-md">
                <div className="heading-md mb-3">Herramientas prácticas</div>
                <ul className="space-y-3 text-body ml-0 list-none">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>Simulaciones de conceptos matemáticos y físicos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>Herramientas útiles de càlculo para diversas situaciones.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>Recopilación de herramientas externas.</span>
                  </li>
                </ul>
              </div>
            </LandingFramer>

            <LandingFramer animation="fadeLeft">
              <div className="rounded overflow-hidden">
                <div className="grid grid-cols-2 gap-3">
                  <Image src={LandingHero} alt={`galeria`} className="w-full h-44 object-cover rounded" />
                  <Image src={LandingHero} alt={`galeria`} className="w-full h-44 object-cover rounded" />
                  <Image src={LandingHero} alt={`galeria`} className="w-full h-44 object-cover rounded" />
                  <Image src={LandingHero} alt={`galeria`} className="w-full h-44 object-cover rounded" />
                </div>
              </div>
            </LandingFramer>
          </div>
        </section>

        {/* GALLERY */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h3 className="heading-lg mb-4">Galería</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LandingFramer key={i} animation="fadeUp">
                <figure className="card overflow-hidden">
                  <Image src={LandingHero} alt={`galeria-${i}`} className="w-full h-40 object-cover rounded" />
                  <figcaption className="p-3 text-muted text-sm">Foto {i} — actividades y proyectos</figcaption>
                </figure>
              </LandingFramer>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <LandingFramer animation="scaleIn">
            <div className="panel p-8 text-center border-border bg-surface">
              <h3 className="heading-xl mb-2">¿Listo para colaborar?</h3>
              <p className="text-muted mb-6">Crea tu cuenta, publica tu proyecto y encuentra compañeros con intereses similares.</p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/register" className="btn btn-primary btn-lg">Crear cuenta</Link>
                <Link href="/login" className="btn btn-secondary btn-lg">Entrar</Link>
              </div>
            </div>
          </LandingFramer>
        </section>

        <Footer />
      </main>
    </div>
  );
}
