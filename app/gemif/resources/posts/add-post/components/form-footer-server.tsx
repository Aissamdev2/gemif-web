import { redirect, unauthorized } from "next/navigation";
import { SessionPayload } from "@/app/lib/definitions";
import { verifySession } from "@/auth/dal";
import FormFooterClient from "./form-footer-client";
import { connection } from "next/server";
import { redirectErrorUrl } from "@/lib/utils";
import { isFailure, unwrap, unwrapError } from "@/lib/errors/result";

export default async function FormFooterServer() {
  // Validate session [START]
  const sessionResult = await verifySession();
  if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
  const session = unwrap(sessionResult)
  if (!session) unauthorized()
  // Validate session [END]

  const { role } = session;

  return (
    <FormFooterClient role={role} />
  );
}

