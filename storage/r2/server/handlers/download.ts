import { Result } from "@/lib/errors/types";
import { S3ServerService } from "../s3/logic";




export async function getPresignedDownload(bucket: string, key: string): Promise<Result<string>> {
  
  const s3Service = S3ServerService.getInstance()
  return await s3Service.getPresignedDownload(bucket, key)
}