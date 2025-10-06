
'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { useActionState } from 'react';
import type { ErrorMessage } from "@/app/lib/definitions";
import { addMainPost, finalizeMainPost } from "../actions/actions";
import { FilesToUpload, ServerFile } from "@/types/storage";
import { ProgressCallback } from "@/types/general";
import { isFailure, isPartialSuccess, isSuccess, unwrap, unwrapOr } from "@/lib/errors/result";
import { uploadFiles } from "@/storage/r2/client/handlers/upload";
import { AppError, Result, SanitizedAppError } from "@/lib/errors/types";
import { AddResourcesPostReturn } from "../types";
import { UploadResult } from "@/storage/r2/client/types";
import { pipeline } from "stream";
import ErrorPopup from "@/app/ui/error-popup";

type AddMainPostPageProps = {
  role: string;
};


export default function FormFooterClient({ role }: AddMainPostPageProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<SanitizedAppError | null>(null);

const handleSubmit = async (_: unknown, formData: FormData, onProgress?: ProgressCallback) => {
  // Extract files and add metadata entries as before
  const files = formData.getAll('files') as File[];
  
  // Delete files from FormData to not send the files to server
  formData.delete('files');
  
  // Collect only the file metadata (name, type, size) to send it to server
  files.forEach(file =>
    formData.append(
      'filesMeta',
      JSON.stringify({ name: file.name, size: file.size, type: file.type } as ServerFile)
    )
  );
  

  // Call the server with the FormData to create the db entry and return the upload information
  const postCreationResult = await addMainPost(formData);
  if (isFailure(postCreationResult)) return postCreationResult

  const { groupedFiles, id, folderName } = unwrap(postCreationResult);

  const filesToUpload: FilesToUpload = {
    small: groupedFiles.small.map(processed => ({ ...processed, file: files.find(f => f.name === processed.fileMeta.name) as File })),
    medium: groupedFiles.medium.map(processed => ({ ...processed, file: files.find(f => f.name === processed.fileMeta.name) as File })),
    large: groupedFiles.large.map(processed => ({ ...processed, file: files.find(f => f.name === processed.fileMeta.name) as File })),
  } 
  
  // Upload files
  setUploadState('uploading')
  const uploadResult = await uploadFiles({
    filesToUpload,
    folderName,
    setUploadNames,
    updateProgress,
    onProgress,
  });

  if (isFailure(uploadResult)) return uploadResult
  const { successfulFiles, failedFiles, multipartUploads } = unwrap(uploadResult)

  const doRedirect = true
  const finalizeRes = await finalizeMainPost({
    doRedirect, 
    id,
    currentFilenames: [],
    successfulFiles,
    multipartUploads
  } as any);
  setUploadState(null)
  return finalizeRes;
  
  
};



  const [state, dispatch, pending] = useActionState(handleSubmit, undefined);
  // maps server file key -> percent (0..100)
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  // maps server file key -> display name (filename)
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});
  
  const [uploadState, setUploadState] = useState<'processing' | 'uploading' | null>(null)
  // small ref to throttle UI updates per-file (ms)
  const lastUpdateRef = useRef<Record<string, number>>({});

  /**
   * updateProgress helper — call this from your upload logic.
   * key: server file key
   * loaded: bytes uploaded so far for this file
   * total: total bytes for this file
   */
  const updateProgress = useCallback((key: string, loaded: number, total: number) => {
    const now = performance.now();
    const last = lastUpdateRef.current[key] || 0;
    const percent = Math.min(100, Math.round((loaded / total) * 100));

    // update at most every 100ms (or always if reaching 100)
    if (percent === 100 || now - last > 100) {
      lastUpdateRef.current[key] = now;
      setProgressMap((prev) => {
        if (prev[key] === percent) return prev;
        return { ...prev, [key]: percent };
      });
    }
  }, []);


  useEffect(() => {
    if (!state) return
    if (isSuccess(state)) {
      router.push('/gemif/resources/posts');
    } else {
      setUploadState(null)
      setProgressMap({})
      setUploadNames({})
      setErrorMessage(state.error);
    }
  }, [state, router]);


  const isUserAllowed = true || role === 'dev' || role === 'admin';

  return (
    <>
      {uploadState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-lg w-full max-w-md h-[80vh] p-6 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="heading-md">
                {uploadState === 'processing'
                  ? 'Procesando archivos...'
                  : uploadState === 'uploading'
                  ? 'Progreso general'
                  : 'Finalizando subida'}
              </span>
              {/* Circular loader for processing/finalizing */}
              {(uploadState !== "uploading") && (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              )}
              {/* Overall percentage */}
              {uploadState === 'uploading' && (
                <span className="text-xs text-muted">
                  {(() => {
                    const keys = Object.keys(uploadNames);
                    if (keys.length === 0) return "0%";
                    const sum = keys.reduce((s, k) => s + (progressMap[k] ?? 0), 0);
                    return `${Math.round(sum / keys.length)}%`;
                  })()}
                </span>
              )}
            </div>

            {/* Global progress bar */}
            {uploadState === 'uploading' && (
              <div className="mb-4">
                <div className="w-full h-2 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 ease-out"
                    style={{
                      width: `${(() => {
                        const keys = Object.keys(uploadNames);
                        if (keys.length === 0) return 0;
                        const sum = keys.reduce((s, k) => s + (progressMap[k] ?? 0), 0);
                        return Math.round(sum / keys.length);
                      })()}%`,
                      background: "linear-gradient(90deg,#464357,#323136)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* File list with scroll */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {Object.entries(uploadNames).map(([key, name]) => {
                const pct = progressMap[key] ?? 0;
                return (
                  <div key={key} className="w-full">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="text-body truncate w-[50%]"
                          title={name}
                        >
                          {name}
                        </div>
                        <div className="text-[11px] text-muted w-[20%] text-right">
                          • {pct}%
                        </div>
                      </div>
                      <div className="text-[11px] text-muted w-[20%] text-right">
                        {pct === 100 ? "Completado" : `${pct}%`}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full transition-all duration-300 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: "linear-gradient(90deg,#464357,#645e7a)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {errorMessage && (
        <ErrorPopup 
          error={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
      <button type="button" onClick={() => router.back()} className="btn btn-secondary">
        Cancelar
      </button>
      <button type="submit" onClick={() => setUploadState('processing')} formAction={dispatch} disabled={pending || !isUserAllowed} className="btn btn-primary">
        {pending ? 'Cargando...' : 'Crear Publicación'}
      </button>
    </>
  );
}
