
import Link from 'next/link'
import { VscGithubInverted } from "react-icons/vsc";
import LoginClient from './components/login-client'


export default function Page() {

  return (
    <main className="section p-1 flex flex-col items-center h-full min-h-0">
      <form
        className="panel max-sm:w-xs max-md:w-sm w-md px-4 h-full flex flex-col"
        aria-labelledby="login-heading"
        id="login-form"
      >
        <h1 className="panel-header w-full text-center heading-md border-b border-border flex-none">
          Inicia sessió
        </h1>

        {/* Scrollable Container with body + footer */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Scrollable Body */}
          <div className="panel-body w-full flex-1 overflow-y-auto p-3 flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="label">
                  <div>
                    <p>Correu electrònic</p>
                    <p className='text-[11px] text-muted'>Introdueix el teu correu electrònic.</p>
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
                <label htmlFor="password" className="label">
                  <div>
                    <p>Contrasenya</p>
                    <p className='text-[11px] text-muted'>Escriu la teva contrasenya.</p>
                  </div>
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  autoComplete="current-password"
                  className="input input-md w-full"
                />
              </div>

              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                  <input id="remember" name="remember" type="checkbox" className="h-4 w-4 rounded" />
                  <label htmlFor="remember" className="text-body">Recorda&apos;m en aquest dispositiu</label>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="w-full border-t border-border" />

            {/* Alternate Sign-in */}
            <div className="w-full flex flex-col items-center gap-3">
              <p className="text-muted">Inicia sessió amb altres mètodes</p>
              <button
                type="button"
                className="btn btn-md btn-secondary flex items-center gap-2 px-4 py-2"
                aria-label="Iniciar sesión con GitHub"
              >
                <span aria-hidden>
                  <VscGithubInverted className="w-5 h-5" />
                </span>
                <span className="hidden sm:inline">GitHub</span>
              </button>
            </div>
          </div>

          {/* Sticky Footer (inside scrollable container) */}
          <div className="panel-footer w-full flex-none flex justify-between gap-2 items-end border-t border-border p-3">
            <div className='flex flex-col items-center justify-end gap-1'>
              <p className='text-muted'>¿No tens compte?</p>
              <Link href="/register" className="btn btn-secondary">
                Crear compte
              </Link>
            </div>
            <LoginClient />
          </div>
        </div>
      </form>
    </main>

  );
}
