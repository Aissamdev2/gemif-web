'use client'

import { useActionState } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorMessage } from '@/app/lib/definitions'
import ErrorPopup from '@/app/ui/error-popup'
import { verifyEmail } from '../actions/actions'
import { isSuccess } from '@/lib/errors/result'
import { SanitizedAppError } from '@/lib/errors/types'


export default function VerifyEmailClient() {

  const handleSubmit = async (_currentState: unknown) => {
    const res = await verifyEmail()
    return res;
  }
  
  const [errorMessage, setErrorMessage] = useState<SanitizedAppError | null>(null);
  const [state, dispatch, pending] = useActionState(handleSubmit, undefined)
  const router = useRouter()

  useEffect(() => {
    if (!state) return
    if (isSuccess(state)) {
      router.push('/initial-setup/user-info')
      return
    }
    setErrorMessage(state.error);
  }, [state, router]);

  return (
    <form action={dispatch} className="flex gap-2 items-center justify-center">
      {errorMessage && (
        <ErrorPopup error={errorMessage} onClose={() => setErrorMessage(null)} />
      )}
      <button type="submit" className={`btn btn-primary ${false ? 'pointer-events-none opacity-60' : ''}`}>
        { pending ? 'Verificando...' : 'Verificar mi correo'}
      </button>
    </form>
  )
}
