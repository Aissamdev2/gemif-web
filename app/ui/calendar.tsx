import CalendarEvents from "./calendar-events";
import CalendarHeader from "@/app/ui/calendar-header";
import { DAYS_SHORT } from "../lib/utils";
import { DateProvider } from "../lib/date-context";
import AddEventButton from "./add-event-button";
import { Suspense } from "react";
import CalendarSkeleton from "@/app/ui/calendar-skeleton";
import CalendarClient from "./calendar-client";


export default async function Calendar() {

  return (
    
      <DateProvider>
        <div className="bg-[#ffffff] w-full h-full rounded-xl flex flex-col items-center border-[3px]">
          <div className="flex flex-col md:flex-row gap-2 justify-between items-center flex-grow-[1] text-xl w-full px-5 py-2">
            <CalendarHeader />
            <AddEventButton />
          </div>
          <div className="w-[98%] grid grid-cols-7 bg-[#fff] flex-grow-[1] gap-1 px-2 border-t border-b border-[#a19aff6b]">
            {DAYS_SHORT.map((item, index) => (
              <div key={item} className="flex flex-col justify-center items-center cursor-pointer">
                <span className={`font-bold ${index === 5 || index === 6 ? 'text-red-500' : ''}`}>{item}</span>
              </div>
            ))}
          </div>
          <div className="w-[98%] bg-[#ffffff] rounded-b-xl h-full max-h-full flex-grow-[20] grid grid-cols-7 grid-rows-6 auto-rows-[1fr] shadow-[inset_2px_0_2px_rgba(0,0,0,0.2),inset_-2px_0_2px_rgba(0,0,0,0.2)]" >
            <CalendarClient />
          </div>
        </div>
      </DateProvider>
  );
}
