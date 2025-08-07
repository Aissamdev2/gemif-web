
import bcrypt from 'bcryptjs'
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { UserCookie, VerifySession, ApiResponse, ErrorCode } from './definitions';


export function jsonResponse(res: Partial<ApiResponse>, status = 200) {
  return new Response(JSON.stringify({
    data: res.data ?? null,
    error: res.error ?? null,
    publicError: res.publicError ?? null,
    details: res.details ?? [],
    errorCode: res.errorCode ?? null,
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}


async function hashToken(raw: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(process.env.TOKEN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(raw));
  return Buffer.from(signature).toString('hex');
}

async function compareToken(rawToken: string, hashedToken: string) {
  const hashed = await hashToken(rawToken);
  return hashed === hashedToken;
}



const API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000' // adjust if needed

export async function createVerificationToken(userId: string, type: 'verify' | 'forgot') {
  const rawToken = crypto.randomUUID()
  const hashedToken = await hashToken(rawToken)

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString() // 1 hour from now

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/verification-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_API_SECRET!,
    },
    body: JSON.stringify({ userId, token: hashedToken, expiresAt, type }),
  })

  const resJson = await res.json()
  if (!res.ok) {
    return {
      data: null,
      error: resJson.publicError,
      details: [],
    }
  }

  return { data: rawToken, error: null, details: []} // Return unhashed token for use in email
}

export async function validateVerificationToken(rawToken: string, type: 'verify' | 'forgot'): Promise<{ data: any, error: string | null, publicError: string | null, errorCode: ErrorCode | null, details: any[] }> {
  const res = await fetch(`${API_URL}/api/verification-token?type=${type}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_API_SECRET!,
    },
  })
  const { data: tokens, error } = await res.json()
  if (error || !Array.isArray(tokens)) return { data: null, error: error || 'Failed to fetch tokens', publicError: 'Error de comunicación externa', errorCode: 'UNKNOWN_ERROR', details: [] }
  for (const token of tokens) {
    const match = await compareToken(rawToken, token.token);
    if (match) {
      return { data: token, error: null, publicError: null, errorCode: null, details: [] }
    }
  }

  return {
    data: null,
    error: 'Invalid token',
    publicError: 'Token inválido',
    errorCode: 'UNKNOWN_ERROR',
    details: [],
  }
}

export async function deleteVerificationToken(id: string) {
  await fetch(`${API_URL}/api/verification-token/${id}`, {
    method: 'DELETE',
  })
}





export async function parseGitHubError(response: Response, result: any) {
  const statusCode = response.statusText;
  if (response.status === 403 || statusCode.toLocaleLowerCase().includes("rate limit")) {
    const reset = response.headers.get("X-RateLimit-Reset");
    const resetTime = reset
      ? new Date(Number(reset) * 1000).toLocaleString("es-ES", {
          timeZone: "Europe/Madrid",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "desconocido";

    return {
      errorCode: "RATE_LIMIT",
      error: result.message,
      publicError: "Límite de peticiones alcanzado",
      details: ["Restablecimiento: " + resetTime],
    };
  }


  return {
    errorCode: statusCode.toLocaleUpperCase().replace(" ", "_"),
    error: result.message,
    publicError: "Error de comunicación externa",
    details: [],
  };
}



export async function verifyJWT(token: string) {
  try {
    const { payload, protectedHeader } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET), {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    });
    return payload;
  } catch (error) {
    throw error;
  }
}

export function getSession(): UserCookie | null {
  const tokenCookieString = cookies().get('session')?.value;
  return tokenCookieString ? JSON.parse(tokenCookieString) : null;
}



type SessionType = 'auth' | 'verify' | 'forgot' | null;

export async function verifySession(): Promise<{
  error: string | null;
  ok: boolean;
  session: any | null;
  type: SessionType;
}> {
  const cookieStore = cookies();

  // 1. Normal authenticated session
  const sessionCookie = cookieStore.get('session')?.value;
  if (sessionCookie) {
    const session = JSON.parse(sessionCookie);
    const { token, id } = session || {};

    if (!token) return { error: 'Sesion no encontrada', ok: false, session: null, type: null }; if (!token) return { error: 'Token no encontrado', ok: false, session: null, type: null };
    if (!id) return { error: 'Id de usuario no encontrado', ok: false, session: null, type: null };

    const payload = await verifyJWT(token);
    if (!payload) return { error: 'Sesion no válida', ok: false, session: null, type: null };

    return { error: null, ok: true, session, type: 'auth' };
  }

  // 2. Token-based session (verify or forgot)
  const tokenCookie = cookieStore.get('tokenCookie')?.value;
  
  if (tokenCookie) {
    const session = JSON.parse(tokenCookie);
    const { token, email, type } = session || {};

    if (!token) return { error: 'Sesion no encontrada', ok: false, session: null, type: null };
    if (!email) return { error: 'Email no encontrado', ok: false, session: null, type: null };
    if (type !== 'verify' && type !== 'forgot') {
      return { error: 'Tipo de sesion no reconocida', ok: false, session: null, type: null };
    }

    const result = await validateVerificationToken(token, type);
    if (result.error) return { error: result.error, ok: false, session: null, type: null };

    return { error: null, ok: true, session, type };
  }

  // 3. No valid session
  return { error: null, ok: false, session: null, type: null };
}