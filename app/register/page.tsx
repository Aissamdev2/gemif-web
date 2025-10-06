import Link from 'next/link'
import RegisterClient from './components/register-client'

export default function Page() {


  return (
    <main className="section p-1 flex flex-col items-center h-full min-h-0">
      <form className="panel max-sm:w-sm max-md:w-lg w-2xl px-4 h-full flex flex-col items-start">
        {/* Title */}
        <div className="panel-header w-full text-center heading-md border-b border-border">
          Registrarse
        </div>
        {/* Scrollable Form */}
        <div className="panel-body w-full flex-1 overflow-y-auto p-3 flex flex-col gap-8">
          {/* Left/Right Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="label">
                  <div>
                    <p>Correo electrónico</p>
                    <p className="text-[11px] text-muted">Debe ser un correo electrónico válido capaz de recibir correos electrónicos.</p>
                  </div>
                </label>
                <input
                  type="text"
                  name="email"
                  id="email"
                  autoComplete="email"
                  className="input input-md w-full"
                />
              </div>
              <div>
                <label htmlFor="confirmEmail" className="label">
                  <div>
                    <p>Confirma tu correo electrónico</p>
                    <p className="text-[11px] text-muted">Vuelve a escribir tu correo.</p>
                  </div>
                </label>
                <input
                  type="text"
                  name="confirmEmail"
                  id="confirmEmail"
                  autoComplete="email"
                  className="input input-md w-full"
                />
              </div>
            </div>
            {/* Right Column */}
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="password" className="label">
                  <div>
                    <p>Crea tu contraseña</p>
                    <p className="text-[11px] text-muted">Mín 4 caracteres. Sin embargo, se recomienda una contraseña fuerte.</p>
                  </div>
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  autoComplete="new-password"
                  className="input input-md w-full"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="label">
                  <div>
                    <p>Confirma tu contraseña</p>
                    <p className="text-[11px] text-muted">Vuelve a escribir tu contraseña.</p>
                  </div>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  autoComplete="new-password"
                  className="input input-md w-full"
                />
              </div>

              <div>
                <label htmlFor="key" className="label">
                  <div>
                    <p>Clave</p>
                    <p className="text-[11px] text-muted">Clave de acceso.</p>
                  </div>
                </label>
                <input
                  type="password"
                  name="key"
                  id="key"
                  className="input input-md w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="panel-footer w-full flex-none flex justify-between gap-2 items-end border-t border-border">
          <div className='flex flex-col items-center justify-end gap-1'>
            <p className='text-muted' >Ya tienes cuenta?</p>
            <Link href="/login" className="btn btn-secondary">
              Iniciar sesión
            </Link>
          </div>
          <RegisterClient />
        </div>
      </form>
    </main>
  )
}
