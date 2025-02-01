'use client'

import { checkUnseenMessages } from "@/app/lib/actions";
import { Message } from "@/app/lib/definitions";
import { useMainPosts } from "@/app/lib/use-main-posts";
import { useMessages } from "@/app/lib/use-messages";
import { useUsers } from "@/app/lib/use-users";
import { timeAgo } from "@/app/lib/utils";
import Loader from "@/app/ui/loader";
import { Pencil, Eye } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MessagesPage() {

  const { users, error: usersError, isLoading: isLoadingUsers } = useUsers();
  const { messages, error: messagesError, isLoading: isLoadingMessages } = useMessages();

  if (messagesError) return <div>Error: {messagesError.message}</div>;
  if (messagesError) return <div>Error: {messagesError.message}</div>;

  return (
    <section className="z-50 w-full h-full flex flex-col lg:mb-0 px-2 lg:px-10 gap-12 pt-[80px] pb-[20px] lg:gap-4 lg:flex-col">
        <div className="flex flex-col lg:flex-row justify-between grow gap-8 max-h-full">
          <div className="bg-white p-5 grow shrink basis-1/2 h-full max-h-full rounded-2xl flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-nowrap text-xl font-bold tracking-tight text-black leading-tight md:text-xl">Bandeja de mensajes</h3>
              <AddMessageButton />
            </div>
            {
              !messages || isLoadingMessages || !users || isLoadingUsers ? (
                <div className="flex justify-center items-center pt-3">
                  <Loader />
                </div>

              ) : (
                <ul className="flex flex-col gap-4 overflow-scroll scrollbar-hidden">
                  { messages &&
                    messages?.map((message) => {
                      const messageDate = new Date(message.createdat);
                      return (
                        <Link href={`/gemif/messages/view-message/${message.id}`} key={message.id} className="border border-[#4d30e0] cursor-pointer flex justify-between rounded-lg">
                          <div
                            className={`flex flex-col grow p-4 rounded-lg hover:bg-[#e3deff] transition-[background-color]`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-[#745cee] truncate">
                                {'Enviado por ' + users.find((user) => user.id === message.userid)?.name}
                              </p>
                              <p className="text-sm text-[#9886f0]">
                                {
                                  timeAgo(messageDate)
                                }
                              </p>

                            </div>
                            <p title={message.name} className="truncate font-semibold text-[#4d30e0]">
                              {message.name}
                            </p>
                            <p title={message.description} className="text-sm text-[#9886f0] truncate">
                              {message.description}
                            </p>
                          </div>
                        </Link>
                      )}
                    )}
                </ul>
              )
            }
          </div>
          
        </div>
    </section>
  )
}

function AddMessageButton() {
  return (
    <Link href={'/gemif/messages/add-message'} className='w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700'>
      Enviar mensaje
    </Link>
  )
}
