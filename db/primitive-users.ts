import { failure, success } from "@/lib/errors/result"
import { db } from "./db.server"
import { PrimitiveUser, primitiveUsersTable, eq } from "./schema"
import { DatabaseError, errorRaw } from "@/lib/errors/factories"
import { ErrorTag } from "@/lib/errors/codes"
import { Result } from "@/lib/errors/types"



export async function dbGetPrimitiveUserByName(name: string): Promise<Result<Pick<PrimitiveUser, "id" | "used">>> {
  try {
    const primitiveUser = await db.select({ id: primitiveUsersTable.id, used: primitiveUsersTable.used }).from(primitiveUsersTable).where(eq(primitiveUsersTable.name, name)).limit(1)
    if (!primitiveUser[0]) {
      return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo obtener la información sobre el usuario",
      metadata: {
        scope: "Db get primitive user by name",
        operation: "Get primitive user from db by name",
        sensitivity: "none",
        tags: [ErrorTag.db, ErrorTag.external],
        isExpected: true,
      },
    }))
    }
    return success(primitiveUser[0])
  } catch (error: any) {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo obetener la información sobre el usuario",
      metadata: {
        scope: "Db get primitive user by name",
        operation: "Get primitive user from db by name",
        sensitivity: "none",
        tags: [ErrorTag.db, ErrorTag.external],
        isExpected: false,
      },
      raw: errorRaw(error)
    }))
  }
}

export async function dbUpdatePrimitiveUser({ id, payload }: { id: string, payload: Partial<PrimitiveUser> }): Promise<Result<boolean>> {
  try {
    await db.update(primitiveUsersTable).set(payload).where(eq(primitiveUsersTable.id, id))
    return success(true)
  } catch (error: any) {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo modificar la información del usuario",
      metadata: {
        scope: "Db update primitive user",
        operation: "Db update primitive user",
        sensitivity: "none",
        tags: [ErrorTag.userFailure],
        isExpected: true,
      },
      raw: errorRaw(error)
    }))
  }

}