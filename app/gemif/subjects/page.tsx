
import Footer from "@/app/ui/footer/footer";
import { ArrowRight, BookImage, FileText, Info, Library, Puzzle, Star, Trophy, Users } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function ResourcesPage() {

    const resourceCategories = [
    {
      icon: <Info className="w-5 h-5" />,
      title: "Información de asignaturas",
      description: "Información académica detallada sobre cada asignatura.",
      count: "50+ asignaturas",
      href: "/gemif/subjects/information",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      title: "Valoración de asignaturas",
      description: "Ránking de asignaturas y comentarios de otros estudiantes.",
      count: "1000+ valoraciones",
      href: "/gemif/subjects/reviews",
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
    },
  ];


  return (
    <div className="flex flex-col h-full">
      <main className="flex flex-col h-full w-full bg-bg text-text-primary">
        <section className="panel flex flex-col flex-1 w-full p-6">
          {/* Encabezado */}
          <header className="pb-6">
            <h1 className="heading-md">Recursos de GEMiF</h1>
            <p className="text-muted">
              Aquí podrá encontrar una gran variedad de recursos para cada asignatura.
            </p>
          </header>

          {/* Contenido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tarjeta Información */}
            {resourceCategories.map((category, index) => (
              <Link
                key={index}
                href={category.href}
                className="card group p-6 no-underline hover:shadow-md transition-all duration-300"
                aria-label={`Acceder a ${category.title}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icono con color temático */}
                  <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                    {category.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-body truncate">{category.title}</h2>
                      <span className="text-muted bg-surface-hover px-2 py-1 rounded-full ml-2">
                        {category.count}
                      </span>
                    </div>
                    <p className="text-muted text-xs leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-body font-medium">Explorar {}</span>
                  <div className="group-hover:translate-x-1 transition-transform duration-200">
                    <ArrowRight className="w-4 h-4 text-blue-700" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
