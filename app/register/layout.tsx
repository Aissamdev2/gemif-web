
import type { Metadata } from "next";
import Footer from "../ui/footer/footer";

export const metadata: Metadata = {
  title: "Registrarse - GEMiFWeb",
  description: "Regístrate y crea tu cuenta GEMiFWeb URV para acceder a todo el contenido.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/register", // Ruta canónica relativa
  },
  openGraph: {
    title: "Registrarse - GEMiFWeb",
    description: "Crea tu cuenta GEMiFWeb URV y desbloquea todo el contenido.",
    url: "/register",
    siteName: "GEMiFWeb",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Registrarse - GEMiFWeb",
    description: "Crea tu cuenta GEMiFWeb URV y desbloquea todo el contenido.",
  },
  icons: {
    icon: "/favicon-32x32.png",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const experimental_ppr = true

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}