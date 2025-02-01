export default function CalendarSkeleton() {
  return (
    <>
      {
        Array(42).fill(0).map((_, index) => (
          <div key={index} className={`cursor-pointer relative bg-[#ededed] flex flex-col items-center border-[1px] border-[#a19aff6b] justify-center animate-pulse-fast`}>
          </div>
        ))
      }
    </>
  );
}