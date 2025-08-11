'use client'

import { useEffect, useState } from "react"
import { Event } from "@/app/lib/definitions"
import { dateToString, SCOPES } from "../lib/utils"
import { useRouter } from 'next/navigation'
import SubjectTag from "./subject-tag"
import Timer from "./timer"
import type { RemainingTime, Subject, User } from "../lib/definitions"
import { useFormState, useFormStatus } from "react-dom"
import { deleteEvent } from "../lib/actions/events/actions"
import { useEvents } from "../lib/use-events"
import { mutate } from "swr"
import { useUser } from "../lib/use-user"
import { useSubjects } from "../lib/use-subjects"
import { CircleAlert } from "lucide-react"
import ErrorPage from "./error"
import Loader from "./loader"

export default function ViewEventClient({ id }: { id: string | undefined }) {
  const removeEvent = async (_currentState: unknown, formData: FormData) => {
    const result = await deleteEvent(formData);
    if (!result.error && result.data)
      mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/events", result.data)
    return result
  }

  const [state, dispatch] = useFormState(removeEvent, undefined)
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] }>()
  const router = useRouter()
  const { events, error, isLoading } = useEvents()
  const { subjects, error: subjectsError, isLoading: subjectsLoading } = useSubjects();
  const { user, error: userError, isLoading: userLoading } = useUser();
  const event = events?.find((event) => event.id === id)

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

  const [remainingTime, setRemainingTime] = useState<RemainingTime>({ days: 0, hours: 0, minutes: 0 })

  useEffect(() => {
    if (!event) {
      setRemainingTime({ days: 0, hours: 0, minutes: 0 })
    }
    else {
      const now = new Date()
      let eventDate = new Date(event.date)

      if (event.time) {
        eventDate.setHours(parseInt(event.time.split(':')[0]), parseInt(event.time.split(':')[1]), 0)
      }
      const diff = eventDate.getTime() - now.getTime()

      setRemainingTime({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
      })
    }
  }, [event])

  if (error || subjectsError || userError) return <ErrorPage error={error?.message || subjectsError?.message || userError?.message} />

  return (
    <form action={dispatch} id="modalBox-3"
      className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-full max-w-3xl h-[90vh] flex flex-col bg-white rounded-xl shadow-xl overflow-hidden">
      

      <div className="p-4 border-b border-gray-200 shrink-0">
        <div className="flex flex-col lg:flex-row justify-center items-center gap-1 text-center">
          <h4 className="text-lg font-bold text-gray-900">Información de evento</h4>
          <h4 className="text-lg font-bold text-gray-900">{`(Evento ${SCOPES[event?.scope ?? '']})`}</h4>
        </div>
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
        {
          isLoading || subjectsLoading || userLoading ? (
            <div className="flex justify-center items-center w-full min-h-[4rem]">
              <div className="w-[40px] h-[30px]">
                <Loader />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 gap-10">
              {
                !user ? (<p className="text-lg font-bold text-gray-900 text-center">No se ha encontrado el usuario</p>)
              : !subjects ? (<p className="text-lg font-bold text-gray-900 text-center">No se han encontrado las asignaturas</p>)
              : !event ? (<p className="text-lg font-bold text-gray-900 text-center">No se ha encontrado el evento</p>)
              : 
              <>
                <input type="hidden" name="id" value={event?.id} />
                <div className="flex flex-col md:flex-row justify-around gap-8 w-full">
                  {/* Left Column: Name + Description */}
                  <div className="flex flex-col gap-3 w-full md:max-w-[45%]">
                    <p className="text-black font-semibold text-base">{event?.name}</p>
                    {event?.description && (
                      <div className="text-gray-600 text-sm bg-[#f4f4ff] rounded-lg p-3">
                        {event.description}
                      </div>
                    )}
                  </div>
        
                  {/* Right Column: Subject + Date */}
                  <div className="flex flex-col gap-3 w-full md:max-w-[45%]">
                    {event && (
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-700">Asignatura:</p>
                        <SubjectTag subject={subjects?.find((subject: Subject) => subject.id === event.subjectid)} />
                      </div>
                    )}
        
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-slate-700">Fecha del evento:</p>
                      <p className="text-sm">
                        {dateToString(event?.date ?? '')}
                        {event?.time ? ` a las ${event.time}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
        
        
                {remainingTime?.days > 0 || remainingTime?.hours > 0 || remainingTime?.minutes > 0
                  ? <Timer remainingTime={remainingTime} />
                  : <Timer remainingTime={{ days: 0, hours: 0, minutes: 0 }} />}
              </>
              }
            </div>
          )
        }

      <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
        <DeleteButton disabled={!event || isLoading || !user || userLoading || !subjects || subjectsLoading || user?.id !== event?.userid} />
        <button
          type="button"
          disabled={!event || isLoading || !user || userLoading || !subjects || subjectsLoading || user?.id !== event?.userid}
          onClick={() => router.push(`/gemif/calendar/edit-event/${event?.id}`)}
          className={`${!event || isLoading || !user || userLoading || !subjects || subjectsLoading || user?.id !== event?.userid
            ? 'pointer-events-none opacity-30'
            : 'hover:bg-[#3A7BC4]'} w-full text-center p-1.5 py-2 rounded-md bg-[#2C5AA0] text-white text-xs font-medium close-modal-button transition-all duration-300`}>
          Editar
        </button>
      </div>
    </form>
  )
}

function DeleteButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button
      disabled={disabled || pending}
      type="submit"
      onClick={handleClick}
      className={`${disabled || pending
        ? 'pointer-events-none opacity-30'
        : 'hover:bg-red-700'} w-full text-center p-1.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium close-modal-button transition-all duration-300`}>
      {pending ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}



// 'use client'

// import { useEffect, useState } from "react"
// import { Event } from "@/app/lib/definitions"
// import { dateToString, SCOPES } from "../lib/utils"
// import { useRouter } from 'next/navigation'
// import SubjectTag from "./subject-tag"
// import Timer from "./timer"
// import type { RemainingTime, Subject, User } from "../lib/definitions"
// import { useFormState, useFormStatus } from "react-dom"
// import { deleteEvent } from "../lib/actions/events/actions"
// import { useEvents } from "../lib/use-events"
// import { mutate } from "swr"
// import { useUser } from "../lib/use-user"
// import { useSubjects } from "../lib/use-subjects"
// import { CircleAlert } from "lucide-react"
// import ErrorPage from "./error"

// export default function ViewEventClient({ id }: { id: string | undefined }) {
//   const removeEvent = async (_currentState: unknown, formData: FormData) => {
//     const result = await deleteEvent(formData);
//     if (!result.data && result.error) return { data: null, error: result.error, errorCode: result.errorCode, details: result.details }
//       mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/events", result.data)
//     return result
//   }

//   const [state, dispatch] = useFormState(removeEvent, undefined)
//   const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details?: string[] }>()
//   const router = useRouter()
//   const { events, error, isLoading } = useEvents()
//   const { subjects, error: subjectsError, isLoading: subjectsLoading } = useSubjects();
//   const { user, error: userError, isLoading: userLoading } = useUser();
//   const event = events?.find((event) => event.id === id)

//   useEffect(() => {
//     if (state?.data) {
//       router.back();
//     } else if (state?.error === 'Error de formato') {
//       setErrorMessage({ error: state.error, errorCode: state.errorCode ?? 'UNKNOWN_ERROR', details: state.details });
//     } else if (!state?.data && state?.error) {
//       setErrorMessage({ error: state.error ?? 'UNKNOWN_ERROR', errorCode: state.errorCode ?? 'UNKNOWN_ERROR', details: state.details });
//     }
//   }, [state, router, setErrorMessage]);

//   const [remainingTime, setRemainingTime] = useState<RemainingTime>({ days: 0, hours: 0, minutes: 0 })

//   useEffect(() => {
//     if (!event) {
//       setRemainingTime({ days: 0, hours: 0, minutes: 0 })
//     }
//     else {
//       const now = new Date()
//       let eventDate = new Date(event.date)

//       if (event.time) {
//         eventDate.setHours(parseInt(event.time.split(':')[0]), parseInt(event.time.split(':')[1]), 0)
//       }
//       const diff = eventDate.getTime() - now.getTime()

//       setRemainingTime({
//         days: Math.floor(diff / (1000 * 60 * 60 * 24)),
//         hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
//         minutes: Math.floor((diff / (1000 * 60)) % 60),
//       })
//     }
//   }, [event])

//   if (error || subjectsError || userError) return <ErrorPage error={error?.message || subjectsError?.message || userError?.message} />

//   return (
//     <form action={dispatch} id="modalBox-3"
//       className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-full max-w-3xl h-[90vh] flex flex-col bg-white rounded-xl shadow-xl overflow-hidden">
      
//       <input type="hidden" name="id" value={event?.id} />

//       <div className="p-4 border-b border-gray-200 shrink-0">
//         <div className="flex flex-col lg:flex-row justify-center items-center gap-1 text-center">
//           <h4 className="text-lg font-bold text-gray-900">Información de evento</h4>
//           <h4 className="text-lg font-bold text-gray-900">{`(Evento ${SCOPES[event?.scope ?? '']})`}</h4>
//         </div>
//       </div>

//       {errorMessage && (
//         <div className="p-4 bg-red-100 text-red-700 text-sm shrink-0 border-b border-red-300">
//           <div className="flex items-start gap-2">
//             <CircleAlert className="min-w-[20px] h-5 w-5 mt-[2px]" />
//             <div className="mt-[2px]">
//               <strong className="block mb-1">{errorMessage.errorCode + ': ' + errorMessage.error}</strong>
//               {errorMessage.details && errorMessage.details.map((detail: string, idx: number) => (
//                 <p key={idx + detail}>• {detail}</p>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 gap-10">
//         <div className="flex flex-col md:flex-row justify-around gap-12 w-full">
//           {/* Left Column: Name + Description */}
//           <div className="flex flex-col gap-3 w-full md:max-w-[45%]">
//             <p className="text-black font-semibold text-base">{event?.name}</p>
//             {event?.description && (
//               <div className="text-gray-600 text-sm bg-[#f4f4ff] rounded-lg p-3">
//                 {event.description}
//               </div>
//             )}
//           </div>

//           {/* Right Column: Subject + Date */}
//           <div className="flex flex-col gap-3 w-full md:max-w-[45%]">
//             {event && (
//               <div className="flex items-center gap-2">
//                 <p className="text-sm font-medium text-slate-700">Asignatura:</p>
//                 <SubjectTag subject={subjects?.find((subject: Subject) => subject.id === event.subjectid)} />
//               </div>
//             )}

//             <div className="flex flex-col gap-1">
//               <p className="text-sm font-medium text-slate-700">Fecha del evento:</p>
//               <p className="text-sm">
//                 {dateToString(event?.date ?? '')}
//                 {event?.time ? ` a las ${event.time}` : ''}
//               </p>
//             </div>
//           </div>
//         </div>


//         {remainingTime?.days > 0 || remainingTime?.hours > 0 || remainingTime?.minutes > 0
//           ? <Timer remainingTime={remainingTime} />
//           : <Timer remainingTime={{ days: 0, hours: 0, minutes: 0 }} />}
//       </div>

//       <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
//         <DeleteButton disabled={!event || !user || !(user?.role === 'dev' || user?.id === event?.userid)} />
//         <button
//           type="button"
//           disabled={!event || !user || !(user?.role === 'dev' || user?.id === event?.userid)}
//           onClick={() => router.push(`/gemif/calendar/edit-event/${event?.id}`)}
//           className={`${!event || !user || !(user?.role === 'dev' || user?.id === event?.userid)
//             ? 'pointer-events-none opacity-30'
//             : 'hover:bg-[#3A7BC4]'} w-full text-center p-1.5 py-2 rounded-md bg-[#2C5AA0] text-white text-xs font-medium close-modal-button transition-all duration-300`}>
//           Editar
//         </button>
//       </div>
//     </form>
//   )
// }

// function DeleteButton({ disabled }: { disabled: boolean }) {
//   const { pending } = useFormStatus()

//   const handleClick = (event: React.MouseEvent<HTMLElement>) => {
//     if (pending) {
//       event.preventDefault()
//     }
//   }

//   return (
//     <button
//       disabled={disabled || pending}
//       type="submit"
//       onClick={handleClick}
//       className={`${disabled || pending
//         ? 'pointer-events-none opacity-30'
//         : 'hover:bg-red-700'} w-full text-center p-1.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium close-modal-button transition-all duration-300`}>
//       {pending ? 'Eliminando...' : 'Eliminar'}
//     </button>
//   )
// }

