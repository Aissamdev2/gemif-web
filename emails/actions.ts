import { ErrorTag } from "@/lib/errors/codes";
import { errorRaw, MailError } from "@/lib/errors/factories";
import { failure, success } from "@/lib/errors/result";
import { Result } from "@/lib/errors/types";
import { CreateEmailResponse, Resend } from "resend";


const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ email, subject, html }: { email: string, subject: string, html: string }): Promise<Result<CreateEmailResponse>> {
  try {
    const emailResponse = await resend.emails.send({
    from: 'GEMiFWeb <no-reply@gemif.es>',
    to: [email],
    subject,
    html,
  });

  if (emailResponse.error) {
    return failure(MailError({
      message: "Error enviar el correo de verificación",
      details: "No se pudo enviar el correo",
      metadata: {
        scope: "Send email",
        operation: "send email",
        sensitivity: "masked",
        tags: [ErrorTag.external, ErrorTag.mail],
        isExpected: true,
      },
      raw: `[${emailResponse.error.name}] ${emailResponse.error.message}`
    }))
  }

  return success(emailResponse)
  } catch (error: any) {
    return failure(MailError({
      message: "Error enviar el correo de verificación",
      details: "No se pudo enviar el correo",
      metadata: {
        scope: "Send email",
        operation: "send email",
        sensitivity: "masked",
        tags: [ErrorTag.external, ErrorTag.mail],
        isExpected: false,
      },
      raw: errorRaw(error)
    }))
  }
  
}