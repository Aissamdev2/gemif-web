

import { r2Client } from "@/storage/r2-instance";
import { 
  CreateMultipartUploadCommand, 
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand, 
  DeleteObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3MpuCreationResponse, S3MultipartCompletionResponse } from "./types";
import { S3_SERVER_UPLOAD_CONFIG } from "./config";
import { Result } from "@/lib/errors/types";
import { errorRaw, ExternalApiError, R2ServerStorageError, responseRawError } from "@/lib/errors/factories";
import { failure, success } from "@/lib/errors/result";
import { Part } from "../../client/types";
import { ErrorTag } from "@/lib/errors/codes";

export class S3ServerService {
  private static instance: S3ServerService;

  static getInstance(): S3ServerService {
    if (!this.instance) {
      this.instance = new S3ServerService();
    }
    return this.instance;
  }

  async createMultipartUpload(bucket: string, key: string, contentType?: string): Promise<Result<S3MpuCreationResponse>> {

    const command = new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType || "application/octet-stream",
      });

      console.log({ bucket, key, contentType })
    try {
      const response = await r2Client.send(command);
      
      if (!response.UploadId) {
        return failure(R2ServerStorageError({
          message: "Error de comunicación con servicio externo",
          details: "No se pudo empezar la subida del archivo",
          metadata: {
            scope: "S3",
            operation: "Multipart creation",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.s3, ErrorTag.multipart, ErrorTag.multipartCreation, ErrorTag.failedFetchResponse],
            isExpected: false,
          },
          raw: JSON.stringify(response)
        }))
      }

      return success({ UploadId: response.UploadId })
    } catch (error: any) {
      console.log({ ...error })
      return failure(R2ServerStorageError({
        message: "Error de comunicación con servicio externo",
        details: "No se pudo empezar la subida del archivo",
        metadata: {
          scope: "S3",
          operation: "Multipart creation",
          sensitivity: "none",
          tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.s3, ErrorTag.multipart, ErrorTag.multipartCreation, ErrorTag.failedFetch],
          isExpected: true,
        },
        raw: errorRaw(error)
      }))
  }
  }

  async generatePartUrl(
    bucket: string, 
    key: string, 
    uploadId: string,
    partNumber: number,
  ): Promise<Result<string>> {
    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    try {
      const signedUrl = await getSignedUrl(r2Client, command, { 
        expiresIn: S3_SERVER_UPLOAD_CONFIG.PRESIGN_EXPIRY_SECONDS 
      });
      if (!signedUrl) {
        return failure(R2ServerStorageError({
          message: "Error de comunicación con servicio externo",
          details: "No se pudo firmar el archivo para la subida",
          metadata: {
            scope: "S3",
            operation: "Part url signing",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.s3, ErrorTag.multipart, ErrorTag.partSigning, ErrorTag.failedFetchResponse],
            isExpected: false,
          },
        }))
      }
      return success(signedUrl)
    } catch (error: any) {
      return failure(R2ServerStorageError({
        message: "Error de comunicación con servicio externo",
        details: "No se pudo firmar el archivo para la subida",
        metadata: {
          scope: "S3",
          operation: "Part url signing",
          sensitivity: "none",
          tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.s3, ErrorTag.multipart, ErrorTag.partSigning, ErrorTag.failedFetch],
          isExpected: true,
        },
        raw: errorRaw(error)
      }))
    }
  }

  async completeMultipartUpload(
    bucket: string,
    key: string,
    uploadId: string,
    parts: Array<Part>
  ): Promise<Result<boolean>> {
    
    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });

    try {
      const completeS3Multipart: S3MultipartCompletionResponse = await r2Client.send(command);

      if (!completeS3Multipart.Key || !completeS3Multipart.Bucket) {
        return failure(R2ServerStorageError({
          message: "Error de comunicación con servicio externo",
          details: "No se pudo completar la subida del archivo",
          metadata: {
            scope: "S3",
            operation: "Multipart completion",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.s3, ErrorTag.multipart, ErrorTag.multipartCompletion, ErrorTag.failedFetchResponse],
            isExpected: false,
          },
          raw: JSON.stringify(completeS3Multipart)
        }))
      }
      return success(true);
    } catch (error: any) {
      return failure(R2ServerStorageError({
        message: "Error de comunicación con servicio externo",
        details: "No se pudo completar la subida del archivo",
        metadata: {
          scope: "S3",
          operation: "Multipart completion",
          sensitivity: "none",
          tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.s3, ErrorTag.multipart, ErrorTag.multipartCompletion, ErrorTag.failedFetch],
          isExpected: true,
        },
        raw: errorRaw(error)
      }))
    }
  }

  async abortMultipartUpload(bucket: string, key: string, uploadId: string): Promise<Result<boolean>> {
    // Build the abortion commmand
    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    });
    
    try {
      const abortMultipart = await r2Client.send(command);
      
      if ((abortMultipart.$metadata.httpStatusCode ?? 0) < 200 || (abortMultipart.$metadata.httpStatusCode ?? 500) > 300) {
        return failure(R2ServerStorageError({
          message: "Error de comunicación con servicio externo",
          details: "No se pudo abortar la subida del archivo despues de un error crítico",
          metadata: {
            scope: "S3",
            operation: "Multipart abortion",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.s3, ErrorTag.multipart, ErrorTag.multipartCompletion, ErrorTag.failedFetchResponse],
            isExpected: false,
          },
          raw: JSON.stringify(abortMultipart)
        }))
      }

      return success(true)
    } catch (error: any) {
      return failure(R2ServerStorageError({
        message: "Error de comunicación con servicio externo",
        details: "No se pudo abortar la subida del archivo despues de un error crítico",
        metadata: {
          scope: "S3",
          operation: "Multipart abortion",
          sensitivity: "none",
          tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.s3, ErrorTag.multipart, ErrorTag.multipartCompletion, ErrorTag.failedFetch],
          isExpected: true,
        },
        raw: errorRaw(error)
      }))
    }
  }

  async deleteS3File(bucket: string, key: string): Promise<Result<string>> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
      try {
        await r2Client.send(command);
  
        return success(key)
      } catch (error: any) {
        return failure(R2ServerStorageError({
          message: "Error de comunicación con servicio externo",
          details: "No se pudo eliminar el archivo",
          metadata: {
            scope: "S3 server service",
            operation: "Delete file",
            sensitivity: "none",
            tags: [ErrorTag.external, ErrorTag.r2, ErrorTag.s3],
            isExpected: true,
          },
          raw: errorRaw(error)
        }))
      }
    }

  async getPresignedDownload(bucket: string, key: string): Promise<Result<string>> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });
    try {
      const url = await getSignedUrl(r2Client, command, { expiresIn: 300 });
      return success(url)
    } catch (error: any) {
      return failure(R2ServerStorageError({
        message: "Error durante la descarga",
        details: "No se pudo obtener el enlace de descarga",
        metadata: { 
          scope: "S3 server service", 
          operation: "Get presigned download",
          sensitivity: "none",
          tags: [ErrorTag.r2, ErrorTag.external, ErrorTag.s3],
          isExpected: true,
        },
        raw: errorRaw(error)
      }));
    }
  }
}
