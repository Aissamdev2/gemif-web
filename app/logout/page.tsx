import { Suspense } from "react";
import Footer from "../ui/footer/footer";
import LogOutClient from "./components/logout-client";

export default async function LogOutPage() {

  return (
    <div className="flex flex-col items-center justify-between h-screen w-screen bg-bg text-text-primary">
      <div className="flex flex-col h-full items-center justify-center gap-4 ">        
        <LogOutClient />
      </div>
      <Footer />
    </div>
  )
}
