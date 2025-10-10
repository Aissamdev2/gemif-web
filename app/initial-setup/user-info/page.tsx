import FileUploader from "@/app/ui/file-uploader";
import { WelcomeOverlay } from "./components/welcome-overlay";
import InitialSetupUserInfoClient from "./components/initial-setup-user-info-client";
import InfoBox from "@/app/components/info-box";

export default async function Page() {

  return (
    <main className="section p-1 flex flex-col items-center h-full min-h-0">
      <section className="panel max-sm:w-xs max-md:w-sm w-md px-4 h-full flex flex-col">
          <h1 className="panel-header text-center w-full heading-md border-b border-border">Configuración inicial</h1>
          <WelcomeOverlay />
          <form className='flex-1 flex flex-col min-h-0'> 
            <div className='panel-body w-full flex-1 overflow-y-auto p-3 flex flex-col gap-4'>
              <InfoBox>
                Este es un procedimiento obligatorio. Sin embargo, toda información introducida podrá ser modificada posteriormente.
              </InfoBox>
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="name" className="label">
                    <div>
                      <p>Nombre público</p>
                      <p className="text-[11px] text-muted">Su nombre, este será público.</p>
                    </div>
                  </label>
                  <input id="public-name" name="publicName" className="input input-md w-full" placeholder="Ej. Micielo" />
                </div>
                <div>
                  <label htmlFor="name" className="label">
                    <div>
                      <p>Nombre completo</p>
                      <p className="text-[11px] text-muted">Su nombre y apelidos completos, tal y como aparecen en Moodle. Las mayúsculas o tildes no importan.</p>
                    </div>
                  </label>
                  <input id="name" name="name" className="input input-md w-full" placeholder="Ej. Víctor Diestre Moreno" />
                </div>
                <div>
                  <label htmlFor="year" className="label">
                    <div>
                      <p>Curso</p>
                      <p className="text-[11px] text-muted">Introduzca el año que esta cursando.</p>
                    </div>
                  </label>
                  <input type="number" min={1} max={4} step={1} name='year' className='input input-md' />
                </div>
                <div>
                  <label htmlFor="profilePicture" className="label">
                    <div>
                      <p>Foto de perfil <span className="text-[11px] text-muted">(opcional)</span></p>
                      <p className="text-[11px] text-muted">Suba una foto para su perfil.</p>
                    </div>
                  </label>
                  <FileUploader id="avatar" name="avatar" multiple={false} maxFileSizeMB={4.5} maxFiles={1} accept={[
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                    "image/gif",   // optional (animated)
                    "image/heic",  // iOS
                    "image/heif"   // iOS/HEIF
                  ]} />
                </div>
              </div>
            </div>
            <div className="panel-footer w-full flex-none flex justify-end gap-2 items-end border-t border-border p-3">
              <InitialSetupUserInfoClient />
            </div>
          </form>
      </section>
    </main>
  );
}

