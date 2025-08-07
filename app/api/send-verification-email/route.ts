// app/api/send-verification-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createVerificationToken, jsonResponse } from '@/app/lib/helpers'; // Save token with userId
import { sql } from '@vercel/postgres';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email } = await req.json();

  const user = (await sql`SELECT * FROM users WHERE email = ${email}`).rows[0];
  if (!user) {
    return jsonResponse({ data: null, error: 'Usuario no encontrado', publicError: 'El usuario no existe o email incorrecto', errorCode: 'USER_NOT_FOUND', details: [] }, 404 );
  }

  const { data: token } = await createVerificationToken(user.id, 'verify');
  const verifyUrl = `${(process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string)}/verify-email?token=${token}`;

  try {
    const emailResponse = await resend.emails.send({
      from: 'gemif-web.vercel.app <onboarding@resend.dev>',
      to: [email],
      subject: 'Verifica tu correo electrónico',
      html: `<p>Haz clic en el siguiente enlace para verificar tu cuenta: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
    
    return jsonResponse({ data: token, error: null, publicError: null, errorCode: null, details: [] }, 200);
  } catch (e) {
    console.error(e);
    return jsonResponse({ data: null, error: 'Error al enviar el correo', publicError: 'Error al enviar el correo', errorCode: 'EMAIL_SEND_FAILED', details: [] }, 500 );
  }
}
