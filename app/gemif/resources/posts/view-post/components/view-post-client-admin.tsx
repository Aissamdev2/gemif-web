'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SanitizedAppError } from '@/lib/errors/types';
import { isSuccess } from '@/lib/errors/result';
import ErrorPopup from '@/app/ui/error-popup';
import { deleteResourcesPost } from '../actions/actions';



export default function ViewPostClientAdmin({ id, folderName, fileNames }: { id: string, folderName: string, fileNames: string[] }) {
  
  const router = useRouter();

  const handleSubmit = async (_currentState: unknown, formData: FormData) => {
    const res = await deleteResourcesPost(formData);
    return res
  };

  const [state, dispatch, pending] = useActionState(handleSubmit, undefined);
  const [errorMessage, setErrorMessage] = useState<SanitizedAppError | null>(null);
  
  useEffect(() => {
    if (!state) return
    if (isSuccess(state)) {
      router.push('gemif/resources/posts')
    } else {
      setErrorMessage(state.error);
    }
  }, [state, router]);

  return (
    <form action={dispatch} className="panel-footer w-full flex-none flex justify-start gap-2 items-center border-t border-border">
      {errorMessage && (
        <ErrorPopup 
          error={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="folderName" value={folderName} />
      <input type="hidden" name="fileNames" value={JSON.stringify(fileNames)} />
      <button type="button" onClick={() => router.back()} className="btn btn-secondary">
        Cerrar
      </button>
      <button type="submit" disabled={pending} className="btn btn-danger">
        {pending ? 'Cargando...' : 'Eliminar publicación'}
      </button>
      <Link href={`/gemif/resources/posts/edit-post/${id}`} className="btn btn-primary">
        Editar publicación
      </Link>
    </form>
  );
}
