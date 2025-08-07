'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyUser } from '../lib/actions/session/actions'
import { CircleAlert } from 'lucide-react'

export default function VerifyEmailPage({ searchParams }: { searchParams: { [key: string]: string } }) {
  const token = searchParams.token

  async function checkEmailVerified(_currentState: unknown, formData: FormData) {
    const result = await verifyUser({ token });
    return result
  }
  
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);
  const [state, formAction] = useFormState(checkEmailVerified, undefined)
  const { pending } = useFormStatus()
  const router = useRouter()

  useEffect(() => {
    if (state?.data?.ok) {
      router.push('/login')
    } else if (state?.error) {
      setErrorMessage({ error: state.error, errorCode: state.errorCode ?? 'UNKNOWN_ERROR', details: state.details });
    }
  }, [state, router])

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 space-y-6">
        <h1 className="text-xl font-semibold text-center text-gray-900">
          {
            token ? (
              'Pulsa para verificar tu correo'
            ) : (
              'Revisa tu correo electrónico, puedes cerrar esta pestaña'
            )
          }
          
        </h1>
        <p className="text-sm text-gray-600 text-center">
          {
            token ? (
              'Pulsando abajo podrás verificar tu correo.'
            ) : (
              'Te hemos enviado un enlace de verificación.'
            )
          }
        </p>
        {errorMessage && (
        <div className="p-4 bg-red-100 text-red-700 text-sm shrink-0 border-b border-red-300 overflow-auto max-w-full break-words">
          <div className="flex items-start gap-2">
            <CircleAlert className="min-w-[20px] h-5 w-5 mt-[2px]" />
            <div className="mt-[2px] text-left break-words">
              <strong className="block mb-1 break-words">
                {errorMessage.errorCode + ': ' + errorMessage.error}
              </strong>
              {errorMessage.details && errorMessage.details.length > 0 &&
                errorMessage.details.map((detail: { name: string; success: boolean, error?: string | null }, idx: number) => (
                  <p key={idx + detail.name} className="break-words">• {`${detail.name}: ${detail.error || 'Sin errores'}`}</p>
                ))}
            </div>
          </div>
        </div>
      )}
      {
        token && 
        <form action={formAction} className="space-y-4">
          <button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Verificando...' : 'Verificar correo'}
          </button>

        </form>
      }
      </div>
    </main>
  )
}
