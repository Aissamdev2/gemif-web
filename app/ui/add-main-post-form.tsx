'use client'

import { useFormStatus, useFormState } from "react-dom";
import { addMainPost } from "@/app/lib/actions/main-posts/actions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useUser } from "../lib/use-user";
import { User } from "../lib/definitions";
import { CircleAlert, UploadCloud, FileText, X, OctagonAlert } from "lucide-react";
import { useSubjects } from "../lib/use-subjects";
import ErrorPage from "./error";
import Loader from "./loader";
import MiniModal from "./mini-modal";

export default function AddMainPostForm() {
  const addNewMainPost = async (_currentState: unknown, formData: FormData) => {
    formData.append('type', selected);
    const links = formData.getAll('links[]') as string[]
    const linksString = links.join(',')
    formData.append('links', linksString)
    for (const file of files) {
      formData.append('files', file)
    }


    const result = await addMainPost(formData);
    
    if (result.uploaded > 0 && result.data)
      await mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/main-posts", result.data);
    return result;
  };

  const [state, dispatch] = useFormState(addNewMainPost, undefined);
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);
  const router = useRouter();
  const { user, error: userError, isLoading: isLoadingUser } = useUser();
  const [files, setFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState<'file' | 'link'>('file');
  const [selectedId, setSelectedId] = useState<string | undefined>('11111111');
  const [links, setLinks] = useState<string[]>([''])
  const { subjects, error: subjectsError, isLoading: isLoadingSubjects } = useSubjects();


    const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links]
    newLinks[index] = value
    setLinks(newLinks)
  }

  const addLink = () => {
    setLinks([...links, ''])
  }

  const removeLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index)
    setLinks(newLinks)
  }

  const handleScoreSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!subjects) return;
    setSelectedId(event.target.value);
  };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prevFiles) => {
      const existingNames = new Set(prevFiles.map(file => file.name));
      const uniqueNewFiles = selected.filter(file => !existingNames.has(file.name));
      return [...prevFiles, ...uniqueNewFiles];
    });
  }



  useEffect(() => {
    if (state?.ok) {
      router.back();
    } else if (state?.error) {
      setErrorMessage({
        error: state.error,
        errorCode: state.errorCode ?? 'UNKNOWN_ERROR',
        details: state.details,
      });
    }
  }, [state, router, setErrorMessage]);


  if (userError || subjectsError) return <ErrorPage error={userError?.message || subjectsError?.message} />;

  return (
    <form action={dispatch} id="modalBox-3"
      className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-full max-w-3xl h-[90vh] flex flex-col bg-white rounded-xl shadow-xl overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 shrink-0">
        <h4 className="text-lg font-bold text-gray-900 text-center">Añadir nueva publicación</h4>
      </div>

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

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        { isLoadingSubjects || isLoadingUser ? (
          <div className="flex justify-center items-center w-full min-h-[4rem]">
            <div className="w-[40px] h-[30px]">
              <Loader />
            </div>
          </div>
          
        ) : ( !user ? <p className="text-lg font-bold text-gray-900 text-center">No se ha encontrado el usuario</p>
          : !subjects ? <p className="text-lg font-bold text-gray-900 text-center">No se han encontrado las asignaturas</p>
          :
          <>
            <div className="flex justify-center">
              <div className="flex w-fit overflow-hidden rounded-full border border-gray-300 shadow-sm">
                <button
                  onClick={() => setSelected('file')}
                  className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    selected === 'file' ? 'bg-[#4A90E2] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  type="button"
                >
                  Archivo
                </button>
                <button
                  onClick={() => setSelected('link')}
                  className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    selected === 'link' ? 'bg-[#4A90E2] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  type="button"
                >
                  Enlace
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex flex-col gap-4 w-full lg:w-1/2">
                <div className="relative">
                  <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Título <span className='text-red-500'>*</span></label>
                  <input type="text" name="name"
                    className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
                    placeholder="Añade un título" />
                </div>
                <div className="relative">
                  <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Descripción</label>
                  <textarea name="description"
                    className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
                    placeholder="Escribe una descripción..."></textarea>
                </div>
                <div className="flex flex-col">
                  <label htmlFor="options" className="flex items-center mb-1 text-gray-600 text-xs font-medium">Asignatura</label>
                  <select
                    id="scoreOptions"
                    name="subjectid"
                    value={selectedId}
                    onChange={handleScoreSelectChange}
                    className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition">
                    <option value="11111111">General</option>
                    {
                      subjects?.filter((subject) => subject.primitiveid !== '00000000').map((subject) => (
                        <option key={subject.id + 'score'} value={subject.id}>{subject.name}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div className="w-full lg:w-1/2">
                {selected === 'file' && (
                  <div className="flex flex-col gap-5 w-full lg:w-fit md:h-auto bg-white p-0">
                    <div className="relative flex items-center justify-center w-full">
                      <div className="absolute right-0 top-0 z-[60]">
                        <MiniModal position="left">
                          <p>No subir demasiados archivos a la vez ({"<10"}), y cada archivo debe pesar menos de 20MB. Estos límites son orientativos, nada te lo impide pero con cuidado.</p>
                        </MiniModal>
                      </div>
                      <div
                        className="relative flex flex-col w-full h-80 border-2 border-dashed rounded-xl transition-colors duration-200 overflow-hidden
                                  border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const dropped = Array.from(e.dataTransfer.files ?? []);
                          setFiles((prevFiles) => {
                            const existingNames = new Set(prevFiles.map(file => file.name));
                            const uniqueNewFiles = dropped.filter(file => !existingNames.has(file.name));
                            return [...prevFiles, ...uniqueNewFiles];
                          });
                        }}
                      >
                        {/* Sticky upload label */}
                        <label
                          htmlFor="dropzone-file"
                          className="z-10 sticky top-0 flex flex-col items-center justify-center gap-1 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-blue-200 cursor-pointer dark:bg-gray-800 dark:border-gray-600"
                        >
                          <UploadCloud className="w-6 h-6 text-blue-500 dark:text-blue-300" />
                          <p className="text-sm text-blue-700 dark:text-blue-100 font-medium">
                            Pulsa para añadir archivos o arrastra aquí
                          </p>
                          <p className="text-xs text-gray-400">Puedes seleccionar varios archivos</p>
                        </label>

                        <input
                          id="dropzone-file"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileChange}
                        />

                        {/* Fixed-height scrollable file grid */}
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-2 gap-3">
                          {files.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-start justify-between gap-2 p-2 rounded-md bg-white border border-blue-200 shadow-sm dark:bg-gray-800 dark:border-blue-700"
                            >
                              <div className="flex items-start gap-2 min-w-0 flex-1">
                                <FileText className="text-blue-500 w-4 h-4 mt-1 flex-shrink-0" />
                                <div className="flex flex-col min-w-0 text-xs text-blue-900 dark:text-blue-100">
                                  <p className="font-medium truncate overflow-hidden whitespace-nowrap">{file.name}</p>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-300">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                              <X
                                className="text-red-500 w-4 h-4 mt-1 flex-shrink-0 cursor-pointer"
                                onClick={() =>
                                  setFiles((prevFiles) =>
                                    prevFiles.filter((f) => f.name !== file.name)
                                  )
                                }
                              />
                            </div>

                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {selected === 'link' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Opciones</h3>
                    {links.map((lnk, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          name={`links[]`}
                          value={lnk}
                          onChange={(e) => handleLinkChange(i, e.target.value)}
                          className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg shadow-sm"
                          placeholder={`Opción ${i + 1}`}
                        />
                        {links.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLink(i)}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addLink}
                      className="text-blue-500 text-xs font-medium hover:underline"
                    >
                      + Añadir opción
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
        <button onClick={() => router.back()} type="button"
          className="w-full text-center p-1.5 py-2 rounded-md bg-white text-black text-xs font-medium transition-all duration-300 border hover:border-gray-400"
          data-pd-overlay="#modalBox-3" data-modal-target="modalBox-3">
          Cancelar
        </button>
        <AddButton disabled={!user || isLoadingUser || !subjects || isLoadingSubjects || !(user?.role === 'dev' || user?.role === 'admin')} />
      </div>
    </form>
  );
}

function AddButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault();
    }
  };

  return (
    <button disabled={ pending || disabled}
      type="submit"
      onClick={handleClick}
      className={`${pending || disabled ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-[#4A90E2] text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]`}>
      {pending ? 'Cargando...' : 'Crear Publicación'}
    </button>
  );
}
