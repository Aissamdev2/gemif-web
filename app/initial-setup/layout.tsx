
export const metadata = {
  title: "Configuración inicial - GEMiFWeb",
  description: "Antes de empezar, debes configurar tu cuenta",
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