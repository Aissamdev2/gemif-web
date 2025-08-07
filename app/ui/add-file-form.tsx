'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { addHistoryItem } from '@/app/lib/actions/history/actions'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { CircleAlert, FileText, UploadCloud, X } from 'lucide-react'
import MiniModal from './mini-modal'

export default function AddFileForm({ fullPath }: { fullPath: string }) {

// SWR key used for fetching files
const KEY = `${(process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL)}/api/history`;

const createArchiveItem = async (_currentState: unknown, formData: FormData) => {
  formData.append('parentPath', fullPath);
  formData.append('type', 'file');
  for (const file of files) {
    formData.append('files', file)
  }

  const result = await addHistoryItem(formData);
  
  if (result.uploaded > 0) {
    const section = fullPath.split("/").shift();
    await mutate([KEY, section], (prev: any) => {
      if (!Array.isArray(prev)) return prev;

      const updated = structuredClone(prev);

      const targetPath = fullPath;

      const insertFiles = (nodes: any[]) => {
        for (const node of nodes) {
          if (node.path === targetPath) {
            node.children = node.children || [];

            if (!result.details) return;

            for (const f of result.details) {
              if (f.success) {
                node.children.push({
                  name: f.name,
                  path: `${targetPath}/${f.name}`,
                  type: "file"
                });
              }
            }

            node.children.sort((a: any, b: any) => a.name.localeCompare(b.name));
            return; // ✅ Exit after insertion
          }

          if (node.children?.length) insertFiles(node.children);
        }
      };

      insertFiles(updated);

      return updated;
    }, false);

  } 

  return result;
};


  const [state, formAction] = useFormState(createArchiveItem, undefined);
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null)

  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      router.back();
    } else if (state?.error) {
      setErrorMessage({
        error: state.error,
        errorCode: state.errorCode ?? 'UNKNOWN_ERROR',
        details: state.details,
      });
    }
  }, [state, router]);


  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prevFiles) => {
      const existingNames = new Set(prevFiles.map(file => file.name));
      const uniqueNewFiles = selected.filter(file => !existingNames.has(file.name));
      return [...prevFiles, ...uniqueNewFiles];
    });
  }

  return (
    <form action={formAction}  className="starting:scale-[0] scale-[1] transition-[transform] duration-300 max-w-3xl flex flex-col bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="p-4 border-b border-gray-200 shrink-0">
        <h4 className="text-lg font-bold text-gray-900 text-center">Añadir archivos</h4>
      </div>
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
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="relative flex items-center justify-center w-full">
          <div className="absolute right-0 top-0 z-[60]">
            <MiniModal position="left">
              <p>No subir demasiados archivos a la vez ({"<10"}), y cada archivo debe pesar menos de 20MB. Estos límites son orientativos, nada te lo impide pero con cuidado.</p>
            </MiniModal>
          </div>
          <div
            className="relative flex flex-col w-full h-80 border-2 border-dashed rounded-xl transition-colors duration-200 overflow-hidden
                      border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = Array.from(e.dataTransfer.files ?? []);
              setFiles((prevFiles) => {
                const existingNames = new Set(prevFiles.map(file => file.name));
                const uniqueNewFiles = dropped.filter(file => !existingNames.has(file.name));
                return [...prevFiles, ...uniqueNewFiles];
              });
            }}
          >
            {/* Sticky upload label */}
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

            {/* Fixed-height scrollable file grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-2 gap-3">
              {files.map((file, idx) => (
                <div
                  key={idx}
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
                    onClick={() =>
                      setFiles((prevFiles) =>
                        prevFiles.filter((f) => f.name !== file.name)
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <SubmitButton disabled={!files.length} />

      </div>
    </form>

  )
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending || disabled} type="submit" className={`${ pending || disabled ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-[#4A90E2] text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]`}>
      {pending ? 'Subiendo... Esto puede tardar' : 'Subir archivos'}
    </button>
  );
}