'use client'

import { useActionState, useRef } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorMessage } from '@/app/lib/definitions'
import { sendVerificationEmail } from '../actions/actions'
import ErrorPopup from '@/app/ui/error-popup'
import { SanitizedAppError } from '@/lib/errors/types'
import { isFailure, isSuccess, unwrapError } from '@/lib/errors/result'


export default function SendEmailClient({ id, email, sendTrigger }: { id: string, email: string, sendTrigger: boolean }) {

  const handleSubmit = async (_currentState: unknown) => {
    const res = sendVerificationEmail({ id, email })
    return res;
  }
  
  const [errorMessage, setErrorMessage] = useState<SanitizedAppError | null>(null);
  const [state, dispatch, pending] = useActionState(handleSubmit, undefined)
  const router = useRouter()
  const emailSent = useRef(false);


  useEffect(() => {
    if (sendTrigger) {
      (async () => {
        const verificationResult = await sendVerificationEmail({ id, email })
        if (isSuccess(verificationResult)) {
          emailSent.current = true;
          return
        }
        setErrorMessage(verificationResult.error);
      })();
      
    }
  }, [id, email, sendTrigger])

  useEffect(() => {
    if (!state || isSuccess(state)) return
    setErrorMessage(state.error);
  }, [state, router]);

  return (
    <form action={dispatch} className="flex gap-2 items-center justify-center">
      {errorMessage && (
        <ErrorPopup error={errorMessage} onClose={() => setErrorMessage(null)} />
      )}
      <p className='text-muted'>¿No ha recibido el correo?</p>
      <button type="submit" className="btn btn-primary">
        {pending ? 'Reenviando...' : 'Reenviar'}
      </button>
    </form>
  )
}
