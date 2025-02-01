import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { UserCookie, VerifySession } from './definitions';

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
  const sessionString = cookies().get('session')?.value;
  return sessionString ? JSON.parse(sessionString) : null;
}

export async function verifySession(): Promise<VerifySession> {
  const sessionString = cookies().get('session')?.value;
  const session = sessionString ? JSON.parse(sessionString) : null;
  if (!session) {
    return { error: "No session", session: null }
  }
  const { token } = session
  if (!token) {
    return { error: "No token", session: null }
  }
  const payload = await verifyJWT(token)
  if (!payload) {
    return { error: "Invalid token", session: null }
  }
  const { id: userId } = session
  if (!userId) {
    return { error: "No user id", session: null }
  }
  return { error: null, session}
}