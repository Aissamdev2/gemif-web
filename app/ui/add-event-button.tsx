import Link from "next/link";

export default function AddEventButton() {
  return (
    <Link href={'/gemif/calendar/add-event'} className='py-1 px-3 md:py-2.5 md:px-4 text-sm bg-indigo-500 text-white rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 hover:bg-indigo-700'>
      Crear nuevo evento
    </Link>
  )
}