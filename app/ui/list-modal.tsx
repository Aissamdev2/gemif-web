'use client'
import { createPortal } from "react-dom";
import { MainPost } from "../lib/definitions";

type Props = {
  post?: MainPost;
  type: 'link' | 'file';
  position: { top: number; left: number };
  onClose: () => void;
};

export default function ListModal({ post, type, position, onClose }: Props) {
  // Derive items and baseHref based on type
  const items = type === 'link' ? post?.links : post?.filenames;
  const baseHref = type === 'file' 
    ? `https://raw.githubusercontent.com/Aissamdev2/Archive/main/main-data/${post?.foldername}/` 
    : '';

  if (!items || items.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {/* Backdrop to capture outside clicks */}
      <div
        className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className="absolute bg-white border border-blue-200 shadow-xl rounded-lg p-3 w-[250px] max-h-[220px] animate-fade-in pointer-events-auto"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translateY(-10px)',
        }}
      >
        <p className="text-xs text-gray-500 mb-2 font-semibold">
          {type === 'file' ? 'Archivos:' : 'Enlaces:'}
        </p>
        
        <div className="grid grid-rows-3 grid-flow-col auto-cols-fr gap-1 overflow-auto max-h-[150px]">
          {items.map((item, index) => (
            <a
              key={index}
              href={type === 'file' ? `${baseHref}${item}` : item}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition truncate"
              onClick={e => e.stopPropagation()}
            >
              {item}
            </a>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="mt-2 w-full py-1 text-xs text-center text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body
  );
}