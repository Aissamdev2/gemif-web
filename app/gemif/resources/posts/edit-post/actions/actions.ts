'use server'

import { ActionRedirect, ActionReturn } from "@/app/lib/definitions";
import { parseWithSchema } from "@/lib/validation";
import { RESOURCES_POSTS_UPDATE_SCHEMA, resourcesPostsUpdateSchema } from "./validation";
import { dbUpdateResourcesPost } from "@/db/main-posts/main-posts";
import { revalidateTag } from "next/cache";
import { redirect, unauthorized } from "next/navigation";
import { verifySession } from "@/auth/dal";
import { failure, isFailure, setData, success, unwrap, unwrapError } from "@/lib/errors/result";
import { parseFormValue, redirectErrorUrl } from "@/lib/utils";
import { Result, SanitizedResult } from "@/lib/errors/types";
import { UpdateResourcesPostReturn } from "../../add-post/types";
import { sanitizeResult } from "@/lib/errors/sanitization/sanitizer";
import { FileToProcess, ServerFile } from "@/types/storage";
import { completeMultipartUploads, processFiles } from "@/storage/r2/server/handlers/upload";
import { deleteR2Files } from "@/storage/r2/server/handlers/delete";
import { MultipartUploads } from "@/storage/r2/client/types";
import { DatabaseError, errorRaw } from "@/lib/errors/factories";
import { ErrorTag } from "@/lib/errors/codes";


const BUCKET = "gemif-web-main"


export async function updateResourcesPost(
  formData: FormData
): Promise<
  Promise<SanitizedResult<UpdateResourcesPostReturn>>
> {
  return sanitizeResult(await (async () => {
    // Validate session [START]
    const sessionResult = await verifySession();
    if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
    const session = unwrap(sessionResult)
    if (!session) unauthorized()
    // Validate session [END]
  
    // Validate FormData
    const payload = {
      id: parseFormValue(formData.get("id")),
      name: parseFormValue(formData.get("name")),
      description: parseFormValue(formData.get("description")),
      subjectId: parseFormValue(formData.get("subjectId")),
      links: [] as string[]
    }
    // Retrieve links from FormData and give them desired format
    const linksRaw = formData.get("links") as string | null;
    if (linksRaw) payload.links = JSON.parse(linksRaw)
    // Parse data
    const parsedResult = parseWithSchema<typeof payload>({ payload, schema: resourcesPostsUpdateSchema, errorPaths: RESOURCES_POSTS_UPDATE_SCHEMA })
    if (isFailure(parsedResult)) return parsedResult
  
    // Retrieve session and validation info
    const { userId } = session;
    const { id, name, description, subjectId, links } = unwrap(parsedResult);
  
    // Create the main post preliminary data (no files yet)
    const dbUpdateResult = await dbUpdateResourcesPost({ id, payload: {
      name,
      description,
      links: links,
      subjectId: subjectId,
    }})
    if (isFailure(dbUpdateResult)) return dbUpdateResult

    revalidateTag("resources-posts", "max")
  
    // --- Handle files ---
    const removedFilesString = formData.get("removed") as string | null;
    const removedFiles: string[] = removedFilesString ? JSON.parse(removedFilesString) : []

    // Retrieve files from FormData and filter the invalid ones
    const newFiles: ServerFile[] = (formData.getAll("filesMeta") as string[])
      .map((fileString) => JSON.parse(fileString))
      .filter((file) => file.name !== "undefined" && file.size !== 0);
  
    const folderName = formData.get("folderName") as string;
    const originalFiles = formData.getAll("originalFilenames") as string[];
    
    const r2DeletionResult = await deleteR2Files({ bucket: BUCKET, folderName, deletedFiles: removedFiles })
    if (isFailure(r2DeletionResult)) return r2DeletionResult

    const deletedFiles = unwrap(r2DeletionResult)
  
    const filesToProcess: FileToProcess[] = [];
        
    // Compute the file keys
    newFiles.forEach((fileMeta) => {
      const key = `${folderName}/${encodeURIComponent(fileMeta.name)}`;
      filesToProcess.push({ fileMeta, key })
    });
  
    // Process files
    const processedFilesResult = await processFiles({ filesToProcess, bucket: BUCKET });
    if (isFailure(processedFilesResult)) return processedFilesResult
  
    const { groupedFiles } = unwrap(processedFilesResult)
  
    return setData(processedFilesResult, { groupedFiles, id, folderName })
  })())
}



export async function finalizeMainPost({
  id,
  currentFilenames,
  successfulFiles,
  multipartUploads
}: {
  id: string;
  currentFilenames: string[];
  successfulFiles: Record<string,string>;
  multipartUploads: MultipartUploads;
}): Promise<Result<boolean>> {

  const fileNames = Object.values(successfulFiles)

  const multipartCompletionResult = await completeMultipartUploads({ multipartUploads, bucket: BUCKET, successfulFiles });

  const mergedFilenames = [...(currentFilenames || []), ...fileNames];
  try {
    await dbUpdateResourcesPost({ id, payload: { fileNames: mergedFilenames }})
  } catch (error: any) {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo crear la publicación en la base de datos",
      metadata: {
        scope: "Finalize main post",
        operation: "Db update",
        sensitivity: "none",
        tags: [ErrorTag.db, ErrorTag.external],
        isExpected: true,
      },
      raw: errorRaw(error)
    }))
  }

  revalidateTag("resources-posts", "max");

  return success(true)
}




// export async function finalizeMainPost({
//   id,

//   currentFilenames,
//   successfulFilenames,
//   multipartUploads,
// }: {
//   id: string;
//   currentFilenames: string[];
//   successfulFilenames: string[];
//   multipartUploads?: Record<
//     string,
//     {
//       success: boolean;
//       multipart: {
//         uploadId: string;
//         parts: {
//           PartNumber: number;
//           ETag: string;
//         }[];
//       };
//     }
//   >;
// }): Promise<ActionRedirect> {
//     // --- Handle multipart uploads ---
//     if (multipartUploads) {
//       try { 
//         await completeS3Multipart({ multipartUploads, bucket: BUCKET })
//       } catch (error: any) {
//         return {
//           ok: false,
//           error: "Error completando la subida de archivos",
//           errorCode: "UNKNOWN_ERROR",
//         };
//       }
//     }

//     // --- Update DB ---
//     const filenames = successfulFilenames.map((fileString) =>
//       fileString.split("/").pop() as string
//     );
//     const mergedFilenames = [...(currentFilenames || []), ...filenames];
//     try {
//       await dbUpdateResourcesPost({ id, payload: { filenames: mergedFilenames }})
//     } catch (error: any) {
//       return {
//           ok: false,
//           error: "Error finalizando la creación de la piblicación",
//           errorCode: "DB_MAIN_POSTS_PATCH_FAILED",
//         };
//     }

//     revalidateTag("main-posts");
//     redirect(`/gemif/main`)
// }
