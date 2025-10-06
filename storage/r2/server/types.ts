import { FileToProcess, ServerFile } from "@/types/storage";


export interface FileGroup {
  small: FileToProcess[];
  medium: FileToProcess[];
  large: FileToProcess[];
}


export type ProcessedFile = FileToProcess;

export type ProcessedSmallFile = ProcessedFile & { url: string; type: "worker" } 
export type ProcessedMediumFile = ProcessedFile & { url: string; uploadId: string; type: "worker multipart" } 
export type ProcessedLargeFile = ProcessedFile & {uploadId: string; partUrls: string[]; type: "s3 multipart" }

