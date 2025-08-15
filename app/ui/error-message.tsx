'use client';

import { CircleAlert, X } from 'lucide-react';
import { useEffect } from 'react';

type ErrorDetail = { name: string; success: boolean; error?: string | null };

type ErrorPopupProps = {
  error: string;
  errorCode?: string;
  details?: ErrorDetail[];
  onClose: () => void;
};

export default function ErrorPopup({ error, errorCode = 'UNKNOWN_ERROR', details = [], onClose }: ErrorPopupProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      {/* Popup */}
      <div
        className="relative z-10 w-[90%] max-w-lg bg-red-600 text-white rounded-xl shadow-xl p-5 overflow-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white hover:bg-red-500 rounded-full p-1 transition"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3">
          <CircleAlert className="w-6 h-6 flex-shrink-0 mt-[2px]" />
          <div>
            <strong className="block mb-2 break-words">{errorCode}: {error}</strong>
            {details.length > 0 && (
              <div className="space-y-1 text-sm">
                {details.map((d, idx) => (
                  <p key={idx}>{`• ${d.name}: ${d.error || 'Sin errores'}`}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
