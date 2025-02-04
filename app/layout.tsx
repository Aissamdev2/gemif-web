import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Página web GEMiF, URV",
  description: "Página web de GEMiF, Universitat Rovira i Virgili (URV) NO OFICIAL",
  keywords: "Pagina web, Página web, web, gemif, GEMIF, GEMiF, URV, Universitat Rovira i Virgili",
  authors: [{ name: "Aissam Khadraoui" }],
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="google-site-verification" content="BuUjUrMXjcobaS_shfW4lsUoMZ3teEvFnLiFf_0Gy9U" />
      </head>
      <body className={inter.className + ' h-screen'}>{children}</body>
    </html>
  );
}
