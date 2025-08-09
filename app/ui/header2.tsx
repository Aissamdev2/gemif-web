'use client';

import React, {
  useCallback,
  useState,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { mutate } from 'swr';
import { CircleUserRound } from 'lucide-react';

import { useUser } from '../lib/use-user';
import { useUnseenMessages } from '../lib/use-unseen-messages';
import { signOut } from '../lib/actions/session/actions';
import { checkUnseenMessages } from '../lib/actions/messages/actions';
import { HEADER_OPTIONS } from '../lib/utils';
import ErrorPage from './error';
import { Message } from '../lib/definitions';

// Helper to extract active path
const getActivePath = (pathname: string) =>
  pathname.split('/').slice(2).reverse().pop() ?? '';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, error: userError } = useUser();
  const { unseenMessages, error: messagesError } = useUnseenMessages();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLUListElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const [errorMessage, dispatch] = useFormState(signOut, undefined);

  const activePath = useMemo(() => getActivePath(pathname), [pathname]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const updateIndicatorStyle = useCallback(() => {
    const current = linkRefs.current[activePath];
    if (current && navContainerRef.current) {
      const containerRect = navContainerRef.current.getBoundingClientRect();
      const rect = current.getBoundingClientRect();
      setIndicatorStyle({
        left:
          rect.left -
          containerRect.left +
          navContainerRef.current.scrollLeft,
        width: rect.width,
      });
    }
  }, [activePath]);

  // Attach outside click listener only when dropdown is open
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Handle path changes
  useEffect(() => {
    if (pathname.startsWith('/gemif/messages')) {
      mutate(
        process.env.NEXT_PUBLIC_BASE_URL + '/api/messages/unseen',
        checkUnseenMessages()
      );
    }
    updateIndicatorStyle();
    router.refresh();
  }, [pathname, router, updateIndicatorStyle]);

  const error = userError || messagesError;
  if (error) return <ErrorPage error={error.message} />;

  return (
    <header className="sticky top-0 left-0 w-full max-w-full box-border z-[100]">
      <nav className="bg-[#ffffff] max-w-full px-6 py-2 flex items-center box-border justify-between">
        <div className="flex items-center max-w-full overflow-hidden gap-2">
          <Link
            href={'/gemif/main'}
            className="text-slate-700 text-lg md:text-3xl font-extrabold"
          >
            GEMiF
          </Link>
          <div className="mx-1 md:mx-3 border-r border-[#2C3E50] h-[30px]" />
          <NavigationMenu
            navContainerRef={navContainerRef}
            linkRefs={linkRefs}
            activePath={activePath}
            indicatorStyle={indicatorStyle}
          />
        </div>
        <ProfileDropdown
          dropdownRef={dropdownRef}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          unseenMessages={unseenMessages}
          user={user}
          dispatch={dispatch}
        />
      </nav>
    </header>
  );
}

const NavigationMenu = React.memo(
  ({
    navContainerRef,
    linkRefs,
    activePath,
    indicatorStyle,
  }: {
    navContainerRef: React.RefObject<HTMLUListElement>;
    linkRefs: React.MutableRefObject<Record<string, HTMLAnchorElement | null>>;
    activePath?: string;
    indicatorStyle: { left: number; width: number };
  }) => {
    return (
      <ul
        ref={navContainerRef}
        className="relative flex items-stretch min-h-[35px] overflow-scroll scrollbar-hidden max-md:max-w-[60%]"
      >
        {HEADER_OPTIONS.map((option) => (
          <Link
            key={option.name}
            href={`/gemif/${option.href}`}
            ref={(el) => {
              linkRefs.current[option.href] = el;
            }}
            className={`text-slate-700 z-[102] relative flex items-center px-2 py-1 transition-all after:z-[101] after:opacity-0 after:transition-[opacity] after:duration-500 after:delay-500 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-full ${
              activePath === option.href
                ? 'font-bold border-b-2 border-[#76aae6] after:opacity-100 after:bg-[linear-gradient(to_top,#ddebfc,transparent)]'
                : ''
            }`}
          >
            <p className="z-[102]">{option.name}</p>
          </Link>
        ))}
        <div
          className="absolute bottom-0 h-[3px] bg-[#76aae6] transition-all duration-300 ease-in-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      </ul>
    );
  }
);

NavigationMenu.displayName = 'NavigationMenu';

const ProfileDropdown = React.memo(
  ({
    dropdownRef,
    dropdownOpen,
    setDropdownOpen,
    unseenMessages,
    user,
    dispatch,
  }: {
    dropdownRef: React.RefObject<HTMLDivElement>;
    dropdownOpen: boolean;
    setDropdownOpen: (open: boolean) => void;
    unseenMessages?: Message[] | null;
    user?: any | null;
    dispatch: any;
  }) => {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex items-center text-black px-1 md:px-4 py-2 gap-1 focus:outline-none ${
            dropdownOpen ? 'border-b-2 border-[#76aae6] font-bold' : ''
          }`}
        >
          <span className="text-slate-700">Perfil</span>
          {unseenMessages && unseenMessages.length > 0 && (
            <div
              title="Mensaje/s nuevo/s"
              className="w-2 h-2 bg-red-500 rounded-full"
            ></div>
          )}
        </button>

        {dropdownOpen && (
          <div className="starting:opacity-0 opacity-100 transition-[opacity] absolute right-0 mt-2 w-64 bg-[#ffffffe7] text-slate-700 rounded-lg shadow-lg">
            <div className="p-4 border-b z-40 border-gray-300">
              <div className="flex items-center space-x-4">
                <CircleUserRound
                  className="w-6 h-6"
                  style={{ color: user?.color ?? '#ffffff' }}
                />
                <div>
                  <p className="font-semibold">{user?.publicname}</p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
              </div>
            </div>
            <ul className="py-2 z-40 flex flex-col border-b border-gray-300">
              <DropdownLink
                href="/gemif/settings/subjects"
                onClick={() => setDropdownOpen(false)}
              >
                Ajustes
              </DropdownLink>
              <DropdownLink
                href="/gemif/messages"
                onClick={() => setDropdownOpen(false)}
              >
                Mensajes
                {unseenMessages && unseenMessages.length > 0 && (
                  <div
                    title="Mensaje/s nuevo/s"
                    className="w-2 h-2 bg-red-500 rounded-full"
                  ></div>
                )}
              </DropdownLink>
            </ul>
            <form action={dispatch}>
              <LogOutButton />
            </form>
          </div>
        )}
      </div>
    );
  }
);

ProfileDropdown.displayName = 'ProfileDropdown';

const DropdownLink = React.memo(function DropdownLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      onClick={onClick}
      href={href}
      className="px-4 py-2 text-slate-700 flex items-center gap-1 hover:bg-[#f0f1ff] transition-[background-color] cursor-pointer"
    >
      {children}
    </Link>
  );
});

const LogOutButton = React.memo(function LogOutButton() {
  const { pending } = useFormStatus();

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (pending) {
        event.preventDefault();
      }
    },
    [pending]
  );

  return (
    <div className="px-4 py-2 z-40 hover:bg-[#fbbdbd] transition-[background-color] rounded-b-lg">
      <button
        className="text-red-700 font-semibold w-full text-left"
        type="submit"
        disabled={pending}
        onClick={handleClick}
      >
        {pending ? 'Saliendo...' : 'Salir'}
      </button>
    </div>
  );
});
