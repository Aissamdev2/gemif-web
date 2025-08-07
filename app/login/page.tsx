'use client'

import { authenticate, forgotPassword, resetPassword } from '@/app/lib/actions/session/actions'
import { useFormStatus, useFormState } from 'react-dom'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Page() {
  const loginUser = async (_currentState: any, formData: FormData) => {
    const result = await authenticate(formData);
    return result;
  };

  const forgot = async (_currentState: any, formData: FormData) => {
    const result = await forgotPassword(formData);
    return result;
  };

  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);
  const [state, dispatch] = useFormState(loginUser, undefined);
  const [email, setEmail] = useState('');
  const [forgotState, dispatchForgot] = useFormState(forgot, undefined);
  const [forgotErrorMessage, setForgotErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);


  const router = useRouter();

  
  useEffect(() => {
    if (state?.error) {
      setErrorMessage({
        error: state.error,
        errorCode: state.errorCode ?? 'UNKNOWN_ERROR',
        details: state.details,
      });
    } else if (state?.data && state?.data?.user && state?.data?.user.logincount === 0 && state?.data?.verify === false) {
      router.push('/initial-setup');
      setErrorMessage(null);
    } else if (state?.data && state?.data?.cookie && state?.data?.verify === true) {
      router.push('/verify-email');
      setErrorMessage(null);
    } else if (state?.data && state?.data?.user && state?.data?.user.logincount > 0 && state?.data?.verify === false) {
      router.push('/gemif/main');
      setErrorMessage(null);
    }
  }, [state, router]);

  useEffect(() => {
    if (forgotState?.error) {
      setErrorMessage({
        error: forgotState.error,
        errorCode: forgotState.errorCode ?? 'UNKNOWN_ERROR',
        details: forgotState.details,
      });
    } else if (forgotState?.data) {
      setErrorMessage(null);
      router.push('/reset-password');
    }
  }, [forgotState, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className='w-full max-w-xl bg-[#f4f9ff] rounded-xl shadow-lg p-8 sm:p-10 flex flex-col gap-6 overflow-hidden'>
        <form
          action={dispatch}
          className='flex flex-col gap-6 p-1 overflow-hidden'
        >
          <h2 className="text-3xl font-semibold text-center">Iniciar sesión</h2>
          <div className="min-h-[80px]">
            {errorMessage && (
              <div className="p-4 bg-red-100 text-red-700 text-sm border border-red-300 rounded-lg max-w-full break-words overflow-auto">
                <div className="flex items-start gap-2">
                  <CircleAlert className="min-w-[20px] h-5 w-5 mt-[2px]" />
                  <div>
                    <strong className="block mb-1">{errorMessage.errorCode + ': ' + errorMessage.error}</strong>
                    {Array.isArray(errorMessage.details) && errorMessage.details.map((detail, idx) => (
                      <p key={idx + detail.name}>• {`${detail.name}: ${detail.error || 'Sin errores'}`}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900">
                Correo electrónico <span className='text-red-500'>*</span>
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="on"
                className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-900">
                Contraseña <span className='text-red-500'>*</span>
              </label>
              <input
                type="password"
                name="password"
                id="password"
                autoComplete="current-password"
                className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
                required
              />
            </div>
          </div>
          <div className='flex justify-center'>
            <LoginButton />
          </div>
          
        </form>
        <form action={dispatchForgot}>
          <input type='hidden' name='email' value={email} />
          <button type="submit" className="text-center text-[#4A90E2] cursor-pointer">¿Olvidaste tu contraseña?</button>
        </form>
        <div className="w-full border-t border-[#5f3fbe61]" />
        <p className="text-center">¿No tienes cuenta?</p>
        <Link
          href="/register"
          className="bg-[#ad3939] text-white font-semibold py-2 px-4 rounded-lg text-center hover:bg-[#b95353] transition duration-300 max-w-[150px] self-center"
        >
          Crear cuenta
        </Link>
      </div>

    </div>
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
      {pending ? 'Iniciando sesión...' : 'Iniciar sesión'}
    </button>
  );
}
