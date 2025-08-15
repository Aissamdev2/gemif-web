export default function AddMainPostSkeleton() {
  return (
    <div className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-full max-w-3xl h-[90vh] flex flex-col bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="p-4 border-b border-gray-200 shrink-0">
        <h4 className="text-lg font-bold text-gray-900 text-center">Añadir nueva publicación</h4>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 animate-pulse">
        <div className="flex justify-center">
          <div className="flex w-fit overflow-hidden rounded-full border border-gray-300 shadow-sm">
            <div className="h-10 w-24 bg-gray-200"></div>
            <div className="h-10 w-24 bg-gray-100"></div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex flex-col gap-4 w-full lg:w-1/2">
            <div className="relative">
              <div className="h-4 w-20 bg-gray-200 mb-1"></div>
              <div className="h-10 w-full bg-gray-100 rounded-lg"></div>
            </div>
            <div className="relative">
              <div className="h-4 w-24 bg-gray-200 mb-1"></div>
              <div className="h-20 w-full bg-gray-100 rounded-lg"></div>
            </div>
            <div className="flex flex-col">
              <div className="h-4 w-16 bg-gray-200 mb-1"></div>
              <div className="h-10 w-full bg-gray-100 rounded-lg"></div>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="h-80 w-full bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
        <div className="h-10 w-full bg-gray-100 rounded-md"></div>
        <div className="h-10 w-full bg-gray-200 rounded-md"></div>
      </div>
    </div>
  )
}