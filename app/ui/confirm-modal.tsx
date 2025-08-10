'use client';

import { CircleAlert } from "lucide-react";
import { useEffect } from "react";

export default function ConfirmModal({
  errorMessage,
  title,
  subtitle,
  color,
  isLoading,
  onCancel,
  onConfirm,
}: {
  errorMessage?: {  
    error: string, 
    errorCode: string, 
    details?: { name: string; success: boolean, error?: string | null }[] 
  } | null;
  title: string;
  subtitle: string;
  color?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  
  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl min-w-[20rem] text-center space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-800 break-words whitespace-pre-wrap">
          {title}
        </h2>
        <p className="text-sm text-gray-600 break-words whitespace-pre-wrap">
          {subtitle}
        </p>
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
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-white"
            //style={{ backgroundColor: color?? '#4A90E2' }}
          >
            {isLoading ? 'Cargando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
