'use server'

import { ErrorTag } from "@/lib/errors/codes"
import { AuthError, errorRaw } from "@/lib/errors/factories"
import { failure, success } from "@/lib/errors/result"
import { Result, SanitizedResult } from "@/lib/errors/types"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { sanitizeResult } from "@/lib/errors/sanitization/sanitizer"


export async function logOut(): Promise<SanitizedResult<boolean>> {
  return sanitizeResult(await (async () => {
      const cookieStore = await cookies()
      try {
        cookieStore.delete("session")
        return success(true)
      } catch (error: any) {
        return failure(AuthError({
          message: "Error cerrando sesión",
          details: "No se pudo cerrar la sesión",
          metadata: { 
            scope: "Sign out", 
            operation: "Could not delete",
            sensitivity: "none",
            tags: [ErrorTag.auth, ErrorTag.session, ErrorTag.cookies],
            isExpected: false,
          },
          raw: errorRaw(error)
        }));
      }
  })())
}