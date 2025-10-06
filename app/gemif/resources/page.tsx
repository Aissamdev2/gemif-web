
import Footer from "@/app/ui/footer/footer";
import { ArrowRight, BookImage, Crown, FileText, Library, Puzzle, Star, Users } from "lucide-react";
import Link from "next/link";
import React from "react";

const resourceCategories = [
  {
    icon: <BookImage className="w-5 h-5" />,
    title: "Publicaciones Académicas",
    description: "Apuntes, resúmenes y material de estudio creado por estudiantes.",
    count: "250+ publicaciones",
    href: "/gemif/resources/posts",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
  },
  {
    icon: <Puzzle className="w-5 h-5" />,
    title: "Biblioteca de problemas",
    description: "Colección de problemas organizada por asignatura y nivel de dificultad.",
    count: "800+ problemas",
    href: "/gemif/resources/problems",
    color: "bg-green-500/10 text-green-600 dark:text-green-400"
  },
  {
    icon: <Library className="w-5 h-5" />,
    title: "Exámenes Anteriores",
    description: "Material estructurado de exámenes pasados para practicar.",
    count: "120+ exámenes",
    href: "/gemif/resources/exams",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Moodle de año anterior",
    description: "Acceso a cursos y materiales del Moodle de años anteriores.",
    count: "500+ materiales",
    href: "/gemif/resources/moodle",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400"
  }
];

export default function ResourcesPage() {


  return (
    <div className="flex flex-col h-fit">
      <main className="flex flex-col h-full w-full bg-bg text-text-primary">
        <section className="panel flex flex-col gap-4 flex-1 w-full p-6">
          {/* Encabezado */}
          <header className="">
            <h1 className="heading-md">Recursos de GEMiF</h1>
            <p className="text-muted">
              Aquí podrá encontrar una gran variedad de recursos para cada asignatura.
            </p>
          </header>

          <div className="flex flex-col items-center gap-1 p-2 border boder-boder">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                <Crown className="w-4 h-4" />
              </div>
              <h2 className="heading-md">Top contribuidores</h2>
            </div>
            <ul>
              <li className="text-muted">1. Micielo Díaz - 150 contribuciones</li>
              <li className="text-muted">2. Pau OP - 150 contribuciones</li>
              <li className="text-muted">3. Juan the Horse - 150 contribuciones</li>
            </ul>
          </div>

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
