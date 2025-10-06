'use server'

import { ActionReturn } from "@/app/lib/definitions";
import { createVerificationToken } from "@/auth/dal";
import { sendEmail } from "@/emails/actions";
import { verificationEmailTemplate } from "@/emails/templates/verification";
import { ErrorTag } from "@/lib/errors/codes";
import { MailError } from "@/lib/errors/factories";
import { failure, isFailure, success, unwrap } from "@/lib/errors/result";
import { sanitizeResult } from "@/lib/errors/sanitization/sanitizer";
import { Result, SanitizedResult } from "@/lib/errors/types";
import { revalidateTag } from "next/cache";



export async function sendVerificationEmail({ id, email }: { id: string, email: string }): Promise<SanitizedResult<boolean>> {
  return sanitizeResult(await (async () => {
      // Create the verification token
      const tokenResult = await createVerificationToken({ userId: id, type: 'verify' });
      if (isFailure(tokenResult)) return tokenResult
    
      const token = unwrap(tokenResult);
      revalidateTag("verification-tokens")
      
      // Email HTML structure [START]
      const url = `${(process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string)}/verify-email/verify?token=${encodeURIComponent(token)}`;
      const html = verificationEmailTemplate({ url })
      // Email HTML structure [START]
    
      // Send email [START]
      const emailResult = await sendEmail({ email, subject: "Verifica tu correo electrónico", html})
      if (isFailure(emailResult)) return emailResult

      return success(true)
      // Send email [END]
  })())
}