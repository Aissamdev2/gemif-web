
'use server'

import { ActionRedirect, SessionPayload } from "@/app/lib/definitions";
import { updateSessionCookie, verifySession } from "@/auth/dal";
import { parseWithSchema } from "@/lib/validation";
import { redirect, unauthorized } from "next/navigation";
import { INITIAL_SETUP_USER_INFO_ERROR_PATHS, initialSetupUserInfoSchema } from "./validation";
import { dbGetPrimitiveUserByName, dbUpdatePrimitiveUser } from "@/db/primitive-users";
import { PrimitiveUser } from "@/db/schema";
import { dbUpdateUser } from "@/db/users";
import { revalidateTag } from "next/cache";
import { failure, isFailure, setResource, unwrap, unwrapError } from "@/lib/errors/result";
import { Result, SanitizedResult } from "@/lib/errors/types";
import { redirectErrorUrl } from "@/lib/utils";
import { makeUserResource, DatabaseError, InvalidInputError } from "@/lib/errors/factories";
import { ErrorTag } from "@/lib/errors/codes";
import { sanitizeResult } from "@/lib/errors/sanitization/sanitizer";



export async function initializeUserInfo(formData: FormData): Promise<SanitizedResult<boolean>> {

  return sanitizeResult(await (async () => {
      // Validate session [START]
      const sessionResult = await verifySession();
      if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
      const session = unwrap(sessionResult)
      if (!session) unauthorized()
      // Validate session [END]
    
      const { userId, email, flags, role } = session;
    
      // Zod validation [START]
      const payload = {
        name: String(formData.get("name") ?? '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
        publicName: String(formData.get("publicName") ?? ''),
        year: String(formData.get("year") ?? ''),
      }
      const parsedResult = parseWithSchema<typeof payload>({ payload, schema: initialSetupUserInfoSchema, errorPaths: INITIAL_SETUP_USER_INFO_ERROR_PATHS })
      if (isFailure(parsedResult)) return parsedResult
      // Zod validation [END]
    
      const { name, publicName, year } = unwrap(parsedResult)
    
      // Ensure available primitive user [START]
      const primitiveUserResult = await dbGetPrimitiveUserByName(name)
      if (isFailure(primitiveUserResult)) return setResource(primitiveUserResult, makeUserResource({ userId, email }))
    
      const primitiveUser = unwrap(primitiveUserResult)
    
      if (primitiveUser.used) {
        return failure(InvalidInputError({
          message: "Error de verificación",
          details: "Este usuario ya se encuentra registrado en GEMiFWeb",
          metadata: {
            scope: "Initialize user info",
            operation: "Verify primitive user is non-used",
            sensitivity: "none",
            tags: [ErrorTag.userFailure],
            isExpected: true,
          },
        }))
      }
      // Ensure available primitive user [END]
    
      // Update primitive user "used" flag [START]
      const updatePrimitiveUserResult = await dbUpdatePrimitiveUser({ id: primitiveUser.id, payload: { used: true } })
      if (isFailure(updatePrimitiveUserResult)) return setResource(updatePrimitiveUserResult, makeUserResource({ userId, email }))
      // Update primitive user "used" flag [START]
    
      // Update user flags [START]
      const mergedFlags = {...flags, ...{ is_complete_user_info: true }}
    
      const updateUserResult = await dbUpdateUser({ id: userId, payload: { name, primitiveId: primitiveUser.id, publicName: publicName, year, flags: mergedFlags }})
      if (isFailure(updateUserResult)) return setResource(updateUserResult, makeUserResource({ userId, email }))
    
      revalidateTag("user")
      // Update user flags [END]
    
      // Update session cookie [START]
      
      const updateSessionResult = await updateSessionCookie({ userId, email, flags: mergedFlags, role })
      if (isFailure(updateSessionResult)) return setResource(updateSessionResult, makeUserResource({ userId, email }))
      // Update session cookie [END]
    
      // Redirect on success
      redirect('/initial-setup/subjects')
  })())
};