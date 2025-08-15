'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useMemo } from 'react';
import { deleteMainPost } from '@/app/lib/actions/main-posts/actions';
import { ErrorCode, MainPost, Subject, User } from '@/app/lib/definitions';
import { CircleAlert, X } from 'lucide-react';
import SubjectTag from '../../subject-tag';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useSubjects } from '@/app/lib/use-subjects';
import { useUser } from '@/app/lib/use-user';
import { useMainPost } from '@/app/lib/use-main-post';

type ViewMainPostClientProps = {
  initialUser: User;
  initialSubjects: Subject[];
  initialMainPost: MainPost;
};

export default function ViewMainPostClient({ initialUser, initialSubjects, initialMainPost }: ViewMainPostClientProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const removeMainPostWithData = async (_currentState: unknown, formData: FormData) => {
    formData.append('type', mainPost?.type || '');
    formData.append('path', mainPost?.foldername || '');
    return await deleteMainPost(formData);
  };

  const { user, error: userError } = useUser({ fallbackData: initialUser });
  const { subjects, error: subjectsError } = useSubjects({ fallbackData: initialSubjects });
  const { data: mainPost, error: postsError } = useMainPost({ fallbackData: initialMainPost, id: initialMainPost.id ?? '' });
  
  
  const [state, dispatch] = useActionState(removeMainPostWithData, undefined);
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: ErrorCode, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);


  const subject = useMemo(() => 
    mainPost?.subjectid === '11111111' 
      ? { id: '11111111', name: 'General', color: '#000000', bgcolor: '#ffffff', bordercolor: '#000000' } as Subject
      : subjects?.find(s => s.id === mainPost?.subjectid) as Subject,
    [subjects, mainPost]
  );
  
  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  }, []);

  useEffect(() => {
    if (state?.ok) {
      dialogRef.current?.close();
      router.back();
    } else if (state?.error) {
      setErrorMessage({
        error: state.error,
        errorCode: state.errorCode ?? 'UNKNOWN_ERROR',
        details: state.details,
      });
    }
  }, [state, router]);

  const isUserAllowed = user?.role === 'dev' || user?.role === 'admin';

  return (
      <form action={dispatch} className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-full max-w-3xl h-[90vh] flex flex-col bg-white rounded-xl shadow-xl overflow-hidden" aria-labelledby="modal-title">
  <header className="p-4 border-b border-gray-200 shrink-0 relative">
    <h4 id="modal-title" className="text-lg font-bold text-gray-900 text-center">Detalles de la publicación</h4>
    <button
      type="button"
      onClick={() => router.back()}
      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
      aria-label="Cerrar modal"
    >
      <X className="w-5 h-5 text-gray-500" />
    </button>
  </header>

  {errorMessage && (
    <div className="p-4 bg-red-100 text-red-700 text-sm shrink-0 border-b border-red-300 overflow-auto max-w-full break-words">
      <div className="flex items-start gap-2">
        <CircleAlert className="min-w-[20px] h-5 w-5 mt-[2px]" />
        <div className="mt-[2px] text-left break-words">
          <strong className="block mb-1 break-words">
            {errorMessage.errorCode + ': ' + errorMessage.error}
          </strong>
          {errorMessage.details && errorMessage.details.length > 0 &&
            errorMessage.details.map((detail: { name: string; success: boolean, error?: string | null }, idx: number) => (
              <p key={idx + detail.name} className="break-words">• {`${detail.name}: ${detail.error || 'Sin errores'}`}</p>
            ))}
        </div>
      </div>
    </div>
  )}

  <div className="flex-1 overflow-y-auto p-6">
    <input type="hidden" name="id" value={mainPost?.id} />
    <div className="flex flex-col md:flex-row md:justify-between gap-8 w-full">
      <div className="flex-1 flex flex-col gap-4">
        <div className="text-xl font-bold text-slate-800">{mainPost?.name}</div>
        {mainPost?.description && (
          <div className="text-sm text-slate-600 bg-gray-50 rounded-lg p-3">
            {mainPost.description}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {subject && (
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-700">Asignatura:</p>
            <SubjectTag subject={subject} />
          </div>
        )}

        {mainPost?.foldername && Array.isArray(mainPost.filenames) && mainPost.filenames.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Archivos:</p>
            <ul className="flex flex-col gap-1">
              {mainPost.filenames.map((filename, index) => {
                const fileUrl = `https://raw.githubusercontent.com/Aissamdev2/Archive/main/main-data/${mainPost.foldername}/${filename}`;
                return (
                  <li key={index + filename} className="text-blue-600 text-xs bg-blue-50 rounded-lg p-2 break-all max-w-sm truncate">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {filename}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {mainPost?.links && Array.isArray(mainPost.links) && mainPost.links.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Links:</p>
            <ul className="flex flex-col gap-1">
              {mainPost.links.map((link, index) => (
                <li key={index + link} className="text-blue-600 text-xs bg-blue-50 rounded-lg p-2 break-all max-w-sm truncate">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  </div>

  <footer className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
    <EditButton id={mainPost?.id} router={router} disabled={!isUserAllowed} />
    <DeleteButton disabled={!isUserAllowed} />
  </footer>
</form>
  );
}

function DeleteButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={disabled || pending}
      type="submit"
      className={`${disabled || pending ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-700'} w-full text-center p-2 rounded-md bg-red-600 text-white text-xs font-semibold transition-all duration-300`}
    >
      {pending ? 'Cargando...' : 'Eliminar'}
    </button>
  );
}

function EditButton({ id, router, disabled }: { id: string | undefined, router: AppRouterInstance, disabled: boolean }) {
  
  return (
    <button
      type="button"
      disabled={disabled }
      onClick={() => window.history.pushState(null, '', `/gemif/main/edit-main-post/${id}`)}
      className={`${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#3A7BC4]'} w-full text-center p-2 rounded-md bg-[#2C5AA0] text-white text-xs font-semibold transition-all duration-300`}
    >
      Editar
    </button>
  );
}