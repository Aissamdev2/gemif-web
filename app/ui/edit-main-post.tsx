'use client'

import { useFormStatus, useFormState } from "react-dom";
import { updateMainPost } from "@/app/lib/actions/main-posts/actions";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useUser } from "../lib/use-user";
import { useMainPosts } from "../lib/use-main-posts";
import { User } from "../lib/definitions";
import { CircleAlert, FileText, OctagonAlert, TriangleAlert, UploadCloud, X } from "lucide-react";
import Loader from "./loader";
import { useSubjects } from "../lib/use-subjects";
import ErrorPage from "./error";
import MiniModal from "./mini-modal";

export default function EditMainPost({ id }: { id: string | undefined }) {

  const changeMainPost = async (_: unknown, formData: FormData) => {
    formData.set('id', mainPost?.id || '');
    formData.set('type', mainPost?.type || '');

    if (mainPost?.type === 'link') {
      const linksString = links.filter(Boolean).join(',');
      formData.set('links', linksString);
    } else {
      // Append files to formData
      for (const file of files) {
        if (existingFiles?.includes(file.name)) continue;
        formData.append("newFiles", file);
      }
      if (!mainPost) return { ok:false, success: 0, data: null, error: 'No se encontró el recurso', errorCode: null, details: [] };
      formData.set("folderName", mainPost.foldername || "");
      mainPost.filenames?.forEach(f => formData.append("originalFilenames", f));

      const removedFiles = mainPost?.filenames?.filter(f => !existingFiles.includes(f)) || [];
      formData.set('removed', JSON.stringify(removedFiles));
    }

    const result = await updateMainPost(formData);
    if (result.success > 0 && result.data)
      await mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/main-posts", result.data);

    return result;
  };


  const [state, dispatch] = useFormState(changeMainPost, undefined)
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null)
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [inputKey, setInputKey] = useState(Date.now());
  const [links, setLinks] = useState<string[]>(['']);
  const [scoreSelectedOptionId, setScoreSelectedOptionId] = useState<string | undefined>('11111111');

  const router = useRouter()
  const { user, error: userError, isLoading:isLoadingUser } = useUser();
  const { mainPosts, error: mainPostsError, isLoading: isLoadingMainPosts } = useMainPosts();
  const { subjects, error: subjectsError, isLoading: isLoadingSubjects } = useSubjects();
    
  const mainPost = useMemo(() => mainPosts?.find(post => post.id === id), [mainPosts, id])
  
  

  useEffect(() => {
    if (!mainPost) return;

    setLinks(mainPost.links?.length ? mainPost.links : ['']);
    setExistingFiles(mainPost.filenames || []);
    setFiles([]);
  }, [mainPost]);


  useEffect(() => {
    if (!mainPost) return
    setScoreSelectedOptionId(mainPost.subjectid || '11111111')
  }, [mainPost])

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
  }, [state, router, setErrorMessage])

  const handleScoreSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!subjects) return
    setScoreSelectedOptionId(event.target.value);
  };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);

    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      const newFiles = selected.filter(f => !existing.has(f.name + f.size));
      return [...prev, ...newFiles];
    });

    setInputKey(Date.now()); // reset file input so user can re-add removed file
  }

  function handleRemoveNewFile(name: string, size: number) {
    setFiles(prev => prev.filter(f => !(f.name === name && f.size === size)));
  }

  function handleRemoveExistingFile(name: string) {
    setExistingFiles(prev => prev.filter(f => f !== name));
  }

  const emptyPost = mainPost ? (mainPost?.type === 'link' && links.length === 0) || (mainPost?.type === 'file' && existingFiles.length === 0 && files.length === 0) : false;
  
  if (userError || mainPostsError || subjectsError ) return <ErrorPage error={userError?.message || mainPostsError?.message || subjectsError?.message} />

    return (
      <form
        action={dispatch}
        id="modalBox-3"
        className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-full max-w-3xl h-[90vh] flex flex-col bg-white rounded-xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 shrink-0">
          <h4 className="text-lg font-bold leading-8 text-gray-900 text-center">
            Editar publicación
          </h4>
        </div>

        {
          emptyPost && (
            <div className="p-4 bg-yellow-100 text-yellow-600 text-sm shrink-0 border-b border-yellow-300">
          <div className="flex items-start gap-2">
            <TriangleAlert className="min-w-[20px] h-5 w-5 mt-[2px]" />
            <div className="mt-[2px]">
              <strong className="block mb-1">{"Atención: "}</strong> 
              <p>La publicación debe contener al menos un recurso, de lo contrario se eliminará</p>
            </div>
          </div>
        </div>
          )
        }
        {/* Error Message */}
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
        {/* Scrollable Form Section */}
        <div className="flex-1 overflow-y-auto p-6">
          { isLoadingSubjects || isLoadingUser || isLoadingMainPosts ? (
            <div className="flex justify-center items-center w-full min-h-[4rem]">
              <div className="w-[40px] h-[30px]">
                <Loader />
              </div>
            </div>
            
          ) : ( !user ? <p className="text-lg font-bold text-gray-900 text-center">No se ha encontrado el usuario</p>
            : !subjects ? <p className="text-lg font-bold text-gray-900 text-center">No se han encontrado las asignaturas</p>
            : !mainPost ? <p className="text-lg font-bold text-gray-900 text-center">No se ha encontrado la publicación</p>
            :
            <>
              <input type="hidden" name="id" value={mainPost.id} />
              {/* Left Side */}
              <div className="flex flex-col md:flex-row justify-around gap-8 w-full">
                <div className="flex flex-col gap-4 w-full md:max-w-[48%]">
                  {/* Title */}
                  <div className="relative">
                    <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Título</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={mainPost?.name}
                      className="block w-full pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
                      placeholder="Añade un título"
                    />
                  </div>

                  {/* Description */}
                  <div className="relative">
                    <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Descripción</label>
                    <textarea
                      name="description"
                      defaultValue={mainPost?.description}
                      className="block w-full h-24 px-3.5 py-2 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed resize-none"
                      placeholder="Escribe una descripción..."
                    ></textarea>
                  </div>

                  {/* Subject */}
                  <div className="flex flex-col grow">
                    <label htmlFor="scoreOptions" className="flex items-center mb-1 text-slate-700 text-xs font-medium">
                      Asignatura
                    </label>
                    <select
                      id="scoreOptions"
                      name="subjectid"
                      value={scoreSelectedOptionId}
                      onChange={handleScoreSelectChange}
                      className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
                    >
                      <option value="11111111">General</option>
                      {isLoadingSubjects || !subjects ? (
                        <option value="Cargando">Cargando...</option>
                      ) : (
                        subjects
                          .filter((subject) => subject.primitiveid !== '00000000')
                          .map((subject) => (
                            <option key={subject.id + 'score'} value={subject.id}>
                              {subject.name}
                            </option>
                          ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Right Side (Link input for type = link) */}
                {mainPost?.type === 'file' ? (
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
                          const droppedFiles = Array.from(e.dataTransfer.files ?? []);
                          setFiles((prev) => {
                            const existing = new Set(prev.map(f => f.name + f.size));
                            const unique = droppedFiles.filter(f => !existing.has(f.name + f.size));
                            return [...prev, ...unique];
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
                          key={inputKey}
                          id="dropzone-file"
                          name="files"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileChange}
                        />

                        {/* Fixed-height scrollable file grid */}
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-2 gap-3">
  {existingFiles.map((fileName) => (
    <div
      key={fileName}
      className="flex items-start justify-between gap-2 p-2 rounded-md bg-white border border-blue-200 shadow-sm dark:bg-gray-800 dark:border-blue-700"
    >
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <FileText className="text-blue-500 w-4 h-4 mt-1 flex-shrink-0" />
        <div className="flex flex-col min-w-0 text-xs text-blue-900 dark:text-blue-100">
          <p className="font-medium truncate">{fileName}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-300">Archivo existente</p>
        </div>
      </div>
      <X
        className="text-red-500 hover:bg-red-100 w-4 h-4 mt-1 flex-shrink-0 cursor-pointer"
        onClick={() => handleRemoveExistingFile(fileName)}
      />
    </div>
  ))}

  {files.map((file) => (
    <div
      key={file.name + file.size}
      className="flex items-start justify-between gap-2 p-2 rounded-md bg-white border border-blue-200 shadow-sm dark:bg-gray-800 dark:border-blue-700"
    >
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <FileText className="text-blue-500 w-4 h-4 mt-1 flex-shrink-0" />
        <div className="flex flex-col min-w-0 text-xs text-blue-900 dark:text-blue-100">
          <p className="font-medium truncate">{file.name}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-300">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>
      <X
        className="text-red-500 hover:bg-red-100 w-4 h-4 mt-1 flex-shrink-0 cursor-pointer"
        onClick={() => handleRemoveNewFile(file.name, file.size)}
      />
    </div>
  ))}
</div>

                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col w-full md:max-w-[48%]">
                    <label className="mb-1 text-xs text-gray-600 font-medium">Enlaces</label>
                    {links.map((lnk, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          name="links[]"
                          value={lnk}
                          onChange={(e) => {
                            const newLinks = [...links];
                            newLinks[i] = e.target.value;
                            setLinks(newLinks);
                          }}
                          className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg shadow-sm"
                          placeholder={`Enlace ${i + 1}`}
                        />
                        {links.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setLinks(links.filter((_, idx) => idx !== i))}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setLinks([...links, ''])}
                      className="text-blue-500 text-xs font-medium hover:underline"
                    >
                      + Añadir enlace
                    </button>
                  </div>
                )}

              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={() => router.back()}
            type="button"
            className="w-full text-center p-1.5 py-2 rounded-md bg-white text-black text-xs font-medium transition-all duration-300 border hover:border-gray-400"
            data-pd-overlay="#modalBox-3"
            data-modal-target="modalBox-3"
          >
            Cancelar
          </button>
          <UpdateButton emptyPost={emptyPost} disabled={!mainPost || isLoadingMainPosts || !user || isLoadingUser || !subjects || isLoadingSubjects || !(user?.role === 'dev' || user?.role === 'admin')} />
        </div>
      </form>
    )

}

function UpdateButton({ emptyPost, disabled}:{ emptyPost: boolean, disabled: boolean}) {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button disabled={ pending || disabled} type="submit" onClick={handleClick} className={`${pending || disabled ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-[#4A90E2] text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]`}>
      {pending ? 'Cargando...' : (emptyPost ? 'Eliminar publicación' : 'Actualizar')}
    </button>
  )
}
