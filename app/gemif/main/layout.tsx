
import { preload } from "@/app/lib/preload";
import React from "react";

export default async function MainLayout({
  modal,
  children,
}: {
  modal: React.ReactNode;
  children: Readonly<React.ReactNode>;
}) {

  preload();
  
  return (
    <>
      {children}
      {/* {modal} */}
    </>
);
}