'use client';

import { CircleAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppError, Resource, SanitizedAppError } from '@/lib/errors/types';


type ErrorPopupProps = {
  error: SanitizedAppError;
  onClose: () => void;
};

const SUMMARY_ERROR_CODES = [
  {
    errorCode: 'TOO_MANY_RETRIES',
    text: "Mostrar errores de cada intento"
  },
]


export default function ErrorPopup<R extends Resource = Resource>({ error, onClose }: { error: SanitizedAppError<R>, onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  // Trigger the falling animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 top-0 left-1/2 transform -translate-x-1/2 z-[200] py-4 w-full pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/10 backdrop-blur-xs pointer-events-auto"
        onClick={onClose}
      ></div>

      {/* Popup */}
      <div
        className={`relative h-full mx-auto z-10 panel max-sm:w-sm max-md:w-md w-lg px-4 flex flex-col pointer-events-auto
          transform transition-all duration-500 ease-out
          ${visible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (fixed inside popup) */}
        <div className="panel-header w-full flex items-center justify-center gap-2 border-b border-border flex-none py-3 bg-white sticky top-0 z-10">
          <CircleAlert className="w-5 h-5 text-danger-dark" />
          <h1 className="heading-md text-danger-dark">Ocurrió un error</h1>
        </div>

        {/* Main scrollable content */}
        <div className="flex-1 overflow-y-auto py-4">
          <ErrorMessage error={error} />
        </div>

        {/* Footer (fixed bottom inside popup) */}
        <div className="panel-footer w-full flex-none flex justify-end items-center border-t border-border p-3 bg-white sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cerrar mensaje de error
          </button>
        </div>
      </div>
    </div>

  );
}


function ErrorMessage<R extends Resource = Resource>({ error }: { error: SanitizedAppError<R> }) {
  const summaryText =
    SUMMARY_ERROR_CODES.find((e) => e.errorCode === error.code)?.text ??
    "Mostrar cadena de suberrores";

  return (
    <div className="flex flex-col gap-1 px-2 bg-red-100 rounded p-2">
      <div className="flex flex-col border border-red-300 bg-red-200 rounded p-1">
        {/* Code */}
        <p className="text-body">
          <span className="font-extrabold">Código:</span>{" "}
          <code className="px-1 py-0.5 rounded bg-gray-200">{error.code}</code>
        </p>

        {/* Message */}
        <p className="text-body">
          <span className="font-extrabold">Mensaje:</span> {error.message}
        </p>

        {/* Details */}
        {error.details && (
          <p className="text-body">
            <span className="font-extrabold">Detalles:</span> {error.details}
          </p>
        )}

        {/* Raw */}
        {error.raw && (
          <p className="text-body break-all">
            <span className="font-extrabold">Raw:</span> {error.raw}
          </p>
        )}

        {/* Resource */}
        {error.resource && (
          <details className="mt-1">
            <summary className="cursor-pointer text-body hover:underline">
              Recurso afectado
            </summary>
            <div className="ml-2 flex flex-col gap-1 text-body">
              {Object.entries(error.resource).map(([key, value]) => {
                if (key === 'kind') return null
                return (
                  <p key={key}>
                    <span className="font-extrabold">{key}:</span>{" "}
                    {String(value)}
                  </p>
                )})}
            </div>
          </details>
        )}
      </div>

      {/* Parallel errors */}
      {error.parallelErrors &&
        Array.isArray(error.parallelErrors) &&
        error.parallelErrors.length > 0 && (
          <details className="flex flex-col gap-1 mt-1">
            <summary className="text-body cursor-pointer hover:underline">
              {summaryText}
            </summary>
            {error.parallelErrors.map((e, i) => (
              <div key={e.code + e.message + i} className="ml-2">
                <ErrorMessage error={e} />
              </div>
            ))}
          </details>
        )}
    </div>
  );
}
