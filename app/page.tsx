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
              maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0))",
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0))",
            }}
          ></div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="panel rounded p-2 flex items-center gap-3 border-border bg-surface">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold bg-primary text-text-on-accent">
                G
              </div>
              <div>
                <div className="heading-lg">GEMiFWeb</div>
                <div className="text-muted">Enginyeria Matemàtica i Física — URV</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <Link href="/login" className="btn btn-ghost btn-md">
              Inicia sessió
            </Link>
            <Link href="/register" className="btn btn-primary btn-md">
              Registra&apos;t
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
                GEMiFWeb — Grau en Enginyeria Matemàtica i Física
              </h1>
              <p className="text-muted mb-6">
                GEMiFWeb és l&apos;espai de la comunitat d&apos;estudiants del grau GEMiF de la Universitat Rovira i Virgili (URV) a Tarragona, Catalunya. Compartim exercicis, projectes, recursos i eines aplicades a les matemàtiques i la física amb una clara vocació acadèmica i cultural catalana.
              </p>

              <div className="flex gap-3">
                <Link href="/register" className="btn btn-primary btn-lg">
                  Uneix-te gratis
                </Link>
                <Link href="#about" className="btn btn-secondary btn-lg">
                  Més informació
                </Link>
              </div>

              <div className="mt-6 panel p-6 border-border bg-surface rounded-lg shadow-md">
                <div className="heading-md mb-3">El que hi trobaràs</div>
                <ul className="space-y-3 text-body ml-0 list-none">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>Repositori d&apos;exercicis resolts i problemes d&apos;accés a la universitat amb explicacions en català.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>Guies per a programació científica pensades per estudiants de la URV.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>Fòrums i grups d&apos;estudi per assignatura i per projectes impulsats per la comunitat estudiantil a Tarragona.</span>
                  </li>
                </ul>
              </div>
            </div>
          </LandingFramer>

          <LandingFramer animation="scaleIn">
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-md rounded-lg overflow-hidden shadow-lg border border-border bg-surface">
                <Image src={LandingHero} alt="estudiants treballant a la URV" className="w-full h-64 object-cover" />
                <div className="p-4">
                  <div className="heading-md">Aprèn col·laborant</div>
                  <div className="text-muted">Recursos compartits i informació acadèmica per a la comunitat de la URV.</div>
                </div>
              </div>
            </div>
          </LandingFramer>
        </section>

        {/* ABOUT */}
        <section id="about" className="max-w-6xl mx-auto px-6 py-12">
          <LandingFramer animation="fadeUp" custom={1}>
            <div className="panel p-8 border-border bg-surface">
              <h2 className="heading-xl mb-2">Per què GEMiFWeb?</h2>
              <p className="text-muted mb-4">
                Molts dels nostres mòduls combinen teoria i implementacions pràctiques amb projectes de grup. GEMiFWeb centralitza material docent, plans de treball, exposicions i solucions — i ofereix un espai per practicar presentacions i avaluar propostes de projectes dins de la comunitat acadèmica catalana.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <LandingFramer animation="fadeUp">
                  <div className="card">
                    <div className="heading-md">Recursos</div>
                    <div className="text-muted">Apunts, notebooks, exemples interactius i enllaços a eines amb suport en català.</div>
                  </div>
                </LandingFramer>

                <LandingFramer animation="fadeUp">
                  <div className="card">
                    <div className="heading-md">Projectes</div>
                    <div className="text-muted">Troba companys, publica la teva proposta i rep feedback de la comunitat estudiantil de la URV.</div>
                  </div>
                </LandingFramer>

                <LandingFramer animation="fadeUp">
                  <div className="card">
                    <div className="heading-md">Esdeveniments</div>
                    <div className="text-muted">Seminaris, tallers i hackathons organitzats per la facultat i estudis a Tarragona i la resta de Catalunya.</div>
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
                <div className="heading-md mb-3">Eines pràctiques</div>
                <ul className="space-y-3 text-body ml-0 list-none">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>Simulacions de conceptes matemàtics i físics pensades per a l&apos;aprenentatge col·laboratiu.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>Eines de càlcul útils per a pràctiques i treballs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>Recopilació d&apos;eines externes i recursos locals de la comunitat estudiantil universitària.</span>
                  </li>
                </ul>
              </div>
            </LandingFramer>

            <LandingFramer animation="fadeLeft">
              <div className="rounded overflow-hidden">
                <div className="grid grid-cols-2 gap-3">
                  <Image src={LandingHero} alt={`galeria URV`} className="w-full h-44 object-cover rounded" />
                  <Image src={LandingHero} alt={`galeria URV`} className="w-full h-44 object-cover rounded" />
                  <Image src={LandingHero} alt={`galeria URV`} className="w-full h-44 object-cover rounded" />
                  <Image src={LandingHero} alt={`galeria URV`} className="w-full h-44 object-cover rounded" />
                </div>
              </div>
            </LandingFramer>
          </div>
        </section>

        {/* GALLERY */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h3 className="heading-lg mb-4">Galeria</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LandingFramer key={i} animation="fadeUp">
                <figure className="card overflow-hidden">
                  <Image src={LandingHero} alt={`galeria-${i} URV`} className="w-full h-40 object-cover rounded" />
                  <figcaption className="p-3 text-muted text-sm">Foto {i} — activitats i projectes de la comunitat estudiantil a Tarragona</figcaption>
                </figure>
              </LandingFramer>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <LandingFramer animation="scaleIn">
            <div className="panel p-8 text-center border-border bg-surface">
              <h3 className="heading-xl mb-2">Preparat per col·laborar?</h3>
              <p className="text-muted mb-6">Crea el teu compte, publica el teu projecte i troba companys amb interessos similars dins de la comunitat GEMiF de la URV.</p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/register" className="btn btn-primary btn-lg">Crear compte</Link>
                <Link href="/login" className="btn btn-secondary btn-lg">Entra</Link>
              </div>
            </div>
          </LandingFramer>
        </section>

        <Footer />
      </main>
    </div>
  );
}
