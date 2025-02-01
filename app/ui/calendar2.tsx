/*

'use client'

import CalendarEvents from "./calendar-events";
import CalendarHeader from "@/app/ui/calendar-header2";
import { compareDates, DAYS_SHORT, getCalendarDates } from "../lib/utils";
import { DateContext, DateProvider } from "../lib/date-context";
import AddEventButton from "./add-event-button";
import { Suspense, useContext, useState } from "react";
import CalendarSkeleton from "@/app/ui/calendar-skeleton";
import CalendarClient from "./calendar-client2";
import { useEvents } from "../lib/use-events";
import { useSubjects } from "../lib/use-subjects";
import Dashboard from "./dashboard";

export default function Calendar() {
  const {year, month} = useContext(DateContext);
  const { events, error, isLoading } = useEvents()
  const { subjects, error: subjectsError, isLoading: subjectsLoading } = useSubjects()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const eventsInDate = selectedDate ? events?.filter((event) => {
    return compareDates(new Date(event.date), selectedDate);
  }) : [];

  console.log(selectedDate)

  return (
      <DateProvider>
        <section className="relative h-full w-full bg-stone-50">
        <div className="bg-sky-400 w-full sm:w-40 h-40 rounded-full absolute top-1 opacity-30 max-sm:right-0 sm:left-56 z-0"></div>
        <div className="bg-emerald-500 w-full sm:w-40 h-24 absolute top-0 -left-0 opacity-30 z-0"></div>
        <div className="bg-purple-600 w-full sm:w-40 h-24 absolute top-40 -left-0 opacity-30 z-0"></div>
        <div className="w-full h-full absolute z-10 backdrop-blur-3xl">
          <div className="w-full lg:max-h-screen max-w-7xl mx-auto px-2 lg:px-8">
            <div className="flex flex-col pt-[20%] lg:pt-[5%] min-h-0 gap-8 max-w-4xl mx-auto xl:max-w-full xl:flex-row">
              <div className="grow-[1] flex flex-col">
                <h2 className="font-manrope text-3xl leading-tight text-gray-900 mb-1.5">Upcoming Events</h2>
                <p className="text-lg font-normal text-gray-600 mb-8">Don’t miss schedule</p>
                <div className="flex gap-5 flex-col overflow-y-auto scrollbar-hidden max-h-[450px]">
                  <Dashboard eventsInDate={eventsInDate} subjects={subjects} />
                  
                </div>
              </div>
              <div className="px-2.5 grow-[1] bg-gradient-to-b from-white/25 to-white xl:bg-white rounded-2xl">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-5">
                  <CalendarHeader />
                  <p>Añadir evento</p>
                </div>
                <div className="border flex flex-col border-indigo-200 rounded-xl">
                  <div className="grid grid-cols-7 rounded-t-3xl border-b border-indigo-200">
                    <div className="py-3.5 border-r rounded-tl-xl border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600">Lun</div>
                    <div className="py-3.5 border-r border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600">Mar</div>
                    <div className="py-3.5 border-r border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600">Mié</div>
                    <div className="py-3.5 border-r border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600">Jue</div>
                    <div className="py-3.5 border-r border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600">Vie</div>
                    <div className="py-3.5 border-r border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600">Sáb</div>
                    <div className="py-3.5 rounded-tr-xl bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600">Dom</div>
                  </div>
                  <CalendarClient subjects={subjects} events={events} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </DateProvider>
  );
}
*/