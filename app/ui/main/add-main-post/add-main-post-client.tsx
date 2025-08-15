'use client'

import { addMainPost } from "@/app/lib/actions/main-posts/actions";
import { CircleAlert, FileText, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { mutate } from "swr";
import { Subject, User } from "../../../lib/definitions"; // Assume these types exist
import MiniModal from "../../mini-modal";
import { useUser } from "@/app/lib/use-user";
import { useSubjects } from "@/app/lib/use-subjects";
import ErrorPage from "../../error";

type AddMainPostClientProps = {
  initialUser: User;
  initialSubjects: Subject[];
};

export default function AddMainPostClient({ initialUser, initialSubjects }: AddMainPostClientProps) {

  // The `addMainPost` action is now a pure server action.
  // We'll bind the state to it before calling it.
  const addMainPostWithData = async (_currentState: unknown, formData: FormData) => {
    formData.append('type', selected);
    const linksString = links.join(',');
    formData.append('links', linksString);

    for (const file of files) {
      formData.append('files', file);
    }
    
    // Server action logic
    const result = await addMainPost(formData);
    
    if (result.uploaded > 0 && result.data) {
      // Revalidate cache with SWR, if still needed.
      // With Next.js Server Actions, you might use revalidatePath or revalidateTag instead.
      // This is a choice based on your application's data management strategy.
      await mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/main-posts", result.data);
    }
    
    return result;
  };
  

  const { user, error: userError } = useUser({ fallbackData: initialUser });
  const { subjects, error: subjectsError } = useSubjects({ fallbackData: initialSubjects });

  const router = useRouter();
  const [state, dispatch] = useActionState(addMainPostWithData, undefined);
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState<'file' | 'link'>('file');
  const [selectedId, setSelectedId] = useState<string | undefined>('11111111');
  const [links, setLinks] = useState<string[]>([''])
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  
  // Accessibility: Focus management
  useEffect(() => {
    // Open the dialog when the component mounts
    if (dialogRef.current) {
      dialogRef.current.showModal();
      // Set focus to the title input
      titleInputRef.current?.focus();
    }
    
    // Close the dialog and navigate back on a successful state
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

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const addLink = () => {
    setLinks([...links, '']);
  };

  const removeLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks);
  };

  const handleScoreSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedId(event.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    setFiles((prevFiles) => {
      const existingNames = new Set(prevFiles.map(file => file.name));
      const uniqueNewFiles = selectedFiles.filter(file => !existingNames.has(file.name));
      return [...prevFiles, ...uniqueNewFiles];
    });
  };

  const removeFile = (fileName: string) => {
    setFiles((prevFiles) => prevFiles.filter((f) => f.name !== fileName));
  };
  

  const isUserAllowed = user?.role === 'dev' || user?.role === 'admin';


  if (!user || userError) return <ErrorPage error={userError ?? 'Error al recuperar el usuario'} />;
  if (!subjects || subjectsError) return <ErrorPage error={subjectsError ?? 'Error al recuperar las asignaturas'} />;

  return (
      <form action={dispatch} className="starting:scale-[0] scale-[1] transition-[transform] duration-300 h-[90vh] flex flex-col bg-white rounded-xl shadow-xl overflow-hidden" aria-labelledby="modal-title">
  <header className="p-4 border-b border-gray-200 shrink-0 relative">
    <h4 id="modal-title" className="text-lg font-bold text-gray-900 text-center">Añadir nueva publicación</h4>
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
            errorMessage.details.map((detail, idx) => (
              <p key={idx + detail.name} className="break-words">• {`${detail.name}: ${detail.error || 'Sin errores'}`}</p>
            ))}
        </div>
      </div>
    </div>
  )}

  <div id="modal-description" className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
    <div className="flex justify-center">
      <div className="flex w-fit overflow-hidden rounded-full border border-gray-300 shadow-sm">
        <button
          onClick={() => setSelected('file')}
          className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
            selected === 'file' ? 'bg-[#2C5AA0] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          type="button"
        >
          Archivo
        </button>
        <button
          onClick={() => setSelected('link')}
          className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
            selected === 'link' ? 'bg-[#2C5AA0] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          type="button"
        >
          Enlace
        </button>
      </div>
    </div>

    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative">
          <label htmlFor="title-input" className="flex items-center mb-1 text-gray-600 text-xs font-medium">Título <span className='text-red-500'>*</span></label>
          <input
            type="text"
            id="title-input"
            name="name"
            ref={titleInputRef}
            className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
            placeholder="Añade un título"
            aria-required="true"
          />
        </div>
        <div className="relative">
          <label htmlFor="description-input" className="flex items-center mb-1 text-gray-600 text-xs font-medium">Descripción</label>
          <textarea
            id="description-input"
            name="description"
            className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
            placeholder="Escribe una descripción..."
          ></textarea>
        </div>
        <div className="flex flex-col">
          <label htmlFor="subject-select" className="flex items-center mb-1 text-gray-600 text-xs font-medium">Asignatura</label>
          <select
            id="subject-select"
            name="subjectid"
            value={selectedId}
            onChange={handleScoreSelectChange}
            className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
          >
            <option value="11111111">General</option>
            {subjects.filter((subject) => subject.primitiveid !== '00000000').map((subject) => (
              <option key={subject.id + 'score'} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1">
        {selected === 'file' && (
          <div className="flex flex-col gap-5 w-full md:h-auto bg-white p-0">
            <div className="relative flex items-center justify-center w-full">
              <div className="absolute right-0 top-0 z-[60]">
                <MiniModal position="left">
                  <p>No subir demasiados archivos a la vez (&lt;10), y cada archivo debe pesar menos de 20MB. Estos límites son orientativos, nada te lo impide pero con cuidado.</p>
                </MiniModal>
              </div>
              <div
                className="relative flex flex-col w-full h-80 border-2 border-dashed rounded-xl transition-colors duration-200 overflow-hidden border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFiles = Array.from(e.dataTransfer.files ?? []);
                  handleFileChange({
                    target: { files: droppedFiles as any }, // Cast to any to match event type
                  } as React.ChangeEvent<HTMLInputElement>);
                }}
              >
                <label
                  htmlFor="dropzone-file"
                  className="z-10 sticky top-0 flex flex-col items-center justify-center gap-1 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-blue-200 cursor-pointer dark:bg-gray-800 dark:border-gray-600"
                >
                  <UploadCloud className="w-6 h-6 text-blue-500 dark:text-blue-300" />
                  <p className="text-sm text-blue-700 dark:text-blue-100 font-medium">
                    Pulsa para añadir archivos o arrastra aquí
                  </p>
                  <p className="text-xs text-gray-400">Puedes seleccionar varios archivos</p>
                </label>

                <input
                  id="dropzone-file"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-2 gap-3">
                  {files.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-start justify-between gap-2 p-2 rounded-md bg-white border border-blue-200 shadow-sm dark:bg-gray-800 dark:border-blue-700"
                    >
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <FileText className="text-blue-500 w-4 h-4 mt-1 flex-shrink-0" />
                        <div className="flex flex-col min-w-0 text-xs text-blue-900 dark:text-blue-100">
                          <p className="font-medium truncate overflow-hidden whitespace-nowrap">{file.name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-300">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <X
                        className="text-red-500 w-4 h-4 mt-1 flex-shrink-0 cursor-pointer"
                        onClick={() => removeFile(file.name)}
                        aria-label={`Eliminar archivo ${file.name}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {selected === 'link' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Opciones</h3>
            {links.map((lnk, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  name={`links[]`}
                  value={lnk}
                  onChange={(e) => handleLinkChange(i, e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg shadow-sm"
                  placeholder={`Opción ${i + 1}`}
                />
                {links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    className="text-red-500 hover:text-red-600 text-sm"
                    aria-label={`Eliminar enlace ${i + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addLink}
              className="text-blue-500 text-xs font-medium hover:underline"
            >
              + Añadir opción
            </button>
          </div>
        )}
      </div>
    </div>
  </div>

  <footer className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
    <button
      onClick={() => router.back()}
      type="button"
      className="w-full text-center p-1.5 py-2 rounded-md bg-white text-black text-xs font-medium transition-all duration-300 border hover:border-gray-400"
    >
      Cancelar
    </button>
    <AddButton disabled={!isUserAllowed} />
  </footer>
</form>
)
}

function AddButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending || disabled}
      type="submit"
      className={`${pending || disabled ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-[#2C5AA0] text-white text-xs font-medium transition-all duration-300 hover:bg-[#3A7BC4]`}
    >
      {pending ? 'Cargando...' : 'Crear Publicación'}
    </button>
  );
}