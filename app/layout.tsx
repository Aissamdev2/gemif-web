import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GEMiF URV: Matemàtiques i Física",
  description:
    "Pàgina no oficial del grau GEMiF (Enginyeria Matemàtica i Física) de la Universitat Rovira i Virgili (URV), Tarragona. Feta per la comunitat d'estudiants.",
  keywords:
    "Pàgina web, GEMiF, URV, Universitat Rovira i Virgili, Tarragona, Catalunya, enginyeria matemàtica, enginyeria física, estudiants URV, comunitat catalana, ciència a Catalunya",
  applicationName: "GEMiF",
  authors: [{ name: "Aissam Khadraoui" }],
  openGraph: {
    title: "GEMiF URV: Matemàtiques i Física",
    description:
      "Portal de la comunitat d'estudiants del grau GEMiF de la URV (Tarragona).",
    url: "https://gemif.cat",
    siteName: "GEMiF",
    locale: "ca_ES",
    type: "website",
    images: [
      {
        url: "https://gemif.cat/preview_og.png",
        width: 1200,
        height: 630,
        alt: "Comunitat GEMiF URV - Enginyeria Matemàtica i Física",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GEMiF URV: Matemàtiques i Física",
    description:
      "Portal de la comunitat d'estudiants del grau d'Enginyeria Matemàtica i Física de la URV (Catalunya).",
    images: ["https://gemif.cat/preview_twitter.png"],
  },
  icons: [
    { rel: "icon", type: "image/ico", sizes: "64x64", url: "/favicon-64x64.ico" },
    { rel: "icon", type: "image/ico", sizes: "32x32", url: "/favicon-32x32.ico" },
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
    { rel: "icon", type: "image/png", sizes: "64x64", url: "/favicon-64x64.png" },
    {
      rel: "apple-touch-icon",
      sizes: "144x144",
      type: "image/png",
      url: "/apple-touch-icon.png",
    },
  ],
  metadataBase: new URL("https://gemif.cat"),
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
    <html lang="ca">
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
          url: "https://gemif.cat/",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://gemif.cat/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
          mainEntity: {
            "@type": "ItemList",
            itemListElement: [
              {
                "@type": "SiteNavigationElement",
                name: "Iniciar sessió",
                url: "https://gemif.cat/login",
              },
              {
                "@type": "SiteNavigationElement",
                name: "Registre",
                url: "https://gemif.cat/register",
              },
            ],
          },
        }),
      }}
    />
  );
}
