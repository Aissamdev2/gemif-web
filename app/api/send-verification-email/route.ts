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
      from: 'GEMiF <no-reply@gemif.es>',
      to: [email],
      subject: 'Verifica tu correo electrónico',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            
            <div style="background: #0f172a; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">GEMiF</h1>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #0f172a; font-size: 20px;">Verifica tu correo electrónico</h2>
              <p style="color: #334155; font-size: 16px;">
                Gracias por registrarte en <strong>GEMiF</strong>. Para completar el proceso, por favor confirma tu correo electrónico haciendo clic en el siguiente botón:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; display: inline-block;">
                  Verificar correo
                </a>
              </div>
              
              <p style="color: #94a3b8; font-size: 14px;">
                Si no creaste esta cuenta, puedes ignorar este mensaje.
              </p>
            </div>
            
            <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} GEMiF. Todos los derechos reservados.
            </div>
            
          </div>
        </div>
      `,
    });

    
    return jsonResponse({ data: token, error: null, publicError: null, errorCode: null, details: [] }, 200);
  } catch (e) {
    console.error(e);
    return jsonResponse({ data: null, error: 'Error al enviar el correo', publicError: 'Error al enviar el correo', errorCode: 'EMAIL_SEND_FAILED', details: [] }, 500 );
  }
}
