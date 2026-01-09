import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Starry Sky",
  description:
    "Pàgina del projecte Starry Sky",
  openGraph: {
    title: "Starry Sky",
    description:
      "Pàgina del projecte Starry Sky",
    url: "https://gemif.cat/starry-sky",
    siteName: "Starry Sky",
    locale: "ca_ES",
    type: "website",
    images: [
      {
        url: "https://gemif.cat/preview_starry_og.png",
        width: 1200,
        height: 630,
        alt: "Starry Sky",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Starry Sky",
    description:
      "Pàgina del projecte Starry Sky.",
    images: ["https://gemif.cat/preview_starry_twitter.png"],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function StarrySkyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col max-h-screen ">
      <main className="overflow-hidden h-fit sm:h-screen w-screen bg-bg overflow-y-hidden">
        {children}
      </main>
    </div>
  );
}
