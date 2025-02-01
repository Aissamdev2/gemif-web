'use client'

import { useUser } from "@/app/lib/use-user";
import { User } from "@/app/lib/definitions";
import { useEffect, useState } from "react";
import { ROLES } from "@/app/lib/utils";
import { useFormState, useFormStatus } from "react-dom";
import { updateUser } from "@/app/lib/actions";
import { mutate } from "swr";
import Loader from "@/app/ui/loader";

export default function Page() {

  const changeUser = async (_currentState: unknown, formData: FormData) => {
    mutate(process.env.BASE_URL as string + "/api/users", await updateUser(formData))
    return 'User updated'
  }

  const [state, dispatch] = useFormState(changeUser, undefined)
  const { user, error, isLoading } = useUser();
  const [reset, setReset] = useState(false);
  const [userState, setUserState] = useState<User | undefined>(undefined)

  useEffect(() => {
    setUserState(user)
  }, [user, isLoading])

  useEffect(() => {
    if (!user) return
    setUserState(prevState => {
      return {
        ...prevState,
        name: user.name,
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

  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    const formData = new FormData(event.currentTarget)
    formData.append('email', user.email)
    formData.append('role', user.role)
    dispatch(formData)
  }
  
  if (error) return <div>{error.message}</div>;
  return (
    <div className="h-fit lg:h-full w-full flex bg-[#eaf3ff] py-3 text-gray-900 font-medium justify-center items-center">
      <div className="w-[95%] h-fit lg:h-[85%] lg:mt-5 bg-white rounded-sm border border-[#a19aff6b] flex flex-col lg:flex-row gap-16 lg:gap-0 justify-between px-4 lg:px-[60px] py-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                      className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
                      value={userState.name} required />
                  </div>
                  <div className="relative">
                    <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Correo electrónico</label>
                    <input type="text" name="email"
                      className="block w-full opacity-50  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
                      disabled defaultValue={user.email} required />
                  </div>
                  <div className="relative">
                    <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Curso</label>
                    <input type="number" min={1} max={4} name="year"
                      onChange={handleChange}
                      className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
                      value={userState.year} required />
                  </div>
                  <div className="relative">
                    <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Rol</label>
                    <input type="text" name="role"
                      className="block w-full opacity-50  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
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
      <button aria-disabled={pending || disabled} type="submit" onClick={handleClick} className={`${disabled || pending ? 'opacity-30' : 'opacity-100'} w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700`}>
        Actualizar
      </button>
    )
  }