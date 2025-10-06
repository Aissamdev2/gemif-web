import { ProgressCallback } from "@/types/general";
import { ProgressTracker, withRetry } from "../logic";
import { Result } from "@/lib/errors/types";
import { failure, success } from "@/lib/errors/result";
import { ClientApiError, errorRaw, ExternalApiError, ExternalParsingError, R2ClientStorageError } from "@/lib/errors/factories";
import { Part } from "../types";
import { ErrorTag } from "@/lib/errors/codes";


export class WorkerClientService {
  private static instance: WorkerClientService;
  private tokenCache = new Map<string, { token: string; expires: number }>();

  static getInstance(): WorkerClientService {
    if (!this.instance) {
      this.instance = new WorkerClientService();
    }
    return this.instance;
  }

  async uploadFile(
    url: string,
    key: string,
    file: File,
    progressTracker: ProgressTracker,
    updateProgress?: Function,
    onProgress?: ProgressCallback
  ): Promise<Result<{ key: string }>> {
    try {
      try {
        progressTracker.init(key, file.size);
      } catch (error: any) {
        return failure(ClientApiError({
          message: "Error inicializando la subida",
          details: "No se pudo iniciar el controlador de progreso",
          metadata: {
            scope: "Worker file uploader",
            operation: "Progress tracker init",
            sensitivity: "none",
            tags: [ErrorTag.worker, ErrorTag.progressTracker],
            isExpected: false,
          },
          raw: errorRaw(error)
        }));
      }

      let xhr: XMLHttpRequest;
      try {
        xhr = new XMLHttpRequest();
      } catch (error: any) {
        return failure(ClientApiError({
          message:  "Error inicializando la subida",
          details: "Error creando la conexión de subida",
          metadata: {
            scope: "Worker file uploader",
            operation: "Create XMLHttpRequest ",
            sensitivity: "none",
            tags: [ErrorTag.xhr],
            isExpected: false,
          },
          raw: errorRaw(error)
        }));
      }

      try {
        xhr.open("PUT", url);
      } catch (error: any) {
        return failure(R2ClientStorageError({
          message:  "Error inicializando la subida",
          details: "Error estableciendo la conexión de subida con el servicio externo",
          metadata: {
            scope: "Worker file uploader",
            operation: "Xhr open",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.fileUpload, ErrorTag.xhr],
            isExpected: true,
          },
          raw: errorRaw(error)
        }));
      }

      try {
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      } catch (error: any) {
        return failure(ClientApiError({
          message: "Error inicializando la subida",
          details: "Error configurando las cabeceras de subida",
          metadata: {
            scope: "Worker file uploader",
            operation: "Xhr set request header",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.fileUpload, ErrorTag.xhr],
            isExpected: false,
          },
          raw: errorRaw(error)
        }));
      }

      return await new Promise<Result<{ key: string }>>((resolve) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            try {
              const prevLoaded = (progressTracker as any).progress.get(key)?.loaded || 0;
              progressTracker.update(key, e.loaded - prevLoaded, updateProgress, onProgress);
            } catch (error: any) {
              return failure(R2ClientStorageError({
                message: "Error actualizando los datos de la subida",
                details: "No se pudo actualizar el progreso",
                metadata: {
                  scope: "Worker file uploader",
                  operation: "Progress tracker update",
                  sensitivity: "none",
                  tags: [ErrorTag.worker, ErrorTag.progressTracker],
                  isExpected: false,
                },
                raw: errorRaw(error)
              }));
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              progressTracker.update(key, file.size, updateProgress, onProgress);
            } catch (error: any) {
              return failure(ClientApiError({
                message: "Error actualizando los datos de la subida",
                details: "No se pudo finalizar el progreso",
                metadata: {
                  scope: "Worker file uploader",
                  operation: "Progress tracker final update",
                  sensitivity: "none",
                  tags: [ErrorTag.worker, ErrorTag.progressTracker],
                  isExpected: false,
                },
                raw: errorRaw(error)
              }));
            }
            resolve(success({ key }));
          } else {
            resolve(failure(R2ClientStorageError({
              message: "Error de comunicación con servicio externo",
              details: "Respuesta de error recibida",
              metadata: {
                scope: "Worker file uploader",
                operation: "Xhr status check",
                sensitivity: "none",
                tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.fileUpload, ErrorTag.xhr],
                isExpected: true,
              },
              raw: `Status [${xhr.status}] Status text [${xhr.statusText}] Text [${xhr.responseText}]`
            })));
          }
        };

        xhr.onerror = (event) => {
          resolve(failure(R2ClientStorageError({
            message: "Error de comunicación con servicio externo",
            details: "Error de red desconocido durante la subida",
            metadata: {
              scope: "Worker file uploader",
              operation: "Xhr onerror",
              sensitivity: "none",
              tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.fileUpload, ErrorTag.xhr],
              isExpected: false,
            },
            raw: JSON.stringify(event)
          })));
        };

        try {
          xhr.send(file);
        } catch (error: any) {
          resolve(failure(R2ClientStorageError({
            message: "Error de comunicación con servicio externo",
            details: "Error enviado el archivo",
            metadata: {
              scope: "Worker file uploader",
              operation: "Xhr send",
              sensitivity: "none",
              tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.fileUpload, ErrorTag.xhr],
              isExpected: true,
            },
            raw: errorRaw(error)
          })));
        }
      });
    } catch (error: any) {
      return failure(R2ClientStorageError({
        message: "Error de comunicación con servicio externo",
        details: "Error desconocido durante la subida",
        metadata: {
          scope: "Worker file uploader",
          operation: "Unknown",
          sensitivity: "none",
          tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.fileUpload, ErrorTag.xhr],
          isExpected: false,
          isSensible: false
        },
        raw: errorRaw(error)
      }));
    }
  }

  async uploadChunk(
    key: string,
    url: string,
    uploadId: string,
    partNumber: number,
    chunk: Blob
  ): Promise<Result<Part>> {
    const fullUrl = `${url}&action=mpu-uploadpart&uploadId=${uploadId}&partNumber=${partNumber}`;
    
    const upload = async () => {
      let response: Response;
      try {
        response = await fetch(fullUrl, { method: 'PUT', body: chunk });
        
        if (!response.ok) {
          return failure(R2ClientStorageError({
            message: "Error de comunicación con servicio externo",
            details: "Error enviando partición de archivo",
            metadata: {
              scope: "Worker",
              operation: "Chunk upload",
              sensitivity: "none",
              tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.fileUpload, ErrorTag.chunkUpload, ErrorTag.failedFetchResponse],
              isExpected: true,
            }
          }))
        }
      } catch (error: any) {
        return failure(R2ClientStorageError({
          message: "Error de comunicación con servicio externo",
          details: "Error enviando partición de archivo",
          metadata: {
            scope: "Worker",
            operation: "Chunk upload",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.fileUpload, ErrorTag.chunkUpload, ErrorTag.failedFetch],
            isExpected: false,
          }
        }))
      }
      try {
        const creationResponse: Part = await response.json();
        return success(creationResponse)
      } catch (error: any) {
        return failure(ExternalParsingError({
          message: "Error de tratamiento de respuestas externas",
          details: "La resupesta recibida no tiene el formato esperado",
          metadata: {
            scope: "Worker",
            operation: "Chunk upload",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.worker, ErrorTag.fileUpload, ErrorTag.chunkUpload, ErrorTag.parse],
            isExpected: false,
          },
          raw: errorRaw(error)
        }))
      }
    };
    
    return await upload();
  }



  
}