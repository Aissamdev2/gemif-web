'use client'

import { useActionState } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ErrorPopup from '../../ui/error-popup'
import { ErrorMessage } from '../../lib/definitions'
import { signIn } from '../actions/actions'
import { isFailure, isSuccess } from '@/lib/errors/result'
import { SanitizedAppError } from '@/lib/errors/types'


export default function LoginClient() {
  

  const handleSubmit = async (_currentState: unknown, formData: FormData) => {
    return await signIn(formData)
  }

  const [errorMessage, setErrorMessage] = useState<SanitizedAppError | null>(null);
  const [state, dispatch, loginLoading] = useActionState(handleSubmit, undefined);
  // const [forgotState, dispatchForgot, forgotLoading] = useActionState((_currentState: unknown, formData: FormData) => forgotPassword(formData), undefined);

  const router = useRouter();
  
  useEffect(() => {
    if (!state || isSuccess(state)) return
    setErrorMessage(state.error);
  }, [state, router]);


  return (
    <>
      {errorMessage && (
        <ErrorPopup error={errorMessage} onClose={() => setErrorMessage(null)} />
      )}
      <button
        disabled={loginLoading}
        type="submit"
        formAction={dispatch}
        className="btn btn-primary"
      >
        {loginLoading ? "Iniciant sessió..." : "Iniciar sessió"}
      </button>
    </>
  );
}
