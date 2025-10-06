import { verifySession } from "@/auth/dal";
import { dbGetPrimitiveSubjects } from "@/db/primitive-subjects";
import { isFailure, unwrap, unwrapError } from "@/lib/errors/result";
import { redirectErrorUrl } from "@/lib/utils";
import { unauthorized } from "next/navigation";
import InformationClient from "./information-client-user";
import InformationClientAdmin from "./information-client-admin";


export default async function InformationServer() {
  // Validate session [START]
  const sessionResult = await verifySession();
  if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
  const session = unwrap(sessionResult)
  if (!session) unauthorized()
  // Validate session [END]

  const { role } = session;

  const primitiveSubjectsResult = await dbGetPrimitiveSubjects();
  if (isFailure(primitiveSubjectsResult)) return redirectErrorUrl(unwrapError(primitiveSubjectsResult))
  const primitiveSubjects = unwrap(primitiveSubjectsResult).filter(p => p.id !== '00000000')

  if (role === "admin" || role === "dev") return <InformationClientAdmin primitiveSubjects={primitiveSubjects} />
  return <InformationClient primitiveSubjects={primitiveSubjects} />
}