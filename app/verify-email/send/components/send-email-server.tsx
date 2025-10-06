import { redirect, unauthorized } from "next/navigation";
import ErrorPage from "../../../ui/error";
import SendEmailClient from "./send-email-client";
import { verifySession } from "@/auth/dal";
import { dbGetVerificationTokens } from "@/db/verification-tokens";
import { redirectErrorUrl } from "@/lib/utils";
import { SessionPayload } from "@/app/lib/definitions";
import { isFailure, unwrap, unwrapError } from "@/lib/errors/result";

export default async function SendEmailServer() {

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

  const sendTrigger = tokens.length === 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-center">
        <div className="text-muted">
          El correo electrónico al que se ha enviado la verificación es:
        </div>
        <div className="text-muted">
          <strong>{email}</strong>
        </div>
      </div>
      <SendEmailClient id={userId} email={email} sendTrigger={sendTrigger} />
    </div>
  )

}
