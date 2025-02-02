'use client'

import { useFormStatus, useFormState } from "react-dom";
import { deleteMessage } from "@/app/lib/actions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useUser } from "../lib/use-user";
import {  Message, User } from "../lib/definitions";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useMessages } from "../lib/use-messages";

export default function ViewMessage({ id }: { id: string}) {

  const removeMessage = async (_currentState: unknown, formData: FormData) => {
    mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/messages", deleteMessage(formData))

    return 'Message deleted'
  }

  const [state, dispatch] = useFormState(removeMessage, undefined)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const { user, error, isLoading } = useUser();
  const { messages, error: messagesError, isLoading: loadingMessages } = useMessages();

  const message = messages?.find(message => message.id === id)

  useEffect(() => {
    if (state === 'Message deleted') {
      router.back();
    } else if (state === 'Failed to delete message') {
      setErrorMessage('No se pudo eliminar el mensaje');
    }
  }, [state, setErrorMessage, router]);

  if (!user) {
    console.log('No user');
    return null;
  }

  if (!message) {
    console.log('No message');
    return null;
  }

  return (
      <form action={dispatch} id="modalBox-3" className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-[90%] h-fit lg:w-fit max-h-screen flex justify-center items-center z-[1000] overflow-x-hidden overflow-y-auto">
        <input type="hidden" name="id" value={message.id} />
        <div className="flex flex-col gap-5 w-fit md:h-auto bg-white p-6">
          <div className="flex flex-col md:flex-row justify-between min-h-[100px] gap-[80px]">
            <div className="flex flex-col max-w-[100%] gap-1">
              <div className="flex items-center gap-[20px]">
                <p className=" text-black font-semibold w-[150px] "> {message?.name} </p>
              </div>
              <div className="text-gray-600 text-sm mt-2 w-[250px] bg-[#f4f4ff] rounded-lg p-2">{message?.description}</div>
            </div>
          </div>
        <div className="flex items-center justify-end gap-4">
          <DeleteButton  message={message} user={user}/>
          <EditButton message={message} user={user} router={router} />
        </div>
      </div>
    </form>
    )
  }
  
  function DeleteButton({ message, user }: { message: Message, user: User }) {
    const { pending } = useFormStatus()
  
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      if (pending) {
        event.preventDefault()
      }
    }
  
    return (
      <button disabled={!(user.id === message.userid) || pending} type="submit" onClick={handleClick} className={`${!(user.id === message.userid) || pending ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-red-700`}>
        Eliminar
      </button>
    )
  }

function EditButton({ message, user, router }: { message: Message, user: User, router: AppRouterInstance }) {
    const { pending } = useFormStatus()  
    return (
      <button type="button" disabled={!(user.id === message.userid) || pending} onClick={() => router.push(`/gemif/messages/edit-message/${message.id}`, { scroll: false })} className={`${!(user.id === message.userid) || pending ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700`}>
        Editar
      </button>
    )
  }