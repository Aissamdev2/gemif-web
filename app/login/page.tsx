'use client'

import { authenticate } from '@/app/lib/actions'
import { useFormStatus, useFormState } from 'react-dom'
import Link from 'next/link'

export default function Page() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined)


  return (
    <div className="flex absolute justify-center items-center bg-[#eaf3ff] h-screen w-screen backdrop-blur-[2px] z-10">
      <form action={dispatch} className="flex flex-col gap-[10px] bg-white w-[400px] h-fit rounded-lg border-[#6c9ded] py-10 px-10">
        <h2 className="text-3xl font-semibold text-center">Iniciar sesión</h2>
        <p className="text-red-500 font-bold text-center min-h-6">{errorMessage}</p>
        <div className='flex flex-col gap-[20px] mb-[25px] px-[20px]'>
          <div className='flex flex-col '>
            <label htmlFor="email" className="block w-fit mb-2 text-sm font-medium text-gray-900 dark:text-white">Correo electrónico <span className='text-red-500'>*</span></label>
            <input autoComplete='on' type="email" name="email" id="email" className="bg-[white] border outline-none border-blue-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[90%] p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-[border-color] duration-100" required />
          </div>
          <div>
            <label htmlFor="password" className="block w-fit mb-2 text-sm font-medium text-gray-900 dark:text-white">Contraseña <span className='text-red-500'>*</span></label>
            <input type="password" name="password" id="password" className="bg-[white] border outline-none border-blue-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[90%] p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-[border-color] duration-100" required />
          </div>
        </div>
        <LoginButton />
        <div className='w-full border-t border-[#5f3fbe61] my-[15px]' />
        <p className="text-center">¿No tienes cuenta?</p>
        <Link href='/register' className="bg-[#ad3939] text-white outline-none max-w-[150px] self-center hover:bg-[#b95353] font-semibold hover:text-white py-2 px-4 border border-red-500 hover:border-transparent rounded-[10px] transition-[background-color, border-color, color] duration-300">Crear cuenta</Link>
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
    <button disabled={pending} type="submit" onClick={handleClick} className="flex justify-center items-center bg-[#592baf] text-white outline-none w-[200px] self-center hover:bg-[#4c41c3] font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded-[10px] transition-[background-color, border-color, color] duration-300">
      {pending ? 'Iniciando sesión...' : 'Iniciar sesión'}
    </button>
  )
}