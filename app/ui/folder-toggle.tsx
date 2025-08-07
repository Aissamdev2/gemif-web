'use client';

import { useEffect, useRef, useState } from "react";
import {
  FilePlus2,
  FolderPlus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import folderOpenAnimation from "@/public/open-folder.json";
import Lottie from "lottie-react";

const FolderToggle = ({
  title,
  children,
  fullPath,
  onDeleteRequest,
}: {
  title: string;
  children: React.ReactNode;
  fullPath: string;
  onDeleteRequest: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    if (lottieRef.current) {
      if (isOpen) {
        lottieRef.current.playSegments([0, 12], true);
      } else {
        lottieRef.current.playSegments([12, 0], true);
      }
    }
  }, [isOpen]);

  const toggleOpen = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    setIsOpen(e.currentTarget.open);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <details className="group" onToggle={toggleOpen}>
      <summary
        className="max-w-full flex justify-between items-center gap-2 p-1 cursor-pointer
                   rounded-md bg-[#ffffff] border border-[#e0e7ff]
                   shadow-sm hover:shadow-md hover:border-blue-400
                   transition-all duration-200 ease-in-out min-h-[30px]"
      >
        <div className="flex items-center gap-2 truncate">
          <div className="w-6 h-6 min-w-[24px]">
            <Lottie
              lottieRef={lottieRef}
              animationData={folderOpenAnimation}
              loop={false}
              autoplay={false}
            />
          </div>
          <span className="text-md text-slate-700 font-medium truncate">{title}</span>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`/gemif/history/add-file?path=${encodeURIComponent(fullPath)}`}
            className="text-green-600 hover:text-green-800 p-1 rounded"
            title="Crear Archivo"
            onClick={handleLinkClick}
          >
            <FilePlus2 className="w-4 h-4" />
          </Link>
          <Link
            href={`/gemif/history/add-folder?path=${encodeURIComponent(fullPath)}`}
            className="text-green-600 hover:text-green-800 p-1 rounded"
            title="Crear Carpeta"
            onClick={handleLinkClick}
          >
            <FolderPlus className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest();
            }}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-all duration-200 ease-in-out"
            title="Eliminar carpeta"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </summary>
      <div className="pl-6 truncate">{children}</div>
    </details>
  );
};

export default FolderToggle;