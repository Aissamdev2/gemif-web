'use client'

import { useFormStatus, useFormState } from "react-dom";
import { addEvent, addMainPost, deleteMainPost } from "@/app/lib/actions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SWRProvider } from "../lib/swr-provider";
import { mutate } from "swr";
import clsx from "clsx";
import { useUser } from "../lib/use-user";
import { useMainPosts } from "../lib/use-main-posts";
import { MainPost, User } from "../lib/definitions";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Loader from "./loader";

export default function ViewMainPost({ id, type }: { id: string, type: string }) {

  const removeMainPost = async (_currentState: unknown, formData: FormData) => {
    mutate(process.env.BASE_URL as string + "/api/main-posts", deleteMainPost(formData))

    return 'Main post deleted'
  }

  const [state, dispatch] = useFormState(removeMainPost, undefined)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const { user, error, isLoading } = useUser();
  const { mainPosts, error: mainPostsError, isLoading: mainPostsLoading } = useMainPosts();

  const mainPost = mainPosts?.find(post => post.id === id)

  useEffect(() => {
    if (state === 'Main post deleted') {
      router.back();
    } else if (state === 'Failed to delete main post') {
      setErrorMessage('No se pudo eliminar la publicación');
    }
  }, [state, setErrorMessage, router]);

  if (mainPostsError || error) return <div>Error: {mainPostsError?.message || error?.message}</div>;

  return (
      <form action={dispatch} id="modalBox-3" className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-[90%] h-fit lg:w-fit max-h-screen flex justify-center items-center z-[1000] overflow-x-hidden overflow-y-auto">
        <div className="flex flex-col gap-5 w-fit md:h-auto bg-white p-6">
        {
          !user || isLoading || mainPostsLoading || !mainPost ? (
            <div className="flex justify-center items-center">
              <Loader />
            </div>
          ) : (
            <>
              <input type="hidden" name="id" value={mainPost.id} />
                <div className="flex flex-col md:flex-row justify-between min-h-[100px] gap-[80px]">
                  <div className="flex flex-col max-w-[100%] gap-1">
                    <div className="flex items-center gap-[20px]">
                      <p className=" text-black font-semibold w-[150px] "> {mainPost?.name} </p>
                    </div>
                    <div className="text-gray-600 text-sm mt-2 w-[250px] bg-[#f4f4ff] rounded-lg p-2">{mainPost?.description}</div>
                  </div>
                </div>
            </>
          )
        }
        <div className="flex items-center justify-end gap-4">
          <DeleteButton  mainPost={mainPost} user={user} disabled={!user || isLoading || mainPostsLoading || !mainPost}/>
          <EditButton mainPost={mainPost} user={user} router={router} type={type} disabled={!user || isLoading || mainPostsLoading || !mainPost} />
        </div>
      </div>
    </form>
    )
  }
  
  function DeleteButton({ mainPost, user, disabled }: { mainPost: MainPost | undefined, user: User | undefined, disabled: boolean }) {
    const { pending } = useFormStatus()
  
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      if (pending) {
        event.preventDefault()
      }
    }
  
    return (
      <button disabled={!(user?.role === 'dev' || user?.role === 'admin') || disabled || pending} type="submit" onClick={handleClick} className={`${!(user?.role === 'dev' || user?.role === 'admin') || disabled || pending ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-red-700`}>
        Eliminar
      </button>
    )
  }

function EditButton({ mainPost, user, router, type, disabled }: { mainPost: MainPost | undefined, user: User | undefined, router: AppRouterInstance, type: string, disabled: boolean }) {
    const { pending } = useFormStatus()  
    return (
      <button type="button" disabled={!(user?.role === 'dev' || user?.role === 'admin') || disabled || pending} onClick={() => router.push(`/gemif/main/edit-main-post/${mainPost?.id}/${type}`)} className={`${!(user?.role === 'dev' || user?.role === 'admin') || disabled || pending ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700`}>
        Editar
      </button>
    )
  }