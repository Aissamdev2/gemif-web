// app/components/edit-main-post-client.tsx

'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateMainPost } from "@/app/lib/actions/main-posts/actions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useUser } from "@/app/lib/use-user";
import { useSubjects } from "@/app/lib/use-subjects";
import { useMainPost } from '@/app/lib/use-main-post';
import { User, Subject, MainPost, ErrorCode } from "@/app/lib/definitions";
import { CircleAlert, FileText, TriangleAlert, UploadCloud, X } from "lucide-react";
import MiniModal from "@/app/ui/mini-modal";
import ErrorPopup from '../../error-message';

type EditMainPostClientProps = {
  initialUser: User;
  initialSubjects: Subject[];
  initialMainPost: MainPost;
};

export default function EditMainPostClient({ initialUser, initialSubjects, initialMainPost }: EditMainPostClientProps) {
  const router = useRouter();
  const { user } = useUser({ fallbackData: initialUser });
  const { subjects } = useSubjects({ fallbackData: initialSubjects });
  const { data: mainPost } = useMainPost({ id: initialMainPost.id ?? '', fallbackData: initialMainPost });

  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>(initialMainPost.filenames || []);
  const [links, setLinks] = useState<string[]>(initialMainPost.links?.length ? initialMainPost.links : ['']);
  const [scoreSelectedOptionId, setScoreSelectedOptionId] = useState<string>(initialMainPost.subjectid || '11111111');
  const [inputKey, setInputKey] = useState(Date.now());
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);

  const changeMainPost = async (_: unknown, formData: FormData) => {
    formData.set('id', mainPost?.id || '');
    formData.set('type', mainPost?.type || '');

    if (mainPost?.type === 'link') {
      const linksString = links.filter(Boolean).join(',');
      formData.set('links', linksString);
    } else {
      for (const file of files) {
        if (existingFiles?.includes(file.name)) continue;
        formData.append("newFiles", file);
      }
      if (!mainPost) return { ok: false, success: 0, data: null, error: 'No se encontró el recurso', errorCode: null, details: [] };
      formData.set("folderName", mainPost.foldername || "");
      mainPost.filenames?.forEach(f => formData.append("originalFilenames", f));

      const removedFiles = mainPost?.filenames?.filter(f => !existingFiles.includes(f)) || [];
      formData.set('removed', JSON.stringify(removedFiles));
    }

    const result = await updateMainPost(formData);
    console.log(result);
    if ((result.ok || result.success > 0) && result.data) {
      console.log((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/main-posts/", mainPost?.id)
      console.log(result.data);
      await mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/main-posts/" + mainPost?.id, result.data);
    }
    return result;
  };

  const [state, dispatch] = useActionState(changeMainPost, undefined);

  useEffect(() => {
    if (state?.ok) {
      window.history.pushState({}, '', '/gemif/main/view-main-post/' + mainPost?.id);
    } else if (state?.error) {
      setErrorMessage({
        error: state.error,
        errorCode: state.errorCode ?? 'UNKNOWN_ERROR',
        details: state.details,
      });
    }
  }, [state, mainPost]);
  
  const handleScoreSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!subjects) return
    setScoreSelectedOptionId(event.target.value);
  };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);

    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      const newFiles = selected.filter(f => !existing.has(f.name + f.size));
      return [...prev, ...newFiles];
    });

    setInputKey(Date.now());
  }

  function handleRemoveNewFile(name: string, size: number) {
    setFiles(prev => prev.filter(f => !(f.name === name && f.size === size)));
  }

  function handleRemoveExistingFile(name: string) {
    setExistingFiles(prev => prev.filter(f => f !== name));
  }

  const emptyPost = mainPost ? (mainPost.type === 'link' && links.filter(Boolean).length === 0) || (mainPost.type === 'file' && existingFiles.length === 0 && files.length === 0) : false;
  const isUserAllowed = user?.role === 'dev' || user?.role === 'admin';

  return (
    <form
      action={dispatch}
      className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-full max-w-3xl h-[90vh] flex flex-col bg-white rounded-xl shadow-xl overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 shrink-0">
        <h4 className="text-lg font-bold text-gray-900 text-center">Editar publicación</h4>
      </div>

      {emptyPost && (
        <div className="p-4 bg-yellow-100 text-yellow-600 text-sm shrink-0 border-b border-yellow-300">
          <div className="flex items-start gap-2">
            <TriangleAlert className="min-w-[20px] h-5 w-5 mt-[2px]" />
            <div className="mt-[2px]">
              <strong className="block mb-1">{"Atención: "}</strong>
              <p>La publicación debe contener al menos un recurso, de lo contrario se eliminará</p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <ErrorPopup
          error={errorMessage.error}
          errorCode={errorMessage.errorCode}
          details={errorMessage.details}
          onClose={() => setErrorMessage(null)} />
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <input type="hidden" name="id" value={mainPost?.id} />
        <div className="flex flex-col md:flex-row justify-around gap-8 w-full">
          <div className="flex flex-col gap-4 w-full md:max-w-[48%]">
            <div className="relative">
              <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Título</label>
              <input
                type="text"
                name="name"
                defaultValue={mainPost?.name}
                className="block w-full pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
                placeholder="Añade un título"
              />
            </div>

            <div className="relative">
              <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Descripción</label>
              <textarea
                name="description"
                defaultValue={mainPost?.description}
                className="block w-full h-24 px-3.5 py-2 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed resize-none"
                placeholder="Escribe una descripción..."
              ></textarea>
            </div>

            <div className="flex flex-col grow">
              <label htmlFor="scoreOptions" className="flex items-center mb-1 text-slate-700 text-xs font-medium">Asignatura</label>
              <select
                id="scoreOptions"
                name="subjectid"
                value={scoreSelectedOptionId}
                onChange={handleScoreSelectChange}
                className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
              >
                <option value="11111111">General</option>
                {subjects?.filter((subject) => subject.primitiveid !== '00000000').map((subject) => (
                    <option key={subject.id + 'score'} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {mainPost?.type === 'file' ? (
            <div className="flex flex-col gap-5 w-full lg:w-fit md:h-auto bg-white p-0">
              <div className="relative flex items-center justify-center w-full">
                <div className="absolute right-0 top-0 z-[60]">
                  <MiniModal position="left">
                    <p>No subir demasiados archivos a la vez ({"<10"}), y cada archivo debe pesar menos de 20MB. Estos límites son orientativos, nada te lo impide pero con cuidado.</p>
                  </MiniModal>
                </div>
                <div
                  className="relative flex flex-col w-full h-80 border-2 border-dashed rounded-xl transition-colors duration-200 overflow-hidden border-gray-300 bg-gray-50"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedFiles = Array.from(e.dataTransfer.files ?? []);
                    setFiles((prev) => {
                      const existing = new Set(prev.map(f => f.name + f.size));
                      const unique = droppedFiles.filter(f => !existing.has(f.name + f.size));
                      return [...prev, ...unique];
                    });
                  }}
                >
                  <label htmlFor="dropzone-file" className="z-10 sticky top-0 flex flex-col items-center justify-center gap-1 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-blue-200 cursor-pointer">
                    <UploadCloud className="w-6 h-6 text-blue-500" />
                    <p className="text-sm text-blue-700 font-medium">Pulsa para añadir archivos o arrastra aquí</p>
                    <p className="text-xs text-gray-400">Puedes seleccionar varios archivos</p>
                  </label>
                  <input key={inputKey} id="dropzone-file" name="files" type="file" multiple className="hidden" onChange={handleFileChange} />
                  <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-2 gap-3">
                    {existingFiles.map((fileName) => (
                      <div key={fileName} className="flex items-start justify-between gap-2 p-2 rounded-md bg-white border border-blue-200 shadow-sm">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <FileText className="text-blue-500 w-4 h-4 mt-1 flex-shrink-0" />
                          <div className="flex flex-col min-w-0 text-xs text-blue-900">
                            <p className="font-medium truncate">{fileName}</p>
                            <p className="text-[10px] text-gray-500">Archivo existente</p>
                          </div>
                        </div>
                        <X className="text-red-500 hover:bg-red-100 w-4 h-4 mt-1 flex-shrink-0 cursor-pointer" onClick={() => handleRemoveExistingFile(fileName)} />
                      </div>
                    ))}
                    {files.map((file) => (
                      <div key={file.name + file.size} className="flex items-start justify-between gap-2 p-2 rounded-md bg-white border border-blue-200 shadow-sm">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <FileText className="text-blue-500 w-4 h-4 mt-1 flex-shrink-0" />
                          <div className="flex flex-col min-w-0 text-xs text-blue-900">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <X className="text-red-500 hover:bg-red-100 w-4 h-4 mt-1 flex-shrink-0 cursor-pointer" onClick={() => handleRemoveNewFile(file.name, file.size)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col w-full md:max-w-[48%]">
              <label className="mb-1 text-xs text-gray-600 font-medium">Enlaces</label>
              {links.map((lnk, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    name="links[]"
                    value={lnk}
                    onChange={(e) => {
                      const newLinks = [...links];
                      newLinks[i] = e.target.value;
                      setLinks(newLinks);
                    }}
                    className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg shadow-sm"
                    placeholder={`Enlace ${i + 1}`}
                  />
                  {links.length > 1 && (
                    <button type="button" onClick={() => setLinks(links.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-600 text-sm">
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setLinks([...links, ''])} className="text-blue-500 text-xs font-medium hover:underline">
                + Añadir enlace
              </button>
            </div>
          )}
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
        <UpdateButton emptyPost={emptyPost} disabled={!isUserAllowed} />
      </footer>
    </form>
  );
}

function UpdateButton({ emptyPost, disabled }: { emptyPost: boolean, disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending || disabled}
      type="submit"
      className={`${pending || disabled ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-[#2C5AA0] text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]`}
    >
      {pending ? 'Cargando...' : (emptyPost ? 'Eliminar publicación' : 'Actualizar')}
    </button>
  );
}