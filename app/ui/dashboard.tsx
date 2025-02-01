import { Event, Subject, PrimitiveSubject } from "../lib/definitions"
import { dateToString } from "../lib/utils";
import DashboardSkeleton from "./dashboard-skeleton";
import Link from "next/link";

export default function Dashboard({events, subjects}:{ events: Event[] | undefined, subjects: Subject[] | undefined}) {

  if (!subjects || !events ) {
    return <DashboardSkeleton />
  }

  const weekMili = 1000*60*60*24*7;
  const nearEvents = events.filter((event) => {
    const now = new Date()
    const date = new Date(event.date)
    date.setHours(Number(event.time?.split(":")[0]), Number(event.time?.split(":")[1]), 0, 0)
    const diff = date.getTime() - now.getTime()
    return (diff >= 0) && (diff < weekMili)
  })

  const sortedEvents = nearEvents.sort((a, b) => {
    const dateA = new Date(a.date)
    dateA.setHours(Number(a.time?.split(":")[0]), Number(a.time?.split(":")[1]), 0, 0)
    const dateB = new Date(b.date)
    dateB.setHours(Number(b.time?.split(":")[0]), Number(b.time?.split(":")[1]), 0, 0)
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <div className="flex flex-col gap-5 lg:w-[350px] bg-white p-2 rounded-2xl rounded-tl-none max-h-full overflow-hidden lg:max-w-[350px] shrink-0 ">
        <h2 className="text-3xl font-extrabold tracking-tight text-black leading-tight md:text-3xl">
          Próximos Eventos
        </h2>
        {
          nearEvents.length !== 0 ?
          <div className="flex gap-5 flex-col p-0 py-1 overflow-scroll scrollbar-hidden">
          {
            sortedEvents.map((event, index) => {
              const subject = subjects?.find((subject) => subject.primitiveid === event.primitiveid)
              return (
                <Link href={`/gemif/calendar/view-event/${event.id}`} key={event.id} className="p-3 truncate grow-0 border border-[#e8dbff] shadow-[0px_3px_6px_#0000001a] shrink-0 rounded-xl bg-white hover:bg-[#f8f5fd] transition-[background-color] duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span 
                      title={subject?.name}
                      style={{ backgroundColor: subject?.bordercolor, borderColor: subject?.bordercolor, color: subject?.color }}
                      className="w-2.5 h-2.5 rounded-full "></span>
                      <p className="font-medium text-sm text-gray-900">{dateToString(event.date)  + (event.time ? (' a las ' + event.time) : '')}</p>
                    </div>
                    
                  </div>
                  <h6 className="text-xl leading-8 font-semibold text-black mb-1 truncate">{event.name}</h6>
                  <p className="text-base font-normal text-gray-600 truncate">{event.description}</p>
                </Link>
              )
            })
          }
        </div>
        :
        <p className="text-base font-normal text-gray-600">No hay eventos próximos</p>
      }
    </div>
  )
}