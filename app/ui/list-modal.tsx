'use client'
import { createPortal } from "react-dom";

type Props = {
  names: string[];
  baseHref: string;
  position: { top: number; left: number };
  onClose: () => void;
};

export default function ListModal({ names, baseHref, position, onClose }: Props) {
  return createPortal(
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {/* Backdrop to capture outside clicks */}
      <div
        className="absolute inset-0 bg-transparent pointer-events-auto"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      />
      
      {/* Modal */}
      <div
        className="absolute bg-white border border-[#DCEBFF] shadow-xl rounded-lg p-3 w-[250px] animate-fade-in pointer-events-auto"
        style={{
          top: position.top - 10, // shift upward
          left: position.left,
        }}
        onMouseDown={(e) => {
          e.stopPropagation(); // allow interaction inside modal only
        }}
      >
        <p className="text-xs text-gray-500 mb-2 font-semibold">Recursos:</p>
        <div className="grid grid-rows-3 grid-flow-col auto-cols-fr gap-1 max-h-[180px] overflow-auto">
          {names.map((name, index) => (
            <a
              key={index}
              href={`${baseHref}${name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 rounded transition truncate"
            >
              {name}
            </a>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
