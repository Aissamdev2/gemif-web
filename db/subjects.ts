import { ActionReturn, WithMandatory } from "@/app/lib/definitions";
import { db } from "./db.server";
import { Subject, subjectsTable, eq } from "./schema";
import { unstable_cache } from "next/cache";
import { failure, success } from "@/lib/errors/result";
import { DatabaseError, errorRaw, InvalidInputError } from "@/lib/errors/factories";
import { ErrorTag } from "@/lib/errors/codes";
import { Result } from "@/lib/errors/types";

export async function dbGetSubjects({ id }: { id: string }): Promise<Result<Subject[]>> {
  return await unstable_cache(async (): Promise<Result<Subject[]>> => {
    try {
      const subjects = await db.select().from(subjectsTable).where(eq(subjectsTable.userId, id));
      if (!subjects) {
        return failure(DatabaseError({
          message: "Error de base de datos",
          details: "No se pudo obtener la información de las asignaturas",
          metadata: {
            scope: "Db get subjects",
            operation: "Db get subjects",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.db],
            isExpected: true,
          },
        }))
      }
      return success(subjects)
    } catch (error: any) {
      return failure(DatabaseError({
          message: "Error de base de datos",
          details: "No se pudo obtener la información de las asignaturas",
          metadata: {
            scope: "Db get subjects",
            operation: "Db get subjects",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.db],
            isExpected: true,
          },
          raw: errorRaw(error)
        }))
    }
    },
    [`subjects-data-${id}`],
    {
      tags: ['subjects'],
    }
  )();
}

export async function dbCreateSubject({ payload }: { payload: WithMandatory<Subject, "name" | "primitiveId" | "userId"> | (WithMandatory<Subject, "name" | "primitiveId" | "userId">)[] }): Promise<Result<boolean>> {
  try {
    if (Array.isArray(payload)) {
      await db.insert(subjectsTable).values(payload);
    } else {
      await db.insert(subjectsTable).values(payload);
    }
    return success(true)
  } catch (error: any) {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo crear la asignatura",
      metadata: {
        scope: "Db create subject",
        operation: "Db create subject",
        sensitivity: "none",
        tags: [ErrorTag.external, ErrorTag.db],
        isExpected: true,
      },
      raw: errorRaw(error)
    }))
  }
}