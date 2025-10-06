


import { createR2WorkerToken } from "@/auth/dal";
import { ActionReturn } from "@/app/lib/definitions";
import { WORKER_SERVER_UPLOAD_CONFIG } from "./config";
import { WorkerMpuCreationResponse, WorkerToken } from "./types";
import { failure, isFailure, success, unwrap } from "@/lib/errors/result";
import { errorRaw, ExternalApiError, ExternalParsingError, R2ServerStorageError, responseRawError } from "@/lib/errors/factories";
import { Result } from "@/lib/errors/types";
import { Part } from "../../client/types";
import { ErrorTag } from "@/lib/errors/codes";



export class WorkerServerService {
  private static instance: WorkerServerService;
  private tokenCache = new Map<string, { token: string; expires: number }>();

  static getInstance(): WorkerServerService {
    if (!this.instance) {
      this.instance = new WorkerServerService();
    }
    return this.instance;
  }

  // ----------------
  //  URL GENERATION
  // ----------------
  async generateWorkerUrl(key: string): Promise<Result<string>> {
    // Get token (cached or new)
    const tokenResult = await this.getCachedToken(key);
    if (isFailure(tokenResult)) return tokenResult;
    
    // Generate and return url
    const token = unwrap(tokenResult);
    const url = `${WORKER_SERVER_UPLOAD_CONFIG.WORKER_BASE_URL}/${key}?token=${token}`;
    return success(url);
  }

  private async getCachedToken(key: string): Promise<Result<string>> {
    // Check and get from cache if available
    const cached = this.tokenCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return success(cached.token);
    }

    // If not, create token
    const tokenCreationResult = await createR2WorkerToken({ payload: { key }, expires: WORKER_SERVER_UPLOAD_CONFIG.TOKEN_EXPIRATION });
    if (isFailure(tokenCreationResult)) return tokenCreationResult;

    // Collect token
    const token = unwrap(tokenCreationResult)

    // Set created token to cache if successfully got
    this.tokenCache.set(key, {
      token,
      expires: Date.now() + WORKER_SERVER_UPLOAD_CONFIG.TOKEN_EXPIRATION // 5 minutes
    });
    
    return tokenCreationResult;
  }

  // ---------------------
  //  MULLTIPART CREATION
  // ---------------------
  async createWorkerMultipart(url: string, type: string): Promise<Result<WorkerMpuCreationResponse>> {
    let response: Response | null = null;
    try {
      response = await fetch(`${url}&action=mpu-create`, { method: "POST", headers: { 'Content-type': type || 'application/octet-stream'} });
      
      if (!response.ok) {
        return failure(R2ServerStorageError({
          message: "Error de comunicación con servicio externo",
          details: "No se pudo empezar la subida del archivo",
          metadata: {
            scope: "Worker",
            operation: "Multipart creation",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.multipart, ErrorTag.multipartCreation, ErrorTag.failedFetchResponse],
            isExpected: true,
          },
          raw: await responseRawError(response)
        }))
      }
    } catch (error: any) {
      return failure(R2ServerStorageError({
        message: "Error de comunicación con servicio externo",
        details: "No se pudo empezar la subida del archivo",
        metadata: {
          scope: "Worker",
          operation: "Multipart creation",
          sensitivity: "none",
          tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.multipart, ErrorTag.multipartCreation, ErrorTag.failedFetch],
          isExpected: false,
        },
        raw: errorRaw(error)
      }))
    }

    try {
      const creationResponse: WorkerMpuCreationResponse = await response.json();
      
      return success(creationResponse)
    } catch (error: any) {
      return failure(ExternalParsingError({
        message: "Error de tratamiento de respuestas externas",
        details: "La resupesta recibida no tiene el formato esperado",
        metadata: {
          scope: "Worker",
          operation: "Multipart creation",
          sensitivity: "none",
          tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.multipart, ErrorTag.multipartCreation, ErrorTag.parse],
          isExpected: false,
        },
        raw: errorRaw(error)
      }))
    }
  }


  async completeMultipartUpload(
    url: string,
    uploadId: string,
    parts: Array<Part>
  ): Promise<Result<boolean>> {
    
    let response: Response | null = null;
    try {
      response = await fetch(`${url}&action=mpu-complete&uploadId=${uploadId}`, { 
        method: "POST",
        headers: {
          'Content-type': "application/json",
        },
        body: JSON.stringify({ parts })
      });
      
      if (!response.ok) {
        return failure(R2ServerStorageError({
          message: "Error de comunicación con servicio externo",
          details: "No se pudo completar la subida del archivo",
          metadata: {
            scope: "Worker",
            operation: "Multipart completion",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.multipart, ErrorTag.multipartCompletion, ErrorTag.failedFetchResponse],
            isExpected: true,
          },
          raw: await responseRawError(response)
        }))
      }
    return success(true)
    } catch (error: any) {
      return failure(R2ServerStorageError({
        message: "Error de comunicación con servicio externo",
        details: "No se pudo completar la subida del archivo",
        metadata: {
          scope: "Worker",
          operation: "Multipart completion",
          sensitivity: "none",
          tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.multipart, ErrorTag.multipartCompletion, ErrorTag.failedFetch],
          isExpected: false,
        }
      }))
    }
  }


  // ---------------
  //  FILE DELETION
  // ---------------
  async deleteWorkerFile(url: string): Promise<Result<boolean>> {
    try {
      const response = await fetch(`${url}?action=delete`, { method: "DELETE" });
      if (!response.ok) {
        return failure(ExternalApiError({
          message: "Error de comunicación con servicio externo",
          details: "No se pudo eliminar el archivo",
          metadata: {
            scope: "Worker",
            operation: "File deletion",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.fileDeletion, ErrorTag.failedFetchResponse],
            isExpected: true,
          },
          raw: await responseRawError(response)
        }))
      }
      return success(true)
    } catch (error: any) {
      return failure(ExternalApiError({
        message: "Error de comunicación con servicio externo",
        details: "No se pudo eliminar el archivo",
        metadata: {
          scope: "Worker",
          operation: "Multipart completion",
          sensitivity: "none",
          tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.fileDeletion, ErrorTag.failedFetchResponse],
          isExpected: false,
        },
        raw: errorRaw(error)
      }))
    }
  }
}