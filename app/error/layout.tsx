
export const metadata = {
  title: "Error",
  description: "Ha ocurrido un error",
  robots: {
    index: false,
    follow: false,
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}