'use client'
import { useSubjects } from "@/app/lib/use-subjects";
import {  useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { archiveSubjects, updateSubjects } from "@/app/lib/actions";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import { usePrimitiveSubjects } from "@/app/lib/use-primitive-subjects";
import Loader from "@/app/ui/loader";


export default function Page() {
  const { subjects, error: subjectsError, isLoading: isLoadingSubjects } = useSubjects();
  const { primitiveSubjects, error, error: primitiveSubjectsError, isLoading: isLoadingPrimitiveSubjects } = usePrimitiveSubjects()
  const router = useRouter()
  const [subjectState, setSubjectState] = useState<Record<string, boolean>>({});
  const [archiveState, setArchiveState] = useState<Record<string, boolean>>({});


  useEffect(() => {
    if (subjects) {
      const initialState = Object.fromEntries(
        subjects.map((subject) => [subject.name, false]) // Initialize all subjects as false
      );
      setArchiveState(initialState);
      
    }
  },[subjects])


  const changeSubjects = async (_currentState: unknown, formData: FormData) => {
    mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/subjects", await updateSubjects(formData))
    return 'Subjects updated'
  }

  const changeArchiveSubjects = async (_currentState: unknown, formData: FormData) => {
    mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/subjects", await archiveSubjects(formData))
    return 'Subjects archived'
  }

  const [reset, setReset] = useState(false)
  const [state, dispatch] = useFormState(changeSubjects, undefined)
  const [resetArchive, setArchiveReset] = useState(false)
  const [archive, archiveDispatch] = useFormState(changeArchiveSubjects, undefined)

  useEffect(() => {
    if (state === 'Subjects updated') {
    } else if (state === 'Failed to update subjects') {
    }
  }, [state, router]);

  useEffect(() => {
    if (archive === 'Subjects archived') {
    } else if (archive === 'Failed to update subjects') {
    }
  }, [archive, router]);


  useEffect(() => {
    if (subjects && primitiveSubjects) {
      const subjectsNames = subjects.map((subject) => subject.name);
      const initialState = Object.fromEntries(
        primitiveSubjects.map((subject) => {
          const isActive = subjectsNames.includes(subject.name);
          return [subject.name, isActive];
        })
      );
      setSubjectState(initialState);
    }
  }, [subjects, reset, primitiveSubjects]);

  useEffect(() => {
    if (subjects && primitiveSubjects) {
      const initialState = Object.fromEntries(subjects.map((subject) => {
        return [subject.name, subject.archived];
      }))
      setArchiveState(initialState);
    }
  }, [subjects, resetArchive, primitiveSubjects]);

  
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target as HTMLInputElement
    setSubjectState((prevState) => {
      if (!prevState) return prevState
      return {
        ...prevState,
        [value]: !prevState[value]
      }
    })
  }

  const handleArchiveChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target as HTMLInputElement
    setArchiveState((prevState) => {
      if (!prevState) return prevState
      return {
        ...prevState,
        [value]: !prevState[value]
      }
    })
  }
  
  const onSubmitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!primitiveSubjects) return
    if (!subjects) return
    const subjectsNames = subjects.map((subject) => subject.name);
    const selectedSubjects = primitiveSubjects.filter((subject) => subjectState[subject.name]);
    const formData = new FormData(e.currentTarget);
    const subjectsToAdd = selectedSubjects.filter((subject) => !subjectsNames.includes(subject.name));
    const subjectsToRemove = subjects.filter((subject) => !subjectState[subject.name]);
    formData.append("subjectsToAdd", JSON.stringify(subjectsToAdd));
    formData.append("subjectsToRemove", JSON.stringify(subjectsToRemove));
    dispatch(formData);
  }
  
  const onSubmitArchiveForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subjects) return
    const preArchivedSubjects = subjects.filter((subject) => subject.archived);
    const preArchivedSubjectsNames = preArchivedSubjects.map((subject) => subject.name);
    const selectedSubjects = subjects.filter((subject) => archiveState[subject.name]);
    const formData = new FormData(e.currentTarget);
    const subjectsToArchive = selectedSubjects.filter((subject) => !preArchivedSubjectsNames.includes(subject.name));
    const subjectsToUnarchive = preArchivedSubjects.filter((subject) => !archiveState[subject.name]);
    formData.append("subjectsToArchive", JSON.stringify(subjectsToArchive));
    formData.append("subjectsToUnarchive", JSON.stringify(subjectsToUnarchive));
    archiveDispatch(formData);
  }
  
  if (subjectsError) return <div>Error: {subjectsError}</div>
  if (primitiveSubjectsError) return <div>Error: {primitiveSubjectsError}</div>
    
  
  return (
    <div className="h-fit lg:h-full w-full flex bg-[#eaf3ff] py-3 text-gray-900 font-medium justify-center items-center">
      <div className="w-[95%] h-fit lg:h-[85%] lg:mt-5 bg-white rounded-sm border border-[#a19aff6b] flex flex-col lg:flex-row gap-16 lg:gap-0 justify-around px-1 lg:px-[60px] py-4">
        <form onSubmit={onSubmitForm} className="flex flex-col gap-3 lg:max-w-[40%]">
          <p className="text-sm border-b px-2 py-2 border-[#5f3fbe61]">Asignaturas cursando actualmente</p>
          {
            !subjects || !primitiveSubjects || isLoadingPrimitiveSubjects || isLoadingSubjects || !subjectState ? (
              <div className="flex items-center justify-center">
                <Loader />
              </div>
            ) : (
                <div className="flex flex-col py-2 px-4 gap-3 max-h-[397.6px]">
                  <div className="flex gap-2 grow-0 shrink-0">
                    <p className="[writing-mode:vertical-lr]  text-sm flex justify-center items-center text-gray-500">Cursando</p>
                    <div className="flex flex-col overflow-auto scrollbar-hidden max-h-[200px] gap-3">
                      {
                        subjects.map((subject, index) => {
                          if (subject.name === 'Otros') return null
                          if (subject.archived) return null
                          return (
                            <div key={subject.id} title={subject.name} className="flex items-center">
                              <input checked={!!subjectState[subject.name]} id={subject.name + 'active'} type="checkbox" name="subject" value={subject.name} onChange={handleChange} className="w-[21.6px] h-[21.6px] appearance-none border cursor-pointer border-gray-300  rounded-md mr-2 hover:border-indigo-500 hover:bg-indigo-100 checked:bg-no-repeat checked:bg-center checked:border-indigo-500 checked:bg-indigo-100"/>
                              <label htmlFor={subject.name + 'active'} className="text-sm font-norma cursor-pointer truncate max-w-[200px] text-gray-600">{subject.name}</label>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                  <div className="w-full border-b border-[#5f3fbe3c]"></div>
                  <div className="flex gap-2 border-b py-1 border-[#5f3fbe2a] grow-[1] shrink-[1] min-h-[0]">
                    <p className="[writing-mode:vertical-lr] text-sm flex justify-start items-center text-gray-500">Por cursar</p>
                    <div className="flex flex-col gap-3 overflow-auto scrollbar-hidden max-h-[200px] pb-2">
                      {
                        primitiveSubjects.map((subject, index) => {
                          if (subjects?.map((subject) => subject.name)?.includes(subject.name) || subject.name === 'Otros') return null
                          return (
                            <div key={subject.id} title={subject.name} className="flex items-center">
                              <input checked={!!subjectState[subject.name]} id={subject.name + 'inactive'} type="checkbox" name="subject" value={subject.name} onChange={handleChange} className="w-[21.6px] h-[21.6px] appearance-none border cursor-pointer border-gray-300  rounded-md mr-2 hover:border-indigo-500 hover:bg-indigo-100 checked:bg-no-repeat checked:bg-center checked:border-indigo-500 checked:bg-indigo-100"/>
                              <label htmlFor={subject.name + 'inactive'} className="text-sm font-norma cursor-pointer truncate max-w-[200px] text-gray-600">{subject.name}</label>
                            </div>
                          )
                        })
                      }
                    </div>
                    <div className="flex items-end py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 animate-bounce">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                </div>
              </div>
            )
          }
          <div className="flex gap-3 justify-center">
            <button type="button" disabled={!subjects || !primitiveSubjects || isLoadingPrimitiveSubjects || isLoadingSubjects || !subjectState} onClick={() => setReset(!reset)} className={`${!subjects || !primitiveSubjects || isLoadingPrimitiveSubjects || isLoadingSubjects || !subjectState ? 'opacity-30' : 'opacity-100'} w-full text-center p-1.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium close-modal-button transition-all text-nowrap duration-300 hover:bg-red-700`}>
              Reestablecer selección
            </button>
            <UpdateButton text="Aplicar" disabled={!subjects || !primitiveSubjects || isLoadingPrimitiveSubjects || isLoadingSubjects || !subjectState}/>
          </div>
        </form>
        <form onSubmit={onSubmitArchiveForm} className="flex flex-col gap-3 lg:max-w-[40%]">
          <p className="text-sm border-b px-2 py-2 border-[#5f3fbe61]">Archivar asignaturas superadas</p>
          {
            !subjects || !primitiveSubjects || isLoadingPrimitiveSubjects || isLoadingSubjects || !archiveState ? (
              <div className="flex items-center justify-center">
                <Loader />
              </div>
            ) : (
              <div className="flex flex-col py-2 px-4 gap-3 max-h-[397.6px]">
                  <div className="flex gap-2 grow-0 shrink-0">
                    <p className="[writing-mode:vertical-lr]  text-sm flex justify-center items-center text-gray-500">Cursando</p>
                    <div className="flex flex-col overflow-auto scrollbar-hidden max-h-[200px] gap-3">
                      {
                        subjects.filter((subject) => !subject.archived).map((subject, index) => {
                          if (subject.name === 'Otros') return null
                          return (
                            <div key={subject.id} title={subject.name} className="flex items-center">
                              <input checked={!!archiveState[subject.name]} id={subject.name + 'unarchived'} type="checkbox" name="archive" value={subject.name} onChange={handleArchiveChange} className="w-[21.6px] h-[21.6px] appearance-none border cursor-pointer border-gray-300  rounded-md mr-2 hover:border-indigo-500 hover:bg-indigo-100 checked:bg-no-repeat checked:bg-center checked:border-indigo-500 checked:bg-indigo-100"/>
                              <label htmlFor={subject.name + 'unarchived'} className="text-sm font-norma cursor-pointer truncate max-w-[200px] text-gray-600">{subject.name}</label>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                  <div className="w-full border-b border-[#5f3fbe3c]"></div>
                  <div className="flex gap-2 border-b py-1 border-[#5f3fbe2a] grow-[1] shrink-[1] min-h-[0]">
                    <p className="[writing-mode:vertical-lr] text-sm flex justify-start items-center text-gray-500">Superadas</p>
                    <div className="flex flex-col gap-3 overflow-auto scrollbar-hidden max-h-[200px] pb-2">
                      {
                        subjects.filter((subject) => subject.archived).map((subject, index) => {
                          if (subject.name === 'Otros') return null
                          return (
                            <div key={subject.id} title={subject.name} className="flex items-center">
                              <input checked={!!archiveState[subject.name]} id={subject.name + 'archived'} type="checkbox" name="archive" value={subject.name} onChange={handleArchiveChange} className="w-[21.6px] h-[21.6px] appearance-none border cursor-pointer border-gray-300  rounded-md mr-2 hover:border-indigo-500 hover:bg-indigo-100 checked:bg-no-repeat checked:bg-center checked:border-indigo-500 checked:bg-indigo-100"/>
                              <label htmlFor={subject.name + 'archived'} className="text-sm font-norma cursor-pointer truncate max-w-[200px] text-gray-600">{subject.name}</label>
                            </div>
                          )
                        })
                      }
                    </div>
                </div>
              </div>
            )
          }
          <div className="flex gap-3 justify-center">
            <button type="button" disabled={!subjects || !primitiveSubjects || isLoadingPrimitiveSubjects || isLoadingSubjects || !archiveState} onClick={() => setArchiveReset(!reset)} className={`${!subjects || !primitiveSubjects || isLoadingPrimitiveSubjects || isLoadingSubjects || !archiveState ? 'opacity-30' : 'opacity-100'} w-full text-center p-1.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium close-modal-button transition-all text-nowrap duration-300 hover:bg-red-700`}>
              Reestablecer selección
            </button>
            <UpdateButton text="Marcar como superadas" disabled={(!subjects || !primitiveSubjects || isLoadingPrimitiveSubjects || isLoadingSubjects || !archiveState)}/>
          </div>
        </form>
      </div>
    </div>
  );
}

function UpdateButton({ text, disabled }: { text?: string, disabled: boolean }) {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button disabled={pending || disabled } type="submit" onClick={handleClick} className={`${disabled || pending ? 'opacity-30' : 'opacity-100'} w-full text-center text-nowrap p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700`}>
      {text}
    </button>
  )
}