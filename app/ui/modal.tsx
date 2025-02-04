'use client'

import { useRouter } from "next/navigation";

export default function Modal({
  children,}: {
  children: React.ReactNode;
}) {

  const router = useRouter()
  const handleOutsideClick = () => {
    router.back()
  }

  return (
    <div className="starting:opacity-0 trasition-[opacity] opacity-100 duration-300 fixed top-0 left-0 z-[100] h-full w-screen ">
      <div onClick={handleOutsideClick} className=" backdrop-blur-[2px] starting:opacity-0 trasition-[opacity] opacity-100 duration-300 w-full content-[''] h-full bg-[#0000002f] absolute bottom-0 left-0" />
      <div className="w-full h-full flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}