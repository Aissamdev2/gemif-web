'use client'

import FileUploader from "@/app/ui/file-uploader";
import { X } from "lucide-react";
import { useEffect, useState } from "react";


export default function FileLinkInputClient() {

  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<'file' | 'link'>('file');

  
  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="links" value={JSON.stringify(links)} />
      <div className="flex items-center gap-2">
        <label className="label">
          <div>
            <p>Archivos y/o links <span className="text-[11px] text-muted">(opcional)</span></p>
            <p className="text-[11px] text-muted">Adjuntar archivos y/o links a la publicación</p>
          </div>
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setSelectedType('file')}
            className={`btn btn-md border ${selectedType === 'file' ? 'bg-primary text-white border-surface' : 'bg-white text-black border-border'}`}
          >
            Archivo
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('link')}
            className={`btn btn-md border ${selectedType === 'link' ? 'bg-primary text-white border-surface' : 'bg-white text-black border-border'}`}
          >
            Enlace
          </button>
        </div>
      </div>

      {selectedType === 'file' ? (
        <div>
          <FileUploader
            id="post-files"
            name="files"
            multiple
            initial={files}
            maxFileSizeMB={500}
            onChange={setFiles}
            className="shadow-sm"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="label">Enlaces</label>
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="url"
                value={link}
                onChange={(e) => {
                  const newLinks = [...links];
                  newLinks[i] = e.target.value;
                  setLinks(newLinks);
                }}
                placeholder="https://..."
                className="input input-md"
              />
                <button
                  type="button"
                  onClick={() => setLinks(links.filter((_, idx) => idx !== i))}
                  className="cursor-pointer text-gray-500 hover:text-black p-1"
                >
                  <X size={16} />
                </button>
            </div>
          ))}
          <div>
            <button
              type="button"
              onClick={() => setLinks([...links, ''])}
              className="cursor-pointer text-xs text-black font-medium hover:underline mt-1 text-left"
            >
              + Añadir enlace
            </button>
          </div>
        </div>
      )}
    </div>
  )
}