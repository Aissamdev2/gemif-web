'use client';

import {  useContext } from 'react';
import { getCalendarDates, compareDates, SUBJECTS_COLORS_OBJ, SUBJECTS_BG_COLORS_OBJ, SUBJECTS_BORDER_COLORS_OBJ } from '@/app/lib/utils';
import { Event } from '../lib/definitions';
import { DateContext } from '../lib/date-context';
import Link from 'next/link';
import { useEvents } from '../lib/use-events';
import CalendarSkeleton from './calendar-skeleton';
import clsx from 'clsx';
import { useUser } from '../lib/use-user';
import { useSubjects } from '../lib/use-subjects';


type Props = {
  events: Event[];
};

export default function CalendarClient() {
  const { date, month, year } = useContext(DateContext);
  const { events, error, isLoading } = useEvents()
  const { user, isLoading: isLoadingUser } = useUser()
  const { subjects, error: subjectsError, isLoading: subjectsLoading } = useSubjects()
  
  if (isLoading || isLoadingUser || subjectsLoading) {
    return (
      <CalendarSkeleton />
    )
  }

  if (!user || !subjects) {
    return null
  }
  return (
    <>
      {
        getCalendarDates(year, month).map((item) => {
          const eventsInDate = events?.filter((event) => {
            return compareDates(new Date(event.date), item.date);
          }) ?? [];
          return (
            <div key={item.date.toDateString() } className={`group overflow-hidden max-h-[110px] md:max-h-[87px] flex flex-col md:flex-row transition-[border-color] duration-300 bg-[#ffffff] border-[1px] border-[#a19aff6b] hover:border-[#5551FF] ${item.isCurrentMonth ? '' : 'opacity-60 bg-[#dedede]'} ${item.isToday ? 'border-[2px]' : ''}`}>
              <div className='flex justify-center md:flex-col md:justify-between md:items-center w-full md:w-[30px]'>
                <div className={`transition-[background-color,border-color,text] duration-300 md:w-[30px] text-center px-[4px] md:px-0 md:border-r md:border-b md:py-[1px] rounded-full md:rounded-none md:rounded-br-[10px] border-[#a19affb1] hover:border-[#5551FF] md:basis-4 ${item.date.getDay() === 0 || item.date.getDay() === 6 ? 'text-red-500' : ''} ${item.isToday ? 'bg-[#b3b3ff] group-hover:text-[#ffffff]' : 'group-hover:text-[#5551FF]'} `}>{item.date.getDate()}</div>
                {
                  eventsInDate?.length > 4 && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 hidden md:block animate-bounce">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>

                  )
                }
              </div>
              <div className="flex-grow h-full overflow-hidden p-[2px] flex flex-col">
              {
                eventsInDate?.length > 0 && eventsInDate?.map((event, index) =>  {
                  const subject = subjects.find((subject) => subject.id === event.subjectid)
                  return <Link key={event.id} href={`/gemif/calendar/view-event/${event.id}`}
                  style={{ backgroundColor: subject?.bgcolor, borderColor: subject?.bordercolor, color: subject?.color }}
                  className={`h-[16.6px] w-full max-w-full font-bold truncate py-[0px] px-[4px] rounded border-[1px] text-[10px] hover:cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap`}>{event.name}</Link>
                })
              }
              </div>
            </div>
          );
        })
      }
    </>
  );
}


