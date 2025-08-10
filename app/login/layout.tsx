
export const metadata = {
  title: "Iniciar sesión - GEMiFWeb",
  description: "Accede a tu cuenta GEMiF para ver todo el contenido",
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