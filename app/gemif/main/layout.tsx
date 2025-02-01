'use client'

import { usePathname } from "next/navigation";

export default function MainLayout({
  modal,
  children,
}: {
  modal: React.ReactNode;
  children: Readonly<React.ReactNode>;
}) {

  const pathname = usePathname();

  const modals  = ['add-main-post', 'edit-main-post', 'view-main-post'];

  const isModalOpen = modals.some(modal => pathname.includes(modal));

  return (
    <>
      {isModalOpen && modal}
      {children}
    </>
);
}