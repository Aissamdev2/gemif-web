import { RemainingTime } from "../lib/definitions";

export default function Timer({ remainingTime }: {remainingTime: RemainingTime}) {
  return (
    <div className="flex items-center justify-center w-full gap-[15px]">
        <div className="timer">
          <div className={`pr-1.5 pl-[7px] relative ${remainingTime.days > 0 || remainingTime.hours > 0 || remainingTime.minutes > 0 ? 'bg-indigo-50' : 'bg-red-100'} w-max rounded before:contents-[''] before:absolute before:h-full before:w-0.5 before:top-0 before:left-1/2 before:-translate-x-1/2 before:bg-white before:z-10`}>
            <h3 className="countdown-element days font-manrope font-semibold text-2xl text-indigo-600 tracking-[12px] max-w-[44px] text-center relative z-20">
              {String(remainingTime.days).padStart(2, "0")}
            </h3>                   
          </div>
          <p className="text-sm font-normal text-gray-900 mt-1 text-center w-full">días</p>
        </div>
        <div className="timer">
          <div className={`pr-1.5 pl-[7px] relative ${remainingTime.days > 0 || remainingTime.hours > 0 || remainingTime.minutes > 0 ? 'bg-indigo-50' : 'bg-red-100'} w-max rounded before:contents-[''] before:absolute before:h-full before:w-0.5 before:top-0 before:left-1/2 before:-translate-x-1/2 before:bg-white before:z-10`}>
            <h3 className="countdown-element hours font-manrope font-semibold text-2xl text-indigo-600 tracking-[12px] max-w-[44px] text-center relative z-20">
              {String(remainingTime.hours).padStart(2, "0")}
            </h3>                        
          </div>
          <p className="text-sm font-normal text-gray-900 mt-1 text-center w-full">horas</p>
        </div>
        <div className="timer">
          <div className={`pr-1.5 pl-[7px] relative ${remainingTime.days > 0 || remainingTime.hours > 0 || remainingTime.minutes > 0 ? 'bg-indigo-50' : 'bg-red-100'} w-max rounded before:contents-[''] before:absolute before:h-full before:w-0.5 before:top-0 before:left-1/2 before:-translate-x-1/2 before:bg-white before:z-10`}>
            <h3 className="countdown-element minutes font-manrope font-semibold text-2xl text-indigo-600 tracking-[12px] max-w-[44px] text-center relative z-20">
              {String(remainingTime.minutes).padStart(2, "0")}
            </h3>                     
          </div>
          <p className="text-sm font-normal text-gray-900 mt-1 text-center w-full">minutos</p>
        </div>
    </div>
  )
}