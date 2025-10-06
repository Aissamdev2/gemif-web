'use client'

import { useEffect, useRef, useState } from "react"
import { logOut } from "../../gemif/actions/actions"
import { useRouter } from "next/navigation";
import { SanitizedAppError } from "@/lib/errors/types";
import { isSuccess } from "@/lib/errors/result";
import ErrorPopup from "@/app/ui/error-popup";
import { resolve } from "path";

// app/logout/page.tsx
export default function LogOutClient() {
  const [loggingOut, setLoggingOut] = useState(true);
  const [errorMessage, setErrorMessage] = useState<SanitizedAppError | null>(null);
  const router = useRouter()

  let success = useRef(false);

  useEffect(() => {
    (async () => {
      await Promise.resolve((resolve: any, reject: any) => setTimeout(resolve, 5000))
      const result = await logOut();
      setLoggingOut(false)
      if (isSuccess(result)) {
        success.current = true;
        router.push('/login')
      } else {
        success.current = false;
        setErrorMessage(result.error)
      }
    })();
  }, [router])

  console.log({ loggingOut, success })

  return (
    <>
      {errorMessage && (
        <ErrorPopup error={errorMessage} onClose={() => setErrorMessage(null)} />
      )}

      {
        loggingOut ? (
          <>
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <h1 className="text-body">Cerrando sesión... Espere...</h1>
          </>
        ) : success.current ? (
          <p className="text-body text-center max-w-xs">
            La sesión se ha cerrado correctamente.
          </p>
        ) : (
          <>
            <p className="text-body text-center max-w-xs">
              No se pudo cerrar la sesión.
            </p>
            <button onClick={() => router.back()} className="btn btn-primary btn-md">
              Volver
            </button>
          </>
        )
      }
    </>
  )
}
