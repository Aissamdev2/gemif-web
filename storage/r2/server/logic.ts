import { S3ServerService } from "./s3/logic";
import { WorkerServerService } from "./worker/logic";
import { FILE_SIZE_THRESHOLDS, GLOBAL_SERVER_UPLOAD_CONFIG } from "./config";
import { FileToProcess, ServerFile } from "@/types/storage";
import { FileGroup, ProcessedFile, ProcessedLargeFile, ProcessedMediumFile, ProcessedSmallFile } from "./types";
import { makeFileResource, R2ServerStorageError, TooManyRetriesError } from "@/lib/errors/factories";
import { sleep } from "@/lib/utils";
import { FunctionMetadata } from "@/types/general";
import { AppError, ErrorFactoryParams, FileResource, Result } from "@/lib/errors/types";
import {  failure, isFailure, isPartialSuccess, isSuccess, setResource, success, unwrap } from "@/lib/errors/result";
import { Part } from "../client/types";
import { ErrorTag } from "@/lib/errors/codes";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";



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
    maxRetries = GLOBAL_SERVER_UPLOAD_CONFIG.MAX_RETRIES,
    delayMs = GLOBAL_SERVER_UPLOAD_CONFIG.RETRY_DELAY_MS,
    multiplier = GLOBAL_SERVER_UPLOAD_CONFIG.RETRY_MULTIPLIER,
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

    if (isPartialSuccess(result)) {
      errors.concat(result.error)
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
  if (items.length === 0) return [];
  
  const results: Result<R>[] = new Array(items.length);
  let index = 0;
  let completed = 0;
  
  // Process items in chunks to avoid memory buildup
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index++;
      const item = items[currentIndex];
      
      try {
        const result = await processor(item);
        results[currentIndex] = result;
      } catch (error) {
        // Handle unexpected errors gracefully
        results[currentIndex] = {
          ok: false,
          error: error as any
        } as Result<R>;
      }
      
      completed++;
    }
  });
  
  await Promise.all(workers);
  return results;
}


export class FileProcessor {
  private workerService: WorkerServerService;
  private s3Service: S3ServerService;

  constructor() {
    this.workerService = WorkerServerService.getInstance();
    this.s3Service = S3ServerService.getInstance();
  }

  categorizeFiles(filesToProcess: FileToProcess[]): FileGroup {
    // Split files in three categories by size
    return {
      small: filesToProcess.filter(f => f.fileMeta.size < FILE_SIZE_THRESHOLDS.SMALL),
      medium: filesToProcess.filter(f => 
        f.fileMeta.size >= FILE_SIZE_THRESHOLDS.SMALL && 
        f.fileMeta.size < FILE_SIZE_THRESHOLDS.MEDIUM
      ),
      large: filesToProcess.filter(f => f.fileMeta.size >= FILE_SIZE_THRESHOLDS.MEDIUM),
    };
  }

  async processSmallFile(
    fileToProcess: FileToProcess, 
  ): Promise<Result<ProcessedSmallFile, FileResource>> {
    // Get the worker url
    const urlResult = await withRetry(async () => {
      return await this.workerService.generateWorkerUrl(fileToProcess.key);
    });
    if (isFailure(urlResult)) {
      const resource = makeFileResource({ fileName: fileToProcess.fileMeta.name, key: fileToProcess.key, size: fileToProcess.fileMeta.size, contentType: fileToProcess.fileMeta.type })
      return setResource(urlResult, resource)
    }
    return success({
      type: 'worker',
      ...fileToProcess,
      url: urlResult.data,
    })
  }

  async processMediumFile(
    fileToProcess: FileToProcess, 
  ): Promise<Result<ProcessedMediumFile>> {
    // Get the worker url
    const urlResult = await withRetry(async () => {
      return await this.workerService.generateWorkerUrl(fileToProcess.key);
    });
    if (isFailure(urlResult)) {
      const resource = makeFileResource({ fileName: fileToProcess.fileMeta.name, key: fileToProcess.key, size: fileToProcess.fileMeta.size, contentType: fileToProcess.fileMeta.type })
      return setResource(urlResult, resource)
    }
    const url= unwrap(urlResult)

    // Create the worker multipart upload
    const multipartCreationResult = await withRetry(async () => {
      return await this.workerService.createWorkerMultipart(url, fileToProcess.fileMeta.type);
    });
    if (isFailure(multipartCreationResult)) {
      const resource = makeFileResource({ fileName: fileToProcess.fileMeta.name, key: fileToProcess.key, size: fileToProcess.fileMeta.size, contentType: fileToProcess.fileMeta.type })
      return setResource(multipartCreationResult, resource)
    }
    
    const { uploadId } = unwrap(multipartCreationResult)

    return success({
      type: 'worker multipart',
      ...fileToProcess,
      url,
      uploadId
    })

  }

  // TODO: implement large file upload via s3
  async processLargeFile(
    fileToProcess: FileToProcess, 
    bucket: string
  ): Promise<Result<ProcessedLargeFile>> {

    const multipartCreationResult = await withRetry(async () => {
      return await this.s3Service.createMultipartUpload(bucket, fileToProcess.key, fileToProcess.fileMeta.type);
    });
    if (isFailure(multipartCreationResult)) return setResource(multipartCreationResult, makeFileResource({ fileName: fileToProcess.fileMeta.name, key: fileToProcess.key, size: fileToProcess.fileMeta.size, contentType: fileToProcess.fileMeta.type }))
    const { UploadId: uploadId } = unwrap(multipartCreationResult)

    const totalParts = Math.ceil(fileToProcess.fileMeta.size / GLOBAL_SERVER_UPLOAD_CONFIG.CHUNK_SIZE)

    const partUrls: string[] = []

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const partUrlCreationResult = await withRetry(async () => {
        return await this.s3Service.generatePartUrl(bucket, fileToProcess.key, uploadId, partNumber);
      });
      if (isFailure(partUrlCreationResult)) return partUrlCreationResult
      
      const partUrl = unwrap(partUrlCreationResult)
      partUrls.push(partUrl)
    }

    return success({
      type: "s3 multipart",
      ...fileToProcess,
      uploadId,
      partUrls
    })

  }

  async completeMultipartUpload(
    bucket: string,
    key: string,
    uploadId: string,
    parts: Array<Part>,
    type: 's3' | 'worker'
  ): Promise<Result<boolean>> {

    // S3 completion
    if (type === 's3') {
      return this.s3Service.completeMultipartUpload(bucket, key, uploadId, parts);
    }
    
    // Worker completion
    const urlResult = await withRetry(() => 
      this.workerService.generateWorkerUrl(key)
    );
    if (isFailure(urlResult)) return (urlResult)
      const url = unwrap(urlResult)

    const multipartCompletionResult = await withRetry(() => 
      this.workerService.completeMultipartUpload(url, uploadId, parts)
    );

    return multipartCompletionResult
  }

  async deleteFile(bucket: string, key: string): Promise<Result<string>> {
    return await withRetry(() => 
      this.s3Service.deleteS3File(bucket, key)
    );
  }
}









