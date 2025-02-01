import { useContext } from "react";
import { compareDates, getCalendarDates } from "../lib/utils";
import { DateContext } from "../lib/date-context";
import { Subject, Event, PrimitiveSubject } from "../lib/definitions";
import CalendarClientSkeleton from "./calendar-client-skeleton";
import Link from "next/link";

export default function CalendarClient({
  subjects,
  primitiveSubjects,
  events
}: {
  subjects: Subject[] | undefined;
  primitiveSubjects: PrimitiveSubject[] | undefined;
  events: Event[] | undefined;
}) {
  const { year, month } = useContext(DateContext);

  if (!subjects || !events) {
    return <CalendarClientSkeleton />;
  }

  return (
    <div
      className="grid grid-cols-7 grid-rows-[repeat(6,minmax(1fr,16.6%))] auto-rows-[16.6%] gap-[1px] shrink rounded-b-xl w-full grow bg-indigo-200 overflow-hidden"
    >
      {getCalendarDates(year, month).map((item, index) => {
        const eventsInDate =
          events?.filter((event) =>
            compareDates(new Date(event.date), item.date)
          ) ?? [];

        return (
          <div
            key={index}
            className={`bg-white relative hover:bg-indigo-50 ${
              item.isCurrentMonth ? "" : "opacity-80 bg-gray-100"
            } flex flex-col gap-1 overflow-hidden  border border-indigo-200 transition-all duration-300 cursor-pointer`}
          >
            {/* Date */}
            <span
              className={`text-gray-400 ${
                item.isToday
                  ? " text-white after:content-[''] after:w-[19px] after:h-[19px] after:rounded-md after:z-[-1] z-[1] after:absolute after:top-0 after:left-0  after:bg-indigo-600"
                  : ""
              } text-xs w-[19px] h-[19px] font-semibold flex justify-center items-center`}
            >
              {item.date.getDate()}
            </span>

            {/* Events */}
            <div className="flex flex-col gap-[1px] overflow-scroll scrollbar-hidden ">
              {eventsInDate.length > 0 &&
                eventsInDate.map((event) => {
                  let subject: Subject | PrimitiveSubject | undefined = subjects.find(
                    (subject) => subject.primitiveid === event.primitiveid
                  );
                  if (!subject) {
                    subject = primitiveSubjects?.find(
                      (subject) => subject.id === event.primitiveid
                    );
                  }

                  return (
                    <Link
                      href={`/gemif/calendar/view-event/${event.id}`}
                      key={event.id}
                      style={{
                        background: `linear-gradient(to right, ${subject?.bgcolor}, white)`,
                        borderColor: subject?.bordercolor,
                        color: subject?.color,
                        borderRadius: "4px"
                      }}
                      className={`cursor-pointer border z-[2] grow text-[10px] min-h-[14px] truncate font-medium px-1.5 py-0`}
                      >
                        {event.name}
                    </Link>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
