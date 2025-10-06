
'use server'

import { parseWithSchema } from "@/lib/validation";
import { SIGN_IN_ERROR_PATHS, signInSchema } from "./validation";
import { ActionRedirect } from "../../lib/definitions";
import { redirect } from "next/navigation";
import { dbGetUserByEmail } from "../../../db/users";
import { User } from "../../../db/schema";
import { createSessionCookie } from "../../../auth/dal";
import { hashPassword } from "@/auth/logic";
import { Result, SanitizedResult } from "@/lib/errors/types";
import { failure, isFailure, setResource, unwrap } from "@/lib/errors/result";
import { AuthError, makeUserEmailResource, makeUserResource, R2ServerStorageError } from "@/lib/errors/factories";
import { ErrorTag } from "@/lib/errors/codes";
import { sanitizeError, sanitizeResult } from "@/lib/errors/sanitization/sanitizer";

// Sign in server action
export async function signIn(formData: FormData): Promise<SanitizedResult<boolean>> {
  return sanitizeResult(await (async () => {
      // Zod validation [START]
      const payload = {
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
      }
      const parsedResult = parseWithSchema<typeof payload>({ payload, schema: signInSchema, errorPaths: SIGN_IN_ERROR_PATHS })
      if (!parsedResult.ok) return parsedResult
      // Zod validation [END]
    
      const { email, password } = parsedResult.data;
    
      // Account verification [START]
      const userResult = await dbGetUserByEmail(email)
      if (isFailure(userResult)) return setResource(userResult, makeUserEmailResource({ email }))
    
      const user = unwrap(userResult)

      if (!user) {
        return failure(AuthError({
          message: "No se encontró el usuario",
          details: "El correo introducido no pertenece a ningún usuario registrado",
          metadata: { 
            scope: "Db get yser by email", 
            operation: "Db get yser by email",
            sensitivity: "none",
            tags: [ErrorTag.db, ErrorTag.users],
            isExpected: true,
          },
          resource: makeUserEmailResource({ email })
        }));
      }
    
      if (!user.password) return failure(AuthError({
          message: "Error de tipo cuenta",
          details: "Debes iniciar sesión con el mètodo adecuado",
          metadata: { 
            scope: "Sign in", 
            operation: "Db user has no password",
            sensitivity: "none",
            tags: [ErrorTag.auth, ErrorTag.account, ErrorTag.login],
            isExpected: true,
          },
          resource: makeUserEmailResource({ email })
        }));
      // Account verification [END]
    
      // Password verification [START]
      const salt = process.env.PASSWORD_SALT
      if (!salt) return failure(AuthError({
          message: "Error durante el cifrado de la contraseña",
          details: "No se pudo cifrar la contraseña",
          metadata: {
            scope: "Sign in", 
            operation: "Salt env obetention",
            sensitivity: "none",
            tags: [ErrorTag.auth, ErrorTag.login, ErrorTag.env],
            isExpected: false,
          },
          resource: makeUserEmailResource({ email })
        }));

      const hashedPasswordResult = await hashPassword({ password, salt })
      if (isFailure(hashedPasswordResult)) return setResource(hashedPasswordResult, makeUserEmailResource({ email }))
      const hashedPassword = unwrap(hashedPasswordResult)

      if (hashedPassword !== user.password) {
        return failure(AuthError({
          message: "Error de autenticación",
          details: "Contraseña incorrecta",
          metadata: {
            scope: "Sign in", 
            operation: "Password hashes comparison",
            sensitivity: "none",
            tags: [ErrorTag.auth, ErrorTag.login],
            isExpected: true,
          },
          resource: makeUserEmailResource({ email })
        }));
      }
      // Password verification [END]
    
      // Create the session cookie
      const sessionResult = await createSessionCookie({ userId: user.id, email: user.email, flags: user.flags, role: user.role })
      if (isFailure(sessionResult)) return setResource(sessionResult, makeUserEmailResource({ email }))
    
      // Redirect on success
      redirect('/gemif/main');
  })())
}
