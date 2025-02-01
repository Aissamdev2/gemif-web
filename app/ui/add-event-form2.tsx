'use client'

import { useFormStatus, useFormState } from "react-dom";
import { addEvent } from "@/app/lib/actions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SWRProvider } from "../lib/swr-provider";
import { mutate } from "swr";
import { useUser } from "../lib/use-user";
import { Subject } from "../lib/definitions";
import { useSubjects } from "../lib/use-subjects";
import { usePrimitiveSubjects } from "../lib/use-primitive-subjects";
import Loader from "./loader";

export default function AddEventForm() {

  const addNewEvent = async (_currentState: unknown, formData: FormData) => {
    mutate(process.env.BASE_URL as string + "/api/events", addEvent(formData))

    return 'Event created'
  }

  const [state, dispatch] = useFormState(addNewEvent, undefined)
  const [errorMessage, setErrorMessage] = useState('')
  const [scope, setScope] = useState('user')
  const router = useRouter()
  const { user, error, isLoading } = useUser();
  const { subjects, error: subjectsError, isLoading: isLoadingSubjects } = useSubjects();
  const { primitiveSubjects, error: primitiveSubjectsError, isLoading: isLoadingPrimitiveSubjects } = usePrimitiveSubjects()
  const [disabled, setDisabled] = useState(true)

  useEffect(() => {
    if (state === 'Event created') {
      router.back();
    } else if (state === 'Failed to create event') {
      console.log('Event NOT createddd');
      setErrorMessage('No se pudo crear el evento');
    }
  }, [state, setErrorMessage, router]);

  const handleScopeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setScope(event.target.value)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !subjects) return
    const formData = new FormData(event.currentTarget);
    const eventSubject = subjects.find(subject => subject.id === formData.get('subjectid'))
    console.log(eventSubject)
    formData.append('primitiveid', eventSubject?.primitiveid as string);
    dispatch(formData);
  };

  


    return (
      <SWRProvider>                                              
        <form onSubmit={handleSubmit} id="modalBox-3"
          className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-[90%] lg:w-fit h-fit max-h-screen flex justify-center items-center z-[1000] overflow-x-hidden overflow-y-auto">
          <div className="flex flex-col gap-5 w-full lg:w-fit md:h-auto bg-white p-6">
            <h4 className="text-lg font-bold leading-8 text-gray-900 text-center">Añadir nuevo evento</h4>
            <div className="flex flex-col gap-8 overflow-auto scrollbar-hidden py-5 md:flex-row">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Título</label>
                  <input type="text" name="name"
                    className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
                    placeholder="Añade un titulo" required />
                </div>
                <div className="relative">
                  <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Descripción </label>
                  <textarea  name="description"
                    className="block w-full  h-24 px-3.5 py-2 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed resize-none"
                    placeholder="Escribe una descripción..."></textarea>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Fecha del evento</label>
                  <input type="date" name="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
                    placeholder="Añade un titulo" required />
                </div>
                <div className="relative">
                  <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Hora del evento</label>
                  <input type="time" name="time"
                    defaultValue={new Date().toLocaleTimeString().slice(0, 5)}
                    className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
                    placeholder="Añade un titulo" required />
                </div>
                {
                  user && user.role === 'user' && (
                    <input type="hidden" name="scope" value="user" />
                  )
                }
                {
                  user && user.role === 'admin' && (
                    <div className="flex flex-col">
                      <label htmlFor="options" className=" mb-2 text-sm font-medium text-gray-600 w-full">Vsibilidad</label>
                      <select 
                      id="options"
                      name="scope"
                      value={scope}
                      onChange={handleScopeChange}
                      className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed">
                        <option value="user">Individual</option>
                        <option value="admin">Clase</option>
                      </select>
                    </div>
                  )
                }
                {
                  user && user.role === 'dev' && (
                    <div className="flex flex-col">
                      <label htmlFor="options" className=" mb-2 text-sm font-medium text-gray-600 w-full">Vsiibilidad</label>
                      <select 
                      id="options"
                      name="scope"
                      value={scope}
                      onChange={handleScopeChange}
                      className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed">
                        <option value="user">Individual</option>
                        <option value="admin">Clase</option>
                        <option value="dev">Global</option>
                      </select>
                    </div>
                  )
                }
                

              </div>
              {
                !subjects || isLoadingSubjects ? (
                  <div className="flex justify-center items-center">
                    <Loader />
                  </div>
                ) : (
                  <div className="flex flex-col gap-[5px]">
                    <SubjectRadios subjects={subjects} setDisabled={setDisabled}/>
                  </div>
                )
              }
            </div>
            <div className="flex items-center justify-end gap-4">
              <button onClick={() => router.back()} type="button" className="w-full text-center p-1.5 py-2 rounded-md bg-white text-black text-xs font-medium transition-all duration-300 border hover:border-gray-400"  data-pd-overlay="#modalBox-3" data-modal-target="modalBox-3">Cancel</button>
              <AddButton disabled={disabled || !user || isLoadingSubjects || !subjects || !primitiveSubjects || isLoading || isLoadingPrimitiveSubjects}/>
            </div>
          </div>
        </form>
      </SWRProvider>
    )
}

function AddButton({disabled}:{disabled: boolean}) {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button disabled={pending || disabled} type="submit" onClick={handleClick} className={`${disabled || pending ? 'pointer-events-none opacity-30' : 'opacity-100'} w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700`}>
      Crear
    </button>
  )
}

function SubjectRadios({ subjects, setDisabled }: { subjects: Subject[], setDisabled: React.Dispatch<React.SetStateAction<boolean>> }) {
  const emptyState = () => {
    const subjectsName = subjects.map((subject) => subject.name)
    const values = Array(subjects.length).fill(false)
    const state: Record<string, boolean> = Object.fromEntries(subjectsName.map((subject, index) => [subject, values[index]]))
    return state
  }

  const [isChecked, setIsChecked] = useState(() => {
    let state = emptyState()
    return state
  });

  useEffect(() => {
    if (!isChecked) return
    setDisabled(Object.values(isChecked).every((value) => value === false))

  }, [isChecked, setDisabled])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, target: string) => {
    const { checked } = e.target;
    setIsChecked((prevState: Record<string, boolean>) => {
      let state = emptyState()
      state[target] = checked;
      return state;
    });
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>, target: string) => {
    if (isChecked[target]) {
      setIsChecked(() => {
        let state = emptyState()
        return state
      });
    }
  };

  return (
    <>
      {subjects.map((subject, index) => {
        return <div key={subject.id} className="flex items-center">
          <input
            type="radio"
            id={subject.id}
            className="hidden peer"
            onChange={(event) => handleChange(event, subject.name)}
            value={subject.id}
            onClick={(event) => handleClick(event, subject.name)}
            checked={isChecked[subject.name]}
            name="subjectid"
          />
          <label htmlFor={subject.id}>
            <div
              style={{
                background: `linear-gradient(to right, ${subject?.bgcolor}, white)`,
                borderColor: subject.bordercolor,
                color: subject.color,
                borderRadius: "4px",
              }}
              className={
                `max-w-[170px] cursor-pointer flex items-center gap-2 border-[2px] text-xs font-medium mr-2 px-1.5 py-1`}
            >
              <p className="overflow-hidden truncate w-[">{subject.name}</p>
              {isChecked[subject.name] && (
                <div className="min-w-[8px]">
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.52539 6.47487L6.47514 1.52512M6.47514 6.47487L1.52539 1.52512"
                      stroke="#6B7280"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </div>
              )}
            </div>
          </label>
        </div>
      })}
    </>
  );
}