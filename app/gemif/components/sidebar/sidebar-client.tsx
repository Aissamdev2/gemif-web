"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { House, Calendar, Book, FolderOpen, MessageCircleQuestion, Boxes, Swords, Settings, ChevronRight, LucideIcon, PanelsTopLeft } from "lucide-react"


type SidebarOption = {
  name: string
  href?: string
  icon?: LucideIcon
  children?: { name: string; href: string }[]
}

const SIDEBAR_OPTIONS: SidebarOption[] = [
  {
    name: "Inicio",
    href: "/gemif/main",
    icon: House,
  },
  { name: "Calendario", href: "/gemif/calendar", icon: Calendar },
  { 
    name: "Recursos",
    href: "/gemif/resources",
    icon: FolderOpen,
    children: [
      { name: "Publicaciones", href: "/gemif/resources/posts" },
      { name: "Problemas", href: "/gemif/resources/problems" },
      { name: "Examenes", href: "/gemif/resources/exams" },
      { name: "Moodle", href: "/gemif/resources/moodle" },
    ]
  },
  { 
    name: "Asignaturas",
    href: "/gemif/subjects",
    icon: Book,
    children: [
      { name: "Información", href: "/gemif/subjects/information" },
      { name: "Valoraciones", href: "/gemif/subjects/reviews" },
    ]
  },
  { name: "Desafíos semanales", href: "/gemif/weekly-challenges", icon: Swords },
  { name: "Blogs", href: "/gemif/blogs", icon: PanelsTopLeft },
  { name: "Q&A", href: "/gemif/questions-and-answers", icon: MessageCircleQuestion },
  { name: "Herramientas & Simulaciones", href: "/gemif/tools-and-simulations", icon: Boxes },
  {
    name: "Configuración",
    icon: Settings,
    href: "/gemif/settings",
    children: [
      { name: "Asignaturas", href: "/gemif/settings/subjects" },
      { name: "Colores", href: "/gemif/settings/colors" },
      { name: "Cuenta", href: "/gemif/settings/account" },
    ],
  },
]

export function SidebarClient() {
  const pathname = usePathname()

  function normalizePath(p?: string) {
    if (!p) return "/"
    const u = p.split(/[?#]/)[0]
    return u === "/" ? "/" : u.endsWith("/") ? u.slice(0, -1) : u
  }

  function isActive(href?: string) {
    if (!href) return false
    const p = normalizePath(pathname)
    const h = normalizePath(href)
    return p === h || p.startsWith(h + "/")
  }

  return (
    <ul className="space-y-0.5">
      {SIDEBAR_OPTIONS.map((opt) => {
        const parentHref = opt.href ?? opt.children?.[0]?.href
        const parentActive = isActive(parentHref)
        const anyChildActive = opt.children?.some((c) => isActive(c.href)) ?? false
        const open = parentActive || anyChildActive
        const Icon = opt.icon

        if (opt.children && opt.children.length > 0) {
          return (
            <li key={opt.name} className="relative">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs hover:bg-surface-hover transition-all`}
              >
                <Link href={opt.href ?? "#"} className="flex items-center gap-2 flex-1 truncate">
                  {Icon && (
                    <Icon
                      strokeWidth={parentActive || anyChildActive ? 4 : 3}
                      size={16}
                      className="opacity-70"
                    />
                  )}
                  <span className={`truncate text-body ${parentActive || anyChildActive ? "underline font-extrabold" : ""}`}>{opt.name}</span>
                </Link>
              </div>

              <details className="group/sidebar rounded" open={open}>
                <summary className="list-none absolute right-2 top-2 p-1 cursor-pointer rounded hover:bg-surface-hover">
                  <ChevronRight className="w-3 h-3 transition-transform duration-200 group-open/sidebar:rotate-90" />
                </summary>

                <ul className="mt-1 ml-1 pl-7 space-y-0.5 border-l border-sidebar-border transition-[max-height] duration-300 overflow-hidden max-h-0 group-open/sidebar:max-h-[1000px]">
                  {opt.children.map((sub) => {
                    const subActive = isActive(sub.href)
                    return (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          className={`block px-2 py-1.5 rounded text-muted truncate transition-all hover:bg-surface-hover ${
                            subActive ? "underline" : ""
                          }`}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </details>

              {(parentActive || anyChildActive) && (
                <span className="absolute left-0 top-0 h-full w-0.5 bg-sidebar-accent rounded-r animate-pulse" />
              )}
            </li>
          )
        }

        return (
          <li key={opt.href} className="relative">
            <Link
              href={opt.href!}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs hover:bg-surface-hover transition-all ${
                parentActive
                  ? "underline font-bold"
                  : "font normal"
              }`}
              aria-current={parentActive ? "page" : undefined}
            >
              {Icon && (
                <Icon
                  strokeWidth={parentActive ? 4 : 3}
                  size={16}
                  className="opacity-70"
                />
              )}
              <span className="truncate text-body">{opt.name}</span>
            </Link>
            {parentActive && (
              <span className="absolute left-0 top-0 h-full w-0.5 bg-sidebar-accent rounded-r animate-pulse" />
            )}
          </li>
        )
      })}
    </ul>
  )
}
