import { AppError, FileResource, Resource, Result, Success } from "@/lib/errors/types";
import { GLOBAL_CLIENT_UPLOAD_CONFIG } from "./config";
import { failure, isFailure, isSuccess, setResource, success, unwrap } from "@/lib/errors/result";
import { makeFileResource, R2ClientStorageError, R2ServerStorageError, TooManyRetriesError } from "@/lib/errors/factories";
import { sleep } from "@/lib/utils";
import { WorkerClientService } from "./worker/logic";
import { S3ClientService } from "./s3/logic";
import { ProgressCallback } from "@/types/general";
import { ProcessedFile } from "../server/types";
import { SmallFileToUpload, MediumFileToUpload, LargeFileToUpload, ServerFile } from "@/types/storage";
import { LargeFileState, MediumFileState, MultipartResult, Part, PoolTask } from "./types";
import { ParallelPool } from "./handlers/upload";
import { ErrorTag } from "@/lib/errors/codes";


interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  multiplier?: number;
  shouldRetry?: (error: any) => boolean;
}


export async function withRetry<T>(
  fn: () => Promise<Result<T>>,
  options: RetryOptions = {},
): Promise<Result<T>> {
  const {
    maxRetries = GLOBAL_CLIENT_UPLOAD_CONFIG.MAX_RETRIES,
    delayMs = GLOBAL_CLIENT_UPLOAD_CONFIG.RETRY_DELAY_MS,
    multiplier = GLOBAL_CLIENT_UPLOAD_CONFIG.RETRY_MULTIPLIER,
  } = options;

  let errors: AppError[] = [];
  let currentDelay = delayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await fn();

    if (isSuccess(result)) {
      return success(result.data);
    }

    if (isFailure(result)) {
      errors.push(result.error);
    }

    if (attempt === maxRetries) {
      break;
    }

    await sleep(currentDelay);
    currentDelay *= multiplier;
  }

  return failure(
    TooManyRetriesError({
      message: "Se ha alcanzado el número máximo de reintentos por errores",
      details: "No se pudo completar la operación",
      parallelErrors: errors,
      metadata: {
        scope: "Retry function",
        operation: "Retry",
        sensitivity: "none",
        tags: [ErrorTag.retry],
        isExpected: true,
        isSensible: false
      }
    }));
}


export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<Result<R>>,
  concurrency: number
): Promise<Result<R>[]> {
  const results: Result<R>[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const p = processor(item).then(result => {
      results.push(result);
    });

    // When this promise settles, remove it from the pool
    const wrapped = p.finally(() => {
      const idx = executing.indexOf(wrapped);
      if (idx >= 0) executing.splice(idx, 1);
    });

    executing.push(wrapped);

    if (executing.length >= concurrency) {
      await Promise.race(executing); // wait for at least one slot to free
    }
  }

  await Promise.all(executing); // wait for any remaining tasks
  return results;
}

export class FileUploader {
  public workerService: WorkerClientService;
  public s3Service: S3ClientService;

  constructor() {
    this.workerService = WorkerClientService.getInstance();
    this.s3Service = S3ClientService.getInstance();
  }


  async uploadSmallFile(
    fileToUpload: SmallFileToUpload,
    progressTracker: ProgressTracker,
    updateProgress?: Function,
    onProgress?: ProgressCallback
  ): Promise<Result<{ key: string }>> {
    
    const uploadresult = await withRetry(async () => {
      return await this.workerService.uploadFile(
        fileToUpload.url,
        fileToUpload.key,
        fileToUpload.file,
        progressTracker,
        updateProgress,
        onProgress
      );
    });

    if (isFailure(uploadresult)) {
      const resource = makeFileResource({
        fileName: fileToUpload.fileMeta.name,
        key: fileToUpload.key,
        size: fileToUpload.fileMeta.size,
        contentType: fileToUpload.fileMeta.type
      })
      return setResource(uploadresult, resource)
    } else {
      return success({ key: fileToUpload.key })
    }
  }


  async uploadMediumFile({
    fileToUpload,
    pool,
    chunkSize,
    totalParts,
    progressTracker,
    uploader,
    updateProgress,
    onProgress,
  }: {
    fileToUpload: MediumFileToUpload;
    pool: ParallelPool<{ part: Part, key: string }, FileResource>;
    chunkSize: number;
    totalParts: number;
    progressTracker: ProgressTracker;
    uploader: FileUploader;
    updateProgress: Function;
    onProgress?: ProgressCallback;
  }): Promise<void> {
      progressTracker.init(fileToUpload.key, fileToUpload.file.size);

      const chunkTasks: PoolTask[] = [];

      for (let i = 0; i < totalParts; i++) {
        const partNumber = i + 1;
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, fileToUpload.file.size);
        const chunk = fileToUpload.file.slice(start, end);

        chunkTasks.push({
          priority: 2,
          fileKey: fileToUpload.key,
          execute: async (): Promise<Result<{ part: Part, key: string }>> => {
            const partResult = await uploader.workerService.uploadChunk(
              fileToUpload.key,
              fileToUpload.url!,
              fileToUpload.uploadId!,
              partNumber,
              chunk
            );

            if (isFailure(partResult)) {
              const resource = makeFileResource({
                fileName: fileToUpload.fileMeta.name,
                key: fileToUpload.key,
                size: fileToUpload.fileMeta.size,
                contentType: fileToUpload.fileMeta.type
              })
              return setResource(partResult, resource)
            }

            const part = unwrap(partResult)
            progressTracker.update(fileToUpload.key, chunk.size, updateProgress, onProgress);
            return success({ part, key: fileToUpload.key });
          }
        });
      }

      // Add medium file chunks to pool
      chunkTasks.forEach(task => pool.addTask(task));
  }


  async uploadLargeFile({
    fileToUpload,
    pool,
    chunkSize,
    totalParts,
    progressTracker,
    uploader,
    updateProgress,
    onProgress,
  }: {
    fileToUpload: LargeFileToUpload;
    pool: ParallelPool<{ part: Part, key: string }, FileResource>;
    chunkSize: number;
    totalParts: number;
    progressTracker: ProgressTracker;
    uploader: FileUploader;
    updateProgress: Function;
    onProgress?: ProgressCallback;
  }): Promise<void> {
      progressTracker.init(fileToUpload.key, fileToUpload.file.size);

      const chunkTasks: PoolTask[] = [];

      for (let i = 0; i < totalParts; i++) {
        const partNumber = i + 1;
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, fileToUpload.file.size);
        const chunk = fileToUpload.file.slice(start, end);

        chunkTasks.push({
          priority: 3,
          fileKey: fileToUpload.key,
          execute: async (): Promise<Result<{ part: Part, key: string }>> => {
            const partResult = await uploader.s3Service.uploadChunk(
              fileToUpload.key,
              fileToUpload.partUrls[i],
              partNumber,
              chunk,
              fileToUpload.file.type || 'application/octet-stream'
            );
            
            if (isFailure(partResult)) {
              console.log("part Result failed:", {partResult})
              const resource = makeFileResource({
                fileName: fileToUpload.fileMeta.name,
                key: fileToUpload.key,
                size: fileToUpload.fileMeta.size,
                contentType: fileToUpload.fileMeta.type
              })
              return setResource(partResult, resource)
            }

            const part = unwrap(partResult)
            progressTracker.update(fileToUpload.key, chunk.size, updateProgress, onProgress);
            return success({ part, key: fileToUpload.key });
          }
        });
      }


      // Add large file chunks to pool
      chunkTasks.forEach(task => pool.addTask(task));
  }


  // async uploadMediumFile(
  //   fileToUpload: FileToUpload,
  //   progressTracker: ProgressTracker,
  //   updateProgress?: Function,
  //   onProgress?: ProgressCallback
  // ): Promise<Result<Part[]>> {
    
  //   const chunkSize = GLOBAL_CLIENT_UPLOAD_CONFIG.CHUNK_SIZE;
  //   const totalParts = Math.ceil(fileToUpload.file.size / chunkSize);
  //   const parts: (Part | null)[] = new Array(totalParts);
    
  //   progressTracker.init(fileToUpload.key, fileToUpload.file.size);
    
  //   // Create chunk upload tasks
  //   const chunkTasks: (() => Promise<Result<{ index: number; part: Part | null }>>)[] = [];
    
  //   for (let i = 0; i < totalParts; i++) {
  //     const partNumber = i + 1;
  //     const start = i * chunkSize;
  //     const end = Math.min(start + chunkSize, fileToUpload.file.size);
  //     const chunk = fileToUpload.fileData.slice(start, end);
      
  //     chunkTasks.push(async () => {
  //       const partResult = await this.workerService.uploadChunk(
  //         fileToUpload.url, 
  //         fileToUpload.uploadId as string, 
  //         partNumber, 
  //         chunk
  //       );

  //       return map(partResult, (part) => {
  //         progressTracker.update(fileToUpload.key, chunk.size, updateProgress, onProgress);
  //         return { index: i, part };
  //       });
  //     });
  //   }

  //   // This method is now handled by the pool system
  //   // Return empty result as this method signature is preserved for compatibility
  //   return success([]);
  // }

  // async uploadLargeFile(
  //   fileToUpload: FileToUpload,
  //   progressTracker: ProgressTracker,
  //   updateProgress?: Function,
  //   onProgress?: ProgressCallback
  // ): Promise<Result<Part[]>> {
    
  //   const chunkSize = GLOBAL_CLIENT_UPLOAD_CONFIG.CHUNK_SIZE;
  //   const totalParts = Math.ceil(fileToUpload.file.size / chunkSize);
  //   const parts: (Part | null)[] = new Array(totalParts);
    
  //   progressTracker.init(fileToUpload.key, fileToUpload.file.size);
    
  //   // Create chunk upload tasks
  //   const chunkTasks: (() => Promise<Result<{ index: number; part: Part | null }>>)[] = [];
    
  //   for (let i = 0; i < totalParts; i++) {
  //     const partNumber = i + 1;
  //     const start = i * chunkSize;
  //     const end = Math.min(start + chunkSize, fileToUpload.file.size);
  //     const chunk = fileToUpload.fileData.slice(start, end);
      
  //     chunkTasks.push(async () => {
  //       const partResult = await this.s3Service.uploadChunk(
  //         fileToUpload.url, 
  //         partNumber, 
  //         chunk,
  //         fileToUpload.uploadId as string, 
  //       );

  //       return map(partResult, (part) => {
  //         progressTracker.update(fileToUpload.key, chunk.size, updateProgress, onProgress);
  //         return { index: i, part };
  //       });
  //     });
  //   }

  //   // This method is now handled by the pool system
  //   // Return empty result as this method signature is preserved for compatibility
  //   return success([]);
  // }



  // async uploadSmallFile(
  //   fileToUpload: FileToUpload,
  //   progressTracker: ProgressTracker,
  //   updateProgress?: Function,
  //   onProgress?: ProgressCallback
  // ): Promise<Result<string>> {
    
  //   const uploadresult = await withRetry(async () => {
  //     return await this.workerService.uploadFile(fileToUpload.url, fileToUpload.key, fileToUpload.fileData, progressTracker, updateProgress, onProgress);
  //   });

  //   if (isFailure(uploadresult)) {
  //     return failure(R2ClientStorageError({
  //       message: "Error al iniciar la subida del archivo: " + fileToUpload.file.name,
  //       metadata: {
  //         scope: "R2 storage",
  //         operation: "Uploading small file",
  //         isExpected: true,
  //         isSensible: false,
  //         key: fileToUpload.key,
  //       },
  //       stack: [uploadresult.error]
  //     }))
  //   } else {
  //     return success(fileToUpload.key)
  //   }
  // }


  // async uploadMediumFile(
  //   fileToUpload: FileToUpload,
  //   progressTracker: ProgressTracker,
  //   updateProgress?: Function,
  //   onProgress?: ProgressCallback
  // ): Promise<Result<Part[]>> {
    
  //   const chunkSize = GLOBAL_CLIENT_UPLOAD_CONFIG.CHUNK_SIZE;
  //   const totalParts = Math.ceil(fileToUpload.file.size / chunkSize);
  //   const parts: (Part | null)[] = new Array(totalParts);
    
  //   progressTracker.init(fileToUpload.key, fileToUpload.file.size);
    
  //   // Create chunk upload tasks
  //   const chunkTasks: (() => Promise<Result<{ index: number; part: Part | null }>>)[] = [];
    
  //   for (let i = 0; i < totalParts; i++) {
  //     const partNumber = i + 1;
  //     const start = i * chunkSize;
  //     const end = Math.min(start + chunkSize, fileToUpload.file.size);
  //     const chunk = fileToUpload.fileData.slice(start, end);
      
  //     chunkTasks.push(async () => {
  //       const partResult = await this.workerService.uploadChunk(fileToUpload.url, fileToUpload.uploadId as string, partNumber, chunk);

  //       return map(partResult, (part) => {
  //         progressTracker.update(fileToUpload.key, chunk.size, updateProgress, onProgress);
          
  //         return { index: i, part };
  //       })
        
  //     });
  //   }
  // }

  // async uploadLargeFile(
  //   fileToUpload: FileToUpload,
  //   progressTracker: ProgressTracker,
  //   updateProgress?: Function,
  //   onProgress?: ProgressCallback
  // ): Promise<Result<Part[]>> {
    
  //   const chunkSize = GLOBAL_CLIENT_UPLOAD_CONFIG.CHUNK_SIZE;
  //   const totalParts = Math.ceil(fileToUpload.file.size / chunkSize);
  //   const parts: (Part | null)[] = new Array(totalParts);
    
  //   progressTracker.init(fileToUpload.key, fileToUpload.file.size);
    
  //   // Create chunk upload tasks
  //   const chunkTasks: (() => Promise<Result<{ index: number; part: Part | null }>>)[] = [];
    
  //   for (let i = 0; i < totalParts; i++) {
  //     const partNumber = i + 1;
  //     const start = i * chunkSize;
  //     const end = Math.min(start + chunkSize, fileToUpload.file.size);
  //     const chunk = fileToUpload.fileData.slice(start, end);
      
  //     chunkTasks.push(async () => {
  //       const partResult = await this.workerService.uploadChunk(fileToUpload.url, fileToUpload.uploadId as string, partNumber, chunk);

  //       return map(partResult, (part) => {
  //         progressTracker.update(fileToUpload.key, chunk.size, updateProgress, onProgress);
          
  //         return { index: i, part };
  //       })
        
  //     });
  //   }

  // }


  
}






export class ProgressTracker {
  private progress = new Map<string, { loaded: number; total: number; startTime: number }>();
  
  init(key: string, total: number): void {
    this.progress.set(key, { loaded: 0, total, startTime: Date.now() });
  }
  
  update(key: string, bytes: number, updateFn?: Function, onProgress?: ProgressCallback): void {
    const tracker = this.progress.get(key);
    if (!tracker) return;
    
    tracker.loaded = Math.min(tracker.loaded + bytes, tracker.total);
    const percentage = (tracker.loaded / tracker.total) * 100;
    
    try {
      updateFn?.(key, tracker.loaded, tracker.total);
      onProgress?.(key, percentage);
    } catch (e) {
      console.warn('Progress update failed:', e);
    }
  }
  
  getSpeed(key: string): number {
    const tracker = this.progress.get(key);
    if (!tracker) return 0;
    const elapsed = (Date.now() - tracker.startTime) / 1000;
    return elapsed > 0 ? tracker.loaded / elapsed : 0;
  }
}




