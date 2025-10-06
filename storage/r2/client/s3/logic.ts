import { Result } from "@/lib/errors/types";
import { Part } from "../types";
import { failure, success } from "@/lib/errors/result";
import { errorRaw, ExternalApiError, R2ClientStorageError } from "@/lib/errors/factories";
import { ErrorTag } from "@/lib/errors/codes";


export class S3ClientService {
  private static instance: S3ClientService;

  static getInstance(): S3ClientService {
    if (!this.instance) {
      this.instance = new S3ClientService();
    }
    return this.instance;
  }

  async uploadChunk(
    key: string,
    url: string,
    partNumber: number,
    chunk: Blob,
    contentType: string
  ): Promise<Result<Part>> {
    try {
      const xhr = new XMLHttpRequest();
      try {
        console.log({ key, url, partNumber, contentType})
        xhr.open("PUT", url);
      } catch (error: any) {
        return failure(R2ClientStorageError({
          message: "Error durante la subida de archivos",
          details: "No se pudo abrir la conexión de subida",
          metadata: { 
            scope: "Upload s3 chunk", 
            operation: "Xhr open",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.xhr],
            isExpected: false,
          },
          raw: errorRaw(error)
        }));
      }

      try {
        xhr.setRequestHeader('Content-Type', contentType);
      } catch (error: any) {
        return failure(R2ClientStorageError({
          message: "Error durante la subida de archivos",
          details: "No se pudieron establecer las cabeceras de subida",
          metadata: { 
            scope: "Upload s3 chunk", 
            operation: "Xhr set request headers",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.xhr],
            isExpected: false,
          },
          raw: errorRaw(error)
        }));
      }

      return await new Promise<Result<Part>>((resolve) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const etag = xhr.getResponseHeader('ETag');
            if (!etag) {
              resolve(failure(R2ClientStorageError({
                message: "Error durante la subida de archivos",
                details: "Se recibió una respuesta incorrecta del servicio externo",
                metadata: { 
                  scope: "Upload s3 chunk", 
                  operation: "Xhr check for etag",
                  sensitivity: "none",
                  tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.xhr],
                  isExpected: false,
                },
              })));
            } else {
              resolve(success({ PartNumber: partNumber, ETag: etag }));
            }
          } else {
            resolve(failure(R2ClientStorageError({
              message: "Error durante la subida de archivos",
              details: "Se recibió una respuesta de error del servicio externo",
              metadata: { 
                scope: "Upload s3 chunk", 
                operation: "Xhr check status",
                sensitivity: "none",
                tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.xhr],
                isExpected: false,
              },
              raw: `Status [${xhr.status}] Status text [${xhr.statusText}] Text [${xhr.responseText}]`
            })));
          }
        };

        xhr.onerror = () => {
          resolve(failure(R2ClientStorageError({
            message: "Error durante la subida de archivos",
            details: "Hubo un error de red durante la subida",
            metadata: { 
              scope: "Upload s3 chunk", 
              operation: "Xhr onerror",
              sensitivity: "none",
              tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.xhr],
              isExpected: false,
            },
            raw: `Status [${xhr.status}] Status text [${xhr.statusText}]`
          })));
        };

        try {
          xhr.send(chunk);
        } catch (error: any) {
          resolve(failure(R2ClientStorageError({
            message: "Error durante la subida de archivos",
            details: "No se pudo enviar un fragmento de archivo",
            metadata: { 
              scope: "Upload s3 chunk", 
              operation: "Xhr send chunk",
              sensitivity: "none",
              tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.xhr],
              isExpected: false,
            },
            raw: errorRaw(error)
          })));
        }
      });
    } catch (error: any) {
      return failure(R2ClientStorageError({
        message: "Error durante la subida de archivos",
        details: "Error desconocido durante la subida",
        metadata: { 
          scope: "Upload s3 chunk", 
          operation: "Xhr global try catch",
          sensitivity: "none",
          tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.xhr],
          isExpected: false,
        },
        raw: errorRaw(error)
      }));
    }
  }  
  
}
