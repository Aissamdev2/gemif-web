// 'use client'

// import { useEffect, useState } from "react"
// import { Event } from "@/app/lib/definitions"
// import { dateToString } from "../lib/utils"
// import { useRouter } from 'next/navigation'
// import SubjectTag from "./subject-tag"
// import Timer from "./timer"
// import type { RemainingTime, Subject } from "../lib/definitions"
// import { useFormState, useFormStatus } from "react-dom"
// import { deleteEvent } from "../lib/actions"
// import { useEvents } from "../lib/use-events"
// import ViewEventSkeleton from "./view-event-skeleton"
// import { mutate } from "swr"
// import { useUser } from "../lib/use-user"
// import { useSubjects } from "../lib/use-subjects"

// export default function ViewEventClient({ id }: { id: string | undefined }) {

//   const removeEvent = async (_currentState: unknown, formData: FormData) => {
//     mutate(process.env.BASE_URL as string + "/api/events", await deleteEvent(formData))
//     return 'Event deleted'
//   }

//   const [state, dispatch] = useFormState(removeEvent, undefined)
//   const [errorMessage, setErrorMessage] = useState('')
//   const router = useRouter()
//   const { events, error, isLoading } = useEvents()
//   const { subjects, error: subjectsError, isLoading: subjectsLoading } = useSubjects();

//   const event = events?.find((event) => event.id === id)

//   useEffect(() => {
//     if (state === 'Event deleted') {
//       router.back();
//     } else if (state === 'Failed to delete event') {
//       setErrorMessage('No se pudo eliminar el evento');
//     }
//   }, [state, setErrorMessage, router]);


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

//       setRemainingTime ({
//         days: Math.floor(diff / (1000 * 60 * 60 * 24)),
//         hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
//         minutes: Math.floor((diff / (1000 * 60)) % 60),
//       })
//     }
//   }, [event])

  
//   if (isLoading) return <ViewEventSkeleton />
//   if (!event) return null
//   if (!subjects) return null
//   return (
//     <form action={dispatch} className="md:w-full md:h-full fixed top-[100px] left-0 z-[60] overflow-x-hidden overflow-y-auto">
//       <input type="hidden" name="id" value={event.id} />
//       <div className="lg:max-w-3xl lg:w-full m-3 lg:mx-auto">
//         <div className="flex flex-col bg-white rounded-2xl border-[3px] py-4 px-5">
//           <div className="flex justify-between items-center pb-4 border-b border-gray-200">
//             <h4 className="text-sm text-gray-900 font-medium">Información del evento</h4>
//             <button className="block cursor-pointer" type="button" onClick={() => router.back()} >
//               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path d="M7.75732 7.75739L16.2426 16.2427M16.2426 7.75739L7.75732 16.2427" stroke="black" strokeWidth="1.6" strokeLinecap="round"></path>
//               </svg>
//             </button>
//           </div>
//           <div className="flex flex-col px-3 py-10 min-h-[100px] overflow-y-auto gap-[30px]">
//             <div className="flex flex-col md:flex-row justify-between min-h-[100px] gap-[30px]">
//               <div className="flex flex-col max-w-[100%] gap-1">
//                 <div className="flex items-center gap-[20px]">
//                   <p className=" text-black font-semibold w-fit text-nowrap"> {event.name} </p>
//                   <SubjectTag subject={subjects?.find((subject: Subject) => subject.id === event.subjectid) } />
//                 </div>
//                 <div className="text-gray-600 text-sm mt-2 bg-[#f3f3f3] rounded-lg p-2">{event.description}</div>
//               </div>
//               <div className="flex flex-col justify-start">
//                 <p className=" text-gray-600 font-semibold">Fecha del evento</p>
//                 <p className=" text-sm">{dateToString(event.date)  + (event.time ? (' a las ' + event.time) : '')}</p>
//               </div>
//             </div>
//             <div className="w-full border-b border-gray-200" />
//             {
//               remainingTime?.days > 0 || remainingTime?.hours > 0 || remainingTime?.minutes > 0
//                 ? <Timer remainingTime={remainingTime} />
//                 : <Timer remainingTime={{ days: 0, hours: 0, minutes: 0 }} />
//             }
//           </div>
//           <div className="flex items-center justify-end pt-4 border-t border-gray-200 space-x-4">
//             <DeleteButton />
//             <button type="button" onClick={() => router.push(`/gemif/calendar/edit-event/${event.id}`)} className="py-2.5 px-5 text-xs  bg-indigo-500 text-white rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 hover:bg-indigo-700 close-modal-button">Editar</button>
//           </div>
//         </div>
//       </div>
//     </form>
//   )
// }

// function DeleteButton() {
//   const { pending } = useFormStatus()

//   const handleClick = (event: React.MouseEvent<HTMLElement>) => {
//     if (pending) {
//       event.preventDefault()
//     }
//   }

//   return (
//     <button aria-disabled={pending} type="submit" onClick={handleClick} className="py-2.5 px-5 text-xs bg-red-500 text-white rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 hover:bg-red-700">
//       Eliminar
//     </button>
//   )
// }