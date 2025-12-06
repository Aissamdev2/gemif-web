'use server'

import { ActionRedirect, SessionPayload, SimplePrim } from "@/app/lib/definitions";
import { updateSessionCookie, verifySession } from "@/auth/dal";
import { dbCreateSubject } from "@/db/subjects";
import { dbUpdateUser } from "@/db/users";
import { ErrorTag } from "@/lib/errors/codes";
import { InvalidInputError, makePrimitiveSubjectResource, makePrimitiveSubjectsResource, makeUserResource } from "@/lib/errors/factories";
import { failure, isFailure, setResource, unwrap, unwrapError } from "@/lib/errors/result";
import { sanitizeResult } from "@/lib/errors/sanitization/sanitizer";
import { Result, SanitizedResult } from "@/lib/errors/types";
import { redirectErrorUrl } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import { redirect, unauthorized } from "next/navigation";


export const initializeSubjects = async (formData: FormData): Promise<SanitizedResult<boolean>> => {

  return sanitizeResult(await (async () => {
    // Validate session [START]
    const sessionResult = await verifySession();
    if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
    const session = unwrap(sessionResult)
    if (!session) unauthorized()
    // Validate session [END]
  
    const { userId, email, role, flags } = session
  
    // Verify subjects format [START]
    const takingRaw = formData.get('taking') as string | null;
    const passedRaw = formData.get('passed') as string | null;
    const taking: SimplePrim[] = takingRaw ? JSON.parse(takingRaw) : [];
    const passed: SimplePrim[] = passedRaw ? JSON.parse(passedRaw) : []; 
    if (taking.length === 0) {
      return failure(InvalidInputError({
        message: "Error de entrada",
        details: "Debe introducir al menos una asignatura al apartado Cursando",
        metadata: {
          scope: "Initialize subjacts",
          operation: "Verify at least one subject taking",
          sensitivity: "none",
          tags: [ErrorTag.userFailure],
          isExpected: true,
        },
      }))
    }
    // Verify subjects format [END]
  
    // Prepare subjects to upload [START]
    const toInsert = [
      ...taking.map(p => ({
        name: p.name,
        archived: false,
        qual: null,
        diff: null,
        primitiveId: p.id,
        userId: userId,
      })),
      ...passed.map(p => ({
        name: p.name,
        archived: true,
        qual: null,
        diff: null,
        primitiveId: p.id,
        userId: userId,
      })),
    ];
    // Prepare subjects to upload [END]
  
    // Upload subjects [START]
    const subjectCreationResult = await dbCreateSubject({ payload: toInsert })
    if (isFailure(subjectCreationResult)) return setResource(subjectCreationResult, makePrimitiveSubjectsResource({ primitiveIds: toInsert.map(p => p.primitiveId) }))
  
    revalidateTag("subjects", "max");
    // Upload subjects [END]
  
    // Update user flags [START]
    const mergedFlags = { ...flags, is_complete_subjects: true };
  
    const updateUserResult = await dbUpdateUser({ id: userId, payload: { flags: mergedFlags }});
    if (isFailure(updateUserResult)) return setResource(updateUserResult, makeUserResource({ userId, email }))
  
    revalidateTag("user", "max");
    // Update user flags [END]
  
    // Update session cookie [START]
    const updateSessionCookieResult = await updateSessionCookie({ userId, email, flags: mergedFlags, role })
    if (isFailure(updateSessionCookieResult)) return setResource(updateSessionCookieResult, makeUserResource({ userId, email }))
    // Update session cookie [END]
  
    // Redirect on success
    redirect('/gemif/main');
  })())
};

