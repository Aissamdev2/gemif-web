import { AppError, FileResource, Resource, Result } from "@/lib/errors/types";
import { GLOBAL_SERVER_UPLOAD_CONFIG } from "../config";
import { FileProcessor, processBatch, withRetry } from "../logic";
import { WorkerServerService } from "../worker/logic";
import { failure, isFailure, partialSuccess, success, unwrap } from "@/lib/errors/result";
import { errorRaw, R2PartialServerStorageError, R2ServerStorageError } from "@/lib/errors/factories";
import { PoolTask } from "../../client/types";
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


export async function deleteR2Files({
  bucket,
  folderName,
  deletedFiles,
}: {
  bucket: string;
  folderName: string;
  deletedFiles: string[];
}): Promise<Result<string[]>> {
  if (deletedFiles.length === 0) return success([])
  const processor = new FileProcessor();
  
  // Create a parallel pool with 100 "threads" (because we are on server)
  const pool = new ParallelPool<string, FileResource>(5)

  for (const fileToDelete of deletedFiles) {
    pool.addTask({
      priority: 1,
      fileKey: fileToDelete,
      execute: () => processor.deleteFile(bucket, `${folderName}/${fileToDelete}`),
    });
  }
  
  // Process all tasks
  let results: Result<string, FileResource>[] = [];
  try {
    results = await pool.processAll();
  } catch (error: any) {
    return failure(R2ServerStorageError({
      message: "Error durante la eliminación de archivos",
      details: "No se pudo empezar la eliminación",
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

  const failedFiles: AppError<FileResource>[] = [];
  const successfulFiles: string[] = [];

  let successes = 0;
  results.forEach(result => {
    if (isFailure(result)) {
      failedFiles.push(result.error)
      return
    }
    successes++;
    successfulFiles.push(unwrap(result))
  })

  if (successes === 0) {
    return failure(R2ServerStorageError({
      message: "Error eliminando archivos",
      details: "No se pudo eliminar ningún archivo",
      metadata: { 
        scope: "Delete r2 files", 
        operation: "Check successes",
        sensitivity: "none",
        tags: [ErrorTag.r2, ErrorTag.external],
        isExpected: true,
      },
      parallelErrors: failedFiles,
    }));
  }
  
  if (failedFiles.length) {
    return partialSuccess(successfulFiles, R2PartialServerStorageError({
      message: "Eliminación parcial de archivos",
      details: "Uno o más archivos no pudieron ser eliminados",
      metadata: { 
        scope: "Delete r2 files", 
        operation: "Check successes",
        sensitivity: "none",
        tags: [ErrorTag.r2, ErrorTag.external],
        isExpected: true,
      },
      parallelErrors: failedFiles,
    }))
  }

  return success(successfulFiles);
}

