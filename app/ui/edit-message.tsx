'use client'

import { useFormStatus, useFormState } from "react-dom";
import {  updateMessage } from "@/app/lib/actions/messages/actions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useUser } from "../lib/use-user";
import { useMessages } from "../lib/use-messages";
import ErrorPage from "./error";
import { CircleAlert } from "lucide-react";

export default function EditMessage({ id }: { id: string }) {

  const changeMessage = async (_currentState: unknown, formData: FormData) => {
    const { data, error, errorCode } = await updateMessage(formData);

    if (!error)
      await mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/messages", data)

    return { data, error, errorCode }
  }

  const [state, dispatch] = useFormState(changeMessage, undefined)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const [scope, setScope] = useState('year')
  const [year, setYear] = useState<string>('')
  const { user, error, isLoading } = useUser();
  const { messages, error: messagesError, isLoading: loadingMessages } = useMessages();

  useEffect(() => {
    if (state?.data) {
      router.back();
    } else if (state?.error) {
      setErrorMessage(`${state.error}, código de error: ${state.errorCode}`);
    }
  }, [state, setErrorMessage, router]);

  const message = messages?.find(message => message.id === id)

  useEffect(() => {
    if (!user || !message) return
    setYear(message.year ?? user.year)
    setScope(message.scope)
  }, [message, user])


  const handleScopeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setScope(event.target.value)
  }
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setYear(event.target.value)
  }

  if (error || messagesError) return <ErrorPage error={error?.message || messagesError?.message} />

    return (                                             
        <form action={dispatch} id="modalBox-3"
          className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-[90%] lg:w-fit h-fit max-h-screen z-[1000] overflow-x-hidden overflow-y-auto">
          <input type="hidden" name="id" value={message?.id} />
          <div className="flex flex-col gap-5 w-full lg:w-fit md:h-auto bg-white p-6">
            <h4 className="text-lg font-bold leading-8 text-gray-900 text-center">Editar mensaje</h4>
            {
              errorMessage && (
                <div className="flex items-center gap-1 p-3 rounded-lg bg-red-200">
                  <div className="flex items-center justify-center basis-6 shrink-0">
                    <CircleAlert className="text-red-800 w-6 h-6" />
                  </div>
                  <h4 className="text-red-600 text-sm">{errorMessage}</h4>
                </div>
              )
            }
            <div className="flex flex-col gap-8 overflow-auto scrollbar-hidden py-5 md:flex-row">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Título</label>
                  <input type="text" name="name"
                    defaultValue={message ? message.name : 'Cargando...'}
                    className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
                    placeholder="Añade un titulo" required />
                </div>
                <div className="relative">
                  <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Descripción</label>
                  <textarea  name="description"
                    defaultValue={message ? message.description : 'Cargando...'}
                    className="block w-full  h-24 px-3.5 py-2 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed resize-none"
                    placeholder="Escribe una descripción..."></textarea>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <label htmlFor="options" className=" mb-2 text-sm font-medium text-gray-600 w-full">Visibilidad</label>
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
            <EditButton disabled={!user || !message || !(user.id === message.userid)} />
          </div>
        </div>
        </form>
    )
}

function EditButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button disabled={ disabled || pending } type="submit" onClick={handleClick} className={`${disabled || pending ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-[#2C5AA0] text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]`}>
      {pending ? 'Cargando...' : 'Editar'}
    </button>
  )
}
