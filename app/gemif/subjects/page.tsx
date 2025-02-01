'use client'

import { updateSubject } from "@/app/lib/actions";
import { PrimitiveSubject, Ranking, Subject } from "@/app/lib/definitions";
import { usePrimitiveSubjects } from "@/app/lib/use-primitive-subjects";
import { useRanking } from "@/app/lib/use-ranking";
import { useSubjects } from "@/app/lib/use-subjects";
import SubjectBoxInfo from "@/app/ui/subject-box-info";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { mutate } from "swr";
import { Award } from "lucide-react";
import Loader from "@/app/ui/loader";


export default function SubjectsPage() {
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>('Seleccione una asignatura');
  const [selectedOption, setSelectedOption] = useState<PrimitiveSubject | undefined>(undefined);
  const [scoreSelectedOptionId, setScoreSelectedOptionId] = useState<string | undefined>('Seleccione una asignatura');
  const [scoreSelectedOption, setScoreSelectedOption] = useState<Subject | undefined>(undefined);
  const { primitiveSubjects, error: primitiveError, isLoading: isLoadingPrimitive } = usePrimitiveSubjects();
  const router = useRouter()
  const { subjects, error: subjectsError, isLoading: isLoadingSubjects } = useSubjects();
  const { ranking, error: rankingError, isLoading: isLoadingRanking } = useRanking();



  const submitScore = async (_currentState: unknown, formData: FormData) => {
    mutate(process.env.BASE_URL as string + "/api/ranking", await updateSubject(formData))
    return 'Score submitted'
  }

  const [state, dispatch] = useFormState(submitScore, undefined)

  useEffect(() => {
      if (state === 'Score submitted') {
        router.refresh();
      } else if (state === 'Failed to update subjects') {
      }
    }, [state, router]);



  if (primitiveError) return <div>Error: {primitiveError.message}</div>;
  if (subjectsError) return <div>Error: {subjectsError.message}</div>;

  if (rankingError) return <div>Error: {rankingError.message}</div>;

  const orderedRanking = ranking?.sort((a, b) => {
    return b.score - a.score;
  });

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!primitiveSubjects) return
    const targetSubject = primitiveSubjects.find((subject) => subject.id === event.target.value)
    setSelectedOptionId(event.target.value);
    setSelectedOption(targetSubject)
  };

  const handleScoreSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!subjects) return
    const targetSubject = subjects.find((subject) => subject.id === event.target.value)
    setScoreSelectedOptionId(event.target.value);
    setScoreSelectedOption(targetSubject)
  };

  console.log('subjects: ', isLoadingSubjects, 'primitive: ', isLoadingPrimitive, 'ranking: ', isLoadingRanking )

  return (
    <section className="z-50 w-full h-full flex flex-col lg:mb-0 px-2 lg:px-10 gap-12 pt-[80px] pb-[20px] lg:gap-12 lg:flex-row">
        <div className="p-5 bg-white rounded-2xl flex flex-col grow-[4] gap-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-black leading-tight md:text-3xl">
            Asignaturas de GEMiF
          </h2>
          <h3>Aquí podrás ver información sobre cada asignatura</h3>
          <div className="flex gap-3">
            {
              isLoadingPrimitive || !primitiveSubjects ? (
                <div className="flex flex-col w-full">
                  <label htmlFor="options" className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Asignatura</label>
                  <select 
                  id="options"
                  name="options"
                  value={selectedOptionId}
                  onChange={handleSelectChange}
                  className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed">
                    <option value="Seleccione una asignatura">Cargando...</option>
                  </select>
                </div>
              ) : (
                <div className="flex flex-col w-full">
                  <label htmlFor="options" className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Asignatura</label>
                  <select 
                  id="options"
                  name="options"
                  value={selectedOptionId}
                  onChange={handleSelectChange}
                  className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed">
                    <option value="Seleccione una asignatura">Seleccione una asignatura</option>
                    {
                      primitiveSubjects.map((subject) => {
                        if (subject.name === 'Otros') return null
                        return (
                          <option key={subject.id + 'color'} value={subject.id}>{subject.name}</option>
                        )
                      })
                    }
                  </select>
                </div>
              )
            }
          </div>

          {
            selectedOption && selectedOptionId !== 'Seleccione una asignatura' && (
              <div className="flex">
                <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:grid-rows-[repeat(3,1fr] lg:gap-y-2 lg:gap-x-2">
                    <div className="flex justify-start">
                      <SubjectBoxInfo title="Nombre" info={selectedOption?.name} />
                    </div>
                    <div className="flex justify-start">
                      <SubjectBoxInfo title="Créditos" info={selectedOption?.credits} />
                    </div>
                    <div className="flex justify-start">
                      <SubjectBoxInfo title="Curso" info={selectedOption.year?? 'Sin definir'} />
                    </div>
                    <div className="flex justify-start">
                      <SubjectBoxInfo title="Cuadrimestre" info={selectedOption?.quadri ?? 'Sin definir'} />
                    </div>
                    <div className="flex justify-start">
                      <SubjectBoxInfo title="Profesores" info={selectedOption.professors.length > 0 ? selectedOption.professors.map((professor, index) => `${index + 1}. ${professor}`) : 'Sin definir'} />
                    </div>
                    <div className="flex justify-start">
                      <SubjectBoxInfo title="Emails" info={selectedOption.emails.length > 0 ? selectedOption.emails.map((email, index) => `${index + 1}. ${email}`) : 'Sin definir'} />
                    </div>
                </div>
              </div>
            )
          }

          
        </div>
        <div className="p-5 bg-white rounded-2xl max-w-[600px] flex flex-col gap-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-black leading-tight md:text-3xl">
            Dale tu puntuación a las asignaturas
          </h2>
          <h3>Dale tu puntuación dentro del intervalo [0,10] y con un decimal como máximo. Por ejemplo 6.9</h3>
          <form action={dispatch} className=" flex flex-col gap-2 mt-3">
            {
              isLoadingSubjects || !subjects ? (
                <div className="flex flex-col">
                <label htmlFor="options" className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Asignatura</label>
                <select 
                id="scoreOptions"
                name="id"
                value={scoreSelectedOptionId}
                onChange={handleScoreSelectChange}
                className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed">
                  <option value="Seleccione una asignatura">Cargando...</option>
                </select>
              </div>
              ) : (
                <div className="flex flex-col">
                  <label htmlFor="options" className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Asignatura</label>
                  <select 
                  id="scoreOptions"
                  name="id"
                  value={scoreSelectedOptionId}
                  onChange={handleScoreSelectChange}
                  className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed">
                    <option value="Seleccione una asignatura">Seleccione una asignatura</option>
                    {
                      subjects.map((subject) => {
                        if (subject.name === 'Otros') return null
                        return (
                          <option key={subject.id + 'score'} value={subject.id}>{subject.name}</option>
                        )
                      })
                    }
                  </select>
                </div>
              )
            }
            <div className="flex gap-3">
              <div className="flex flex-col">
                <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Puntuación</label>
                <div className="flex gap-2">
                  <input type="number" name="score" min={0} max={10} step={0.1} disabled={scoreSelectedOptionId === 'Seleccione una asignatura'}
                    defaultValue={scoreSelectedOption?.score}
                    className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
                    required />
                  <ScoreButton text="Puntuar" active={scoreSelectedOptionId !== 'Seleccione una asignatura'} />
                </div>
              </div>
            </div>
          </form>
          <div className="flex mt-5 flex-col">
                <p className="text-xl font-extrabold tracking-tight text-black leading-tight md:text-3xl">Ranking de asignaturas</p>
                <div className="flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="flex grow">
                      <p className="flex justify-start items-center py-1 border-b border-[#4d30e0]">Top</p>
                      <p className="flex justify-start items-center grow pl-4 py-1 border-b border-[#4d30e0]">Asignatura</p>
                    </div>
                    <p className="flex justify-start items-center pl-1 py-1 border-b border-[#4d30e0]">Puntuación</p>
                  </div>
                  {
                    isLoadingRanking || !orderedRanking ? (
                      <div className="w-full flex justify-center items-center">
                        <Loader />
                      </div>
                    ) : (
                      <div className="flex justify-between max-h-[200px] overflow-scroll scrollbar-hidden">
                        <div className="flex grow">
                          <div className="flex flex-col">
                            {
                              orderedRanking.map((rankingItem, index) => {
                                if (index === 0 ) return <div key={index + 'award'} className="flex justify-center items-center pr-3 py-1 border-b border-[#dad3ff]"><Award className="text-[#FFD700]" /></div>
                                if (index === 1 ) return <div key={index + 'award'} className="flex justify-center items-center pr-3 py-1 border-b border-[#dad3ff]"><Award className="text-[#C0C0C0]" /></div>
                                if (index === 2 ) return <div key={index + 'award'} className="flex justify-center items-center pr-3 py-1 border-b border-[#dad3ff]"><Award className="text-[#CD7F32]" /></div>
                                return (
                                  <p className="flex justify-center items-center pr-3 py-1 border-b border-[#dad3ff]" key={index + 'pos'}>{index+1}</p>
                                )
                              })
                            }
                          </div>
                          <div className="flex flex-col grow">
                            { primitiveSubjects && !isLoadingPrimitive &&
                              orderedRanking.map((rankingItem, index) => {
                                const name = primitiveSubjects.find((subject) => subject.id === rankingItem.primitiveid)?.name
                                return (
                                    <p className="pl-2 py-1 box-border shrink-0 border-b border-[#dad3ff] truncate hover:bg-[#e9e5ff]" key={index + 'name'}>{name}</p>
                                )
                              })
                            }
                          </div>
                        </div>
                        <div className="flex flex-col">
                          {
                            orderedRanking.map(rankingItem => {
                              return (
                                <p className="py-1 border-b px-8 border-[#dad3ff]" key={rankingItem.primitiveid + 'score'}>{rankingItem.score}</p>
                              )
                            })
                          }
                        </div>
                      </div>
                    )
                  }
                </div>
            </div>
        </div>
        </section>
  )
}

function ScoreButton({ text, active }: { text?: string, active?: boolean }) {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button disabled={pending || !active} type="submit" onClick={handleClick} className={`${pending || !active ? 'opacity-30' : 'opacity-100'} w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700`}>
      {pending ? 'Puntuando...' : text}
    </button>
  )
}