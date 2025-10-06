
import React from "react";

export default async function MainLayout({
  children,
}: {
  children: Readonly<React.ReactNode>;
}) {
  
  return (
    <>
      {children}
    </>
);
}