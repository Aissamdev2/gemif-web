import Link from "next/link"
import { Suspense } from "react"
import ProfileServer from "./profile-server"
import { SidebarClient } from "./sidebar-client"
import { LogOut } from "lucide-react"
// import { signOut } from "@/app/services/auth/services"



export default function SidebarServer() {
  return (
    <aside className="sticky flex top-0 h-full w-full bg-sidebar border-r border-sidebar-border flex-col">
      {/* Top: Header */}
      <div className="flex-none flex items-center px-5 h-14 border-b border-border">
        <Link href="/" className="flex items-center gap-2 no-underline group">
          <span className="text-md font-extrabold text-sidebar-foreground tracking-tight group-hover:opacity-80 transition-opacity">
            GEMiF
          </span>
        </Link>
      </div>

      {/* Middle: Navigation (client) */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll px-2 py-3">
        <SidebarClient />
      </nav>

      {/* Bottom: Profile + Logout */}
      <div className="flex-none px-3 py-3 border-t border-border">
        <div className="flex flex-col gap-4 p-3 rounded-lg hover:bg-gray-100 transition">
          <Suspense fallback={<ProfileSkeleton />}>
            <ProfileServer />
          </Suspense>
          <Link
            href={"/logout"}
            className="flex items-center w-full gap-2 px-2 py-1 rounded-md cursor-pointer text-xs text-red-500 hover:text-red-700 hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </Link>
        </div>
      </div>
    </aside>
  )
}

function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 skeleton" />
      <div className="flex flex-col min-w-0 gap-1">
        <div className="h-4 w-24 skeleton" />
        <div className="h-3 w-32 skeleton" />
      </div>
    </div>
  )
}
