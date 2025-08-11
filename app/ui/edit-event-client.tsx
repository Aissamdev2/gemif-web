'use client'

import { useEffect, useState } from "react";
import { Event, Subject } from "../lib/definitions";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { updateEvent } from "../lib/actions/events/actions";
import { useUser } from "../lib/use-user";
import { useSubjects } from "../lib/use-subjects";
import { mutate } from "swr";
import { CircleAlert } from "lucide-react";
import ErrorPage from "./error";
import { useEvents } from "../lib/use-events";
import Loader from "./loader";

export default function EditEventClient({ id }: { id: string }) {

  const changeEvent = async (_currentState: unknown, formData: FormData) => {
    const subjectid = formData.get('subjectid')
    if (!subjects) return { data: null, error: 'No se pudieron cargar las asignaturas', errorCode: 'MISSING_FIELDS', details: [] };
    const eventSubject = subjects.find(subject => subject.id === subjectid)
    formData.append('primitiveid', eventSubject?.primitiveid as string);
    formData.append('scope', scope);

    const result = await updateEvent(formData)
    if (!result.error && result.data) 
      await mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/events", result.data)

    return result;
  }

  const [state, dispatch] = useFormState(changeEvent, undefined)
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] }>()
  const [scope, setScope] = useState('')
  const router = useRouter()
  const { subjects, error, isLoading } = useSubjects()
  const { events, error: eventsError, isLoading: eventsLoading } = useEvents()
  const { user, error: userError, isLoading: userLoading } = useUser();

  const event = events?.find(event => event.id === id)

  useEffect(() => {
    if (event) {
      setScope(event.scope)
    }
  }, [event, setScope])


  useEffect(() => {
    if (state?.data) {
      router.back();
    } else if (state?.error) {
      setErrorMessage({
        error: state.error,
        errorCode: state.errorCode ?? 'UNKNOWN_ERROR',
        details: state.details,
      });
    }
  }, [state, router, setErrorMessage]);


  const handleScopeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setScope(event.target.value)
  }


  if (error || userError || eventsError) return <ErrorPage error={error?.message || userError?.message || eventsError?.message} />;

      return (                                            
        <form action={dispatch} id="modalBox-3"
          className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-full max-w-3xl h-[90vh] flex flex-col bg-white rounded-xl shadow-xl overflow-hidden">
          {
            event &&
              <input type="hidden" name="id" value={event?.id} />
          }
          <div className="p-4 border-b border-gray-200 shrink-0">
            <h4 className="text-lg font-bold text-gray-900 text-center">Editar evento</h4>
          </div>
          {errorMessage && (
            <div className="p-4 bg-red-100 text-red-700 text-sm shrink-0 border-b border-red-300 overflow-auto max-w-full break-words">
              <div className="flex items-start gap-2">
                <CircleAlert className="min-w-[20px] h-5 w-5 mt-[2px]" />
                <div className="mt-[2px] text-left break-words">
                  <strong className="block mb-1 break-words">
                    {errorMessage.errorCode + ': ' + errorMessage.error}
                  </strong>
                  {errorMessage.details && errorMessage.details.length > 0 &&
                    errorMessage.details.map((detail: { name: string; success: boolean, error?: string | null }, idx: number) => (
                      <p key={idx + detail.name} className="break-words">• {`${detail.name}: ${detail.error || 'Sin errores'}`}</p>
                    ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-6">
            {
              isLoading || userLoading || eventsLoading ? (
                <div className="flex justify-center items-center w-full min-h-[4rem]">
                  <div className="w-[40px] h-[30px]">
                    <Loader />
                  </div>
                </div>
              ) : !user ? (<p className="text-lg font-bold text-gray-900 text-center">No se ha encontrado el usuario</p>)
                  : !subjects ? (<p className="text-lg font-bold text-gray-900 text-center">No se han encontrado las asignaturas</p>)
                  : !event ? (<p className="text-lg font-bold text-gray-900 text-center">No se ha encontrado el evento</p>)
                  : 
              <div className="flex flex-col md:flex-row justify-around gap-8 w-full">
                <div className="flex flex-col gap-8">
                  <div className="relative">
                    <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Título<span className='text-red-500'>*</span></label>
                    <input type="text" name="name"
                      className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
                      placeholder="Añade un titulo"  defaultValue={event ? event.name : 'Cargando...'}/>
                  </div>
                  <div className="relative">
                    <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Descripción</label>
                    <textarea  name="description"
                      className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
                      placeholder="Escribe una descripción..." defaultValue={event ? event.description : 'Cargando...'}></textarea>
                  </div>
                </div>
                <div className="flex flex-col gap-8">
                  <div className="relative">
                    <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Fecha del evento<span className='text-red-500'>*</span></label>
                    <input type="date" name="date"
                      className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
                      defaultValue={event ? new Date(event.date).toLocaleDateString().split('/').map((date) => date.padStart(2, '0')).reverse().join('-') : new Date().toLocaleDateString().split('/').map((date) => date.padStart(2, '0')).reverse().join('-')}/>
                  </div>
                  <div className="relative">
                    <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Hora del evento<span className='text-red-500'>*</span></label>
                    <input type="time" name="time"
                      defaultValue={event ? event.time : ''}
                      className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition" />
                  </div>
                  {
                    user &&user.role === 'user' && (
                      <input type="hidden" name="scope" value="user" />
                    )
                  }
                  {
                    user && user.role === 'admin' && (
                      <div className="flex flex-col">
                        <label htmlFor="options" className=" mb-2 text-sm font-medium text-gray-600 w-full">Visibilidad<span className='text-red-500'>*</span></label>
                        <select 
                        id="options"
                        name="scope"
                        value={scope}
                        onChange={handleScopeChange}
                        className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition">
                          <option value="user">Individual</option>
                          <option value="admin">Clase</option>
                        </select>
                      </div>
                    )
                  }
                  {
                    user && user.role === 'dev' && (
                      <div className="flex flex-col">
                      <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Visibilidad<span className='text-red-500'>*</span></label>
                        <select 
                        id="options"
                        name="scope"
                        value={scope}
                        onChange={handleScopeChange}
                        className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition">
                          <option value="user">Individual</option>
                          <option value="admin">Clase</option>
                          <option value="dev">Global</option>
                        </select>
                      </div>
                    )
                  }
                </div>
                <div className="flex flex-col gap-1">
                  <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Asignatura<span className='text-red-500'>*</span></label>
                  { subjects && event &&
                    <SubjectRadios subjects={subjects.filter((subject) => subject.archived === false)} event={event}/>
                  }
                </div>
              </div>
            }
          </div>
          
          <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
            <button onClick={() => router.back()} type="button" className="w-full text-center p-1.5 py-2 rounded-md bg-white text-black text-xs font-medium transition-all duration-300 border hover:border-gray-400"  data-pd-overlay="#modalBox-3" data-modal-target="modalBox-3">Cancel</button>
            <EditButton disabled={!event || eventsLoading || !subjects || isLoading || !user || userLoading || user?.id !== event?.userid} />
          </div>
        </form>
      )
  }
  
  function EditButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus()
  
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      if (pending) {
        event.preventDefault()
      }
    }
  
    return (
      <button disabled={disabled || pending} type="submit" onClick={handleClick} className={`${disabled || pending ? 'pointer-events-none opacity-30' : 'opacity-100'} w-full text-center p-1.5 py-2 rounded-md bg-[#2C5AA0] text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]`}>
        {pending ? 'Cargando...' : 'Editar'}
      </button>
    )
  }
  
  function SubjectRadios({ subjects, event }: { subjects: Subject[], event: Event }) {
    const emptyState = () => {
      const subjectsName = subjects.map((subject) => subject.name)
      const values = subjects.map((subject) => false)
      const state: Record<string, boolean> = Object.fromEntries(subjectsName.map((subject, index) => [subject, values[index]]))
      return state
    }
    const initialState = () => {
      const subjectsName = subjects.map((subject) => subject.name)
      const values = subjects.map((subject) => subject.primitiveid === '00000000' ? true : false)
      const state: Record<string, boolean> = Object.fromEntries(subjectsName.map((subject, index) => [subject, values[index]]))
      return state
    }
    
  
    const [isChecked, setIsChecked] = useState(() => {
    let state = emptyState()
    state[subjects.find((subject) => subject.id === event.subjectid)!.name] = true
    return state
  });
  
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
          let state = initialState()
          return state
        });
      }
    };
  
    return (
      <>
        {subjects.filter((subjects) => subjects.archived === false).map((subject, index) => {
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
                // style={{
                //   background: `linear-gradient(to right, ${subject?.bgcolor}, white)`,
                //   borderColor: subject.bordercolor,
                //   color: subject.color,
                //   borderRadius: "4px",
                // }}
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


