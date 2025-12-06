import Footer from "../ui/footer/footer";

export const metadata = {
  title: "Verifica tu email - GEMiFWeb",
  description: "Verifica tu email GEMiF para ver todo el contenido",
  robots: {
    index: false,
    follow: false,
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}