import {  redirect, unauthorized } from "next/navigation";
import { AlertTriangle } from "lucide-react"
import { verifySession } from "@/auth/dal";
import { SessionPayload } from "@/app/lib/definitions";
import { redirectErrorUrl } from "@/lib/utils";
import { connection } from "next/server";
import { isFailure, setResource, unwrap, unwrapError } from "@/lib/errors/result";
import { makeUserResource } from "@/lib/errors/factories";
import { dbGetUser } from "@/db/users";


export default async function HeaderBanner() {
  // Validate session [START]
  const sessionResult = await verifySession();
  if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
  const session = unwrap(sessionResult)
  if (!session) unauthorized()
  // Validate session [END]

  const { userId, email } = session;

  // Fetch user
  const userResult = await dbGetUser({ id: userId});
  if (isFailure(userResult)) redirectErrorUrl(unwrapError(setResource(userResult, makeUserResource({ userId, email }))))

  const { publicName } = unwrap(userResult)

  return (
    <span>{publicName}</span>
  );
}
