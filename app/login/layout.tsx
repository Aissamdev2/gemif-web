
import type { Metadata } from "next";
import Footer from "../ui/footer/footer";

export const metadata: Metadata = {
  title: "Iniciar sesión - GEMiFWeb",
  description: "Inicia sesión en GEMiFWeb y accede a tu cuenta de GEMiFWeb URV.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/login", // Canonical relativo; Next.js lo resuelve con el dominio
  },
  openGraph: {
    title: "Iniciar sesión - GEMiFWeb",
    description: "Accede a tu cuenta de GEMiFWeb URV y disfruta de todos los recursos.",
    url: "/login", // relativo, lo resolverá el dominio base
    siteName: "GEMiFWeb",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Iniciar sesión - GEMiFWeb",
    description: "Accede a tu cuenta de GEMiFWeb URV y disfruta de todos los recursos.",
  },
  icons: {
    icon: "/favicon-32x32.png",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}