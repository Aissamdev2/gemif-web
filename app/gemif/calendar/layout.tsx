'use client'

import { usePathname } from "next/navigation";

export default function GemifLayout({
  modal,
  children,
}: {
  modal: React.ReactNode;
  children: Readonly<React.ReactNode>;
}) {

  const pathname = usePathname();

  const modals  = ['add-event', 'edit-event', 'view-event'];

  const isModalOpen = modals.some(modal => pathname.includes(modal));

  return (
    <>
      {isModalOpen && modal}
      {children}
    </>
);
}