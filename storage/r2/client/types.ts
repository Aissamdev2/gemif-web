import { ProgressCallback } from "@/types/general";
import { FilesToUpload, ServerFile } from "@/types/storage";
import { ProcessedFile } from "../server/types";
import { AppError } from "@/lib/errors/types";


export interface FileGroup {
  small: ServerFile[];
  medium: ServerFile[];
  large: ServerFile[];
}


export type Part = { PartNumber: number; ETag: string };
export type MultipartResult = { uploadId: string; parts: Part[] };
export type UploadError = { key: string; fileName: string; error: string;};


export interface UploadConfig {
  filesToUpload: FilesToUpload;
  folderName?: string;
  fileKeys?: string[];
  setUploadNames: (value: React.SetStateAction<Record<string, string>>) => void;
  updateProgress: (key: string, loaded: number, total: number) => void;
  onProgress?: ProgressCallback;
}

// Optimized upload result interface
export interface UploadResult {
  successfulFiles: Record<string,string>; // File names only
  failedFiles: Record<string, AppError[]>;
  multipartUploads: MultipartUploads;
}

export type MultipartUploads = {
    worker: Record<string, MultipartResult>;
    s3: Record<string, MultipartResult>;
  }



// Task types for the pool
export interface PoolTask {
  priority: number; // 1=highest, 3=lowest
  fileKey: string;
  execute: () => Promise<any>;
}

export interface MediumFileState {
  fileKey: string;
  totalChunks: number;
  completedChunks: number;
  parts: (Part | null)[];
  chunkTasks: PoolTask[];
}

export interface LargeFileState {
  fileKey: string;
  totalChunks: number;
  completedChunks: number;
  parts: (Part | null)[];
  chunkTasks: PoolTask[];
}