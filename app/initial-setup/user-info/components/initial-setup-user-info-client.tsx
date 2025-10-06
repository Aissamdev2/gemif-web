'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorMessage } from '@/app/lib/definitions';
import ErrorPopup from '@/app/ui/error-popup';
import { initializeUserInfo } from '../actions/actions';
import { SanitizedAppError } from '@/lib/errors/types';
import { isSuccess } from '@/lib/errors/result';



export default function InitialSetupUserInfoClient() {

  const submitAll = async (_: unknown, formData: FormData) => {
    const res = await initializeUserInfo(formData)
    return res
  };

  const [state, dispatch, pending] = useActionState(submitAll, undefined);
  const [errorMessage, setErrorMessage] = useState<SanitizedAppError | null>(null);
  const router = useRouter();

  
  useEffect(() => {
    if (!state) return
    if (isSuccess(state)) {
      router.push('/initial-setup/subjects')
      return
    }
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
        formAction={dispatch}
        disabled={pending}
        type="submit"
        className="btn btn-primary"
      >
        {pending ? "Cargando..." : "Continuar"}
      </button>
    </>
  );
}
