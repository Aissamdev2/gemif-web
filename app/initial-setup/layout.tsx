import Footer from "../ui/footer/footer";

export const metadata = {
  title: "Configuración inicial - GEMiFWeb",
  description: "Antes de empezar, debes configurar tu cuenta",
  robots: {
    index: false,
    follow: false,
  }
};

export const experimental_ppr = true

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}