
'use server'

import { ActionRedirect } from "@/app/lib/definitions";
import { parseWithSchema } from "@/lib/validation";
import { SIGN_UP_ERROR_PATHS, signUpSchema } from "./validation";
import { dbCreateUser, dbGetUserByEmail } from "@/db/users";
import { createSessionCookie } from "@/auth/dal";
import { redirect } from "next/navigation";
import { User } from "@/db/schema";
import { hashPassword } from "@/auth/logic";
import { failure, isFailure, setResource, unwrap } from "@/lib/errors/result";
import { Result, SanitizedResult } from "@/lib/errors/types";
import { AuthError, makeUserEmailResource, makeUserResource, R2ServerStorageError } from "@/lib/errors/factories";
import { ErrorTag } from "@/lib/errors/codes";
import { sanitizeResult } from "@/lib/errors/sanitization/sanitizer";




// Register server action
export async function signUp(formData: FormData): Promise<SanitizedResult<boolean>> {
  return sanitizeResult(await (async () => {
    // Zod validation [START]
    const payload = {
      email: String(formData.get("email") ?? ''),
      confirmEmail: String(formData.get("confirmEmail") ?? ''),
      password: String(formData.get("password") ?? ''),
      confirmPassword: String(formData.get("confirmPassword") ?? ''),
      key: String(formData.get("key") ?? ''),
    };
    const parsedResult = parseWithSchema<typeof payload>({ payload, schema: signUpSchema, errorPaths: SIGN_UP_ERROR_PATHS })
    if (!parsedResult.ok) return parsedResult
    // Zod validation [END]

    const { email, confirmEmail, password, confirmPassword, key } = unwrap(parsedResult)

    // Input fileds validation [START]
    if (email !== confirmEmail) return failure(AuthError({
      message: "Error de entrada de usuario",
      details: "El email de confirmación no coincide",
      metadata: {
        scope: "Sign up", 
        operation: "Check email confirmation",
        sensitivity: "none",
        tags: [ErrorTag.auth, ErrorTag.signup, ErrorTag.userFailure],
        isExpected: true,
      },
      resource: makeUserEmailResource({ email })
    }));
    
    if (password !== confirmPassword) return failure(AuthError({
      message: "Error de entrada de usuario",
      details: "La contraseña de confirmación no coincide",
      metadata: {
        scope: "Sign up", 
        operation: "Check password confirmation",
        sensitivity: "none",
        tags: [ErrorTag.auth, ErrorTag.signup, ErrorTag.userFailure],
        isExpected: true,
      },
      resource: makeUserEmailResource({ email })
    }));

    const signUpKey = process.env.SIGNUP_KEY;
    if (!signUpKey) return failure(AuthError({
          message: "Error durante el cifrado de la contraseña",
          details: "No se pudo cifrar la contraseña",
          metadata: {
            scope: "Sign up", 
            operation: "signUpKey env obetention",
            sensitivity: "none",
            tags: [ErrorTag.auth, ErrorTag.signup, ErrorTag.env],
            isExpected: false,
          },
          resource: makeUserEmailResource({ email })
        }));
    if (key !== signUpKey) return failure(AuthError({
      message: "Error de entrada de usuario",
      details: "La clave es incorrecta",
      metadata: {
        scope: "Sign up", 
        operation: "Check signUpKey",
        sensitivity: "none",
        tags: [ErrorTag.auth, ErrorTag.signup, ErrorTag.userFailure],
        isExpected: true,
      },
      resource: makeUserEmailResource({ email })
    }));
    // Input fileds validation [END]


    // Check existing email [START]
    const existingResult = await dbGetUserByEmail(email)
    if (isFailure(existingResult)) return setResource(existingResult, makeUserEmailResource({ email }))
    
    const existing = unwrap(existingResult)

    if (existing) {
      return failure(AuthError({
        message: "Error al crear el usuario en la base de datos",
        details: "El usuario ya existe",
        metadata: { 
          scope: "Sign up", 
          operation: "Existing in db",
          sensitivity: "none",
          tags: [ErrorTag.auth, ErrorTag.session, ErrorTag.db, ErrorTag.users],
          isExpected: false,
        },
        resource: makeUserEmailResource({ email })
      }));
    }
    // Check existing email [END]

    
    // Password treatment [START]
    const salt = process.env.PASSWORD_SALT
    if (!salt) return failure(AuthError({
        message: "Error durante el cifrado de la contraseña",
        details: "No se pudo cifrar la contraseña",
        metadata: {
          scope: "Sign in", 
          operation: "Salt env obetention",
          sensitivity: "none",
          tags: [ErrorTag.auth, ErrorTag.signup, ErrorTag.env],
          isExpected: false,
        },
        resource: makeUserEmailResource({ email })
      }));

    const hashedPasswordResult = await hashPassword({ password: password, salt })
    if (isFailure(hashedPasswordResult)) return setResource(hashedPasswordResult, makeUserEmailResource({ email }))

    const hashedPassword = unwrap(hashedPasswordResult)
    // Password treatment [END]
    
    // User entry creation [START]
    const role = 'user'

    const creationResult = await dbCreateUser({ email, password: hashedPassword, role })
    if (isFailure(creationResult)) return setResource(creationResult, makeUserEmailResource({ email }))
    // User entry creation [END]

    const { id: userId, flags } = unwrap(creationResult)

    // Create the session cookie
    const sessionResult = await createSessionCookie({ userId: userId, email,  flags, role })
    if (isFailure(sessionResult)) return setResource(sessionResult, makeUserResource({ userId, email }))

    // Redirect on success
    redirect('/verify-email/send')
  })());

}