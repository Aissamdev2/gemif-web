import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GEMiFWeb URV: Matemáticas y Física",
  description:
    "Pagina web de GEMiF Grado en Ingeniería Matemática y Física, Universitat Rovira i Virgili (URV)",
  keywords:
    "Pagina web, Página web, web, etse, gemif, GEMIF, GEMiF, GEMIFWeb, gemifweb, matemáticas, fisica, matematicas, URV, Universitat Rovira i Virgili, estudiantes gemif, universitat rovira i virgili, enginyeria, matematica",
  applicationName: "GEMiF",
  authors: [{ name: "Aissam Khadraoui" }],
  openGraph: {
    title: "GEMiFWeb URV: Matemáticas y Física",
    description: "Pagina web de GEMiF, Universitat Rovira i Virgili (URV)",
    url: "https://gemif.es",
    siteName: "GEMiF",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "https://gemif.es/preview_og.png",
        width: 1200,
        height: 630,
        alt: "Comunidad GEMiF URV - Ingeniería Matemático-Física",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GEMiFWeb URV: Matemáticas y Física",
    description:
      "Pagina web de GEMiF Grado en Ingeniería Matemática y Física, Universitat Rovira i Virgili (URV)",
    images: ["https://gemif.es/preview_twitter.png"],
  },
  icons: [
    { rel: "icon", type: "image/ico", sizes: "64x64", url: "/favicon.ico" },
    { rel: "icon", type: "image/ico", sizes: "32x32", url: "/favicon-32x32.ico" },
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
    {
      rel: "apple-touch-icon",
      sizes: "144x144",
      type: "image/png",
      url: "/apple-touch-icon.png",
    },
  ],
  metadataBase: new URL("https://gemif.es"),
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
    },
  },

};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {



  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="application-name" content="GEMiF" />
        <meta property="og:site_name" content="GEMiF" />
        <JsonLdSiteNavigation />

      </head>
      
      <body className={"h-screen flex flex-col " + inter.className}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

// components/JsonLdSiteNavigation.tsx
function JsonLdSiteNavigation() {
  return (
    <script
      key="jsonld-sitenav"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "GEMiF",
          url: "https://gemif.es/",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://gemif.es/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
          mainEntity: {
            "@type": "ItemList",
            itemListElement: [
              {
                "@type": "SiteNavigationElement",
                name: "Iniciar sesión",
                url: "https://gemif.es/login",
              },
              {
                "@type": "SiteNavigationElement",
                name: "Registro",
                url: "https://gemif.es/register",
              },
            ],
          },
        }),
      }}
    />
  );
}

