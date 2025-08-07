'use client'

import { useUser } from "@/app/lib/use-user";
import { User } from "@/app/lib/definitions";
import { useEffect, useState } from "react";
import { ROLES } from "@/app/lib/utils";
import { useFormState, useFormStatus } from "react-dom";
import { updateUser } from "@/app/lib/actions/user/actions";
import { mutate } from "swr";
import Loader from "@/app/ui/loader";
import ErrorPage from "@/app/ui/error";
import { CircleAlert } from "lucide-react";

export default function Page() {

  const changeUser = async (_currentState: unknown, formData: FormData) => {
    const result = await updateUser(formData);
    if (!result.error && result.data) {
      mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/user", result.data)  
    }
    return result
  }

  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);
  const [state, dispatch] = useFormState(changeUser, undefined)
  const { user, error, isLoading } = useUser();
  const [reset, setReset] = useState(false);
  const [userState, setUserState] = useState<User | undefined>(undefined)


  useEffect(() => {
  if (state?.data) {
    setErrorMessage(null);
    setUserState(state.data);
  } else if (!state?.data && state?.error) {
    setErrorMessage({ error: state.error ?? 'UNKNOWN_ERROR', errorCode: state.errorCode ?? 'UNKNOWN_ERROR', details: state.details });
  }
}, [state, setErrorMessage]);

  useEffect(() => {
    if (!user) return
    setUserState(user)
  }, [user, isLoading])

  useEffect(() => {
    if (!user) return
    setUserState(prevState => {
      return {
        ...prevState,
        name: user.publicname,
        email: user.email,
        year: user.year,
        role: user.role
      } as User
    })

  }, [user, reset])


  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserState((prevState) => {
      if (!prevState) return prevState
      return {
        ...prevState,
        [event.target.name]: event.target.value
      }
    })
  }


  if (error) return <ErrorPage error={error?? ''} />;
  
  return (
    <div className="h-fit lg:h-full w-full flex bg-white py-3 text-gray-900 font-medium justify-center items-center">
      <div className="w-[95%] h-fit lg:h-[85%] lg:mt-5 bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 rounded-sm flex flex-col lg:flex-row gap-16 lg:gap-0 justify-between px-4 lg:px-[60px] py-4">
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
        <form action={dispatch} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <p className="text-sm border-b px-1 py-2 border-[#5f3fbe61]">Información de usuario</p>
            {
              !user || !userState || isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Nombre de usuario</label>
                    <input type="text" name="name"
                      onChange={handleChange}
                      className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
                      value={userState.name} required />
                  </div>
                  <div className="relative">
                    <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Correo electrónico</label>
                    <input type="text" name="email"
                      className="cursor-not-allowed block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
                      disabled defaultValue={user.email} required />
                  </div>
                  <div className="relative">
                    <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Curso</label>
                    <input type="number" min={1} max={4} name="year"
                      onChange={handleChange}
                      className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
                      value={userState.year} required />
                  </div>
                  <div className="relative">
                    <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Rol</label>
                    <input type="text" name="role"
                      className="cursor-not-allowed block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
                      disabled defaultValue={ROLES[user.role]} required />
                  </div>
                </>
              )
            }
          </div>
          <div className="flex gap-3 justify-center">
            <button type="button" disabled={!user || isLoading || !userState} onClick={() => setReset(!reset)} className={`${!user || isLoading || !userState ? 'opacity-30' : 'opacity-100'} w-full text-center text-nowrap p-1.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-red-700`}>
              Reestablecer datos
            </button>
            <EditButton disabled={!user || isLoading || !userState}/>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus()
  
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      if (pending) {
        event.preventDefault()
      }
    }
  
    return (
      <button disabled={pending || disabled} type="submit" onClick={handleClick} className={`${disabled || pending ? 'opacity-30' : 'opacity-100'} w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700`}>
        {pending ? 'Cargando...' : 'Editar'}
      </button>
    )
  }