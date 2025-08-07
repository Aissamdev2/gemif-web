import Header from "@/app/ui/header2";
import 'katex/dist/katex.min.css';

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