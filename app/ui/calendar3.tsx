'use client';

import CalendarHeader from "@/app/ui/calendar-header2";
import { DateContext, DateProvider } from "../lib/date-context";
import AddEventButton from "./add-event-button2";
import { useContext } from "react";
import CalendarClient from "./calendar-client2";
import { useEvents } from "../lib/use-events";
import { useSubjects } from "../lib/use-subjects";
import Dashboard from "./dashboard";
import { usePrimitiveSubjects } from "../lib/use-primitive-subjects";
import { usePathname } from "next/navigation";
import ErrorPage from "./error";

export default function Calendar() {
  const { year, month } = useContext(DateContext);
  const { events, isLoading: eventsLoading, error: eventsError } = useEvents();
  const { subjects, isLoading: subjectsLoading, error: subjectsError } = useSubjects({});
  const { primitiveSubjects, isLoading: primitiveSubjectsLoading, error: primitiveSubjectsError } = usePrimitiveSubjects();

  const pathname = usePathname();

  const modals  = ['add-event', 'edit-event', 'view-event'];

  const isModalOpen = modals.some(modal => pathname.includes(modal));

  if (eventsError || subjectsError || primitiveSubjectsError) return <ErrorPage error={eventsError?.message || subjectsError.message || primitiveSubjectsError.message} />
  
  return (
    <DateProvider>
        <section className={`${isModalOpen ? 'overflow-hidden' : ''} z-50 max-h-full w-full h-full flex flex-col lg:mb-0 px-2 lg:px-10 gap-24 pt-[80px] pb-[20px] lg:gap-12 lg:flex-row`}>
              {/* Upcoming Events */}
              <Dashboard events={events} subjects={subjects} />

              {/* Calendar */}
              <div className="flex min-h-[550px] shrink-0 lg:min-h-auto lg:basis-[60%] h-full flex-col px-2.5 py-2 grow-[6] shadow-[0_2px_4px_rgba(16,42,83,0.08)] bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 rounded-2xl">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-5">
                  <CalendarHeader />
                  <AddEventButton />
                </div>
                <div className="border flex flex-col grow border-indigo-200 rounded-xl">
                  <div className="grid grid-cols-7 rounded-t-3xl border-b border-indigo-200">
                    <div
                        key={"Lun"}
                        className="py-3.5 rounded-tl-xl border-r last:border-r-0  border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600"
                      >
                        {"Lun"}
                      </div>
                    {["Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                      <div
                        key={day}
                        className="py-3.5 border-r last:border-r-0  border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600"
                      >
                        {day}
                      </div>
                    ))}
                    <div
                        key={"Dom"}
                        className="py-3.5 rounded-tl-xl border-r last:border-r-0  border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600"
                      >
                        {"Dom"}
                      </div>
                  </div>
                  <CalendarClient
                    subjects={subjects}
                    primitiveSubjects={primitiveSubjects}
                    events={events}
                  />
                </div>
              </div>
      </section>
    </DateProvider>
  );
}
