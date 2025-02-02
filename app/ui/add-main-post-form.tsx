'use client'

import { useFormStatus, useFormState } from "react-dom";
import {  addMainPost } from "@/app/lib/actions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SWRProvider } from "../lib/swr-provider";
import { mutate } from "swr";
import { useUser } from "../lib/use-user";
import { TITLES } from "../lib/utils";
import { useMainData } from "../lib/use-main-data";
import {  User } from "../lib/definitions";
import { OctagonAlert } from "lucide-react";
import Loader from "./loader";

export default function AddMainPostForm({ type }: { type: string }) {

  const addNewMainPost = async (_currentState: unknown, formData: FormData) => {
    mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/main-posts", addMainPost(formData))

    return 'Main post created'
  }

  const [state, dispatch] = useFormState(addNewMainPost, undefined)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const { user, error: userError, isLoading: isLoadingUser } = useUser();
  const { mainData, error: mainDataError, isLoading: isLoadingMainData} = useMainData()
  const [selectedFile, setSelectedFile] = useState('Seleccione un archivo')

  useEffect(() => {
    if (state === 'Main post created') {
      router.back();
    } else if (state === 'Failed to create main post') {
      setErrorMessage('No se pudo crear la publicación');
    }
  }, [state, setErrorMessage, router]);


  const handleFileSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFile(event.target.value)
  };


  if (userError || mainDataError) {
    return (
      <div>Error: {userError?.message || mainDataError?.message}</div>
    )
  }


    return (
      <SWRProvider>                                              
        <form action={dispatch} id="modalBox-3"
          className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-[90%] lg:w-fit h-fit max-h-screen z-[1000] overflow-x-hidden overflow-y-auto">
          <div className="flex flex-col gap-5 w-full lg:w-fit md:h-auto bg-white p-6">
            {
              !mainData || isLoadingMainData  ? (
                <div className="flex justify-center items-center w-full">
                  <Loader />
                </div>
              ) : (
                <>
                <h4 className="text-lg font-bold leading-8 text-gray-900 text-center">{`Añadir nuevo ${TITLES[type]}`}</h4>
                <div className="flex flex-col lg:justify-center gap-8 overflow-auto scrollbar-hidden py-5 lg:flex-row">
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Título</label>
                      <input type="text" name="name"
                        className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
                        placeholder="Añade un titulo" required />
                    </div>
                    <div className="relative">
                      <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Descripción </label>
                      <textarea  name="description"
                        className="block w-full  h-24 px-3.5 py-2 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed resize-none"
                        placeholder="Escribe una descripción..."></textarea>
                    </div>
                  </div>
                  {   
                    type === 'file' ? (
                      mainData && mainData?.error === 'Rate limit exceeded' ? (
                        <div className="flex items-center gap-1 p-3 rounded-lg bg-red-100">
                          <div className="flex items-center justify-center basis-6 shrink-0">
                            <OctagonAlert className="text-red-400 w-6 h-6" />
                          </div>
                          <h4 className="text-red-500 text-sm">Límite de acceso excedido, espere menos de una hora a que se reinicie el contador</h4>
                        </div>
                      ) : (
                      <div className="flex flex-col">
                        <label htmlFor="fileName" className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Archivo en GitHub</label>
                        <select 
                        id="fileName"
                        name="fileName"
                        value={selectedFile}
                        onChange={handleFileSelectChange}
                        className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed">
                          <option value="Seleccione un archivo">Seleccione un archivo</option>
                          {
                            mainData.data.map((data) => {
                              return (
                                <option key={data.name + 'file'} value={data.name}>{data.name}</option>
                              )
                            })
                          }
                        </select>
                      </div>
                      )
                    ) : (
                      <div className="relative">
                        <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">{'Enlace (importante poner el protocolo http:// o https://)'}</label>
                        <input type="text" name="link"
                          className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
                          placeholder="Ejemplo: https://google.com" required />
                      </div>
                    )
                  }
              </div>
              </>
              )
            }
          <div className="flex items-center justify-end gap-4">
            <button onClick={() => router.back()} type="button" className="w-full text-center p-1.5 py-2 rounded-md bg-white text-black text-xs font-medium transition-all duration-300 border hover:border-gray-400"  data-pd-overlay="#modalBox-3" data-modal-target="modalBox-3">Cancel</button>
            <AddButton selectedFile={selectedFile} user={user} disabled={!user || isLoadingUser || isLoadingMainData || !mainData} type={type}/>
          </div>
        </div>
        </form>
      </SWRProvider>
    )
}

function AddButton({selectedFile, user, disabled, type}:{selectedFile: string, user: User | undefined, disabled: boolean, type: string}) {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button disabled={!(user?.role === 'dev' || user?.role === 'admin') || pending || disabled || (selectedFile === 'Seleccione un archivo' && type === 'file') } type="submit" onClick={handleClick} className={`${!(user?.role === 'dev' || user?.role === 'admin') || pending || disabled || (selectedFile === 'Seleccione un archivo' && type === 'file') ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700`}>
      Crear publicación
    </button>
  )
}
