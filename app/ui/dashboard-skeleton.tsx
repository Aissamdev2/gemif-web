import Loader from "./loader";

export default function DashboardSkeleton() {

  return (
    <div className="flex flex-col gap-5 lg:w-[350px] bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 p-2 rounded-2xl rounded-tl-none max-h-full overflow-hidden lg:max-w-[350px] shrink-0 ">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-700 leading-tight md:text-3xl">
          Próximos Eventos
        </h2>
      <div className="flex gap-5 flex-col items-center overflow-auto p-0 scrollbar-hidden h-fit lg:h-auto max-h-[450px]">
        <div className="flex justify-center items-center w-full min-h-[4rem]">
          <div className="w-[40px] h-[30px]">
            <Loader />
          </div>
        </div>
        {/* <div className="p-3 w-full max-w-full shrink-0 rounded-xl bg-slate-100
          relative 
          before:absolute before:inset-0
          before:-translate-x-full
          before:animate-[shimmer_2s_infinite]
          before:bg-gradient-to-r
          before:from-transparent before:via-white before:to-transparent
          isolate
          overflow-hidden
          shadow-xl shadow-black/5
          before:border-t before:border-rose-100/10">
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex grow items-center gap-2.5">
              <span 
              className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
              <div className="bg-gray-200 grow rounded-lg h-[24px]"></div>
            </div>
            
          </div>
          <h6 className="bg-gray-200 h-[32px] grow rounded-lg mb-1"></h6>
          <div className="bg-gray-200 h-[24px] grow rounded-lg"></div>
        </div> */}
      </div>
    </div>
  )
}