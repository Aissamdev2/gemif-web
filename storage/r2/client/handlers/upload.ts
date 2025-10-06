import { GLOBAL_CLIENT_UPLOAD_CONFIG } from "../config";
import { FileUploader, processBatch, ProgressTracker } from "../logic";
import { LargeFileState, MediumFileState, MultipartResult, UploadResult, Part, PoolTask, UploadConfig, UploadError, MultipartUploads } from "../types";
import { isFailure, isSuccess, partialSuccess, success, failure, unwrap, unwrapResource } from "@/lib/errors/result";
import { AppError, ErrorMetadata, FileResource, Resource, Result, Success } from "@/lib/errors/types";
import { errorRaw, R2ClientStorageError, R2PartialClientStorageError } from "@/lib/errors/factories";
import { ErrorTag } from "@/lib/errors/codes";

export class ParallelPool<T, R extends Resource = Resource> {
  private maxConcurrent: number;
  private activeTasks: Set<Promise<any>>;
  private taskQueue: PoolTask[];
  private results: Result<T, R>[];

  constructor(maxConcurrent: number = 6) {
    this.maxConcurrent = maxConcurrent;
    this.activeTasks = new Set();
    this.taskQueue = [];
    this.results = [];
  }

  addTask(task: PoolTask): void {
    this.taskQueue.push(task);
    // Sort by priority (1 = highest priority)
    this.taskQueue.sort((a, b) => a.priority - b.priority);
  }

  async processAll(): Promise<Result<T, R>[]> {
    while (this.taskQueue.length > 0 || this.activeTasks.size > 0) {
      // Start new tasks if we have capacity
      while (this.activeTasks.size < this.maxConcurrent && this.taskQueue.length > 0) {
        const task = this.taskQueue.shift()!;
        const promise = this.executeTask(task).then(result => {
          this.results.push(result);
          return result;
        });
        this.activeTasks.add(promise);
        // Remove the exact promise when it settles
        promise.finally(() => this.activeTasks.delete(promise));
      }

      // Wait for at least one task to complete (if any)
      if (this.activeTasks.size > 0) {
        await Promise.race(Array.from(this.activeTasks));
      }
    }

    return this.results;
  }

  private async executeTask(task: PoolTask): Promise<any> {
    try {
      return await task.execute();
    } catch (error) {
      console.error(`Task failed for ${task.fileKey}:`, error);
      return { error, fileKey: task.fileKey }; // still return something useful
    }
  }
}


export async function uploadFiles(config: UploadConfig): Promise<Result<UploadResult>> {
  const {
    filesToUpload,
    setUploadNames,
    updateProgress,
    onProgress
  } = config;

  // Progress tracking and uploader
  const progressTracker = new ProgressTracker();
  const uploader = new FileUploader();
  const pool = new ParallelPool<{ part: Part, key: string }, FileResource>(5);

  const allFiles = [...filesToUpload.small, ...filesToUpload.medium, ...filesToUpload.large];

  // Handle empty file list
  if (allFiles.length === 0) {
    return success({
      successfulFiles: {},
      failedFiles: {},
      multipartUploads: { worker: {}, s3: {} }
    });
  }

  // Set upload names once
  setUploadNames(Object.fromEntries(allFiles.map(f => [f.key, f.file.name])));

  // Track file metadata for result processing
  const fileMetadata = new Map(allFiles.map(f => [f.key, {
    name: f.file.name,
    type: getFileType(f, filesToUpload),
    uploadId: (f as any).uploadId,
    expectedParts: getExpectedParts(f, filesToUpload)
  }]));

  // 1. Add small file tasks (Priority 1 - highest)
  for (const fileToUpload of filesToUpload.small) {
    pool.addTask({
      priority: 1,
      fileKey: fileToUpload.key,
      execute: async (): Promise<Result<{ key: string }>> => await uploader.uploadSmallFile(
        fileToUpload,
        progressTracker,
        updateProgress,
        onProgress
      )
    });
  }

  // 2. Delegate medium file chunk preparation to external class
  for (const fileToUpload of filesToUpload.medium) {
    await uploader.uploadMediumFile({
      fileToUpload,
      pool,
      chunkSize: GLOBAL_CLIENT_UPLOAD_CONFIG.CHUNK_SIZE,
      totalParts: Math.ceil(fileToUpload.file.size / GLOBAL_CLIENT_UPLOAD_CONFIG.CHUNK_SIZE),
      progressTracker,
      uploader,
      updateProgress,
      onProgress,
    });
  }

  // 3. Delegate large file chunk preparation to external class
  for (const fileToUpload of filesToUpload.large) {
    await uploader.uploadLargeFile({
      fileToUpload,
      pool,
      chunkSize: GLOBAL_CLIENT_UPLOAD_CONFIG.CHUNK_SIZE,
      totalParts: Math.ceil(fileToUpload.file.size / GLOBAL_CLIENT_UPLOAD_CONFIG.CHUNK_SIZE),
      progressTracker,
      uploader,
      updateProgress,
      onProgress,
    });
  }

  // 4. Process all tasks
  let results: Result<{ part: Part, key: string }, FileResource>[] = [];
  try {
    results = await pool.processAll();
  } catch (error: any) {
    return failure(R2ClientStorageError({
      message: "Error durante el procesamiento de archivos",
      details: "No se pudo empezar a procesar los archivos",
      metadata: { 
        scope: "Process files", 
        operation: "Pool process all",
        sensitivity: "none",
        tags: [ErrorTag.pool],
        isExpected: false,
      },
      raw: errorRaw(error)
    }));
  }

  // 5. Process results with correct success/failure logic
  return processUploadResults(results, fileMetadata, allFiles.length);
}

// Helper function to determine file type
function getFileType(file: any, filesToUpload: any): 'small' | 'medium' | 'large' {
  if (filesToUpload.small.includes(file)) return 'small';
  if (filesToUpload.medium.includes(file)) return 'medium';
  if (filesToUpload.large.includes(file)) return 'large';
  return 'small';
}

// Helper function to get expected number of parts for a file
function getExpectedParts(file: any, filesToUpload: any): number {
  if (filesToUpload.small.includes(file)) return 1; // Small files have 1 "part"
  if (filesToUpload.medium.includes(file) || filesToUpload.large.includes(file)) {
    return Math.ceil(file.file.size / GLOBAL_CLIENT_UPLOAD_CONFIG.CHUNK_SIZE);
  }
  return 1;
}

// Improved result processing function with correct success/failure logic
function processUploadResults(
  results: Result<{ part: Part, key: string }, FileResource>[],
  fileMetadata: Map<string, any>,
  totalFiles: number
): Result<UploadResult> {
  const fileResults = new Map<string, { errors: AppError[], parts: Part[] }>();
  
  // Initialize all files in the results map
  for (const [fileKey] of fileMetadata) {
    fileResults.set(fileKey, { errors: [], parts: [] });
  }
  
  // Group results by file key
  for (const result of results) {
    let fileKey: string;
    
    if (isFailure(result)) {
      const resource = unwrapResource(result);
      if (!resource || !resource.fileName) {
        return failure(R2ClientStorageError({
          message: "No se pudo subir el archivo",
          details: "No se pudo identificar el archivo que falló",
          metadata: {
            scope: "Upload file client",
            operation: "Identify failed file",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.fileUpload],
            isExpected: true,
          },
          resource: resource,
        }));
      }
      fileKey = resource.fileName;
    } else {
      fileKey = unwrap(result).key;
    }
    
    if (!fileKey || !fileResults.has(fileKey)) continue;
    
    const fileResult = fileResults.get(fileKey)!;
    
    if (isFailure(result)) {
      fileResult.errors.push(result.error);
    } else if (isSuccess(result)) {
      fileResult.parts.push(unwrap(result).part);
    }
  }

  // Process results into optimized format
  const successfulFiles: Record<string, string> = {};
  const failedFiles: Record<string, AppError[]> = {};
  const multipartUploads: MultipartUploads = { worker: {}, s3: {} };
  const errors: AppError[] = [];

  for (const [fileKey, { errors: fileErrors, parts }] of fileResults) {
    const metadata = fileMetadata.get(fileKey);
    if (!metadata) continue;

    const hasErrors = fileErrors.length > 0;
    const hasAllExpectedParts = parts.length === metadata.expectedParts;
    
    // A file is considered failed if:
    // It has any errors, OR
    // It doesn't have all expected parts 
    const isFileFailed = hasErrors || !hasAllExpectedParts;

    if (isFileFailed) {
      // File failed
      const fileErrorList = [...fileErrors];
      
      // Add missing parts error if applicable
      if (!hasAllExpectedParts && !hasErrors) {
        fileErrorList.push(R2ClientStorageError({
          message: "No se pudo subir el archivo",
          details: "Uno o más fragmentos del archivo fallaron",
          metadata: {
            scope: "Upload file client",
            operation: "Part validation",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.fileUpload, ErrorTag.chunkUpload, ErrorTag.failedFetchResponse],
            isExpected: true,
          },
          resource: fileErrors.length > 0 ? fileErrors[0].resource : undefined,
          parallelErrors: fileErrors
        }));
      }
      
      failedFiles[fileKey] = fileErrorList;
      errors.push(R2ClientStorageError({
        message: `Error durante la subida del archivo.`,
        details: "No se pudo subir el archivo",
        metadata: {
          scope: "Upload file client",
          operation: "File upload",
          sensitivity: "none",
          tags: [ErrorTag.r2],
          isExpected: true,
        },
        parallelErrors: fileErrorList
      }));
    } else {
      // File succeeded - has all expected parts and no errors
      successfulFiles[fileKey] = metadata.name;
      
      // Add multipart info for medium/large files
      if (metadata.type === 'medium') {
        multipartUploads.worker[fileKey] = {
          uploadId: metadata.uploadId,
          parts
        };
      } else if (metadata.type === 'large') {
        multipartUploads.s3[fileKey] = {
          uploadId: metadata.uploadId,
          parts
        };
      }
    }
  }

  // Determine the correct result type based on success/failure counts
  const successfulCount = Object.keys(successfulFiles).length;
  const failedCount = Object.keys(failedFiles).length;

  const resultData: UploadResult = {
    successfulFiles,
    failedFiles,
    multipartUploads
  };

  if (successfulCount === totalFiles && failedCount === 0) {
    // All files succeeded
    return success(resultData);
  } else if (failedCount === totalFiles && successfulCount === 0) {
    // All files failed
    return failure(R2ClientStorageError({
      message: "Todos los archivos fallaron al subir",
      details: `${failedCount} archivo(s) no pudieron ser subidos`,
      metadata: {
        scope: "Upload file client",
        operation: "Batch upload",
        sensitivity: "none",
        tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.fileUpload],
        isExpected: true,
      },
      parallelErrors: errors
    }));
  } else {
    
    return partialSuccess(resultData, R2PartialClientStorageError({
      message: "Todos los archivos fallaron al subir",
      details: `${failedCount} archivo(s) no pudieron ser subidos`,
      metadata: {
        scope: "Upload file client",
        operation: "Batch upload",
        sensitivity: "none",
        tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.fileUpload],
        isExpected: true,
      },
      parallelErrors: errors
    }));
  }
}



// export async function uploadFiles(config: UploadConfig): Promise<UploadResult> {
//   const {
//     filesToUpload,
//     fileKeys,
//     setUploadNames,
//     updateProgress,
//     onProgress
//   } = config;
  
//   // Initialize result tracking
//   const successfulFiles = new Set<string>();
//   const failedFiles: UploadError[] = [];
//   const workerMultipartUploads: Record<string, MultipartResult> = {};
//   const s3MultipartUploads: Record<string, MultipartResult> = {};
  
//   // Progress tracking
//   const progressTracker = new ProgressTracker();
//   const uploader = new FileUploader();

//   // Claude create the pool here

//   // The file shoudl return something like this, you are free to change the reuturn values for a more compact ones
//   return {
//     successfulFiles,
//     failedFiles,
//     workerMultipartUploads,
//     s3MultipartUploads,
//   };
// }
