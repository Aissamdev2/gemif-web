export default function MainSkeleton() {
  return (
    <section aria-label="Cargando recursos" className="z-50 w-full min-h-screen max-h-full flex flex-col lg:mb-0 px-4 sm:px-6 lg:px-10 gap-6 pt-[80px] pb-[20px]">
      {/* Header Skeleton */}
      <div className="shadow-[0_2px_4px_rgba(16,42,83,0.08)] bg-[#f4f9ff] border border-[#DCEBFF] rounded-2xl p-5 basis-[15%] flex flex-col sm:flex-row justify-between items-center gap-4 animate-pulse">
        <div className="h-9 w-64 bg-slate-200 rounded-md" aria-label="Cargando título" />
        <div className="h-12 w-48 bg-slate-200 rounded-2xl" aria-label="Cargando botón de enlace" />
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-col gap-5 shadow-[0_2px_4px_rgba(16,42,83,0.08)] bg-[#f4f9ff] border border-[#DCEBFF] p-5 grow rounded-2xl animate-pulse">
        <div className="flex flex-col gap-3">
          <div className="h-6 w-48 bg-slate-200 rounded-md" aria-label="Cargando encabezado" />
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap">
            <div className="flex flex-col w-full max-w-xs md:w-auto">
              <div className="h-3 w-20 mb-1 bg-slate-200 rounded-md" aria-label="Cargando etiqueta de selección" />
              <div className="h-10 w-full bg-white border border-[#DCEBFF] rounded-lg" aria-label="Cargando campo de selección" />
            </div>
            <div className="h-10 w-full max-w-xs md:w-48 bg-[#2C5AA0] rounded-md" aria-label="Cargando botón de adición" />
          </div>
        </div>

        {/* Posts List Skeleton */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 auto-rows-max gap-3 overflow-y-auto flex-1 min-h-0 bg-[#e4ecf6] p-3 rounded-lg" aria-label="Cargando lista de recursos">
          {Array.from({ length: 8 }).map((_, index) => (
            <li key={index} className="bg-white h-[100px] flex rounded-xl border border-[#e0e7ff] shadow-sm">
              <div className="flex flex-col justify-center grow px-4 py-3 overflow-hidden">
                <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
                <div className="h-3 w-1/2 mt-2 bg-slate-200 rounded-md" />
              </div>
              <div className="flex w-12 items-center justify-center bg-slate-100 rounded-r-xl">
                <div className="w-5 h-5 bg-slate-200 rounded-full" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}