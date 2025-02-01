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

export default function Calendar() {
  const { year, month } = useContext(DateContext);
  const { events } = useEvents();
  const { subjects } = useSubjects();
  const { primitiveSubjects } = usePrimitiveSubjects();

  const pathname = usePathname();

  const modals  = ['add-event', 'edit-event', 'view-event'];

  const isModalOpen = modals.some(modal => pathname.includes(modal));
  
  return (
    <DateProvider>
        {/* Background decorations */}
        {/* <div className="fixed top-0 left-0 w-screen h-screen">
          <div className="bg-[#8a88b8] w-[20px] sm:w-40 h-40 rounded-full opacity-45 max-sm:ml-auto sm:ml-56"></div>
          <div className="bg-emerald-500 w-[20px] sm:w-40 h-24 md:mt-0 mt-20 opacity-25"></div>
          <div className="bg-purple-600 w-[20px] sm:w-40 h-24 md:mt-0 mt-10 opacity-45"></div>
          <div className="absolute inset-0  backdrop-blur-3xl"></div>
        </div> */}

        {/* Main content area */}
        <section className={`${isModalOpen ? 'overflow-hidden' : ''} z-50 max-h-full w-full h-full flex flex-col lg:mb-0 px-2 lg:px-10 gap-24 pt-[80px] pb-[20px] lg:gap-12 lg:flex-row`}>
              {/* Upcoming Events */}
              <Dashboard events={events} subjects={subjects} />

              {/* Calendar */}
              <div className="flex min-h-[550px] shrink-0 lg:min-h-auto lg:basis-[60%] h-full flex-col px-2.5 py-2 grow-[6] bg-white rounded-2xl">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-5">
                  <CalendarHeader />
                  <AddEventButton />
                </div>
                <div className="border flex flex-col grow border-indigo-200 rounded-xl">
                  <div className="grid grid-cols-7 rounded-t-3xl border-b border-indigo-200">
                    {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                      <div
                        key={day}
                        className="py-3.5 border-r last:border-r-0  border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600"
                      >
                        {day}
                      </div>
                    ))}
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
