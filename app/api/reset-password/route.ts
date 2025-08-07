import { jsonResponse, validateVerificationToken } from '@/app/lib/helpers';
import bcrypt from 'bcrypt';
import { sql } from '@vercel/postgres';

export async function POST(req: Request) {
  const { token, password } = await req.json();

  const result = await validateVerificationToken(token, 'forgot');
  if (result.error) {
    return jsonResponse({ error: result.error, publicError: result.publicError, errorCode: result.errorCode, details: result.details }, 400);
  }

  const hashed = await bcrypt.hash(password, 12);

  try {
    await sql`
      UPDATE users SET password = ${hashed} WHERE id = ${result.data.userid};
    `;

    await sql`
      UPDATE verification_tokens SET used = true WHERE id = ${result.data.id};
    `;
  } catch (e: any) {
    
    return jsonResponse({
      data: null,
      error: e.message ?? "Unexpected error",
      publicError: "Error modificando contraseña",
      errorCode: 'UNKNOWN_ERROR',
      details: []
    }, 400)
  }

  return jsonResponse({ data: { ok: true }, error: null, publicError: null, errorCode: null, details: [] }, 200);
}
