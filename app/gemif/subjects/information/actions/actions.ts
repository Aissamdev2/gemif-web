'use server'

import { verifySession } from "@/auth/dal";
import { isFailure, setResource, success, unwrap, unwrapError } from "@/lib/errors/result";
import { sanitizeResult } from "@/lib/errors/sanitization/sanitizer";
import { Result, SanitizedResult } from "@/lib/errors/types";
import { parseFormValue, redirectErrorUrl } from "@/lib/utils";
import { forbidden, unauthorized } from "next/navigation";
import { PRIMITIVE_SUBJECTS_ERROR_PATHS, primitiveSubjectsUpdateSchema } from "./validation";
import { parseWithSchema } from "@/lib/validation";
import { dbUpdatePrimitiveSubject } from "@/db/primitive-subjects";
import { PrimitiveSubject } from "@/db/schema";
import { makePrimitiveSubjectResource } from "@/lib/errors/factories";
import { revalidateTag } from "next/cache";


export async function updatePrimitiveSubject(formData: FormData): Promise<SanitizedResult<boolean>> {
  return sanitizeResult(await (async () => {
    // Validate session [START]
    const sessionResult = await verifySession();
    if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
    const session = unwrap(sessionResult)
    if (!session) unauthorized()
    // Validate session [END]

    const { userId, role } = session;

    if (role !== "admin" && role !== "dev") {
      forbidden()
    }

    // Zod validation [START]
    const payload = {
      id: parseFormValue(formData.get("id")),
      name: parseFormValue(formData.get("name")),
      credits: parseFormValue(formData.get("credits")),
      year: parseFormValue(formData.get("year")),
      quadri: parseFormValue(formData.get("quadri")),
      professors: parseFormValue(formData.get("professors")),
      emails: parseFormValue(formData.get("emails")),
      info: parseFormValue(formData.get("info")),
    };

    const parsedResult = parseWithSchema<typeof payload>({ payload, schema: primitiveSubjectsUpdateSchema, errorPaths: PRIMITIVE_SUBJECTS_ERROR_PATHS })
    if (isFailure(parsedResult)) return parsedResult
    // Zod validation [END]

    const { id, name, credits, year, quadri, professors, emails, info } = unwrap(parsedResult)

    const dbPayload: Partial<PrimitiveSubject> = Object.fromEntries(Object.entries({
      name,
      credits,
      year,
      quadri,
      professors,
      emails,
      info
    })
    .filter(([_, value]) => value))

    const updateResult = await dbUpdatePrimitiveSubject({ userId, id, payload: dbPayload })
    if (isFailure(updateResult)) return setResource(updateResult, makePrimitiveSubjectResource({ primitiveId: id }))

    revalidateTag("primitive-subjects", "max");
    return success(true)
  })())
}