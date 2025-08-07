'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetPassword } from '../lib/actions/session/actions'
import { CircleAlert } from 'lucide-react'

export default function ResetPasswordPage({ searchParams }: { searchParams: { [key: string]: string } }) {
  const token = searchParams.token

  async function changePassword(_currentState: unknown, formData: FormData) {
    formData.append('token', token ?? '')
    const result = await resetPassword(formData);
    return result
  }
  
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);
  const [state, dispatch] = useFormState(changePassword, undefined)
  const { pending } = useFormStatus()
  const router = useRouter()

  useEffect(() => {
    if (state?.data?.ok) {
      router.push('/login')
    } else if (state?.error) {
      setErrorMessage({ error: state.error, errorCode: state.errorCode ?? 'UNKNOWN_ERROR', details: state.details });
    }
  }, [state, router])

  return token ? (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8 overflow-y-auto">
      <form
        action={dispatch}
        className="w-full max-w-xl bg-[#f4f9ff] rounded-xl shadow-lg p-8 sm:p-10 flex flex-col gap-6 overflow-hidden"
      >
        <h2 className="text-3xl font-semibold text-center">Cambia tu contraseña</h2>

        <div className="min-h-[80px]">
          {errorMessage && (
            <div className="p-4 bg-red-100 text-red-700 text-sm border border-red-300 rounded-lg max-w-full break-words overflow-auto">
              <div className="flex items-start gap-2">
                <CircleAlert className="min-w-[20px] h-5 w-5 mt-[2px]" />
                <div>
                  <strong className="block mb-1">{errorMessage.errorCode + ': ' + errorMessage.error}</strong>
                  {errorMessage.details?.map((detail, idx) => (
                    <p key={idx + detail.name}>• {`${detail.name}: ${detail.error || 'Sin errores'}`}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-900">
              Nueva contraseña <span className='text-red-500'>*</span>
            </label>
            <input
              type="password"
              name="password"
              id="password"
              className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-900">
              Confirma nueva contraseña <span className='text-red-500'>*</span>
            </label>
            <input
              type="password"
              name="confirm_password"
              id="password"
              className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
              required
            />
          </div>
        </div>
        <input type="hidden" name="token" value={token} />
        <LoginButton />
      </form>
    </div>
  ) 
  : (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 space-y-6">
        <h1 className="text-xl font-semibold text-center text-gray-900">
          Te hemos enviado un correo, puedes cerrar esta pestaña
        </h1>
        <p className="text-sm text-gray-600 text-center">
          En el correo te hemos enviado un enlace para restablecer tu contraseña.
        </p>
        
      </div>
    </main>
  )
}



function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      type="submit"
      className="bg-[#592baf] text-white font-semibold py-2 px-4 rounded-lg w-[200px] self-center hover:bg-[#4c41c3] transition duration-300"
    >
      {pending ? 'Cargando...' : 'Cambiar contraseña'}
    </button>
  );
}