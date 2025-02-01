'use client'

import Image from "next/image"
import { useEffect, useRef, useState } from "react";
import { Message, User } from "../lib/definitions";
import { useUser } from "../lib/use-user";
import Link from "next/link";
import { HEADER_OPTIONS } from "../lib/utils";
import { useFormState, useFormStatus } from "react-dom";
import { signOut } from "../lib/auth";
import { usePathname } from "next/navigation";
import { checkUnseenMessages } from "../lib/actions";
import { useUnseenMessages } from "../lib/use-unseen-messages";
import { mutate } from "swr";
import { CircleUserRound } from "lucide-react";


export default function Header() {
  const pathname = usePathname(); 
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, error: userError, isLoading: isLoadingUser } = useUser();
  const [state, setState] = useState(() => {
    return pathname.split('/').slice(2).reverse().pop()
  });
  const [errorMessage, dispatch] = useFormState(signOut, undefined)

  const { unseenMessages, error} = useUnseenMessages();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    } 
  }, []);

  useEffect(() => {
    const newState = pathname.split('/').slice(2).reverse().pop()
    if (!newState) return
    setState(newState)
    mutate(process.env.BASE_URL as string + "/api/messages/unseen", checkUnseenMessages())

  }, [pathname])


  if (userError) return <div>Error: {userError.message}</div>

  return (
    <header className="sticky top-0 left-0 w-full max-w-full box-border z-[100]">
      <nav className="bg-[#4d30e0] max-w-full px-6 py-2 flex items-center box-border justify-between shadow-md">
        <div className="flex items-center max-w-full overflow-hidden gap-2">
          <div className="mr-1 md:mr-3 relative h-[20px] w-[60px] md:h-[40px] md:w-[130px]">
            <Image
              src="/gemif-logo.png"
              alt="Logo"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="mx-1 md:mx-3 border-r border-gray-200 h-[20px]" />
          <ul className="flex items-center overflow-scroll scrollbar-hidden max-md:max-w-[60%] md:gap-2">
            {
              HEADER_OPTIONS.map((option, index) => (
                <li key={option.name} className={` px-2 py-1 rounded-lg ${state === option.href ? "bg-[#ffffff41]" : "hover:bg-[#ffffff17]"} `}>
                  <Link href={`/gemif/${option.href}`} className={`text-white`}>{option.name}</Link>
                </li>
              ))
            }
          </ul>
        </div>
      
      <div className="relative" ref={dropdownRef} >
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex items-center ${dropdownOpen ? "bg-[#ffffff45]" : "hover:bg-[#ffffff17]"} text-black px-1 md:px-4 py-2 gap-1 rounded-lg focus:outline-none`}
        >
          <span className="text-white">Perfil</span>
          {
            unseenMessages && unseenMessages.length > 0 && <div title="Mensaje/s nuevo/s" className="w-2 h-2 bg-red-500 rounded-full"></div>
          }
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-[#ffffffe7] text-black rounded-lg shadow-lg">
            <div className="p-4 border-b z-40 border-gray-300">
              <div className="flex items-center space-x-4">
              <CircleUserRound className="w-6 h-6" 
              style={{ color: user?.color ?? "#ffffff" }}
              />
                <div>
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-sm text-gray-700">{user?.email}</p>
                </div>
              </div>
            </div>

            <ul className="py-2 z-40 flex flex-col border-b border-gray-300">
              <Link onClick={() => setDropdownOpen(false)} href="/gemif/settings/subjects" className="px-4 py-2 hover:bg-[#f0f1ff] transition-[background-color] cursor-pointer">Ajustes </Link>
              <Link onClick={() => setDropdownOpen(false)} href="/gemif/messages" className="px-4 py-2 flex items-center gap-1 hover:bg-[#f0f1ff] transition-[background-color] cursor-pointer">Mensajes 
              {
                unseenMessages && unseenMessages.length > 0 && <div title="Mensaje/s nuevo/s" className="w-2 h-2 bg-red-500 rounded-full"></div>
              }
              </Link>
            </ul>
            <form action={dispatch}>
              <LogOutButton />
            </form>
          </div>
        )}
      </div>
      </nav>
    </header>
  )
}

function LogOutButton() {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }
  return (
    <div className="px-4 py-2 z-40 hover:bg-[#fbbdbd] transition-[background-color] rounded-b-lg">
      <button
        className="text-red-700 font-semibold w-full text-left"
        type="submit"
        aria-disabled={pending}
        onClick={handleClick}
      >
        {pending ? "Saliendo..." : "Salir"}
      </button>
    </div>
  )
}