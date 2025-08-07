// app/api/send-reset-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createVerificationToken } from '@/app/lib/helpers';
import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email } = await req.json();
  const user = (await sql`SELECT * FROM users WHERE email = ${email}`).rows[0];

  if (!user || (user.rows && user.rows.length === 0)) {
    return jsonResponse({ data: null, error: 'Usuario no encontrado', publicError: 'El usuario no existe o email incorrecto', errorCode: 'USER_NOT_FOUND', details: [] }, 404 );
  }

  const { data: token } = await createVerificationToken(user.id, 'forgot');
  const resetUrl = `${(process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string)}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: 'gemif-web.vercel.app <onboarding@resend.dev>',
      to: [email],
      subject: 'Restablece tu contraseña',
      html: `<p>Haz clic para cambiar tu contraseña: <a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    return jsonResponse({ data: { user, token }, error: null, publicError: null, errorCode: null, details: [] }, 200);
  } catch (e: any) {
    console.error(e);
    return jsonResponse({ data: null, error: 'Error al enviar el correo', publicError: 'Error al enviar el correo', errorCode: 'EMAIL_SEND_FAILED', details: [] }, 500 );
  }
}
