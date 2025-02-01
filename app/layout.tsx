import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Calendario GEMiF, URV",
  description: "Calendario de eventos para GEMiF, Universitat Rovira i Virgili (URV) NO OFICIAL",
  keywords: "Calendario, GEMiF, URV, Universitat Rovira i Virgili",
  authors: [{ name: "Aissam Khadraoui" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="google-site-verification" content="vRq6go1xrzjxByoh4eWmCoJJCefv6bCzcCfTFN8GSdo" />
      </head>
      <body className={inter.className + ' h-screen'}>{children}</body>
    </html>
  );
}
