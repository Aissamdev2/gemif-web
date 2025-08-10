import Header from "@/app/ui/header2";

export const metadata = {
  title: "GEMiFWeb",
  robots: {
    index: false,
    follow: false,
  }
};

export default function GemifLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="h-full absolute top-0 left-0 w-screen bg-[#ffffff]">
        {children}
      </main>
    </>
  );
}