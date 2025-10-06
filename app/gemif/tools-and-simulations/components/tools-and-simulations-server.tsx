import Footer from "@/app/ui/footer/footer";
import { verifySession } from "@/auth/dal";
import { dbGetToolsAndSimulations } from "@/db/tools-and-simulations";
import { isFailure, unwrap, unwrapError } from "@/lib/errors/result";
import { redirectErrorUrl } from "@/lib/utils";
import { ArrowRight, Gamepad2, PocketKnife } from "lucide-react";
import Link from "next/link";
import { unauthorized } from "next/navigation";

const ICONS = {
  'tool': <PocketKnife className="w-6 h-6" />,
  'simulation': <Gamepad2 className="w-6 h-6" />
}

export default async function ToolsAndSimulationsServer() {
  // Validate session [START]
  const sessionResult = await verifySession();
  if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
  const session = unwrap(sessionResult)
  if (!session) unauthorized()
  // Validate session [END]

  const toolsAndSimulationsResult = await dbGetToolsAndSimulations();
  if (isFailure(toolsAndSimulationsResult)) return redirectErrorUrl(unwrapError(toolsAndSimulationsResult))
  const toolsAndSimulations = unwrap(toolsAndSimulationsResult)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Tarjeta Información */}
      {toolsAndSimulations.map((item, index) => {
        const type = item.type;
        const href = item.link ? item.link : `/playground/${item.hrefName}`;
        return (
          <Link
            key={index}
            href={href}
            className="card group p-6 no-underline hover:shadow-md transition-all duration-300"
            aria-label={`Acceder a ${item.name}`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
              >
                {ICONS[type]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-body truncate">{item.name}</h2>
                  <span className="text-muted bg-surface-hover px-2 py-1 rounded-full ml-2">
                    {(new Date(item.createdAt)).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-muted text-xs leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
              <span className="text-body font-medium">Explorar</span>
              <div className="group-hover:translate-x-1 transition-transform duration-200">
                <ArrowRight className="w-4 h-4 text-blue-700" />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  );
}
