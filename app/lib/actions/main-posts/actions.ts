'use server'

import { cookies } from "next/headers";
import { ApiResponse, ErrorCode, MainPost } from "../../definitions";
import { revalidateTag } from "next/cache";
import { mainPostsAddSchema, mainPostsUpdateSchema, mainPostsDeleteSchema } from "./validation";
import { normalizeEmptyStrings } from "../../utils";
import z from "zod";
import { cache } from "react";


export const getMainPosts = cache(async (): Promise<{ data: MainPost[] | null | undefined; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> => {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/main-posts', {
     headers: {
      'X-Internal-Token': process.env.INTERNAL_API_SECRET,
      
    },
    next: { tags: ['main-posts'], revalidate: 30 },
    cache: "force-cache"
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: resJson.publicError ?? "Error al recuperar información de las publicaciones", errorCode: resJson.errorCode, details: resJson.details };
  }
  const mainPosts: MainPost[] = resJson.data;
  return { data: mainPosts, error: null, errorCode: null, details: [] };
})

export const getMainPost = cache(async ({ id, cache = true }: { id: string, cache?: boolean }): Promise<{ data: MainPost | null ; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> => {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/main-posts/' + id, {
     headers: {
      Cookie: (await cookies()).toString(),
    },
    cache: cache ? "force-cache" : "no-cache"
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: resJson.publicError ?? "Error al recuperar información de la publicación", errorCode: resJson.errorCode, details: resJson.details };
  }
  const mainPost: MainPost = resJson.data;
  return { data: mainPost, error: null, errorCode: null, details: [] };
})


const ERROR_MESSAGES: Record<string, string> = {
  id: "Id",
  type: "Tipo",
  path: "Ruta",
  name: "Título",
  description: "Descripción",
  subjectId: "Asignatura",
  files: "Archivos",
  folderName: "Nombre de carpeta",
  link: "Enlace"
}

export async function addMainPost(formData: FormData): Promise<{
  ok: boolean;
  data: MainPost[] | null;
  uploaded: number;
  failed: number;
  details: { name: string; success: boolean, error?: string | null }[];
  error: string  | null;
  errorCode: ErrorCode | null | undefined;
  
}> {

  const rawInput = {
    type: formData.get("type"),
    name: formData.get("name"),
    description: formData.get("description"),
    subjectId: formData.get("subjectid"),
  };
  
  const input = normalizeEmptyStrings(rawInput);
  
  const parsed = mainPostsAddSchema.safeParse(input);
    if (!parsed.success) {
    const errors = parsed.error.issues;
    return {
      ok: false,
      failed: 0,
      uploaded: 0,
      data: null,
      error: 'Error de formato',
      errorCode: "BAD_REQUEST",
      details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
    };
  }
  
  
  const { type, name, description, subjectId } = parsed.data;

  let folderName: string | null = null;
  let linksArray: string[] | null = null;

  let successCount = 0;
  let results: {
    name: string;
    success: boolean;
    error?: any;
  }[] = [];

  if (type === "file") {
    const files = (formData.getAll("files") as File[]).filter(file => file.name !== 'undefined' && file.size !== 0);
    const parsedFiles = z.object({ files: z.array(z.instanceof(File), "Archivos subidos inválidos").min(1, "No se han proporcionado archivos, o son vacíos") }).safeParse({ files });
    if (!parsedFiles.success) {
      const errors = parsedFiles.error.issues;
      return {
        ok: false,
        failed: 0,
        uploaded: 0,
        data: null,
        error: 'Error de formato',
        errorCode: "BAD_REQUEST",
        details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
      };
    }

    folderName = crypto.randomUUID();

    

    const pathPrefix = `main-data/${folderName}`;
    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");

        const res = await fetch(`${process.env.BASE_URL}/api/main-data`, {
          method: "POST",
           headers: {
      Cookie: (await cookies()).toString(),
            "Content-Type": "application/json",
            
          },
          body: JSON.stringify({
            path: `${pathPrefix}/${file.name}`,
            message: `Add file ${file.name}`,
            content: base64,
          }),
        });

        const resJson: ApiResponse = await res.json();

        if (!res.ok) {
          results.push({
            name: file.name,
            success: false,
            error: resJson.publicError,
          });
        } else {
          results.push({ name: file.name, success: true });
          successCount++;
        }
      } catch (err: any) {
        results.push({
          name: file.name,
          success: false,
          error: err.message,
        });
      }
    }

    if (successCount === 0) {
      return {
        ok: false,
        data: null,
        uploaded: 0,
        failed: results.length,
        error: "No se ha podido subir ningúno archivo",
        errorCode: "UPLOAD_FAILED",
        details: results,
      };
    }

    const mainPost = {
      name,
      description,
      subjectId,
      type,
      folderName,
      fileNames: results.filter((r) => r.success).map((r) => r.name),
    };

    const dbResponse = await fetch(
      (process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL) + "/api/main-posts",
      {
        method: "POST",
        headers: {
      Cookie: (await cookies()).toString(),
          "Content-Type": "application/json",
          
        },
        body: JSON.stringify(mainPost),
      }
    );

    const dbResJson: ApiResponse = await dbResponse.json();
    if (!dbResponse.ok) {
      return {
        ok: false,
        data: null,
        uploaded: 0,
        failed: files.length,
        error: dbResJson.publicError ?? "Error fatal",
        errorCode: dbResJson.errorCode,
        details: dbResJson.details || [],
      };
    }

  } else if (type === "link") {
    const links = formData.get("links") as string;
    linksArray = links.trim().split(',')

    const parsedLinks = z.object({
      links: z.array(z.url({
      protocol: /^https?$/,
      hostname: z.regexes.domain,
      error: "Una regla de formato de URL fue incumplida",
    })).min(1, "No se han proporcionado enlaces"),
        }).safeParse({ links: linksArray });

    if (!parsedLinks.success) {
      const errors = parsedLinks.error.issues;
      return {
        ok: false,
        failed: 0,
        uploaded: 0,
        data: null,
        error: 'Error de formato',
        errorCode: "BAD_REQUEST",
        details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
      };
    }

    results = [{ name: links, success: true }];
    successCount = 1;

    const mainPost = {
    name,
    description,
    subjectId,
    type,
    links: linksArray,
  };

  

  const response = await fetch(
    (process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL) + "/api/main-posts",
    {
      method: "POST",
       headers: {
      Cookie: (await cookies()).toString(),
        "Content-Type": "application/json",
        
      },
      body: JSON.stringify(mainPost),
    }
  );

  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return {
      ok: false,
      uploaded: successCount,
      failed: results.length - successCount,
      data: null,
      error: resJson.publicError?? "Error al crear el recurso",
      errorCode: resJson.errorCode,
      details: [],
    };
  }


  } else {
    return {
      ok: false,
      data: null,
      uploaded: 0,
      failed: 0,
      error: "Tipo de archivo no reconocido",
      errorCode: "INVALID_TYPE",
      details: [],
    };
  }

  

  revalidateTag("main-posts");
  const { data, error, errorCode } = await getMainPosts();
  if (!data)
    return {
      ok: false,
      data: null,
      uploaded: 0,
      failed: 1,
      error,
      errorCode,
      details: [],
    };


  const ok = successCount === results.length;
  return {
    data,
    ok,
    uploaded: successCount,
    failed: results.length - successCount,
    details: results,
    error: ok? null : "Subida parcial",
    errorCode: ok? null : "EXTERNAL_PARTIAL_POST",
  };
}


export async function updateMainPost(formData: FormData): Promise<{ ok: boolean; success: number; data: MainPost | null; error: string | null; errorCode: ErrorCode | null | undefined; details:  { name: string; success: boolean, error?: string | null }[] }> {
  const rawInput = {
    id: formData.get("id"),
    type: formData.get("type"),
    name: formData.get("name"),
    description: formData.get("description"),
    subjectId: formData.get("subjectid"),
  };
  const input = normalizeEmptyStrings(rawInput);
  
  const parsed = mainPostsUpdateSchema.safeParse(input);
    if (!parsed.success) {
    const errors = parsed.error.issues;
    return {
      ok: false,
      data: null,
      success: 0,
      error: 'Error de formato',
      errorCode: "BAD_REQUEST",
      details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
    };
  }
  
  const { id, type, name, description, subjectId } = parsed.data;

  console.log('From action: ', { id, type, name, description, subjectId })

  let updatePayload: any = {
    name,
    description,
    subjectId,
    type,
  };
  let removeSuccessCount = 0;
  let uploadSuccessCount = 0;
  let removeResults: {
    name: string;
    success: boolean;
    error?: any;
  }[] = [];

  let uploadResults: {
    name: string;
    success: boolean;
    error?: any;
  }[] = [];

  let linksOk = false;
  let filesOk = false;
  if (type === 'link') {
    const links = formData.get("links") as string;
    const linksArray = links.trim().split(','); 

    const parsedLinks = z.object({
      links: z.array(z.url({
      protocol: /^https?$/,
      hostname: z.regexes.domain,
      error: "Enlace inválido"
    })).min(1, "No se han proporcionado enlaces"),
        }).safeParse({ links: linksArray });

    if (!parsedLinks.success) {
      const errors = parsedLinks.error.issues;
      return {
        ok: false,
        data: null,
        success: 0,
        error: 'Error de formato',
        errorCode: "BAD_REQUEST",
        details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
      };
    }

    updatePayload.links = linksArray;

    const dbResponse = await fetch(
      (process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL) + "/api/main-posts/" + id,
      {
        method: "PATCH",
         headers: {
      Cookie: (await cookies()).toString(),
          "Content-Type": "application/json",
          
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!dbResponse.ok) {
      const dbResJson: ApiResponse = await dbResponse.json();
      return {
        ok: false,
        data: null,
        success: 0,
        error: `${dbResJson.publicError}`,
        errorCode: dbResJson.errorCode,
        details: dbResJson.details || [],
      };
    }
    linksOk = true;
    uploadSuccessCount = 1;
  } else if (type === 'file') {
    const newFiles: File[] = (formData.getAll("newFiles") as File[]).filter(file => file.name !== 'undefined' && file.size !== 0);
    const parsedNewFiles = z.object({ files:z.array(z.instanceof(File), "Archivos subidos inválidos") }).safeParse({ files: newFiles });
    if (!parsedNewFiles.success) {
      const errors = parsedNewFiles.error.issues;
      return {
        ok: false,
        data: null,
        success: 0,
        error: 'Error de formato',
        errorCode: "BAD_REQUEST",
        details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
      };
    }
    const removedFiles = JSON.parse(formData.get("removed") as string || '[]') as string[];
    const existingFolder = formData.get("folderName") as string;

    const originalFiles = formData.getAll("originalFilenames") as string[];
    const remainingFiles = originalFiles.filter(f => !removedFiles.includes(f));

    const basePath = `main-data/${existingFolder}`;

    // 🔻 1. Delete removed files
    for (const filename of removedFiles) {
      try {
          const deleteRes = await fetch(`${(process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL)}/api/main-data`, {
            method: "DELETE",
             headers: {
      Cookie: (await cookies()).toString(),
              "Content-Type": "application/json",
              
            },
            body: JSON.stringify({
              path: `${basePath}/${filename}`,
              type: "file",
            }),
          });
    
          if (!deleteRes.ok) {
            const resJson: ApiResponse = await deleteRes.json();
            removeResults.push({
              name: filename,
              success: false,
              error: resJson.publicError,
            })
          }
          removeResults.push({
            name: filename,
            success: true,
          })
          removeSuccessCount++;
      } catch (e: any) {
        removeResults.push({
          name: filename,
          success: false,
          error: e.message,
        })
      }
    }

    // 🔺 2. Upload new files
    for (const file of newFiles) {
      try {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
  
        const uploadRes = await fetch(`${(process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL)}/api/main-data`, {
          method: "POST",
           headers: {
      Cookie: (await cookies()).toString(),
            "Content-Type": "application/json",
            
          },
          body: JSON.stringify({
            path: `${basePath}/${file.name}`,
            message: `Update file ${file.name}`,
            content: base64,
          }),
        });
  
        const resJson: ApiResponse = await uploadRes.json();
        if (!uploadRes.ok) {
          uploadResults.push({
            name: file.name,
            success: false,
            error: resJson.publicError,
          })
        }
        uploadResults.push({
          name: file.name,
          success: true,
        })
        uploadSuccessCount++;
      } catch (e: any) {
        uploadResults.push({
          name: file.name,
          success: false,
          error: e.message
        })
      }
    }

    updatePayload = {
      ...updatePayload,
      fileNames: [...originalFiles.filter(f => !removeResults.filter(r => r.success).map(r => r.name).includes(f)), ...uploadResults.filter(r => r.success).map(r => r.name)],
      folderName: existingFolder,
    }

    if (updatePayload.fileNames.length === 0) {
      const response = await fetch(
      (process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL) + '/api/main-posts/' + id,
        {
          method: 'DELETE',
          headers: {
            Cookie: (await cookies()).toString(),
            'Content-Type': 'application/json',
            
          }
        }
      );
      if (!response.ok) {
        const resJson: ApiResponse = await response.json();
        return {
          ok: false,
          data: null,
          success: removeSuccessCount + uploadSuccessCount,
          error: resJson.publicError ?? "Error fatal durante la eliminación",
          errorCode: resJson.errorCode,
          details: resJson.details
        }
      }
      filesOk = false;

    } else {
      const dbResponse = await fetch(
        `${(process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL)}/api/main-posts/${id}`,
        {
          method: 'PATCH',
          headers: {
            Cookie: (await cookies()).toString(),
            'Content-Type': 'application/json',
            
          },
          body: JSON.stringify(updatePayload),
        }
      );
  
      if (!dbResponse.ok) {
        const dbResJson: ApiResponse = await dbResponse.json();
        return {
          ok: false,
          data: null,
          success: 0,
          error: dbResJson.publicError ?? "Error fatal",
          errorCode: dbResJson.errorCode,
          details: dbResJson.details || [],
        };
      }

      filesOk = uploadSuccessCount === newFiles.length && removeSuccessCount === removedFiles.length;
    }
  }

  revalidateTag('main-posts');
  const { data, error, errorCode } = await getMainPost({ id, cache: false });
  console.log({ data, error, errorCode });
  if (error || !data) return {
    ok: false,
    data: null,
    success: removeSuccessCount + uploadSuccessCount,
    error: error,
    errorCode: errorCode,
    details: []
  }
  return {
    data,
    ok: filesOk || linksOk,
    success: uploadSuccessCount + removeSuccessCount,
    details: [...uploadResults, ...removeResults],
    error: filesOk || linksOk? null : (updatePayload.fileNames.length === 0 ? "Publicación eliminada" : "Actualizado parcialmente"),
    errorCode: filesOk || linksOk? null : (updatePayload.fileNames.length === 0 ? "RESOURCE_DELETED" : "EXTERNAL_PARTIAL_PATCH"),
  };
}



export async function deleteMainPost(formData: FormData): Promise<{ ok: boolean; data: MainPost[] | null; error: string | null | undefined; errorCode: ErrorCode | null | undefined; details: { name: string; success: boolean, error?: string | null }[] }> {

  const rawInput = {
    id: formData.get('id'),
    type: formData.get('type'),
    path: formData.get('path'),
  };

  const input = normalizeEmptyStrings(rawInput);

  const parsed = mainPostsDeleteSchema.omit({ path: true }).safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues;
    return {
      ok: false,
      data: null,
      error: "Error de formato",
      errorCode: "BAD_REQUEST",
      details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
    }
  }
  const { id, type } = parsed.data;

  // 1. Delete from your DB
  const res = await fetch(
    (process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL) + '/api/main-posts/' + id,
    {
      method: 'DELETE',
       headers: {
      Cookie: (await cookies()).toString(),
        'Content-Type': 'application/json',
        
      },
    }
  );
  const resJson: ApiResponse = await res.json();
  if (!res.ok) {
    return { ok: false, data: null, error: resJson.publicError, errorCode: resJson.errorCode, details: [] };
  }

  if (type === 'file') {
    const { ok, data, error, errorCode } = await deleteFromGitHub(formData);
    if (!ok) {
      return { ok: false, data: null, error: error, errorCode: errorCode, details: [] };
    }
  }

  revalidateTag('main-posts');
  const { data, error, errorCode } = await getMainPosts();
  if (error || !data) return {
    ok: false,
    data: null,
    error: error,
    errorCode: errorCode,
    details: []
  }
  return {
    data,
    ok: true,
    error: null,
    errorCode: null,
    details: [],
  };
}

async function deleteFromGitHub(formData: FormData): Promise<{ ok: boolean; data: MainPost[] | null; error: string | null | undefined; errorCode: ErrorCode | null | undefined; details: { name: string; success: boolean, error?: string | null }[] }> {
  const rawInput = {
    type: formData.get('type'),
    path: formData.get('path'),
  };

  const input = normalizeEmptyStrings(rawInput);
  const parsed = mainPostsDeleteSchema.pick({ path: true }).safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues;
    return {
      ok: false,
      data: null,
      error: "Error de formato",
      errorCode: "BAD_REQUEST",
      details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
    }
  }
  const { path } = parsed.data;
  const folderPath = `main-data/${path}`;
  
  const githubDeleteRes = await fetch((process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL) + '/api/main-data', {
    method: 'DELETE',
     headers: {
      Cookie: (await cookies()).toString(),
      'Content-Type': 'application/json',
      
    },
    body: JSON.stringify({ path: folderPath, type: 'folder' }),
  });

  if (!githubDeleteRes.ok) {
    const githubDeleteResJson: ApiResponse = await githubDeleteRes.json();
    return { ok: false, data: null, error: githubDeleteResJson.publicError, errorCode: githubDeleteResJson.errorCode, details: githubDeleteResJson.details };
  }

  return { ok: true, data: null, error: null, errorCode: null, details: [] };
}



