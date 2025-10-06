"use client";

import { LogOut } from "lucide-react";
import { logOut } from "../../actions/actions";
import { SanitizedAppError } from "@/lib/errors/types";
import { useActionState, useEffect, useState } from "react";
import { isSuccess } from "@/lib/errors/result";
import ErrorPopup from "@/app/ui/error-popup";
import { useRouter } from "next/navigation";

export default function ProfileClient() {

  const handleSubmit = async (_currentState: unknown, formData: FormData) => {
    return await logOut()
  }

  const [errorMessage, setErrorMessage] = useState<SanitizedAppError | null>(null);
  const [state, dispatch, pending] = useActionState(handleSubmit, undefined);

  const router = useRouter()

  useEffect(() => {
      if (!state) return
      if (isSuccess(state)) {
        router.push('/login')
      } else {
        setErrorMessage(state.error);
      }
    }, [state, router]);


  return (
    <form
      action={dispatch}
    >
      {errorMessage && (
        <ErrorPopup error={errorMessage} onClose={() => setErrorMessage(null)} />
      )}
      <button
        type="submit"
        className="flex items-center w-full gap-2 px-2 py-1 rounded-md cursor-pointer text-xs text-red-500 hover:text-red-700 hover:bg-red-100 transition-colors"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </form>
  );
}