'use client'

import { useFormStatus, useFormState } from "react-dom";
import {  addMessage } from "@/app/lib/actions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SWRProvider } from "../lib/swr-provider";
import { mutate } from "swr";
import { useUser } from "../lib/use-user";

export default function AddMessageForm() {

  const addNewMessage = async (_currentState: unknown, formData: FormData) => {
    mutate(process.env.BASE_URL as string + "/api/messages", addMessage(formData))

    return 'Message created'
  }

  const [state, dispatch] = useFormState(addNewMessage, undefined)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const [scope, setScope] = useState('year')
  const [year, setYear] = useState<string>('')
  const { user, error, isLoading } = useUser();

  useEffect(() => {
    if (state === 'Message created') {
      router.back();
    } else if (state === 'Failed to create message') {
      setErrorMessage('No se pudo crear el mensaje');
    }
  }, [state, setErrorMessage, router]);

  useEffect(() => {
    if (user) {
      setYear(user.year)
    }
  }, [user])


  const handleScopeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setScope(event.target.value)
  }
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setYear(event.target.value)
  }

  if (!user) {
    return null
  }

    return (
      <SWRProvider>                                              
        <form action={dispatch} id="modalBox-3"
          className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-[90%] lg:w-fit h-fit max-h-screen z-[1000] overflow-x-hidden overflow-y-auto">
          <div className="flex flex-col gap-5 w-full lg:w-fit md:h-auto bg-white p-6">
            <h4 className="text-lg font-bold leading-8 text-gray-900 text-center">Enviar mensaje</h4>
            <div className="flex flex-col gap-8 overflow-auto scrollbar-hidden py-5 md:flex-row">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Título</label>
                  <input type="text" name="name"
                    className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
                    placeholder="Añade un titulo" required />
                </div>
                <div className="relative">
                  <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Descripción</label>
                  <textarea  name="description"
                    className="block w-full  h-24 px-3.5 py-2 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed resize-none"
                    placeholder="Escribe una descripción..."></textarea>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <label htmlFor="options" className=" mb-2 text-sm font-medium text-gray-600 w-full">Vsiibilidad</label>
                  <select 
                  id="options"
                  name="scope"
                  value={scope}
                  onChange={handleScopeChange}
                  className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed">
                    <option value="year">Clase</option>
                    <option value="global">Global</option>
                  </select>
                </div>
                <div className="relative">
                  <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Curso</label>
                  <input type="number" min={1} max={4} name="year"
                    disabled={scope === 'global'}
                    onChange={handleChange}
                    className={`${scope === 'global' ? 'pointer-events-none opacity-30' : 'opacity-100'} block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed`}
                    value={year} required />
                </div>
              </div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <button onClick={() => router.back()} type="button" className="w-full text-center p-1.5 py-2 rounded-md bg-white text-black text-xs font-medium transition-all duration-300 border hover:border-gray-400"  data-pd-overlay="#modalBox-3" data-modal-target="modalBox-3">Cancel</button>
            <AddButton/>
          </div>
        </div>
        </form>
      </SWRProvider>
    )
}

function AddButton() {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button disabled={ pending } type="submit" onClick={handleClick} className={`${pending ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700`}>
      Crear publicación
    </button>
  )
}
