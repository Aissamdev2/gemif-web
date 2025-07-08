'use client'

import { useMainPosts } from "@/app/lib/use-main-posts";
import { useUser } from "@/app/lib/use-user";
import { Eye } from "lucide-react";
import Link from "next/link";
import Loader from "./loader";

export default function Main() {

  const { user, error, isLoading } = useUser();
  const { mainPosts, error: mainPostsError, isLoading: mainPostsLoading } = useMainPosts();

  if (error) return <div>Error: {error.message}</div>;
  if (mainPostsError) return <div>Error: {mainPostsError.message}</div>;

  return (

    <section className="z-50 w-full h-full max-h-full flex flex-col lg:mb-0 px-2 lg:px-10 gap-12 pt-[80px] pb-[20px] lg:gap-4">
      <div className="p-5 shadow-[0_2px_4px_rgba(16,42,83,0.08)] bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 rounded-2xl basis-[15%] flex flex-col gap-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-700 leading-tight md:text-3xl">
          {
            isLoading || !user ? (
              <p className="h-[36px] w-[250px] bg-slate-100 animate-pulse"></p>
            ) : (
              <p>Hola, {user.name}</p>
            )
          }
        </h2>
        </div>
        <div className="flex flex-col lg:flex-row justify-between grow gap-8 max-h-[85%] max-w-full">
          <div className="shadow-[0_2px_4px_rgba(16,42,83,0.08)] bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 p-5 grow shrink basis-1/2 h-full lg:max-w-[50%] rounded-2xl flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-nowrap text-xl font-bold tracking-tight text-slate-700 leading-tight md:text-xl">Archivos útiles</h3>
              {
                user && (user.role === 'admin' || user.role === 'dev') && (
                  <AddMainFileButton />
                )
              }
            </div>
            {
              mainPostsLoading || !user ? (
                <div className="flex justify-center items-center w-full min-h-[4rem]">
                  <div className="w-[40px] h-[30px]">
                    <Loader />
                  </div>
                </div>
                ) : (
                  <ul className="flex flex-col pb-2 gap-4 overflow-auto scrollbar-hidden max-h-full">
                    {mainPosts &&
                      mainPosts?.filter((post) => post.filename).map((post) => (
                        <li
                          key={post.filename}
                          className="max-w-full flex justify-between items-stretch 
                                    rounded-xl bg-white border border-[#e0e7ff] 
                                    shadow-sm hover:shadow-md hover:border-blue-400 
                                    transition-all duration-200 ease-in-out min-h-[72px]"
                        >
                          <a
                            href={`https://raw.githubusercontent.com/Aissamdev2/Archive/main/main-data/${post.filename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col justify-center grow px-4 py-3 overflow-hidden ${
                              user.role === 'admin' || user.role === 'dev'
                                ? 'rounded-tl-xl rounded-bl-xl'
                                : 'rounded-xl'
                            } transition-colors`}
                          >
                            <p
                              title={post.name}
                              className="text-sm font-semibold text-blue-600 truncate"
                            >
                              {post.name}
                            </p>
                            <p
                              title={post.description}
                              className="text-xs text-gray-500 truncate"
                            >
                              {post.description}
                            </p>
                          </a>
                          <Link
                            href={`/gemif/main/view-main-post/${post.id}/file`}
                            className="flex basis-[40px] items-center justify-center px-3 
                                      rounded-tr-xl rounded-br-xl hover:bg-blue-50 
                                      transition-colors"
                          >
                            <Eye className="w-5 h-5 text-blue-500 hover:text-blue-600 transition" />
                          </Link>
                        </li>
                      ))}
                  </ul>


              )
            }
          </div>
          <div className="shadow-[0_2px_4px_rgba(16,42,83,0.08)] bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 p-5 grow shrink basis-1/2 h-full max-h-full lg:max-w-[50%] rounded-2xl flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-nowrap text-xl font-bold tracking-tight text-slate-700 leading-tight md:text-xl">Enlaces útiles</h3>
              {
                user && (user.role === 'admin' || user.role === 'dev') && (
                  <AddMainLinkButton />
                )
              }
            </div>
            {
              mainPostsLoading || !user ? (
                <div className="flex justify-center items-center w-full min-h-[4rem]">
                  <div className="w-[40px] h-[30px]">
                    <Loader />
                  </div>
                </div>
                ) : (
                  <ul className="flex flex-col pb-2 gap-4 overflow-auto scrollbar-hidden max-h-full">
                    {mainPosts &&
                      mainPosts?.filter((post) => post.link).map((post) => (
                        <li
                          key={post.link}
                          className="max-w-full flex justify-between items-stretch 
                                    rounded-xl bg-white border border-[#e0e7ff] 
                                    shadow-sm hover:shadow-md hover:border-blue-400 
                                    transition-all duration-200 ease-in-out min-h-[72px]"
                        >
                          <a
                            href={`https://raw.githubusercontent.com/Aissamdev2/Archive/main/main-data/${post.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col justify-center grow px-4 py-3 overflow-hidden ${
                              user.role === 'admin' || user.role === 'dev'
                                ? 'rounded-tl-xl rounded-bl-xl'
                                : 'rounded-xl'
                            } transition-colors`}
                          >
                            <p
                              title={post.name}
                              className="text-sm font-semibold text-blue-600 truncate"
                            >
                              {post.name}
                            </p>
                            <p
                              title={post.description}
                              className="text-xs text-gray-500 truncate"
                            >
                              {post.description}
                            </p>
                          </a>
                          <Link
                            href={`/gemif/main/view-main-post/${post.id}/link`}
                            className="flex basis-[40px] items-center justify-center px-3 
                                      rounded-tr-xl rounded-br-xl hover:bg-blue-50 
                                      transition-colors"
                          >
                            <Eye className="w-5 h-5 text-blue-500 hover:text-blue-600 transition" />
                          </Link>
                        </li>
                      ))}
                  </ul>


              )
            }
          </div>
        </div>
    </section>
  )
}

function AddMainFileButton() {
  return (
    <Link href={'/gemif/main/add-main-post/file'} className='w-full text-center p-1.5 py-2 rounded-md bg-[#4A90E2] text-[#FFFFFF] text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]'>
      Añadir archivo
    </Link>
  )
}

function AddMainLinkButton() {
  return (
    <Link href={'/gemif/main/add-main-post/link'} className='w-full text-center p-1.5 py-2 rounded-md bg-[#4A90E2] text-[#FFFFFF] text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]'>
      Añadir enlace
    </Link>
  )
}