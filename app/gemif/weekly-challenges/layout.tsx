'use client'

import { usePathname } from "next/navigation";

export default function MessagesLayout({
  modal,
  children,
}: {
  modal: React.ReactNode;
  children: Readonly<React.ReactNode>;
}) {

  const pathname = usePathname();

  const modals  = ['add-weekly-challenge', 'edit-weekly-challenge', 'view-weekly-challenge'];

  const isModalOpen = modals.some(modal => pathname.includes(modal));

  return (
    <>
      {isModalOpen && modal}
      {children}
    </>
);
}