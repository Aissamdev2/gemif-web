'use server'

import { verifySession } from "@/auth/dal";
import { isFailure, success, unwrap, unwrapError } from "@/lib/errors/result";
import { sanitizeResult } from "@/lib/errors/sanitization/sanitizer";
import { SanitizedResult } from "@/lib/errors/types";
import { parseFormValue, redirectErrorUrl } from "@/lib/utils";
import { parseWithSchema } from "@/lib/validation";
import { unauthorized } from "next/navigation";
import { RESOURCES_POSTS_DELETE_ERROR_PATHS, RESOURCES_POSTS_DOWNLOAD_ERROR_PATHS, resourcesPostsDeleteSchema, resourcesPostsDownloadSchema } from "./validation";
import { deleteR2Files } from "@/storage/r2/server/handlers/delete";
import { dbDeleteResourcesPost, dbUpdateResourcesPost } from "@/db/main-posts/main-posts";
import { revalidateTag } from "next/cache";
import { getPresignedDownload } from "@/storage/r2/server/handlers/download";


const BUCKET = "gemif-web-main"

export async function deleteResourcesPost(formData: FormData): Promise<SanitizedResult<string[]>> {
  return sanitizeResult(await (async () => {
      // Validate session [START]
      const sessionResult = await verifySession();
      if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
      const session = unwrap(sessionResult)
      if (!session) unauthorized()
      // Validate session [END]
    
      // Validate FormData
      const payload = {
        id: parseFormValue(formData.get("id")) as string,
        folderName: parseFormValue(formData.get("folderName")) as string,
        fileNames: parseFormValue(formData.get("fileNames")) as string[],
      }
      // Parse data
      const parsedResult = parseWithSchema<typeof payload>({ payload, schema: resourcesPostsDeleteSchema, errorPaths: RESOURCES_POSTS_DELETE_ERROR_PATHS })
      if (isFailure(parsedResult)) return parsedResult
    
      // Retrieve session and validation info
      const { userId } = session;
      const { id, folderName, fileNames } = unwrap(parsedResult);
    
      const r2DeletionResult = await deleteR2Files({ bucket: BUCKET, folderName, deletedFiles: fileNames })
      if (isFailure(r2DeletionResult)) return r2DeletionResult

      const deletedFiles = unwrap(r2DeletionResult)
      
      const dbDeletionResult = await dbDeleteResourcesPost({ id })
    
      // 3. Revalidate cache/tag
      revalidateTag('resources-posts');
    
      return r2DeletionResult
  })())
}

export async function downloadFile(formData: FormData): Promise<SanitizedResult<string>> {
  return sanitizeResult(await (async () => {
    // Validate session [START]
    const sessionResult = await verifySession();
    if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
    const session = unwrap(sessionResult)
    if (!session) unauthorized()
    // Validate session [END]

    // Validate FormData
    const payload = {
      key: parseFormValue(formData.get("key")) as string,
    }
    // Parse data
    const parsedResult = parseWithSchema<typeof payload>({ payload, schema: resourcesPostsDownloadSchema, errorPaths: RESOURCES_POSTS_DOWNLOAD_ERROR_PATHS })
    if (isFailure(parsedResult)) return parsedResult

    const { key } = unwrap(parsedResult)

    const downloadUrlResult = await getPresignedDownload(BUCKET, key)
    return downloadUrlResult
  })())
}