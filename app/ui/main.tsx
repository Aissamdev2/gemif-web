'use client'

import { useMainPosts } from "@/app/lib/use-main-posts";
import { useUser } from "@/app/lib/use-user";
import { Eye } from "lucide-react";
import Link from "next/link";
import Loader from "./loader";
import { useState, useEffect, useRef } from "react";
import { useSubjects } from "../lib/use-subjects";
import { MainPost, Subject } from "../lib/definitions";
import ErrorPage from "./error";
import ListModal from "./list-modal"; 

export default function Main() {
  const [scoreSelectedOptionId, setScoreSelectedOptionId] = useState<string>('11111111');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const { user, error, isLoading } = useUser();
  const { mainPosts, error: mainPostsError, isLoading: mainPostsLoading } = useMainPosts();
  const { subjects, error: subjectsError, isLoading: isLoadingSubjects } = useSubjects();
  const [modalPostId, setModalPostId] = useState<string | null>(null);
  const [modalData, setModalData] = useState<{
    type: string;
    position: { top: number; left: number };
  } | null>(null);

  const toggleList = (e: React.MouseEvent, type: string, postId: string) => {
    setModalPostId(postId);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setModalData({
      type: type,
      position: {
        top: rect.top - 10, // adjust to move modal upward
        left: rect.left,
      },
    });
  };




  const handleScoreSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!subjects) return
    setScoreSelectedOptionId(event.target.value);
  };

  if (error || subjectsError || mainPostsError) return <ErrorPage error={error?.message || subjectsError?.message || mainPostsError?.message} />;

  return (
    <section className="z-50 w-full h-full max-h-full flex flex-col lg:mb-0 px-2 lg:px-10 gap-12 pt-[80px] pb-[20px] lg:gap-4">
      {/* HEADER */}
      <div className="p-5 shadow-[0_2px_4px_rgba(16,42,83,0.08)] bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 rounded-2xl basis-[15%] flex justify-between items-center gap-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-700 leading-tight md:text-3xl">
          {isLoading || !user ? (
            <p className="h-[36px] w-[250px] bg-slate-100 animate-pulse"></p>
          ) : (
            <p>Hola, {user.publicname}</p>
          )}
        </h2>
        <Link href={'/gemif/weekly-challenges'} className="flex flex-col items-start py-2 px-3 hover:bg-[#d3e5ff] transition-[background-color] duration-300 rounded-2xl">
          <p className="text-md font-bold text-slate-700 leading-tight md:text-xl">Atrévete con los</p>
          <p className="text-md font-bold text-slate-700 leading-tight md:text-xl">Desafíos semanales 🔥</p>
        </Link>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col gap-4 shadow-[0_2px_4px_rgba(16,42,83,0.08)] bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 p-5 grow shrink h-full max-h-full min-h-0 rounded-2xl">
        <div className="flex flex-col gap-1">
          <h3 className="text-nowrap text-xl font-bold tracking-tight text-slate-700 leading-tight md:text-xl">Recursos útiles</h3>
          <div className="flex items-end gap-4">
            <SubjectSelect
              subjects={subjects}
              isLoadingSubjects={isLoadingSubjects}
              value={scoreSelectedOptionId}
              onChange={handleScoreSelectChange}
            />
            {user && (user.role === 'admin' || user.role === 'dev') && (
              <div className="flex basis-[30%]">
                <AddMainFileButton />
              </div>
            )}
          </div>
        </div>

        {/* LIST */}
        {mainPostsLoading || !user ? (
          <div className="flex justify-center items-center w-full min-h-[4rem]">
            <div className="w-[40px] h-[30px]">
              <Loader />
            </div>
          </div>
        ) : (
          <ul className="relative z-0 px-2 p-1 bg-[#e4ecf6] rounded-lg grid grid-cols-1 sm:grid-cols-2 auto-rows-max gap-1 overflow-y-auto scrollbar-hidden flex-1 min-h-0">
            {mainPosts &&
              mainPosts
                .filter(post => post.subjectid === scoreSelectedOptionId)
                .map(post => {
                  const onlyOneFile = post.filenames && post.filenames.length === 1;
                  const onlyOneLink = post.links && post.links.length === 1;
                  
                  const fileHref = onlyOneFile
                    ? `https://raw.githubusercontent.com/Aissamdev2/Archive/main/main-data/${post.foldername}/${post.filenames? post.filenames[0] : ''}`
                    : "#";

                  return (
                    <li
                      key={post.id}
                      className={`${expandedPostId === post.id ? "bg-blue-50" : "bg-white"} relative h-[100px] flex justify-between items-stretch rounded-xl border border-[#e0e7ff] shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 ease-in-out`}
                    >
                      {
                        post.type === 'link' ? (
                          <button
                            onClick={(e) => {
                              if (onlyOneLink) window.open(post.links? post.links[0] : '', "_blank", "noopener,noreferrer");
                              else toggleList(e, 'link', post.id ?? '');
                            }}                          
                            className={`text-left flex flex-col justify-center grow px-4 py-3 overflow-hidden transition-colors `}
                          >
                            <p title={post.name} className="text-sm font-semibold text-blue-600 truncate">
                              {post.name}
                            </p>
                            <p title={post.description} className="text-xs text-gray-500 truncate">
                              {post.description}
                            </p>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              if (onlyOneFile) window.open(fileHref, "_blank", "noopener,noreferrer");
                              else toggleList(e, 'file', post.id ?? '');
                            }}
                            className="text-left flex flex-col justify-center grow px-4 py-3 overflow-hidden transition-colors"
                          >
                            <p title={post.name} className="text-sm font-semibold text-blue-600 truncate">
                              {post.name}
                            </p>
                            <p title={post.description} className="text-xs text-gray-500 truncate">
                              {post.description}
                            </p>
                          </button>
                        )
                      }
                      <Link
                        href={`/gemif/main/view-main-post/${post.id}`}
                        className="flex basis-[40px] items-center justify-center px-3 rounded-tr-xl rounded-br-xl hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="w-5 h-5 text-blue-500 hover:text-blue-600 transition" />
                      </Link>

                      {modalData && modalPostId && (
                        <ListModal
                          names={
                            modalData.type === 'link'
                              ? mainPosts?.find(post => post.id === modalPostId)?.links ?? []
                              : mainPosts?.find(post => post.id === modalPostId)?.filenames ?? []
                          }
                          baseHref={
                            modalData.type === 'file'
                              ? `https://raw.githubusercontent.com/Aissamdev2/Archive/main/main-data/${mainPosts?.find(post => post.id === modalPostId)?.foldername}/`
                              : ''
                          }
                          position={modalData.position}
                          onClose={() => {
                            setModalData(null);
                            setModalPostId(null);
                          }}
                        />
                      )}

                    </li>
                  );
                })}
          </ul>
        )}
      </div>
    </section>
  );
}

function SubjectSelect({ subjects, isLoadingSubjects, value, onChange }: {
  subjects?: Subject[],
  isLoadingSubjects: boolean,
  value: string,
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}) {
  return (
    <div className="flex flex-col grow">
      <label htmlFor="scoreOptions" className="flex items-center mb-1 text-slate-700 text-xs font-medium">Asignatura</label>
      <select
        id="scoreOptions"
        name="subjectid"
        value={value}
        onChange={onChange}
        className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
      >
        <option value="11111111">{isLoadingSubjects ? "Cargando..." : "General"}</option>
        {!isLoadingSubjects && subjects?.filter(s => s.primitiveid !== '00000000').map(subject => (
          <option key={subject.id} value={subject.id}>{subject.name}</option>
        ))}
      </select>
    </div>
  );
}

function AddMainFileButton() {
  return (
    <Link href={'/gemif/main/add-main-post'} className='w-full text-center p-1.5 py-[10px] rounded-md bg-[#4A90E2] text-[#FFFFFF] text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]'>
      Añadir recurso
    </Link>
  );
}
