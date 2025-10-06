'use server'

import { ActionRedirect, ActionReturn, SessionPayload } from "@/app/lib/definitions";
import { RESOURCES_POSTS_ADD_ERROR_PATHS, resourcesPostsAddSchema } from "./validation";
import { parseWithSchema } from "@/lib/validation";
import { verifySession } from "@/auth/dal";
import { redirect, unauthorized } from "next/navigation";
import { dbCreateResourcesPost, dbUpdateResourcesPost } from "@/db/main-posts/main-posts";
import { revalidateTag } from "next/cache";
import { ProcessedFile } from "@/storage/r2/server/types";
import { completeMultipartUploads, processFiles } from "@/storage/r2/server/handlers/upload";
import { AddResourcesPostReturn } from "../types";
import { AuthError, DatabaseError, errorRaw } from "@/lib/errors/factories";
import { failure, isFailure, isPartialSuccess, isSuccess, setData, success, unwrap, unwrapError } from "@/lib/errors/result";
import { Result, SanitizedResult } from "@/lib/errors/types";
import { MultipartUploads, UploadResult } from "@/storage/r2/client/types";
import { FileToProcess, ServerFile } from "@/types/storage";
import { parseFormValue, redirectErrorUrl } from "@/lib/utils";
import { sanitizeResult } from "@/lib/errors/sanitization/sanitizer";
import { ErrorTag } from "@/lib/errors/codes";

const BUCKET = "gemif-web-main"

export async function addMainPost(formData: FormData): Promise<SanitizedResult<AddResourcesPostReturn>> {
  return sanitizeResult(await (async () => {
      // Validate session [START]
      const sessionResult = await verifySession();
      if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
      const session = unwrap(sessionResult)
      if (!session) unauthorized()
      // Validate session [END]
    
      // Validate FormData
      const payload = {
        name: parseFormValue(formData.get("name")),
        description: parseFormValue(formData.get("description") ?? ''),
        subjectId: parseFormValue(formData.get("subjectId") ?? ''),
        links: [] as string[]
      }
      // Retrieve links from FormData and give them desired format
      const linksRaw = formData.get("links") as string | null;
      if (linksRaw) payload.links = JSON.parse(linksRaw)
      // Parse data
      const parsedResult = parseWithSchema<typeof payload>({ payload, schema: resourcesPostsAddSchema, errorPaths: RESOURCES_POSTS_ADD_ERROR_PATHS })
      if (isFailure(parsedResult)) return parsedResult
    
      // Retrieve session and validation info
      const { userId } = session;
      const { name, description, subjectId, links } = unwrap(parsedResult);
    
      // Create the main post preliminary data (no files yet)
      const dbCreationResult = await dbCreateResourcesPost({ payload: {
        name,
        description,
        fileNames: [],
        links: links,
        userId: userId,
        subjectId: subjectId,
      }})
      if (isFailure(dbCreationResult)) return dbCreationResult

      revalidateTag("resources-posts")
    
      // Collect main post id and folder name from the db result
      const { id, folderName } = unwrap(dbCreationResult)
    
      // Retrieve files from FormData and filter the invalid ones
      const filesMeta: ServerFile[] = (formData.getAll("filesMeta") as string[])
        .map((fileString) => JSON.parse(fileString))
        .filter((file) => file.name !== "undefined" && file.size !== 0);
    
    
      const filesToProcess: FileToProcess[] = [];
    
      // Compute the file keys
      filesMeta.forEach((fileMeta) => {
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

  revalidateTag("resources-posts");

  return success(true)
}









// export async function addMainPost(formData: FormData): Promise<ActionReturn<{
//   presigned: Record<string, string[]> | null;
//   uploadIds: Record<string, string> | null;
//   id: string;
//   folderName: string;
//   fileKeys: string[];
// }>> {
//   // Zod validation [START]
//   const payload = {
//     name: String(formData.get("name") ?? ''),
//     description: String(formData.get("description") ?? ''),
//     subjectId: String(formData.get("subjectId") ?? ''),
//   }
//   const parsedRes = parseWithSchema<typeof payload>({ payload, schema: mainPostsAddSchema.omit({ links: true }), errorPaths: MAIN_POSTS_ADD_ERROR_PATHS })
//   if (!parsedRes.ok) return parsedRes
//   // Zod validation [END]

//   // Verify session [START]
//   let session: SessionPayload | null;
//   try {
//     session = await verifySession();
//   } catch (error: any) {
//     return { ok: false, error: "Error verificando la sesión", errorCode: "AUTH_ERROR" };
//   }
//   if (!session?.userId) unauthorized();
//   // Verify session [END]


//   const { userId } = session;
//   const { name, description, subjectId } = parsedRes.data;

//   // --- Handle links & insert DB ---
//   const linksRaw = formData.get("links") as string | null;
//   const linksArray: string[] = linksRaw ? JSON.parse(linksRaw) : []

//   let id: string;
//   let folderName: string;
//   try {
//     const res = await dbCreateMainPost({ payload: {
//       name,
//       description,
//       filenames: [],
//       links: linksArray,
//       user_id: userId,
//       subject_id: subjectId,
//     }})
//     id = res?.id;
//     folderName = res?.folderName;
//   } catch (error: any) {
//     return {
//       ok: false,
//       error: "Error al agregar el recurso en la base de datos",
//       errorCode: "DB_MAIN_POSTS_POST_FAILED",
//     };
//   }

//   // --- Extract files ---
//   const files = (formData.getAll("filesMeta") as string[])
//     .map((fileString) => JSON.parse(fileString))
//     .filter((file) => file.name !== "undefined" && file.size !== 0);

//   let fileKeys: string[];
//   let presigned: Record<string, string[]> | null;
//   let uploadIds: Record<string, string> | null;

//   try {
//     const res = await presignS3Multipart({ folderName, files, bucket: BUCKET })
//     fileKeys = res?.fileKeys ?? [];
//     presigned = res?.presigned;
//     uploadIds = res?.uploadIds;
//     } catch (error: any) {
//     return {
//       ok: false,
//       error: "Error al agregar el recurso",
//       errorCode: "UPLOAD_FAILED",
//     };
//   }

//   revalidateTag("main-posts");
//   return {
//     ok: true,
//     data: {
//       presigned,
//       uploadIds,
//       id,
//       folderName,
//       fileKeys,
//     },
//   };
  
// }



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
//       await dbUpdateMainPost({ id, payload: { filenames: mergedFilenames }})
//     } catch (error: any) {
//       return {
//           ok: false,
//           error: "Error finalizando la creación de la piblicación",
//           errorCode: "DB_MAIN_POSTS_PATCH_FAILED",
//         };
//     }

//     revalidateTag("main-posts");
//     redirect("/gemif/main")
// }
