import ErrorPage from "@/app/ui/error"
import { Suspense } from "react"
import VerifyEmailServer from "./components/verify-email-server"
import InfoBox from "@/app/components/info-box"

export default async function VerifyEmailStatic({ searchParams }: { searchParams: any }) {
  const token = (await searchParams).token as string | undefined
  if (!token) return <ErrorPage error="Enlace de verificación no válido" />

  return (
    <main className="section p-1 flex flex-col items-center h-full min-h-0">
      <section
        className="panel max-sm:w-xs max-md:w-sm w-md px-4 h-full flex flex-col items-start"
        aria-labelledby="verify-heading"
        id="verify-sent-form"
      >
        <div className="panel-header text-center w-full heading-md border-b border-border">
          Verificación de correo electrónico
        </div>
    
        <div className="panel-body w-full flex-1 overflow-y-auto p-3 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <InfoBox>
              Pulse el botón situado en la <span className="font-extrabold">parte inferior</span> para proceder con la verificación de su correo electrónico.
            </InfoBox>

            <InfoBox>
              Una vez completada correctamente la verificación, dispondrá de acceso pleno a la plataforma GEMiFWeb.
            </InfoBox>
          </div>
        </div>
    
        {/* Form Footer */}
        <div className="panel-footer w-full flex-none flex justify-center gap-2 items-center border-t border-border">
          <Suspense fallback={<Skeleton />} >
            <VerifyEmailServer token={token} />
          </Suspense>
        </div>
      </section>
    </main>
    
  )

}

function Skeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-center">
        <div className="text-muted">
          El correo electrónico que vas a verificar es:
        </div>
        <div className="text-muted">
          <div className="skeleton min-h-[16px] w-32" />
        </div>
      </div>
      <div  className="flex gap-2 items-center justify-center">
        <button type="submit" disabled className={`btn btn-primary pointer-events-none opacity-60`}>
          Verificar mi correo
        </button>
      </div>
    </div>
  )
}
