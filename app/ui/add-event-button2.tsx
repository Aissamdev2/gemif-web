import Link from "next/link";

export default function AddEventButton() {
  return (
    <Link href={'/gemif/calendar/add-event'} className='w-full text-center p-1.5 py-2 rounded-md bg-[#4A90E2] text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]'>
      Crear evento
    </Link>
  )
}