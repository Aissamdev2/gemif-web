'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { addHistoryItem } from '@/app/lib/actions/history/actions'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { CircleAlert } from 'lucide-react'

export default function AddFolderForm({ fullPath }: { fullPath: string }) {

// SWR key used for fetching files
const KEY = `${(process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL)}/api/history`;
const createArchiveItem = async (_currentState: unknown, formData: FormData) => {
  const parentPath = `${fullPath}`;
  const folderName = formData.get('folderName')?.toString();

  formData.append("parentPath", parentPath);
  formData.append("type", "folder");
  const section = fullPath.split("/").shift();

  const result = await addHistoryItem(formData);

  if (result.ok) {
    await mutate([KEY, section], (prev: any) => {
      if (!Array.isArray(prev)) return prev;

      const updated = structuredClone(prev);

      const insertFolder = (nodes: any[]) => {
        for (const node of nodes) {
          if (node.path === parentPath) {
            node.children = node.children || [];

            node.children.push({
              name: folderName,
              path: `${parentPath}/${folderName}`,
              type: "tree",
              children: [],
            });

            node.children.sort((a: any, b: any) => {
              if (a.type === b.type) return a.name.localeCompare(b.name);
              return a.type === "tree" ? -1 : 1;
            });

            return; // ✅ stop traversal after insertion
          }

          if (node.children?.length) insertFolder(node.children);
        }
      };

      insertFolder(updated);

      return updated;
    }, false);

  }

  return result;
};




  const [state, formAction] = useFormState(createArchiveItem, undefined);
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null)
  const router = useRouter()

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



  return (
    <form action={formAction}  className="starting:scale-[0] scale-[1] transition-[transform] duration-300 max-w-3xl flex flex-col bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="p-4 border-b border-gray-200 shrink-0">
        <h4 className="text-lg font-bold text-gray-900 text-center">Añadir nueva carpeta</h4>
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
        <div className="relative">
          <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Nombre de la carpeta<span className='text-red-500'>*</span></label>
          <input type="text" name="folderName"
            className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed"
            placeholder="Ingrese el nombre de la carpeta" required />
        </div>
        
        <SubmitButton />

      </div>
    </form>

  )
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} type="submit" className={`${ pending ? 'pointer-events-none opacity-30' : ''} w-full text-center p-1.5 py-2 rounded-md bg-[#2C5AA0] text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]`}>
      {pending ? 'Cargando...' : 'Crear carpeta'}
    </button>
  );
}
