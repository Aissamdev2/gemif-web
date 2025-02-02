'use client'

import { useEffect, useState } from "react";
import { usePrimitiveSubjects } from "../lib/use-primitive-subjects"
import { useFormState, useFormStatus } from "react-dom";
import { mutate } from "swr";
import { archiveSubjects, initialize, updateSubjects } from "../lib/actions";
import { getSubjects } from "../lib/actions";
import { useRouter } from "next/navigation";


export default function InitialSetup() {

  const { primitiveSubjects, error, error: primitiveSubjectsError, isLoading: isLoadingPrimitiveSubjects } = usePrimitiveSubjects()
  const [subjectState, setSubjectState] = useState<Record<string, boolean>>({});
  const [passedSubjectState, setPassedSubjectState] = useState<Record<string, boolean>>({});
  const router = useRouter()


  const changeSubjects = async (_currentState: unknown, formData: FormData) => {
    mutate(process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string + "/api/subjects", await updateSubjects(formData))
    return 'Subjects updated'
  }

  const changeArchiveSubjects = async (_currentState: unknown, formData: FormData) => {
      mutate(process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string + "/api/subjects", await archiveSubjects(formData))
      return 'Subjects archived'
    }

  const [addState, dispatch] = useFormState(changeSubjects, undefined)
  const [archiveSstate, archiveDispatch] = useFormState(changeArchiveSubjects, undefined)

  useEffect(() => {
      if (primitiveSubjects) {
        const initialState = Object.fromEntries(
          primitiveSubjects.map((subject) => {
            return [subject.name, false];
          })
        );
        setSubjectState(initialState);
        setPassedSubjectState(initialState);
      }
    }, [primitiveSubjects]);


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

  const handlePassedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target as HTMLInputElement
    setPassedSubjectState((prevState) => {
      if (!prevState) return prevState
      return {
        ...prevState,
        [value]: !prevState[value]
      }
    })
  }

  const onSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!primitiveSubjects) return
    const formData = new FormData(e.currentTarget);
    const subjectsToArchive = primitiveSubjects.filter((subject) => passedSubjectState[subject.name]);
    const subjectsToAdd = primitiveSubjects.filter((subject) => subjectState[subject.name]).concat(subjectsToArchive);
    formData.append("subjectsToAdd", JSON.stringify(subjectsToAdd));
    dispatch(formData);

    const subjects = await getSubjects()

    formData.append("subjectsToArchive", JSON.stringify(subjects.filter((subject) => passedSubjectState[subject.name])));
    archiveDispatch(formData);

    await initialize();
  }

  if (!primitiveSubjects) {
    return null
  }

  return (
    <main className="w-full h-full flex justify-center items-center p-5 bg-[#eaf3ff]">
      <form onSubmit={onSubmitForm} className="flex flex-col gap-5">
        <div className="w-fit h-full flex justify-center items-center gap-5">
          <div className="flex flex-col bg-white p-4 rounded-lg gap-5 items-start">
            <h2 className="text-xl font-extrabold tracking-tight text-black leading-tight md:text-xl">
              Seleccione las asignaturas que cursa actualmente
            </h2>
            <div className="flex border-b border-gray-200">
              <div className="flex flex-col gap-3 overflow-auto scrollbar-hidden max-h-[200px] pb-2">
                {
                  primitiveSubjects.map((subject, index) => {
                    return (
                      <div key={subject.id + 'taking'} title={subject.name} className="flex items-center">
                        <input checked={!!subjectState[subject.name]} disabled={!!passedSubjectState[subject.name]} id={subject.name + 'taking'} type="checkbox" name="subject" value={subject.name} onChange={handleChange} className="w-[21.6px] h-[21.6px] appearance-none border cursor-pointer border-gray-300  rounded-md mr-2 hover:border-indigo-500 hover:bg-indigo-100 checked:bg-no-repeat checked:bg-center checked:border-indigo-500 checked:bg-indigo-100"/>
                        <label htmlFor={subject.name + 'taking'} className={`${!!passedSubjectState[subject.name] ? 'line-through' : ''} text-sm font-norma cursor-pointer truncate max-w-[200px] text-gray-600`}>{subject.name}</label>
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
          <div className="flex flex-col bg-white p-4 rounded-lg gap-5 items-start">
          <h2 className="text-xl font-extrabold tracking-tight text-black leading-tight md:text-xl">
              Seleccione las asignaturas que ha superado
            </h2>
            <div className="flex border-b border-gray-200">
              <div className="flex flex-col gap-3 overflow-auto scrollbar-hidden max-h-[200px] pb-2">
                {
                  primitiveSubjects.map((subject, index) => {
                    return (
                      <div key={subject.id + 'passed'} title={subject.name} className="flex items-center">
                        <input checked={!!passedSubjectState[subject.name]} disabled={!!subjectState[subject.name]} id={subject.name + 'passed'} type="checkbox" name="subject" value={subject.name} onChange={handlePassedChange} className="w-[21.6px] h-[21.6px] appearance-none border cursor-pointer border-gray-300  rounded-md mr-2 hover:border-indigo-500 hover:bg-indigo-100 checked:bg-no-repeat checked:bg-center checked:border-indigo-500 checked:bg-indigo-100"/>
                        <label htmlFor={subject.name + 'passed'} className={`${!!subjectState[subject.name] ? 'line-through' : ''} text-sm font-norma cursor-pointer truncate max-w-[200px] text-gray-600`}>{subject.name}</label>
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
          
        </div>
        <div className="h-full bg-white p-4 rounded-lg flex justify-center items-center">
          <div className="flex justify-center">
            <UpdateButton text="Aceptar"/>
          </div>
        </div>

      </form>
    </main>
  )
}

function UpdateButton({ text }: { text?: string }) {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button disabled={pending} type="submit" onClick={handleClick} className={`${pending ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700`}>
      {text}
    </button>
  )
}