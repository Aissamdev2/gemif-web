'use client';

import Link from "next/link";

export default function AddMainFileButton() {
  return (
    <Link
      href="/gemif/main/add-main-post"
      className="w-full max-w-xs text-center p-2 rounded-md bg-[#2C5AA0] text-white text-sm font-semibold transition-colors duration-300 hover:bg-[#3A7BC4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C5AA0]"
      aria-label="Añadir nuevo recurso"
    >
      Añadir recurso
    </Link>
  )
};