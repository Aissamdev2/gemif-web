import Header from "./components/playground-header";

export const metadata = {
  title: "Starry Sky",
  robots: {
    index: false,
    follow: false,
  }
};

export default async function PlaygroundLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="flex flex-col max-h-screen py-3">
      {children}
    </div>
  );
}