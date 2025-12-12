'use client'

import { useActionState } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorMessage } from '../../lib/definitions'
import ErrorPopup from '../../ui/error-popup'
import { signUp } from '../actions/actions'
import { SanitizedAppError } from '@/lib/errors/types'
import { isSuccess } from '@/lib/errors/result'

export default function RegisterClient() {

  const handleSubmit = async (_currentState: unknown, formData: FormData) => {
    return await signUp(formData)
  }

  const [errorMessage, setErrorMessage] = useState<SanitizedAppError | null>(null);
  const [state, dispatch, pending] = useActionState(handleSubmit, null);
  const router = useRouter();

  useEffect(() => {
      if (!state || isSuccess(state)) return
      setErrorMessage(state.error);
    }, [state, router]);

  return (
    <>
      {errorMessage && (
        <ErrorPopup 
          error={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
      <button
        type="submit"
        formAction={dispatch}
        disabled={pending}
        className="btn btn-primary"
      >
        {pending ? 'Carregant...' : "Crear compte"}
      </button>
    </>
  )
}
