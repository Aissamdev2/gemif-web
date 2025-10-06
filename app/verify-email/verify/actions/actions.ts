'use server'

import { ActionRedirect } from '@/app/lib/definitions'
import { updateSessionCookie, verifySession } from '@/auth/dal'
import { dbUpdateUser } from '@/db/users'
import { dbDeleteVerificationToken } from '@/db/verification-tokens'
import { makeUserEmailResource } from '@/lib/errors/factories'
import { isFailure, setResource, unwrap, unwrapError } from '@/lib/errors/result'
import { sanitizeResult } from '@/lib/errors/sanitization/sanitizer'
import { Result, SanitizedResult } from '@/lib/errors/types'
import { redirectErrorUrl } from '@/lib/utils'
import { revalidateTag } from 'next/cache'
import { redirect, unauthorized } from 'next/navigation'


export async function verifyEmail(): Promise<SanitizedResult<boolean>> {

  return sanitizeResult(await (async () => {
    // Validate session [START]
    const sessionResult = await verifySession();
    if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
    const session = unwrap(sessionResult)
    if (!session) unauthorized()
    // Validate session [END]
  
    const { userId, email, flags, role } = session
  
    // Update is_verified user flag [START]
    const mergedFlags = { ...(flags ?? {}), is_verified: true }
  
    const updateUserResult = await dbUpdateUser({ id: userId, payload: { flags: mergedFlags }})
    if (isFailure(updateUserResult)) return setResource(updateUserResult, makeUserEmailResource({ email }))
  
    revalidateTag("user")
    // Update is_verified user flag [END]
  
    // Update session cookie with the new flags
    const updateCookieResult = await updateSessionCookie({ userId, email, flags: mergedFlags, role })
    if (isFailure(updateCookieResult)) return setResource(updateCookieResult, makeUserEmailResource({ email }))
  
  
    // Delete all verification tokens from db
    const deletionResult = await dbDeleteVerificationToken({ userId: session.userId })
    if (isFailure(deletionResult)) return setResource(deletionResult, makeUserEmailResource({ email }))
  
    revalidateTag("verification-tokens")
  
    // Redirect on success
    redirect('/initial-setup/user-info')

  })())

}
