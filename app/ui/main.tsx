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
      <div className="p-5 bg-white rounded-2xl basis-[15%] flex flex-col gap-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-black leading-tight md:text-3xl">
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
          <div className="bg-white p-5 grow shrink basis-1/2 h-full lg:max-w-[50%] rounded-2xl flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-nowrap text-xl font-bold tracking-tight text-black leading-tight md:text-xl">Archivos útiles</h3>
              {
                user && (user.role === 'admin' || user.role === 'dev') && (
                  <AddMainFileButton />
                )
              }
            </div>
            {
              mainPostsLoading || !user ? (
                <div className="flex items-center justify-center">
                  <Loader />
                </div>
                ) : (
                  <ul className="flex flex-col gap-4 overflow-auto scrollbar-hidden max-lg:max-h-[400px] max-h-full">
                    { mainPosts &&
                      mainPosts?.filter((post) => post.filename).map((post) => (
                      <li key={post.filename} className="border border-[#4d30e0] max-w-full cursor-pointer flex justify-between rounded-lg">
                          <a
                            href={`https://raw.githubusercontent.com/Aissamdev2/Archive/main/main-data/${post.filename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col overflow-hidden grow p-4 ${user.role === 'admin' || user.role === 'dev' ? 'rounded-tl-lg rounded-bl-lg' : 'rounded-lg'} hover:bg-[#e3deff] transition-[background-color]`}
                          >
                            <p title={post.name} className="truncate font-semibold text-[#4d30e0]">
                              {post.name}
                            </p>
                            <p title={post.description} className="text-sm text-[#9886f0] truncate">
                              {post.description}
                            </p>
                          </a>
                          <Link href={`/gemif/main/view-main-post/${post.id}/file`} className="flex basis-[40px] items-center justify-center px-2 rounded-tr-lg rounded-br-lg hover:bg-[#e3deff] transition-[background-color]">
                            <Eye className="w-6 h-6 text-[#4d30e0]" />
                          </Link>
                      </li>
                    ))}
                  </ul>
              )
            }
          </div>
          <div className="bg-white p-5 grow shrink basis-1/2 h-full max-h-full lg:max-w-[50%] rounded-2xl flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-nowrap text-xl font-bold tracking-tight text-black leading-tight md:text-xl">Enlaces útiles</h3>
              {
                user && (user.role === 'admin' || user.role === 'dev') && (
                  <AddMainLinkButton />
                )
              }
            </div>
            {
              mainPostsLoading || !user ? (
                <div className="flex items-center justify-center">
                  <Loader />
                </div>
                ) : (
                  <ul className="flex flex-col gap-4 overflow-scroll scrollbar-hidden">
                    { mainPosts &&
                      mainPosts?.filter((post) => post.link).map((post) => (
                      <li key={post.link} className="border border-[#4d30e0] max-w-full cursor-pointer flex justify-between rounded-lg ">
                          <a
                            href={`${post.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col overflow-hidden grow p-4 ${user.role === 'admin' || user.role === 'dev' ? 'rounded-tl-lg rounded-bl-lg' : 'rounded-lg'} hover:bg-[#e3deff] transition-[background-color]`}
                          >
                            <p title={post.name} className="truncate font-semibold text-[#4d30e0]">
                              {post.name}
                            </p>
                            <p title={post.description} className="text-sm text-[#9886f0] truncate">
                              {post.description}
                            </p>
                          </a>
                          <Link href={`/gemif/main/view-main-post/${post.id}/link`} className="flex basis-[40px] items-center justify-center px-2 rounded-tr-lg rounded-br-lg hover:bg-[#e3deff] transition-[background-color]">
                            <Eye className="w-6 h-6 text-[#4d30e0]" />
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
    <Link href={'/gemif/main/add-main-post/file'} className='w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700'>
      Añadir archivo
    </Link>
  )
}

function AddMainLinkButton() {
  return (
    <Link href={'/gemif/main/add-main-post/link'} className='w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700'>
      Añadir enlace
    </Link>
  )
}