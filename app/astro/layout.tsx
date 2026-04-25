import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "L'Enigma de l'Univers Fosc",
  description: "Una explicació sobre la crisi dels forats negres i els objectes compactes exòtics.",
};

export default function AstroLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans`}>
      <Navbar />
      <main className="grow w-full">
        {children}
      </main>
      <footer className="py-6 bg-slate-900 text-slate-400 text-center text-sm">
        <p suppressHydrationWarning>© {new Date().getFullYear()} GEMiFWeb</p>
      </footer>
    </div>
  );
}

