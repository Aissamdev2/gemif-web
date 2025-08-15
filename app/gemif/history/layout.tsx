'use client'

import { usePathname } from "next/navigation";

export default function HistoryLayout({
  modal,
  children,
}: {
  modal: React.ReactNode;
  children: Readonly<React.ReactNode>;
}) {

  const pathname = usePathname();

  const modals  = ['add-file', 'add-folder'];

  const isModalOpen = modals.some(modal => pathname.includes(modal));

  return (
    <>
      { modal}
      {children}
    </>
);
}