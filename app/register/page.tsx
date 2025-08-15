'use client'

import { addUser } from '@/app/lib/actions/session/actions'
import { useFormStatus } from 'react-dom'
import { useActionState } from 'react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleAlert } from 'lucide-react'




export default function Page() {
  const createUser = async (_currentState: any, formData: FormData) => {
    const result = await addUser(formData);
    return result
  }

  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);
  const [state, dispatch] = useActionState(createUser, undefined)
  const router = useRouter();

  useEffect(() => {
    if (state?.data) {
      router.push('/verify-email');
    } else if (state?.error) {
      setErrorMessage({
        error: state.error,
        errorCode: state.errorCode ?? 'UNKNOWN_ERROR',
        details: state.details,
      });
    }
  }, [state, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <form
        action={dispatch}
        className="w-full max-w-4xl bg-[#f4f9ff] rounded-xl shadow-lg p-8 sm:p-10 flex flex-col gap-6 overflow-hidden"
      >
        <h2 className="text-3xl font-semibold text-center">Registrarse</h2>

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

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left Column */}
          <div className="flex flex-col gap-6 w-full">
            <div className="flex gap-4">
              <div className="w-2/3">
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-900">Nombre de usuario <span className='text-red-500'>*</span></label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  autoComplete="off"
                  className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
                />
              </div>
              <div className="w-1/3">
                <label htmlFor="year" className="mb-2 block text-sm font-medium text-gray-900">Curso <span className='text-red-500'>*</span></label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  step={1}
                  name="year"
                  id="year"
                  autoComplete="off"
                  className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900">Correo electrónico <span className='text-red-500'>*</span></label>
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="on"
                className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
              />
            </div>

            <div>
              <label htmlFor="confirmEmail" className="mb-2 block text-sm font-medium text-gray-900">Confirma tu correo electrónico <span className='text-red-500'>*</span></label>
              <input
                type="email"
                name="confirmEmail"
                id="confirmEmail"
                autoComplete="on"
                className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6 w-full">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-900">Crea tu contraseña <span className='text-red-500'>*</span></label>
              <input
                type="password"
                name="password"
                id="password"
                className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-900">Confirma tu contraseña <span className='text-red-500'>*</span></label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
              />
            </div>

            <div>
              <label htmlFor="key" className="mb-2 block text-sm font-medium text-gray-900">Clave <span className='text-red-500'>*</span></label>
              <input
                type="password"
                name="key"
                id="key"
                className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
              />
            </div>
          </div>
        </div>

        <LoginButton />

        <div className="w-full border-t border-[#5f3fbe61]" />
        <p className="text-center">¿Ya tienes cuenta?</p>
        <Link
          href="/login"
          className="bg-[#592baf] text-white font-semibold py-2 px-4 rounded-lg text-center hover:bg-[#6c41bd] transition duration-300 max-w-[150px] self-center"
        >
          Iniciar sesión
        </Link>
      </form>
    </div>
  )
}

function LoginButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-[#ad3939] text-white font-semibold py-2 px-4 rounded-lg w-[200px] self-center hover:bg-[#b95353] transition duration-300"
    >
      {pending ? 'Registrando...' : 'Registrarse'}
    </button>
  )
}
