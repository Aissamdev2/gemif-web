'use client'
import { useMessages } from "@/app/lib/use-messages";
import { useUsers } from "@/app/lib/use-users";
import { timeAgo } from "@/app/lib/utils";
import Loader from "@/app/ui/loader";
import Link from "next/link";

export default function MessagesPage() {

  const { users, error: usersError, isLoading: isLoadingUsers } = useUsers();
  const { messages, error: messagesError, isLoading: isLoadingMessages } = useMessages();

  if (messagesError) return <div>Error: {messagesError.message}</div>;
  if (messagesError) return <div>Error: {messagesError.message}</div>;

  return (
    <section className="z-50 w-full h-full flex flex-col lg:mb-0 px-2 lg:px-10 gap-12 pt-[80px] pb-[20px] lg:gap-4 lg:flex-col">
        <div className="flex flex-col lg:flex-row justify-between grow gap-8 max-h-full">
          <div className="bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 p-5 grow shrink basis-1/2 h-full max-h-full rounded-2xl flex flex-col gap-4 min-w-0">
            <div className="flex flex-col gap-2">
              <h3 className="text-nowrap text-xl font-bold tracking-tight text-slate-700 leading-tight md:text-xl">Bandeja de mensajes</h3>
              <AddMessageButton />
            </div>
            {
              !messages || isLoadingMessages || !users || isLoadingUsers ? (
                <div className="flex justify-center items-center w-full min-h-[4rem]">
                  <div className="w-[40px] h-[30px]">
                    <Loader />
                  </div>
                </div>

              ) : (
                <ul className="flex flex-col gap-4 overflow-auto scrollbar-hidden max-h-full pb-2">
                  {messages &&
                    messages.map((message) => {
                      const messageDate = new Date(message.createdat);
                      return (
                        <Link
                          href={`/gemif/messages/view-message/${message.id}`}
                          key={message.id}
                          className="max-w-full flex justify-between items-stretch 
                                    rounded-xl bg-white border border-[#e0e7ff] 
                                    shadow-sm hover:shadow-md hover:border-blue-400 
                                    transition-all duration-200 ease-in-out min-h-[72px]"
                        >
                          <div
                            className="flex flex-col justify-center grow px-4 py-3 overflow-hidden 
                                      rounded-xl transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1 min-w-0">
                              <p className="text-xs text-gray-500 truncate min-w-0">
                                {'Enviado por ' +
                                  users.find((user) => user.id === message.userid)?.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate whitespace-nowrap flex-shrink-0">
                                {timeAgo(messageDate)}
                              </p>
                            </div>
                            <p
                              title={message.name}
                              className="text-sm font-semibold text-blue-600 truncate min-w-0"
                            >
                              {message.name}
                            </p>
                            <p
                              title={message.description}
                              className="text-xs text-gray-500 truncate min-w-0"
                            >
                              {message.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
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
    <Link href={'/gemif/messages/add-message'} className='w-full text-center p-1.5 py-2 rounded-md bg-[#4A90E2] text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]'>
      Enviar mensaje
    </Link>
  )
}
