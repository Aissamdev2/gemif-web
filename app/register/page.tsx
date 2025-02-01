'use client'

import { register } from '@/app/lib/actions'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useState } from 'react'

export default function Page() {
  const [errorMessage, dispatch] = useFormState(register, undefined)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [formError, setFormError] = useState<string>('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    
    const passwordError = password !== confirmPassword;
    const emailError = email !== confirmEmail;
    if (passwordError) {
      setFormError((prevState) => prevState + ' Las contraseñas no coinciden.')
    }

    if (emailError) {
      setFormError((prevState) => prevState + ' Los correos no coinciden.')
    }

    if (passwordError || emailError) {
      return
    }
    console.log('Signuppp')
    setFormError('')
    const formData = new FormData(event.currentTarget)
    dispatch(formData) // Dispatch the form data
  }

  return (
    <div className="flex absolute justify-center items-center bg-[#d0e1ff] h-screen w-screen backdrop-blur-[2px] z-10">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-[10px] bg-[#e8f0fd] w-fit h-fit rounded-[30px] border-[#6c9ded] py-10 px-10"
      >
        <h2 className="text-3xl font-semibold text-center">Registrarse</h2>
        <p className="text-red-500 font-bold text-center min-h-6">
          {formError || errorMessage}
        </p>
        <div className='flex flex-col lg:flex-row gap-[50px] mb-[25px] px-[20px]'>
          <div className="flex flex-col gap-[20px]">
            <div className="flex">
              <div className="flex flex-col w-[67%]">
                <label
                  htmlFor="name"
                  className="block w-fit mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Nombre de usuario
                </label>
                <input
                  autoComplete="off"
                  type="text"
                  name="name"
                  id="name"
                  className="bg-[white] border outline-none border-gray-100 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[90%] p-2.5"
                  required
                />
              </div>
              <div className="flex flex-col w-[25%]">
                <label
                  htmlFor="year"
                  className="block w-fit mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Curso
                </label>
                <input
                  autoComplete="off"
                  type="number"
                  min={1}
                  max={4}
                  step={1}
                  name="year"
                  id="year"
                  className="bg-[white] border outline-none border-gray-100 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[90%] p-2.5"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col ">
              <label
                htmlFor="email"
                className="block w-fit mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Correo electrónico
              </label>
              <input
                autoComplete="on"
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[white] border outline-none border-gray-100 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[90%] p-2.5"
                required
              />
            </div>
            <div className="flex flex-col ">
              <label
                htmlFor="confirmEmail"
                className="block w-fit mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Confirma tu correo electrónico
              </label>
              <input
                autoComplete="on"
                type="email"
                name="confirmEmail"
                id="confirmEmail"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="bg-[white] border outline-none border-gray-100 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[90%] p-2.5"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-[20px]">
            <div>
              <label
                htmlFor="password"
                className="block w-fit mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Crea tu contraseña
              </label>
              <input
                type="password"
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[white] border outline-none border-gray-100 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[90%] p-2.5"
                required
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block w-fit mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Confirma tu contraseña
              </label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[white] border outline-none border-gray-100 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[90%] p-2.5"
                required
              />
            </div>
            <div>
              <label
                htmlFor="key"
                className="block w-fit mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Clave
              </label>
              <input
                type="password"
                name="key"
                id="key"
                className="bg-[white] border outline-none border-gray-100 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[90%] p-2.5"
                required
              />
            </div>
          </div>
        </div>
        <LoginButton />
        <div className="w-full border-t border-[#5f3fbe61] my-[15px]" />
        <p className="text-center">¿Ya tienes cuenta?</p>
        <Link
          href="/login"
          className="bg-[#592baf] text-white outline-none max-w-[150px] self-center hover:bg-[#6c41bd] font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded-[10px] transition-[background-color, border-color, color] duration-300"
        >
          Iniciar sesión
        </Link>
      </form>
    </div>
  )
}

function LoginButton() {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button
      aria-disabled={pending}
      type="submit"
      onClick={handleClick}
      className="flex justify-center items-center bg-[#ad3939] text-white outline-none w-[200px] self-center hover:bg-[#b95353] font-semibold hover:text-white py-2 px-4 border border-red-500 hover:border-transparent rounded-[10px] transition-[background-color, border-color, color] duration-300"
    >
      {pending ? (
        <div className="w-[20px] h-[20px] rounded-[50%] border-l-[3px] border-t-[3px] border-white animate-spin"></div>
      ) : (
        'Registrarse'
      )}
    </button>
  )
}
