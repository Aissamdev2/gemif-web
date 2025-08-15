'use client';

import { GitHubContent } from "../lib/definitions";
import FolderToggle from "./folder-toggle";
import { File, Trash2, LoaderCircle } from "lucide-react";
import { deleteHistoryItem } from "@/app/lib/actions/history/actions";
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { mutate } from "swr";
import { useEffect, useState } from "react";
import ConfirmModal from "./confirm-modal";
import { it } from "node:test";

const KEY = (process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL) + "/api/history";

const FileTree = ({ structure }: { structure: GitHubContent[] }) => {
  const [itemToDelete, setItemToDelete] = useState<{
    name: string;
    path: string;
    type: 'file' | 'folder';
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<{ 
    error: string, 
    errorCode: string, 
    details?: { name: string; success: boolean, error?: string | null }[] 
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const removeItem = async (_: unknown, formData: FormData) => {
    const path = formData.get("path") as string;
    const type = formData.get("type") as 'file' | 'folder';
    
    const section = path.split("/").shift();
    const res = await deleteHistoryItem(formData);

    if (res.ok || res.errorCode === "EXTERNAL_PARTIAL_DELETE") {
      mutate([KEY, section], (prev: any) => {
        if (!Array.isArray(prev)) return prev;

        const updated = structuredClone(prev);
        const removeNode = (nodes: any[]) => {
          return nodes.filter((node) => {
            if (node.path === path) return false;
            if (node.children) node.children = removeNode(node.children);
            return true;
          });
        };

        return removeNode(updated);
      }, false);
    }
    setIsDeleting(false)
    return res;
  };

  const [state, dispatch] = useActionState(removeItem, undefined);

  
  useEffect(() => {
    if (state?.ok === true) {
      setItemToDelete(null);
      setErrorMessage(null);
    } else if (state?.error) {
      setErrorMessage({
        error: state.error,
        errorCode: state.errorCode ?? 'UNKNOWN_ERROR',
        details: state.details,
      });
    }
  }, [state]);

  return (
    <>
      <ul>
        {structure.map((item) => (
          <li key={item.path}>
            
            {item.type === "tree" ? (
              <FolderToggle 
                title={item.name} 
                fullPath={item.path}
                onDeleteRequest={() => setItemToDelete({
                  name: item.name,
                  path: item.path,
                  type: 'folder'
                })}
              >
                <FileTree structure={item.children || []} />
              </FolderToggle>
            ) : item.name !== ".gitkeep" ? (
              <div className="flex items-center justify-between gap-2 bg-[#f9f9ff] border border-[#e0e7ff] 
                shadow-sm hover:shadow-md hover:border-blue-400 
                transition-all duration-200 ease-in-out px-2 py-1 rounded-md">
                <a
                  href={`https://raw.githubusercontent.com/Aissamdev2/Archive/main/${item.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 truncate min-w-0 flex-1"
                >
                  <File className="min-w-[20px] text-slate-700" />
                  <p className="truncate text-slate-700">{item.name}</p>
                </a>

                <button
                  onClick={() => setItemToDelete({
                    name: item.name,
                    path: item.path,
                    type: 'file'
                  })}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-all duration-200 ease-in-out"
                  title="Eliminar archivo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : structure.length === 1 && (
              <p className="max-w-full flex justify-start items-center p-1
                          rounded-md shadow-sm hover:shadow-md hover:border-blue-400 
                          transition-all duration-200 ease-in-out min-h-[30px] text-slate-500">Carpeta vacía</p>
              
            )}
          </li>
        ))}
      </ul>

      {itemToDelete && (
        <ConfirmModal
          errorMessage={errorMessage}
          title={`¿Eliminar ${itemToDelete.type === 'folder' ? 'carpeta' : 'archivo'} ${itemToDelete.name}?`}
          subtitle={itemToDelete.type === 'folder' 
            ? "Se eliminarán todos los archivos y carpetas dentro de ella. Esta acción no se puede deshacer."
            : "Esta acción no se puede deshacer."}
          color="#ef4444"
          isLoading={isDeleting}
          onCancel={() => {
            setItemToDelete(null);
            setErrorMessage(null);
          }}
          onConfirm={() => {
            setIsDeleting(true);
            const form = new FormData();
            form.set("path", itemToDelete.path);
            form.set("type", itemToDelete.type);
            dispatch(form);
          }}
        />
      )}
    </>
  );
};

export default FileTree;