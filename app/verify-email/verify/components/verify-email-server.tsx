import VerifyEmailClient from "./verify-email-client";
import { redirect, unauthorized } from "next/navigation";
import ErrorPage from "../../../ui/error";
import { dbGetVerificationTokens } from "@/db/verification-tokens";
import { validateToken, verifySession } from "@/auth/dal";
import { SessionPayload } from "@/app/lib/definitions";
import { redirectErrorUrl } from "@/lib/utils";
import { isFailure, unwrap, unwrapError } from "@/lib/errors/result";

export default async function VerifyEmailServer({ token }: { token: string }) {
  // Validate session [START]
  const sessionResult = await verifySession();
  if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
  const session = unwrap(sessionResult)
  if (!session) unauthorized()
  // Validate session [END]

  const { userId, email } = session;

  const verificationTokensResult = await dbGetVerificationTokens({ id: userId, type: 'verify' })
  if (isFailure(verificationTokensResult)) redirectErrorUrl(unwrapError(verificationTokensResult))
  
  const tokens = unwrap(verificationTokensResult)

  const verificationResult = await validateToken({ rawToken: token, tokens })
  if (isFailure(verificationResult)) return redirectErrorUrl(unwrapError(verificationResult))

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-center">
        <div className="text-muted">
          El correo electrónico que va a verificar es:
        </div>
        <div className="text-muted">
          <strong>{email}</strong>
        </div>
      </div>
      <VerifyEmailClient   />
    </div>
  )

}
