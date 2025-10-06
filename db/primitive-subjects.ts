import { ActionReturn } from "@/app/lib/definitions";
import { unstable_cache } from "next/cache";
import { eq, PrimitiveSubject, primitiveSubjectsAuditTable, primitiveSubjectsTable } from "./schema";
import { db } from "./db.server";
import { failure, success } from "@/lib/errors/result";
import { DatabaseError, errorRaw } from "@/lib/errors/factories";
import { ErrorTag } from "@/lib/errors/codes";
import { Result } from "@/lib/errors/types";

export const dbGetPrimitiveSubjects = unstable_cache(async (): Promise<Result<PrimitiveSubject[]>> => {
  try {
    const primitiveSubjects = await db.select().from(primitiveSubjectsTable).orderBy(primitiveSubjectsTable.id);
    if (!primitiveSubjects || !primitiveSubjects.length) {
      return failure(DatabaseError({
        message: "Error de base de datos",
        details: "No se pudo obtener la información de las asignaturas",
        metadata: {
          scope: "Db get primitive subjects",
          operation: "Db get primitive subjects",
          sensitivity: "none",
          tags: [ErrorTag.external, ErrorTag.db],
          isExpected: false,
        },
      }))
    }
    return success(primitiveSubjects);
  } catch (error: any) {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo obtener la información de las asignaturas",
      metadata: {
        scope: "Db get primitive subjects",
        operation: "Db get primitive subjects",
        sensitivity: "none",
        tags: [ErrorTag.external, ErrorTag.db],
        isExpected: true,
      },
      raw: errorRaw(error)
    }))
  }
},
['primitive-subjects'],
{
  tags: ['primitive-subjects'],
})


export async function dbUpdatePrimitiveSubject({ userId, id, payload }: { userId: string, id: string, payload: Partial<PrimitiveSubject> }): Promise<Result<boolean>> {

  try {
    const [updatedRow] = await db.update(primitiveSubjectsTable).set(payload).where(eq(primitiveSubjectsTable.id, id)).returning();

    await db.insert(primitiveSubjectsAuditTable).values({
      subjectId: updatedRow.id,
      action: "update",
      newData: updatedRow,
      changedBy: userId,
    });

    return success(true)
  } catch(error: any) {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo modificar la información de la asignatura",
      metadata: {
        scope: "Db update primitive subject",
        operation: "Db update primitive subject",
        sensitivity: "none",
        tags: [ErrorTag.external, ErrorTag.db],
        isExpected: false,
      },
      raw: errorRaw(error)
    }))
  }
}