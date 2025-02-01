
export default function CalendarClientSkeleton() {

  return (
    <div
      className="grid grid-cols-7 grid-rows-[repeat(6,minmax(1fr,16.6%))] auto-rows-[16.6%] gap-[1px] shrink rounded-b-xl w-full grow bg-indigo-200 overflow-hidden"
    >
      {Array(42).fill(0).map((_, i) => {
        return (
          <div
            key={i}
            className={`bg-slate-100 p-[2px] border border-indigo-200 cursor-pointer
              relative 
              before:absolute before:inset-0
              before:-translate-x-full
              before:animate-[shimmer_2s_infinite]
              before:bg-gradient-to-r
              before:from-transparent before:via-white before:to-transparent
              isolate
              overflow-hidden
              shadow-xl shadow-black/5
              before:border-t before:border-rose-100/10`}
              >
          </div>
        );
      })}
    </div>
  );
}
