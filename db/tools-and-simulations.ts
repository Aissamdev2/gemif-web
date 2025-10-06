import { ActionReturn } from "@/app/lib/definitions";
import { unstable_cache } from "next/cache";
import { eq, toolsAndSimulationsTable, ToolOrSimulation } from "./schema";
import { db } from "./db.server";
import { failure, success } from "@/lib/errors/result";
import { DatabaseError, errorRaw } from "@/lib/errors/factories";
import { ErrorTag } from "@/lib/errors/codes";
import { Result } from "@/lib/errors/types";


export const dbGetToolsAndSimulations = unstable_cache(async function dbGetToolsAndSimulations(): Promise<Result<ToolOrSimulation[]>> {
  try {
    const toolsAndSimulations = await db.select().from(toolsAndSimulationsTable).orderBy(toolsAndSimulationsTable.name);
    return success(toolsAndSimulations);
  } catch (error: any) {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo obtener la información de las las herramientas y simulaciones",
      metadata: {
        scope: "Db get tools and simulations",
        operation: "Db get tools and simulations",
        sensitivity: "none",
        tags: [ErrorTag.external, ErrorTag.db],
        isExpected: true,
      },
      raw: errorRaw(error)
    }))
  }
},
['tools-and-simulations'],
{
  tags: ['tools-and-simulations'],
  revalidate: 1
})