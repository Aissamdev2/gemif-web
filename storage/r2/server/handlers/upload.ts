import { FileToProcess, ProcessFilesResult, ServerFile } from "@/types/storage";
import { FileProcessor, processBatch, withRetry } from "../logic";
import { GLOBAL_SERVER_UPLOAD_CONFIG } from "../config";
import { ProcessedFile, ProcessedLargeFile, ProcessedMediumFile, ProcessedSmallFile } from "../types";
import { MultipartUploadInfo } from "@/app/lib/definitions";
import { S3ServerService } from "../s3/logic";
import {  failure, isFailure, isSuccess, partialSuccess, success, unwrap } from "@/lib/errors/result";
import { errorRaw, makeFileResource, R2PartialServerStorageError, R2ServerStorageError } from "@/lib/errors/factories";
import { AppError, ErrorMetadata, FileResource, Resource, Result } from "@/lib/errors/types";
import { error } from "console";
import { MultipartUploads, PoolTask, UploadResult } from "../../client/types";
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


export async function processFiles({
  filesToProcess,
  bucket
}: {
  filesToProcess: FileToProcess[];
  bucket: string;
}): Promise<Result<ProcessFilesResult>> {
  if (filesToProcess.length === 0) {
    return success({
      groupedFiles: {
        small: [],
        medium: [],
        large: []
      }
    });
  }

  // Initialize the file processor
  const processor = new FileProcessor();

  // Create a parallel pool with 100 "threads" (because we are on server)
  const pool = new ParallelPool<ProcessedSmallFile | ProcessedMediumFile | ProcessedLargeFile, FileResource>(5)
  
  // Categorize files by size
  const categorized = processor.categorizeFiles(filesToProcess);
  
  // Create processing tasks
  const processingTasks = [];
  

  // Add small file process tasks
  for (const fileToProcess of categorized.small) {
    pool.addTask({
      priority: 1,
      fileKey: fileToProcess.key,
      execute: () => processor.processSmallFile(fileToProcess),
    });
  }

  // Add small file process tasks
  for (const fileToProcess of categorized.medium) {
    pool.addTask({
      priority: 1,
      fileKey: fileToProcess.key,
      execute: () => processor.processMediumFile(fileToProcess),
    });
  }

  // Add small file process tasks
  for (const fileToProcess of categorized.large) {
    pool.addTask({
      priority: 1,
      fileKey: fileToProcess.key,
      execute: () => processor.processLargeFile(fileToProcess, bucket),
    });
  }

  // Process all tasks
  let results: Result<ProcessedSmallFile | ProcessedMediumFile | ProcessedLargeFile, FileResource>[] = [];
  try {
    results = await pool.processAll();
  } catch (error: any) {
    return failure(R2ServerStorageError({
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


  const smallFiles: ProcessedSmallFile[] = [];
  const mediumFiles: ProcessedMediumFile[] = [];
  const largeFiles: ProcessedLargeFile[] = [];

  const failures: AppError<FileResource>[] = [];

  let successes = 0;
  results.forEach(result => {
    if (isFailure(result)) {
      failures.push(result.error)
      return
    }
    successes++;
    console.log({ result })
    const data = unwrap(result);
    if (data.type === 'worker') {
      smallFiles.push(data)
    } else if (data.type === 'worker multipart') {
      mediumFiles.push(data)
    } else if (data.type === 's3 multipart') {
      largeFiles.push(data)
    }
  })

  if (successes === 0) {
    return failure(R2ServerStorageError({
      message: "Error subiendo archivos",
      details: "No se pudo subir ningún archivo",
      metadata: { 
        scope: "Process files", 
        operation: "Check successes",
        sensitivity: "none",
        tags: [ErrorTag.r2, ErrorTag.external],
        isExpected: true,
      },
      parallelErrors: failures,
    }));
  }
  
  const groupedFiles = {
    small: smallFiles,
    medium: mediumFiles,
    large: largeFiles,
  };

  if (failures.length) {
    return partialSuccess({ groupedFiles },R2PartialServerStorageError({
      message: "Subida parcial de archivos",
      details: "Uno o más archivos no pudieron subirse",
      metadata: { 
        scope: "Process files", 
        operation: "Check successes",
        sensitivity: "none",
        tags: [ErrorTag.r2, ErrorTag.external],
        isExpected: true,
      },
      parallelErrors: failures,
    }))
  }

  return success({ groupedFiles });
}


// // Small files
//   if (categorized.small.length > 0) {
//     processingTasks.push(
//       processBatch(
//         categorized.small,
//         file => processor.processSmallFile(file, pathPrefix),
//         Math.min(GLOBAL_SERVER_UPLOAD_CONFIG.SMALL_CONCURRENT_UPLOADS, categorized.small.length)
//       )
//     );
//   } else {
//     processingTasks.push(Promise.resolve([]));
//   }

//   // Medium files
//   if (categorized.medium.length > 0) {
//     processingTasks.push(
//       processBatch(
//         categorized.medium,
//         file => processor.processMediumFile(file, pathPrefix),
//         Math.min(GLOBAL_SERVER_UPLOAD_CONFIG.MEDIUM_CONCURRENT_UPLOADS, categorized.medium.length)
//       )
//     );
//   } else {
//     processingTasks.push(Promise.resolve([]));
//   }

//   // Large files
//   if (categorized.large.length > 0) {
//     processingTasks.push(
//       processBatch(
//         categorized.large,
//         file => processor.processLargeFile(file, pathPrefix, bucket),
//         Math.min(GLOBAL_SERVER_UPLOAD_CONFIG.LARGE_CONCURRENT_UPLOADS, categorized.large.length)
//       )
//     );
//   } else {
//     processingTasks.push(Promise.resolve([]));
//   }

//   // Execute all processing tasks in parallel
//   const [smallResults, mediumResults, largeResults] = await Promise.all(processingTasks);

//   // Split results in success/failure
//   const { successes: smallSuccesses, failures: smallFailures } = splitResults(smallResults);
//   const { successes: mediumSuccesses, failures: mediumFailures } = splitResults(mediumResults);
//   const { successes: largeSuccesses, failures: largeFailures } = splitResults(largeResults);

//   const allErrors = [...smallFailures, ...mediumFailures, ...largeFailures];

export async function completeMultipartUploads({
  multipartUploads,
  bucket,
  successfulFiles, // Pass file names from upload result to avoid splitting keys
}: {
  multipartUploads: MultipartUploads;
  bucket: string;
  successfulFiles: Record<string, string>; // key -> fileName mapping
}): Promise<Result<boolean>> {
  const processor = new FileProcessor();
  const pool = new ParallelPool<boolean, FileResource>(100);
  
  // Extract entries once
  const { worker: workerMultipartUploads, s3: s3MultipartUploads } = multipartUploads;
  const workerEntries = Object.entries(workerMultipartUploads);
  const s3Entries = Object.entries(s3MultipartUploads);


  // Complete multipart for s3 files
  for (const [key, { uploadId, parts }] of s3Entries) {
    pool.addTask({
      priority: 1,
      fileKey: key,
      execute: async () => await withRetry(() => 
        processor.completeMultipartUpload(bucket, key, uploadId, parts, 's3')
      ),
    });
  }

    // Complete multipart for worker files
  for (const [key, { uploadId, parts }] of workerEntries) {
    pool.addTask({
      priority: 1,
      fileKey: key,
      execute: async () => await withRetry(() => 
        processor.completeMultipartUpload(bucket, key, uploadId, parts, 'worker')
      ),
    });
  }

  // Process all tasks
  let results: Result<boolean, FileResource>[] = [];
  try {
    results = await pool.processAll();
  } catch (error: any) {
    return failure(R2ServerStorageError({
      message: "Error de subida de archivo",
      details: "No se pudo finalizar la subida del archivo",
      metadata: {
        scope: "Complete multipart uploads",
        operation: "Start pool proccess all",
        sensitivity: "none",
        tags: [ErrorTag.pool],
        isExpected: true,
      },
      raw: errorRaw(error)
    }))
  }

  const failures: AppError<FileResource>[] = [];

  let successes = 0;
  results.forEach(result => {
    if (isFailure(result)) {
      failures.push(result.error)
      return
    }
    successes++;
  })

  if (successes === 0) {
    return failure(R2ServerStorageError({
      message: "Error subiendo archivos",
      details: "No se pudo subir ningún archivo",
      metadata: { 
        scope: "Process files", 
        operation: "Check successes",
        sensitivity: "none",
        tags: [ErrorTag.r2, ErrorTag.external],
        isExpected: true,
      },
      parallelErrors: failures,
    }));
  }

  if (failures.length) {
    return partialSuccess(true ,R2PartialServerStorageError({
      message: "Subida parcial de archivos",
      details: "Uno o más archivos no pudieron subirse",
      metadata: { 
        scope: "Process files", 
        operation: "Check successes",
        sensitivity: "none",
        tags: [ErrorTag.r2, ErrorTag.external],
        isExpected: true,
      },
      parallelErrors: failures,
    }))
  }

  return success(true);
}