import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GEMiFWeb URV: Matemáticas y Física | Comunidad de Estudiantes",
  description: "Pagina web de GEMiF, Universitat Rovira i Virgili (URV) NO OFICIAL",
  keywords: "Pagina web, Página web, web, gemif, GEMIF, GEMiF, GEMIFWeb, gemifweb, matemáticas, fisica, matematicas, URV, Universitat Rovira i Virgili, estudiantes gemif",
  applicationName: "GEMiFWeb URV",
  authors: [{ name: "Aissam Khadraoui" }],
  openGraph: {
    title: "GEMiFWeb URV: Matemáticas y Física | Comunidad de Estudiantes",
    description: "Pagina web de GEMiF, Universitat Rovira i Virgili (URV) NO OFICIAL",
    url: "https://gemif-web.vercel.app",
    siteName: "GEMiFWeb URV",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GEMiF URV: Recursos para Ingenieros Matemático-Físicos",
    description: "Apuntes, tutoriales y apoyo académico para estudiantes de GEMiF en la URV",
    images: ["https://your-project.vercel.app/twitter-image.jpg"],
  },
  icons: [
    {
      rel: "icon",
      type: "image/ico",
      sizes: "64x64",
      url: "/favicon.ico",
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      type: "image/png",
      url: "/apple-touch-icon.png",
    },
  ],
  metadataBase: new URL("https://gemif-web.vercel.app"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    }
  },
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
