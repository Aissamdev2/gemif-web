import Header from "@/app/ui/header2";

export default function GemifLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="h-full fixed top-0 left-0 w-screen bg-[#eaf3ff]">
        {children}
      </main>
    </>
  );
}