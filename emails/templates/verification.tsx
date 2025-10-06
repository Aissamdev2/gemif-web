
export function verificationEmailTemplate({ url }: { url: string }) {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: #0f172a; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">GEMiF</h1>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px;">
        <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Verifica tu correo electrónico</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">
          Gracias por registrarte en <strong>GEMiF</strong>. Para completar el proceso, confirma tu correo electrónico haciendo clic en el botón a continuación:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; display: inline-block;">
            Verificar correo
          </a>
        </div>
        
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.4;">
          Si no creaste esta cuenta, puedes ignorar este mensaje.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} GEMiF. Todos los derechos reservados.
      </div>
      
    </div>
  </div>
  `;
}
