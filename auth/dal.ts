'use server'

import { cookies } from "next/headers"
import { ActionReturn, SessionPayload } from "../app/lib/definitions"
import { compareVerificationToken, cookieOptions, generateUUIDToken, hashVerificationToken, SESSION_MAX_AGE, signR2WorkerToken, signSession, verifySessionToken } from "./logic"
import { cache } from "react"
import { VerificationToken } from "@/db/schema"
import { dbCreateVerificationToken } from "@/db/verification-tokens"
import { Result, UserResource } from "@/lib/errors/types"
import { failure, isFailure, setResource, success, unwrap } from "@/lib/errors/result"
import { AuthError, errorRaw, makeUserResource } from "@/lib/errors/factories"
import { ErrorTag } from "@/lib/errors/codes"
import { connection } from "next/server"


export async function createSessionCookie(payload: SessionPayload): Promise<Result<boolean, UserResource>> {
  const tokenResult = await signSession(payload)
  if (isFailure(tokenResult)) return setResource(tokenResult, makeUserResource({ userId: payload.userId, email: payload.email}))

  const token = unwrap(tokenResult)
  const expires = new Date(Date.now() + SESSION_MAX_AGE * 1000)
  try {
    const cookieStore = await cookies()
    cookieStore.set('session', token, cookieOptions(expires))
    return success(true)
  } catch (error: any) {
    return failure(AuthError({
      message: "Error de sessión",
      details: "No se pudo crear la sessión",
      metadata: { 
        scope: "Create session cookie", 
        operation: "reate session cookie",
        sensitivity: "masked",
        tags: [ErrorTag.auth, ErrorTag.login, ErrorTag.cookies],
        isExpected: false,
      },
      raw: errorRaw(error)
    }));
  }
}

export async function updateSessionCookie(payload: SessionPayload): Promise<Result<boolean, UserResource>> {
  return await createSessionCookie(payload)
}

export const verifySession = cache(async (): Promise<Result<SessionPayload | null>> => {
  await connection()
  let token: string;
  try {
    const cookie = (await cookies()).get('session')
    if (!cookie?.value) {
      return success(null)
    }
    token = cookie.value 
  } catch (error: any) {
    return failure(AuthError({
      message: "Error de sessión",
      details: "No se pudo obtener la sessión",
      metadata: {
        scope: "Session verification",
        operation: "Session cookie retrieval",
        sensitivity: "none",
        tags: [ErrorTag.auth, ErrorTag.session, ErrorTag.cookies],
        isExpected: false,
      },
      raw: errorRaw(error)
    }))
  }
  const session = await verifySessionToken({ token })
  return session
})


export async function createVerificationToken({ userId, type }: { userId: string, type: 'verify' | 'forgot'}): Promise<Result<string>> {
  
  const  rawTokenResult = generateUUIDToken();
  if (isFailure(rawTokenResult)) return rawTokenResult

  const rawToken = unwrap(rawTokenResult)

  const hashedTokenResult = await hashVerificationToken({ rawToken })
  if (isFailure(hashedTokenResult)) return hashedTokenResult
  
  const hashedToken = unwrap(hashedTokenResult)
  
  const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hour from now
  const creationResult = await dbCreateVerificationToken({ userId, token: hashedToken, expires, type })
  if (isFailure(creationResult)) return creationResult

  return success(rawToken);
}

export async function validateToken({
  rawToken,
  tokens,
}: {
  rawToken: string;
  tokens: VerificationToken[]
}): Promise<Result<VerificationToken>> {


  if (tokens.length === 0) return failure(AuthError({
    message: "Error de validación",
    details: "No se proporcionaron tokens a validar",
    metadata: {
      scope: "Validate token",
      operation: "Token length check",
      sensitivity: "none",
      tags: [ErrorTag.auth, ErrorTag.verification],
      isExpected: false,
    },
  }))

  // Check sequentially to allow short-circuiting on the first match
  for (const token of tokens) {
    const isMatch = await compareVerificationToken({
      rawToken,
      hashedToken: token.token,
    });
    if (isMatch) {
      return success(token);
    }
  }

  return failure(AuthError({
    message: "Error de validación",
    details: "El token es inválido",
    metadata: {
      scope: "Validate token",
      operation: "Check for valid tokens",
      sensitivity: "none",
      tags: [ErrorTag.auth, ErrorTag.verification],
      isExpected: false,
    },
  }))
}


// Cloudflare R2 (Worker) tokens

// Create a token for uploading
export async function createR2WorkerToken({ payload, expires }: { payload: { key: string }, expires: number }): Promise<Result<string>> {
  return await signR2WorkerToken({ payload, expires })
}

// Verify a token
export async function validateR2WorkerToken(
  token: string
): Promise<any> {
  
}











