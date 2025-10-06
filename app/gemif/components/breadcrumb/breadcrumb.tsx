"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const BREADCRUMB_NAMES = [
  { name: "main", shown: "Inicio" },
  { name: "add-post", shown: "Añadir nueva publicación" },
  { name: "edit-post", shown: "Editar publicación" },
  { name: "view-post", shown: "Información de la publicación" },

  { name: "calendar", shown: "Calendario" },
  { name: "add-event", shown: "Añadir nuevo evento" },

  { name: "subjects", shown: "Asignaturas" },
  { name: "resources", shown: "Recursos" },
  { name: "tools-and-simulations", shown: "Herramientas & Simulaciones" },
  { name: "settings", shown: "Configuración" },

  { name: "information", shown: "Información" },
  { name: "posts", shown: "Publicaciones" },
]

const ID_NAMES = ["edit-post", "view-post"];

export default function Breadcrumb() {
  const pathname = usePathname()

  // Split pathname into segments
  const segments = pathname.split("/").slice(2).filter(Boolean)

  // Build cumulative paths
  let isId = false;
  const paths = segments.map((seg, i) => {
    if (isId) return null
    const name = decodeURIComponent(seg)
    if (ID_NAMES.includes(name)) {
      isId = true;
    } else {
      isId = false
    }
    const shownName = BREADCRUMB_NAMES.find((br) => br.name === name)?.shown ?? name;
    return {
      name: shownName,
      href: "/gemif/" + segments.slice(0, i + 1).join("/"),
    }
  }).filter(Boolean) as {
    name: string;
    href: string;
}[]

  return (
    <div className="flex items-center max-sm:pl-16 gap-1 text-sm text-gray-500 font-bold rounded-sm bg-[#efefef] w-fit py-1 px-2">
      <Link href="/" className="hover:underline">
        GEMiF
      </Link>

      {paths.map((p, i) => (
        <span key={p.href} className="flex items-center gap-1">
          <ChevronRight size={16} />
          {i === paths.length - 1 ? (
            <span className="text-gray-900">{p.name}</span>
          ) : (
            <Link href={p.href} className="hover:underline">
              {p.name}
            </Link>
          )}
        </span>
      ))}
    </div>
  )
}
