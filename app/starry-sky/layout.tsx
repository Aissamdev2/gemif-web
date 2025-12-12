export const metadata = {
  title: "Starry Sky",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StarrySkyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col max-h-screen py-3">
      <main className="overflow-hidden h-fit sm:h-screen w-screen p-4 bg-bg overflow-y-hidden">
        {children}
      </main>
    </div>
  );
}
