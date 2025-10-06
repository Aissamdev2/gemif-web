'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

export type FileUploaderProps = {
  id?: string;
  name?: string;
  multiple?: boolean;
  initial?: File[];
  existing?: string[];
  onChange?: (files: File[]) => void;
  onRemoveExisting?: (fileName: string) => void;
  maxFileSizeMB?: number;
  maxFiles?: number;
  accept?: string[]; // 👈 NEW
  className?: string;
};

export default function FileUploader({
  id = 'file-uploader',
  name = 'files',
  multiple = true,
  initial = [],
  existing = [],
  onChange,
  onRemoveExisting,
  maxFileSizeMB = 20,
  maxFiles = Infinity,
  accept,
  className = '',
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>(initial);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      const dataTransfer = new DataTransfer();
      files.forEach((file) => dataTransfer.items.add(file));
      inputRef.current.files = dataTransfer.files;
    }
    if (onChange) onChange(files);
  }, [files, onChange]);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const allowed = accept
        ? newFiles.filter(f => accept.includes(f.type))
        : newFiles;

      const unique = allowed.filter(
        f =>
          f.size / 1024 / 1024 <= maxFileSizeMB &&
          !files.some(existing => existing.name === f.name && existing.size === f.size) &&
          !existing.includes(f.name)
      );

      if (unique.length > 0) {
        setFiles(prev => {
          const next = [...prev, ...unique];
          return next.slice(0, maxFiles); // enforce maxFiles
        });
      }
    },
    [files, existing, maxFileSizeMB, accept, maxFiles]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    addFiles(Array.from(e.target.files));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  return (
    <div className={`flex flex-col border rounded-lg overflow-hidden ${className}`}>
      {/* Top bar */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
        <label
          htmlFor={id}
          className="cursor-pointer text-xs font-bold flex items-center gap-1.5 text-gray-700 dark:text-gray-200 hover:text-blue-500"
        >
          <UploadCloud size={14} strokeWidth={3} /> Seleccionar archivos
        </label>
        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
          Máx {maxFileSizeMB}MB {maxFiles ? `• Máx ${maxFiles} archivos` : ''}
        </p>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={e => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-4 cursor-pointer border-b 
          transition-colors duration-200 text-xs
          ${isDragging ? 'bg-blue-50 dark:bg-blue-900 border-blue-400' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}
        `}
      >
        <p className="text-gray-600 font-bold dark:text-gray-300 text-xs text-center">
          Arrastra archivos aquí o haz click para seleccionarlos
        </p>
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
        accept={accept?.join(',')} // 👈 multiple MIME types supported
      />

      {/* Existing files */}
      {existing.length > 0 && (
        <div className="p-2 bg-gray-50 dark:bg-gray-800">
          <p className="text-xs font-bold mb-1">Archivos preexistentes:</p>
          <div className="space-y-1 max-h-[6rem] overflow-y-auto">
            {existing.map(fileName => (
              <div
                key={fileName}
                className="flex items-center justify-between p-1 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
              >
                <p className="truncate text-xs text-gray-500 font-semibold flex-1 mr-2">{fileName}</p>
                <button
                  type="button"
                  onClick={() => onRemoveExisting?.(fileName)}
                  className="text-gray-500 hover:text-red-500 p-0.5"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New file list */}
      {files.length > 0 && (
        <div className="p-2 bg-gray-50 dark:bg-gray-800">
          <p className="text-xs font-bold mb-1">Archivos añadidos:</p>
          <div className="space-y-1 max-h-[7.5rem] overflow-y-auto">
            {files.map(file => (
              <div
                key={file.name}
                className="flex items-center justify-between p-1 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-1.5 truncate flex-1 mr-2">
                  <FileText size={12} strokeWidth={3} className="flex-shrink-0 text-gray-500" />
                  <p className="truncate text-xs text-gray-500 font-semibold ">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.name)}
                  className="text-gray-500 hover:text-red-500 p-0.5"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
