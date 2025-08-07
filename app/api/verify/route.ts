// app/api/verify/route.ts
import { jsonResponse } from '@/app/lib/helpers';
import { validateVerificationToken } from '@/app/lib/helpers'; // custom logic
import { sql } from '@vercel/postgres';


export async function POST(req: Request) {
  const { token } = await req.json();

  const result = await validateVerificationToken(token, 'verify');
  if (result.error) {
    
    return jsonResponse({ error: result.error, publicError: result.publicError, errorCode: result.errorCode, details: result.details }, 400);
  }

  await sql`
    UPDATE users SET isverified = true WHERE id = ${result.data.userid};
  `;

  await sql`
    UPDATE verification_tokens SET used = true WHERE id = ${result.data.id};
  `;

  return jsonResponse({ data: { ok: true }, error: null, publicError: null, errorCode: null, details: [] }, 200);
}
