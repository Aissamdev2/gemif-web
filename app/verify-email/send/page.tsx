import { Suspense } from "react"
import SendEmailServer from "./components/send-email-server"
import { Info } from "lucide-react"
import InfoBox from "@/app/components/info-box"

export default async function Page() {

  return (
    <main className="section p-1 flex flex-col items-center h-full min-h-0">
      <section
        className="panel max-sm:w-xs max-md:w-sm w-md px-4 h-full flex flex-col items-start"
        aria-labelledby="verify-heading"
        id="verify-sent-form"
      >

        <h1 className="panel-header text-center w-full heading-md border-b border-border">
          Verificación de correo electrónico
        </h1>


        <div className="panel-body w-full flex-1 overflow-y-auto p-3 flex flex-col gap-6">
          <div className="flex flex-col gap-2">

            <h2 id="verify-heading" className="heading-md">Hemos enviado un correo de verificación a tu bandeja.</h2>
            <div className="flex flex-col gap-3">

              <InfoBox>
                Por motivos de seguridad, cada mensaje de verificación tiene una vigencia limitada de <span className="font-extrabold">una hora</span> desde su envío.
              </InfoBox>

              <InfoBox important>
                Con el fin de reforzar la seguridad, la verificación del correo electrónico únicamente puede realizarse desde un dispositivo en el que se haya iniciado sesión con anterioridad.
              </InfoBox>

              <InfoBox>
                Una vez haya confirmado la recepción del mensaje, podrá cerrar esta pestaña con total tranquilidad.
              </InfoBox>

            </div>

          </div>

        </div>

        <div className="panel-footer w-full flex-none flex justify-center gap-2 items-center border-t border-border">
          <Suspense fallback={<Skeleton />}>
            <SendEmailServer />
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
          El correo al que se ha enviado la verificación es:
        </div>
        <div className="text-muted">
          <div className="skeleton min-h-[16px] w-32" />
        </div>
      </div>
      <div  className="flex gap-2 items-center justify-center">
        <p className='text-muted'>¿No has recibido el correo?</p>
        <button type="submit" className="btn btn-primary">
          Reenviar
        </button>
      </div>
    </div>
  )
}
