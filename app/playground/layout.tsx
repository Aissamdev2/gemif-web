import Header from "./components/playground-header";

export const metadata = {
  title: "GEMiFWeb",
  robots: {
    index: false,
    follow: false,
  }
};

export const experimental_ppr = true

export default async function PlaygroundLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="flex flex-col max-h-screen">
      <Header />
      {children}
    </div>
  );
}