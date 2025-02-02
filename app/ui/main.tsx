'use client'

import { useMainPosts } from "@/app/lib/use-main-posts";
import { useUser } from "@/app/lib/use-user";
import { Eye } from "lucide-react";
import Link from "next/link";
import Loader from "./loader";
import { SWRProvider } from "../lib/swr-provider";

export default function Main() {

  const { user, error, isLoading } = useUser();
  const { mainPosts, error: mainPostsError, isLoading: mainPostsLoading } = useMainPosts();

  if (error) return <div>Error: {error.message}</div>;
  if (mainPostsError) return <div>Error: {mainPostsError.message}</div>;

  return (
    <SWRProvider>
    <section className="z-50 w-full h-full flex flex-col lg:mb-0 px-2 lg:px-10 gap-12 pt-[80px] pb-[20px] lg:gap-4 lg:flex-col">
      <div className="p-5 bg-white rounded-2xl flex flex-col gap-4">
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
        <div className="flex flex-col lg:flex-row justify-between grow gap-8">
          <div className="bg-white p-5 grow shrink basis-1/2 h-full rounded-2xl flex flex-col gap-4">
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
                <div className="overflow-scroll scrollbar-hidden">
                  <ul className="flex flex-col gap-4">
                    { mainPosts &&
                      mainPosts?.filter((post) => post.filename).map((post) => (
                      <li key={post.filename} className="border border-[#4d30e0] cursor-pointer flex justify-between rounded-lg">
                          <a
                            href={`https://raw.githubusercontent.com/Aissamdev2/Archive/main/main-data/${post.filename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col grow p-4 ${user.role === 'admin' || user.role === 'dev' ? 'rounded-tl-lg rounded-bl-lg' : 'rounded-lg'} hover:bg-[#e3deff] transition-[background-color]`}
                          >
                            <p title={post.name} className="truncate font-semibold text-[#4d30e0]">
                              {post.name}
                            </p>
                            <p title={post.description} className="text-sm text-[#9886f0] truncate">
                              {post.description}
                            </p>
                          </a>
                          <Link href={`/gemif/main/view-main-post/${post.id}/file`} className="flex items-center justify-center px-2 rounded-tr-lg rounded-br-lg hover:bg-[#e3deff] transition-[background-color]">
                            <Eye className="w-6 h-6 text-[#4d30e0]" />
                          </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            }
          </div>
          <div className="bg-white p-5 grow shrink basis-1/2 h-full rounded-2xl flex flex-col gap-4">
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
                <div className="overflow-scroll scrollbar-hidden">
                  <ul className="flex flex-col gap-4">
                    { mainPosts &&
                      mainPosts?.filter((post) => post.link).map((post) => (
                      <li key={post.link} className="border border-[#4d30e0] cursor-pointer flex justify-between rounded-lg">
                          <a
                            href={`${post.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col grow p-4 ${user.role === 'admin' || user.role === 'dev' ? 'rounded-tl-lg rounded-bl-lg' : 'rounded-lg'} hover:bg-[#e3deff] transition-[background-color]`}
                          >
                            <p title={post.name} className="truncate font-semibold text-[#4d30e0]">
                              {post.name}
                            </p>
                            <p title={post.description} className="text-sm text-[#9886f0]">
                              {post.description}
                            </p>
                          </a>
                          <Link href={`/gemif/main/view-main-post/${post.id}/link`} className="flex items-center justify-center px-2 rounded-tr-lg rounded-br-lg hover:bg-[#e3deff] transition-[background-color]">
                            <Eye className="w-6 h-6 text-[#4d30e0]" />
                          </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            }
          </div>
        </div>
    </section>
    </SWRProvider>
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