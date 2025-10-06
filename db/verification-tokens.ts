import { ActionReturn } from "@/app/lib/definitions";
import { revalidateTag, unstable_cache } from "next/cache";
import { VerificationToken, verificationTokensTable, and, eq, gt } from "./schema";
import { db } from "./db.server";
import { failure, success } from "@/lib/errors/result";
import { DatabaseError, makeVerificationResource } from "@/lib/errors/factories";
import { ErrorTag } from "@/lib/errors/codes";
import { Result, VerificationResource } from "@/lib/errors/types";


export async function dbGetVerificationTokens({ id, type }: { id: string, type: 'verify' | 'forgot' }): Promise<Result<VerificationToken[]>> {
  return await unstable_cache(async (): Promise<Result<VerificationToken[]>> => {
    try {
      const tokens = await  db
        .select()
        .from(verificationTokensTable)
        .where(
          and(
            eq(verificationTokensTable.userId, id),
            eq(verificationTokensTable.type, type),
            gt(verificationTokensTable.expires, new Date()) // only not expired
          )
        );
      return success(tokens);
    } catch (error) {
      const resource = makeVerificationResource({ userId: id, type })
      return failure(DatabaseError({
        message: "Error de base de datos",
        details: "No se pudieron obetenr los tokens de verificación",
        metadata: {
          scope: "Verification token creation",
          operation: "Verification token db creation",
          sensitivity: "masked",
          tags: [ErrorTag.db, ErrorTag.auth, ErrorTag.verification],
          isExpected: true,
        },
        resource
      }))
    }
    },
    [`verification-tokens-data-${id}-${type}`],
    {
      tags: ['verification-tokens'],
    }
  )();
}


export async function dbCreateVerificationToken({ userId, token, expires, type }: { userId: string, token: string, expires: Date, type: 'verify' | 'forgot'}): Promise<Result<boolean, VerificationResource>> {
  try {
    await db.insert(verificationTokensTable).values({
      token: token,
      expires: expires,
      type,
      userId: userId
    })
    return success(true)
  } catch (error: any) {
    const resource = makeVerificationResource({ userId: userId, token, expires, type })
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo crear el token de verificación",
      metadata: {
        scope: "Verification token creation",
        operation: "Verification token db creation",
        sensitivity: "masked",
        tags: [ErrorTag.db, ErrorTag.auth, ErrorTag.verification],
        isExpected: true,
      },
      resource
    }))
  }
}


export async function dbDeleteVerificationToken({ userId }: { userId: string }): Promise<Result<boolean>> {
  try {
    await db.delete(verificationTokensTable).where(eq(verificationTokensTable.userId, userId))
    return success(true)
  } catch (error: any) {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo eliminar el token de verificación",
      metadata: {
        scope: "Verification token deletion",
        operation: "Verification token db deletion",
        sensitivity: "masked",
        tags: [ErrorTag.db, ErrorTag.auth, ErrorTag.verification],
        isExpected: true,
      },
    }))
  }
}