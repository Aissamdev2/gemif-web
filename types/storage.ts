import { AppError } from "@/lib/errors/types";
import { MultipartResult, UploadError } from "@/storage/r2/client/types";
import { ProcessedFile, ProcessedLargeFile, ProcessedMediumFile, ProcessedSmallFile } from "@/storage/r2/server/types";

export type ServerFile = {
  name: string,
  size: number,
  type: string,
}

export type FileToProcess = {
  key: string;
  fileMeta: ServerFile
};





export interface ProcessFilesResult {
  groupedFiles: {
    small: ProcessedSmallFile[];
    medium: ProcessedMediumFile[];
    large: ProcessedLargeFile[];
  };
}

export interface FilesToUpload {
  small: SmallFileToUpload[];
  medium: MediumFileToUpload[];
  large: LargeFileToUpload[];
}

export type SmallFileToUpload = (ProcessedSmallFile & { file: File })
export type MediumFileToUpload = (ProcessedMediumFile & { file: File })
export type LargeFileToUpload = (ProcessedLargeFile & { file: File })


