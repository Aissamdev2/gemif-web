import { Result } from "@/lib/errors/types"
import { db } from "./db.server"
import { User, usersTable, eq } from "./schema"
import { failure, success } from "@/lib/errors/result"
import { AuthError, DatabaseError, errorRaw } from "@/lib/errors/factories"
import { ErrorTag } from "@/lib/errors/codes"
import { unstable_cache } from "next/cache"
export async function dbGetUserByEmail(email: string): Promise<Result<Pick<User, "id" | "password" | "email" | "name" | "flags" | "role"> | null>> {
  try {
    const res = await db.select({
      id: usersTable.id,
      password: usersTable.password,
      email: usersTable.email,
      name: usersTable.name,
      flags: usersTable.flags,
      role: usersTable.role
    }).from(usersTable).where(eq(usersTable.email, email)).limit(1)

    return success(res[0])
  } catch {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo obtener la información del usuario",
      metadata: { 
        scope: "Sign in", 
        operation: "Get user by email",
        sensitivity: "none",
        tags: [ErrorTag.db, ErrorTag.users],
        isExpected: false,
      },
    }));
  }
}

export async function dbGetUser({ id }: { id: string }): Promise<Result<User>> {
  return await unstable_cache(async (): Promise<Result<User>> => {
    try {
      const user = (await db.select().from(usersTable).where(eq(usersTable.id, id)))[0];
      if (!user) {
        return failure(DatabaseError({
          message: "Error de base de datos",
          details: "No se pudo obtener la información del usuario",
          metadata: {
            scope: "Db get user",
            operation: "Db get user",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.db],
            isExpected: true,
          },
        }))
      }
      return success(user);
    } catch (error: any) {
      return failure(DatabaseError({
        message: "Error de base de datos",
        details: "No se pudo obtener la información del usuario",
        metadata: {
          scope: "Db get user",
          operation: "Db get user",
          sensitivity: "none",
          tags: [ErrorTag.external, ErrorTag.db],
          isExpected: false,
        },
        raw: errorRaw(error)
      }))
    }
  },
  [`user-data-${id}`],
  {
    tags: ['user'],
  }
  )();
}

export async function dbCreateUser({ email, password, role}: { email: string, password: string, role: 'user' | 'admin' | 'dev' }): Promise<Result<{ id: string, flags: Record<string, boolean>}>> {
  try {
    const { id, flags } = (await db.insert(usersTable).values({ email, password, role }).returning({ id: usersTable.id, flags: usersTable.flags }))[0]
    if (!id || !flags) {
      return failure(DatabaseError({
        message: "Error de base de datos",
        details: "No se pudo crear el usuario en la base de datos",
        metadata: { 
          scope: "Db create user", 
          operation: "Create user on db",
          sensitivity: "none",
          tags: [ErrorTag.db, ErrorTag.external, ErrorTag.users],
          isExpected: true,
        }
      }));
    }

    return success({ id, flags })
  } catch (error: any) {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo crear el usuario en la base de datos",
      metadata: { 
        scope: "Db create user", 
        operation: "Create user on db",
        sensitivity: "none",
        tags: [ErrorTag.db, ErrorTag.external, ErrorTag.users],
        isExpected: false,
      },
      raw: errorRaw(error)
    }));
  }
}

export async function dbUpdateUser({ id, payload }: { id: string, payload: Partial<User> }): Promise<Result<boolean>> {
  try {
    await db.update(usersTable).set(payload).where(eq(usersTable.id, id))
    return success(true)
  } catch (error: any) {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo actualizar la información del usuario",
      metadata: {
        scope: "Db update user",
        operation: "Update user",
        sensitivity: "none",
        tags: [ErrorTag.external, ErrorTag.db, ErrorTag.users],
        isExpected: true,
      },
    }))
  }
}



