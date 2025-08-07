'use client';

import { useFormStatus, useFormState } from "react-dom";
import { deleteMainPost } from "@/app/lib/actions/main-posts/actions";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useUser } from "../lib/use-user";
import { useMainPosts } from "../lib/use-main-posts";
import { ErrorCode, MainPost, Subject, User } from "../lib/definitions";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Loader from "./loader";
import { CircleAlert } from "lucide-react";
import { useSubjects } from "../lib/use-subjects";
import SubjectTag from "./subject-tag";

export default function ViewMainPost({ id }: { id: string }) {
  const removeMainPost = async (_currentState: unknown, formData: FormData) => {
    formData.append('type', mainPost?.type || '')
    formData.append('path', mainPost?.foldername || '')

    const result = await deleteMainPost(formData)
    if (result.ok)
      mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/main-posts", result.data);

    return result
  }

  const [state, dispatch] = useFormState(removeMainPost, undefined)
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: ErrorCode, details: { name: string; success: boolean, error?: string | null }[] } | null>(null)
  const router = useRouter()
  const { user, error, isLoading } = useUser();
  const { subjects, error: subjectsError, isLoading: subjectsIsLoading } = useSubjects();
  const { mainPosts, error: mainPostsError, isLoading: mainPostsLoading } = useMainPosts();

  const mainPost = useMemo(() => mainPosts?.find(post => post.id === id) as MainPost, [mainPosts, id])
  const subject = useMemo(() => mainPost?.subjectid === '11111111' ? {
    id: '11111111',
    name: 'General',
    color: '#000000',
    bgcolor: '#ffffff',
    bordercolor: '#000000',
  } as Subject : subjects?.find(subject => subject.id === mainPost?.subjectid) as Subject, [subjects, mainPost])

  useEffect(() => {
    if (state?.data && state.ok) {
      router.back();
    } else if (state?.error) {
      setErrorMessage({
        error: state.error,
        errorCode: state.errorCode ?? 'UNKNOWN_ERROR',
        details: state.details,
      });
    }
  }, [state, setErrorMessage, router]);

  if (mainPostsError || error || subjectsError) return <div>Error: {mainPostsError?.message || error?.message || subjectsError?.message}</div>;

  return (
    <form
      action={dispatch}
      id="modalBox-3"
      className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-full max-w-3xl h-[90vh] flex flex-col bg-white rounded-xl shadow-xl overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 shrink-0">
        <h4 className="text-lg font-bold text-gray-900 text-center">Detalles de la publicación</h4>
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

      <div className="flex-1 overflow-y-auto p-6">
        {
          isLoading || subjectsIsLoading || mainPostsLoading  ? (
            <div className="flex justify-center items-center w-full min-h-[4rem]">
              <div className="w-[40px] h-[30px]">
                <Loader />
              </div>
            </div>
          ) : (
            !user ? (<p className="text-lg font-bold text-gray-900 text-center">No se ha encontrado el usuario</p>)
            : !subjects ? (<p className="text-lg font-bold text-gray-900 text-center">No se han encontrado las asignaturas</p>)
            : !mainPost ? (<p className="text-lg font-bold text-gray-900 text-center">No se ha encontrado la publicación</p>)
            :
            <>
              <input type="hidden" name="id" value={mainPost.id} />
              <div className="flex flex-col md:flex-row justify-around gap-8 w-full">
                {/* Left Column: Name + Description */}
                <div className="flex flex-col gap-4 w-full md:max-w-[45%]">
                  {/* Title */}
                  <div className="text-xl font-bold text-slate-800">{mainPost.name}</div>

                  {/* Description */}
                  {mainPost.description && (
                    <div className="text-sm text-slate-600 bg-[#f4f4ff] rounded-lg p-3">
                      {mainPost.description}
                    </div>
                  )}
                </div>

                {/* Right Column: Subject + Link */}
                <div className="flex flex-col gap-4 w-full md:max-w-[45%]">
                  {/* Subject */}
                  {subject && (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-700">Asignatura:</p>
                      <SubjectTag subject={subject} />
                    </div>
                  )}

                  {mainPost.foldername && Array.isArray(mainPost.filenames) && mainPost.filenames.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">Archivos:</p>
                      <ul className="flex flex-col gap-1">
                        {mainPost.filenames.map((filename, index) => {
                          const fileUrl = `https://raw.githubusercontent.com/Aissamdev2/Archive/main/main-data/${mainPost.foldername}/${filename}`;
                          return (
                            <li key={index + filename} className="text-blue-600 text-xs bg-[#e6f0ff] rounded-lg p-2 break-all max-w-sm truncate">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {filename}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Link */}
                  {mainPost.links && Array.isArray(mainPost.links) && mainPost.links.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">Links:</p>
                      <ul className="flex flex-col gap-1">
                        {mainPost.links.map((link, index) => {
                          return (
                            <li key={index + link} className="text-blue-600 text-xs bg-[#e6f0ff] rounded-lg p-2 break-all max-w-sm truncate">
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {link}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          )
        }
      </div>

      <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
        <DeleteButton disabled={!user || isLoading || !subjects || subjectsIsLoading || mainPostsLoading || !mainPost || !(user?.role === 'dev' || user?.role === 'admin')} />
        <EditButton id={mainPost?.id} router={router} disabled={!user || isLoading || !subjects || subjectsIsLoading || mainPostsLoading || !mainPost || !(user?.role === 'dev' || user?.role === 'admin')} />
      </div>
    </form>
  )
}

function DeleteButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button
      disabled={disabled || pending}
      type="submit"
      onClick={handleClick}
      className={`${disabled || pending ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-red-700`}
    >
      {pending ? 'Cargando...' : 'Eliminar'}
    </button>
  )
}

function EditButton({ id, router, disabled }: { id: string | undefined, router: AppRouterInstance, disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => router.push(`/gemif/main/edit-main-post/${id}`)}
      className={`${disabled || pending ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-[#4A90E2] text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]`}
    >
      {pending ? 'Cargando...' : 'Editar'}
    </button>
  )
}
