
import 'server-only'
import { JWTPayload, jwtVerify, SignJWT } from "jose"
import { SessionPayload } from "../app/lib/definitions"
import { AuthError, errorRaw, makeFileResource, makeSessionResource, makeSessionTokenResource } from '@/lib/errors/factories'
import { failure, isFailure, success, unwrap } from '@/lib/errors/result'
import { Result } from '@/lib/errors/types'
import { ErrorTag } from '@/lib/errors/codes'


// Edge-compatible encoder
const sessionSecret = new TextEncoder().encode(process.env.JWT_SECRET)
export const SESSION_MAX_AGE = Number(process.env.JWT_MAX_AGE_SECONDS ?? 60 * 60 * 24 * 7) // 7 days


// Function to sign the session
export async function signSession(payload: SessionPayload): Promise<Result<string>> {
  // Jwt sign parameters and signing
  const now = Math.floor(Date.now() / 1000)
  const exp = now + SESSION_MAX_AGE
  try {
    const hash = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .sign(sessionSecret)
    
    return success(hash);
  } catch (error: any) {
    return failure(AuthError({
      message: "Error de sessión",
      details: "No se pudo crear la sessión",
      metadata: { 
        scope: "Sign session", 
        operation: "Sign jwt payload",
        sensitivity: "masked",
        tags: [ErrorTag.auth, ErrorTag.session, ErrorTag.login, ErrorTag.jose, ErrorTag.jwt],
        isExpected: false,
      },
      raw: errorRaw(error)
    }));
  }
}

// Function to set up the cookie configuration
export function cookieOptions(expiresAt?: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  }
}

// Function to verify the session token
export async function verifySessionToken({ token }: { token: string }): Promise<Result<SessionPayload>> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret, { algorithms: ['HS256'] })
    // jose returns JWTPayload; ensure typing
    const p = payload as JWTPayload & SessionPayload
    const { userId, email, flags, role } = p
    if (!userId) {
      return failure(AuthError({
        message: "Error de sessión",
        details: "No se pudo verficar la sesión",
        metadata: {
          scope: "Verify session token",
          operation: "User id retrieval",
          sensitivity: "none",
          tags: [ErrorTag.auth, ErrorTag.session, ErrorTag.jwt, ErrorTag.jose],
          isExpected: true,
        },
        resource: makeSessionTokenResource(token)
      }))
    }
    return success({ userId: userId, email, flags: flags, role })
  } catch (error: any) {
    return failure(AuthError({
      message: "Error de sessión",
      details: "No se pudo verficar la sesión",
      metadata: {
        scope: "Verify session token",
        operation: "Jwt verification",
        sensitivity: "none",
        tags: [ErrorTag.auth, ErrorTag.session, ErrorTag.jwt, ErrorTag.jose],
        isExpected: true,
      },
      resource: makeSessionTokenResource(token),
      raw: errorRaw(error)
    }))
  }
}



export async function hashPassword({ password, salt }: { password: string, salt: string }): Promise<Result<string>> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password); // combine salt + password
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // convert to hex string
    return success(hashArray.map(b => b.toString(16).padStart(2, "0")).join(""));
  } catch (error: any) {
    return failure(AuthError({
      message: "Error durante el tratamiento de la contraseña",
      details: "No se pudo cifrar la contraseña",
      metadata: { 
        scope: "Sign up", 
        operation: "hashPassword",
        sensitivity: "none",
        tags: [ErrorTag.auth, ErrorTag.crypto],
        isExpected: false,
      },
      raw: errorRaw(error)
    }));
  }
}




// Verification tokens

export async function hashVerificationToken({ rawToken }: { rawToken: string}): Promise<Result<string>> {
  const enc = new TextEncoder();
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      'raw',
      enc.encode(process.env.TOKEN_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
  } catch (error: any) {
    return failure(AuthError({
      message: "Error al crear el token de verificación",
      details: "No se pudo cifrar el token de verificación",
      metadata: {
        scope: "Hash verification token",
        operation: "Create crypto subtle key with env token secret",
        sensitivity: "masked",
        tags: [ErrorTag.auth, ErrorTag.env],
        isExpected: false,
      },
      raw: errorRaw(error)
    }))
  }
  try {
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(rawToken));
    return success(Buffer.from(signature).toString('hex'));
  } catch (error: any) {
    return failure(AuthError({
      message: "Error al crear el token de verificación",
      details: "No se pudo cifrar el token de verificación",
      metadata: {
        scope: "Hash verification token",
        operation: "Verification token sign with crypto subtle",
        sensitivity: "masked",
        tags: [ErrorTag.auth, ErrorTag.verification, ErrorTag.crypto],
        isExpected: false,
      },
      raw: errorRaw(error)
    }))
  }
}

export async function compareVerificationToken({ rawToken, hashedToken }: { rawToken: string, hashedToken: string }) {
  const hashedResult = await hashVerificationToken({ rawToken });
  if (isFailure(hashedResult)) return hashedResult
  const hashed = unwrap(hashedResult)
  return hashed === hashedToken;
}

export function generateUUIDToken(): Result<string> {
  try {
    const token = (
      typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
        ? (crypto as any).randomUUID()
        : (function uuidv4Fallback() {
            const bytes = crypto.getRandomValues(new Uint8Array(16))
            // per RFC4122 set version and variant bits
            bytes[6] = (bytes[6] & 0x0f) | 0x40
            bytes[8] = (bytes[8] & 0x3f) | 0x80
            const toHex = (b: number) => b.toString(16).padStart(2, '0')
            return (
              toHex(bytes[0]) +
              toHex(bytes[1]) +
              toHex(bytes[2]) +
              toHex(bytes[3]) +
              '-' +
              toHex(bytes[4]) +
              toHex(bytes[5]) +
              '-' +
              toHex(bytes[6]) +
              toHex(bytes[7]) +
              '-' +
              toHex(bytes[8]) +
              toHex(bytes[9]) +
              '-' +
              toHex(bytes[10]) +
              toHex(bytes[11]) +
              toHex(bytes[12]) +
              toHex(bytes[13]) +
              toHex(bytes[14]) +
              toHex(bytes[15])
            )
          })()
    )
    return success(token)
  } catch (error: any) {
    return failure(AuthError({
      message: "Error al crear el token",
      details: "No se pudo generar el token",
      metadata: {
        scope: "Generate uuid token",
        operation: "Generate uuid token",
        sensitivity: "masked",
        tags: [ErrorTag.auth, ErrorTag.crypto],
        isExpected: false,
      },
      raw: errorRaw(error)
    }))
  }
}



// Cloudflare R2 (Worker) tokens

const r2WorkerSecret = new TextEncoder().encode(process.env.R2_WORKER_SECRET!);
export const R2_WORKER_MAX_AGE = Number(process.env.R2_WORKER_JWT_MAX_AGE_SECONDS ?? 60 * 5) // 5 minutes

// Create a token for uploading
export async function signR2WorkerToken({ payload, expires }: { payload: { key: string }, expires: number }): Promise<Result<string>> {
  const now = Math.floor(Date.now() / 1000)
  
  const exp = now + expires
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(exp)
      .sign(r2WorkerSecret);

    return success(token)
  } catch (error: any) {
    return failure(AuthError({
        message: "Error al firmar el token",
        details: "No se pudo firmar el token",
        metadata: {
          scope: "Sign r2 worker token",
          operation: "Sign r2 worker token",
          sensitivity: "masked",
          tags: [ErrorTag.auth, ErrorTag.workerAuth, ErrorTag.jwt, ErrorTag.jose],
          isExpected: false,
        },
        raw: errorRaw(error)
      }))
  }
}

// Verify a token
export async function verifyR2WorkerToken<T extends JWTPayload = JWTPayload>(
  token: string
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, r2WorkerSecret);
    return  payload as T;
  } catch (err: any) {
    return null;
  }
}
