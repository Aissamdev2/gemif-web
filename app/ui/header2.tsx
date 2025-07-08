"use client"

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useUser } from "../lib/use-user";
import Link from "next/link";
import { HEADER_OPTIONS } from "../lib/utils";
import { useFormState, useFormStatus } from "react-dom";
import { signOut } from "../lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { checkUnseenMessages } from "../lib/actions";
import { useUnseenMessages } from "../lib/use-unseen-messages";
import { mutate } from "swr";
import { CircleUserRound } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, error: userError } = useUser();
  const [state, setState] = useState(() => pathname.split("/").slice(2).reverse().pop());
  const [errorMessage, dispatch] = useFormState(signOut, undefined);
  const { unseenMessages } = useUnseenMessages();

  const navContainerRef = useRef<HTMLUListElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const newState = pathname.split("/").slice(2).reverse().pop();
    if (!newState) return;
    setState(newState);
    mutate(
      process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL + "/api/messages/unseen",
      checkUnseenMessages()
    );
    router.refresh();
  }, [pathname, router]);

  useEffect(() => {
    const current = linkRefs.current[state ?? ""];
    if (current && navContainerRef.current) {
      const containerRect = navContainerRef.current.getBoundingClientRect();
      const rect = current.getBoundingClientRect();
      setIndicatorStyle({
        left: rect.left - containerRect.left + navContainerRef.current.scrollLeft,
        width: rect.width,
      });
    }
  }, [state]);

  if (userError) return <div>Error: {userError.message}</div>;

  return (
    <header className="sticky top-0 left-0 w-full max-w-full box-border z-[100]">
      <nav className="bg-[#ffffff] max-w-full px-6 py-2 flex items-center box-border justify-between">
        <div className="flex items-center max-w-full overflow-hidden gap-2">
          <p className="text-slate-700 text-lg md:text-3xl font-extrabold">GEMiF</p>
          <div className="mx-1 md:mx-3 border-r border-[#2C3E50] h-[30px]" />

          <ul
            ref={navContainerRef}
            className="relative flex items-stretch min-h-[35px] overflow-scroll scrollbar-hidden max-md:max-w-[60%]"
          >
            {HEADER_OPTIONS.map((option) => (
              <Link
                key={option.name}
                href={`/gemif/${option.href}`}
                ref={(el: HTMLAnchorElement | null) => {
                  linkRefs.current[option.href] = el;
                }}
                className={`text-slate-700 z-[102] relative flex items-center px-2 py-1 transition-all after:opacity-0 after:transition-[opacity] after:duration-500 after:delay-500 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-full ${
                  state === option.href
                    ? "font-bold border-b-2 border-[#76aae6] after:z-[101] after:opacity-100 after:bg-[linear-gradient(to_top,#ddebfc,transparent)]"
                    : ""
                }`}
              >
                <p className="z-[102]">{option.name}</p>
              </Link>
            ))}
            <div
              className="absolute bottom-0 h-[3px] bg-[#76aae6] transition-all duration-300 ease-in-out"
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
          </ul>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center ${
              dropdownOpen ? "border-b-2 border-[#76aae6] font-bold" : ""
            } text-black px-1 md:px-4 py-2 gap-1 focus:outline-none`}
          >
            <span className="text-slate-700">Perfil</span>
            {unseenMessages && unseenMessages.length > 0 && (
              <div title="Mensaje/s nuevo/s" className="w-2 h-2 bg-red-500 rounded-full"></div>
            )}
          </button>

          {dropdownOpen && (
            <div className={`starting:opacity-0 opacity-100 transition-[opacity] absolute right-0 mt-2 w-64 bg-[#ffffffe7] text-slate-700 rounded-lg shadow-lg`}>
              <div className="p-4 border-b z-40 border-gray-300">
                <div className="flex items-center space-x-4">
                  <CircleUserRound className="w-6 h-6" style={{ color: user?.color ?? "#ffffff" }} />
                  <div>
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                  </div>
                </div>
              </div>

              <ul className="py-2 z-40 flex flex-col border-b border-gray-300">
                <Link
                  onClick={() => setDropdownOpen(false)}
                  href="/gemif/settings/subjects"
                  className="px-4 py-2 text-slate-700 hover:bg-[#f0f1ff] transition-[background-color] cursor-pointer"
                >
                  Ajustes
                </Link>
                <Link
                  onClick={() => setDropdownOpen(false)}
                  href="/gemif/messages"
                  className="px-4 py-2 text-slate-700 flex items-center gap-1 hover:bg-[#f0f1ff] transition-[background-color] cursor-pointer"
                >
                  Mensajes
                  {unseenMessages && unseenMessages.length > 0 && (
                    <div title="Mensaje/s nuevo/s" className="w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
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
  );
}

function LogOutButton() {
  const { pending } = useFormStatus();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault();
    }
  };

  return (
    <div className="px-4 py-2 z-40 hover:bg-[#fbbdbd] transition-[background-color] rounded-b-lg">
      <button
        className="text-red-700 font-semibold w-full text-left"
        type="submit"
        disabled={pending}
        onClick={handleClick}
      >
        {pending ? "Saliendo..." : "Salir"}
      </button>
    </div>
  );
}
