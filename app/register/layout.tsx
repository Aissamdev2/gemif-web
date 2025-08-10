
export const metadata = {
  title: "Registrarse - GEMiFWeb",
  description: "Crea tu cuenta GEMiF para ver todo el contenido",
  robots: {
    index: true,
    follow: true,
  }
};


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}