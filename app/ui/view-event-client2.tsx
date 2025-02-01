'use client'

import { useEffect, useState } from "react"
import { Event } from "@/app/lib/definitions"
import { dateToString, SCOPES } from "../lib/utils"
import { useRouter } from 'next/navigation'
import SubjectTag from "./subject-tag2"
import Timer from "./timer"
import type { RemainingTime, Subject, PrimitiveSubject, User } from "../lib/definitions"
import { useFormState, useFormStatus } from "react-dom"
import { deleteEvent } from "../lib/actions"
import { useEvents } from "../lib/use-events"
import { mutate } from "swr"
import { useUser } from "../lib/use-user"
import { useSubjects } from "../lib/use-subjects"

export default function ViewEventClient({ id }: { id: string | undefined }) {

  const removeEvent = async (_currentState: unknown, formData: FormData) => {
    mutate(process.env.BASE_URL as string + "/api/events", await deleteEvent(formData))
    return 'Event deleted'
  }

  const [state, dispatch] = useFormState(removeEvent, undefined)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const { events, error, isLoading } = useEvents()
  const { subjects, error: subjectsError, isLoading: subjectsLoading } = useSubjects();
  const { user, error: userError, isLoading: userLoading } = useUser();

  const event = events?.find((event) => event.id === id)

  useEffect(() => {
    if (state === 'Event deleted') {
      router.back();
    } else if (state === 'Failed to delete event') {
      setErrorMessage('No se pudo eliminar el evento');
    }
  }, [state, setErrorMessage, router]);


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

      setRemainingTime ({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
      })
    }
  }, [event])

  
  if (!event) return null
  if (!subjects) return null
  if (!user) return null
  return (
    <form action={dispatch} id="modalBox-3" className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-[90%] h-fit lg:w-fit max-h-screen flex justify-center items-center z-[1000] overflow-x-hidden overflow-y-auto">
      <input type="hidden" name="id" value={event.id} />
      <div className="flex flex-col gap-5 w-fit md:h-auto bg-white p-6">
        <div className="flex flex-col lg:flex-row justify-center items-center lg:gap-1">
          <h4 className="text-lg font-bold leading-8 text-gray-900 text-center">Información de evento</h4>
          <h4 className="text-lg font-bold leading-8 text-gray-900 text-center">{`(Evento ${SCOPES[event.scope]})`}</h4>
        </div>
      <div className="flex flex-col px-3 py-10 min-h-[100px] overflow-y-auto gap-[30px]">
        <div className="flex flex-col md:flex-row justify-between min-h-[100px] gap-[80px]">
          <div className="flex flex-col max-w-[100%] gap-1">
            <div className="flex items-center gap-[20px]">
              <p className=" text-black font-semibold w-[150px] "> {event.name} </p>
              <SubjectTag subject={subjects?.find((subject: Subject) => subject.id === event.subjectid) } />
            </div>
            <div className="text-gray-600 text-sm mt-2 w-[250px] bg-[#f4f4ff] rounded-lg p-2">{event.description}</div>
          </div>
          <div className="flex flex-col justify-start">
            <p className=" text-gray-600 font-semibold">Fecha del evento</p>
            <p className=" text-sm">{dateToString(event.date)  + (event.time ? (' a las ' + event.time) : '')}</p>
          </div>
        </div>
        <div className="w-full" />
        {
          remainingTime?.days > 0 || remainingTime?.hours > 0 || remainingTime?.minutes > 0
            ? <Timer remainingTime={remainingTime} />
            : <Timer remainingTime={{ days: 0, hours: 0, minutes: 0 }} />
        }
      </div>
      <div className="flex items-center justify-end gap-4">
        <DeleteButton  event={event} user={user}/>
        <button type="button" aria-disabled={!(user.role === 'dev' || user.id === event.userid)} onClick={() => router.push(`/gemif/calendar/edit-event/${event.id}`)} className={`${!(user.role === 'dev' || user.id === event.userid) ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700`}>Editar</button>

        
      </div>
    </div>
  </form>
  )
}

function DeleteButton({ event, user }: { event: Event, user: User }) {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button aria-disabled={!(user.role === 'dev' || user.id === event.userid) || pending} type="submit" onClick={handleClick} className={`${!(user.role === 'dev' || user.id === event.userid) ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-red-700`}>
      Eliminar
    </button>
  )
}