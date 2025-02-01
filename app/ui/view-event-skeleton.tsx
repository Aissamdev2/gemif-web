export default function ViewEventSkeleton() {

  return (
    <div id="large-modal" className="w-full h-full fixed top-[100px] left-0 z-[60] overflow-x-hidden overflow-y-auto">
      <div className="lg:max-w-3xl lg:w-full m-3 lg:mx-auto">
        <div className="flex flex-col bg-white rounded-2xl border-[3px] py-4 px-5">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <h4 className="text-sm text-gray-900 font-medium">Información del evento</h4>
            <button className="block cursor-pointer" >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.75732 7.75739L16.2426 16.2427M16.2426 7.75739L7.75732 16.2427" stroke="black" strokeWidth="1.6" strokeLinecap="round"></path>
              </svg>
            </button>
          </div>
          <div className="flex flex-col px-5 py-10 min-h-[100px] overflow-y-auto gap-[30px]">
            <div className="flex justify-between">
              <div className="flex flex-col gap-[10px] min-h-[90px]">
                <div className="flex items-center gap-[40px]">
                  <div className="w-[80px] h-[20px] rounded-full bg-slate-200 animate-pulse-fast" />
                  <div className="w-[70px] h-[25px] rounded-full bg-slate-200 animate-pulse-fast" />
                </div>
                <div className="w-[250px] h-[50px] rounded-full bg-slate-200 animate-pulse-fast" />
              </div>
              <div className="flex flex-col justify-start pr-[15px] gap-[10px]">
                <div className="w-[100px] h-[20px] rounded-full bg-slate-200 animate-pulse-fast" />
                <div className="w-[250px] h-[20px] rounded-full bg-slate-200 animate-pulse-fast" />
              </div>
            </div>
            <div className="w-full h-[15px] border-b border-gray-200" />
            <div className="w-[250px] self-center h-[50px] rounded-full bg-slate-200 animate-pulse-fast" />
          </div>
          <div className="flex items-center justify-end pt-4 border-t border-gray-200 space-x-4">
          <button type="button" className="py-2.5 px-5 text-xs bg-red-500 text-white rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 hover:bg-red-700">
            Eliminar
          </button>
            <button type="button" className="py-2.5 px-5 text-xs  bg-indigo-500 text-white rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 hover:bg-indigo-700 close-modal-button">Editar</button>
          </div>
        </div>
      </div>
    </div>
  )
}