'use server'

import { cookies } from "next/headers";
import { ApiResponse, ErrorCode, GitHubContent } from "../../definitions";
import { normalizeEmptyStrings } from "../../utils";
import { historyAddSchema, historyDeleteSchema } from "./validation";


export async function getHistory({ section }: { section: string }): Promise<{structure: GitHubContent[] | null, error: string | null, errorCode: ErrorCode | null | undefined }> {
  const res = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/history/" + section.split("/").pop(), { 
    headers: {
      Cookie: cookies().toString()
    },
  });
  const resJson: ApiResponse = await res.json();
  if (!res.ok) {
    if (res.status === 429) {
      return {structure: null, error: 'Limite de peticiones alcanzado', errorCode: resJson.errorCode};
    }
    return {structure: null, error: 'Error al recuperar los recursos: ' + resJson.publicError, errorCode: resJson.errorCode};
  }
  const data = {
    structure: resJson.data.structure,
    error: null, errorCode: null
  } ;
  return data;
}

const ERROR_MESSAGES: Record<string, string> = {
  type: 'Tipo',
  parentPath: 'Ruta',
  path: 'Ruta',
  files: 'Archivos',
  folderName: 'Nombre de carpeta'
}

export async function addHistoryItem(formData: FormData):  Promise<{ ok: boolean; uploaded: number; failed: number; details: { name: string; success: boolean, error?: string | null }[];
error: string | null | undefined;
errorCode: ErrorCode | null | undefined }> {

  const inputRaw = {
    type: formData.get("type"),
    parentPath: formData.get("parentPath"),
  };
  const input = normalizeEmptyStrings(inputRaw);

  const parsed = historyAddSchema.pick({ type: true, parentPath: true }).safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues;
    return {
      ok: false,
      uploaded: 0,
      failed: 0,
      error: 'Error de formato',
      errorCode: "BAD_REQUEST",
      details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
    };
  }

  const { type, parentPath } = parsed.data;

  if (type === "folder") {
    const folderNameInput = normalizeEmptyStrings({ folderName: formData.get("folderName") });
    const folderNameParsed = historyAddSchema.pick({ folderName: true }).safeParse(folderNameInput);
    if (!folderNameParsed.success) {
      const errors = folderNameParsed.error.issues;
      return {
        uploaded: 0,
        failed: 0,
        ok: false,
        error: 'Error de formato',
        errorCode: "BAD_REQUEST",
        details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
      };
    }
    const { folderName } = folderNameParsed.data;

    const path = `${parentPath}/${folderName}/.gitkeep`;
    const message = `Crear carpeta ${parentPath}/${folderName}`;
    const content = Buffer.from("").toString("base64");

    const res = await fetch((process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL) + "/api/history", {
      method: "POST",
      headers: {
        Cookie: cookies().toString(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path, message, content }),
    });
    const resJson: ApiResponse = await res.json();
    if (!res.ok) {
      return { ok: false, uploaded: 0, failed: 1, error: resJson.publicError, errorCode: resJson.errorCode, details: resJson.details };
    }

    return { ok: true, uploaded: 1, failed: 0, error: null, errorCode: null, details: [] };
  } else if (type === "file") {
    
    const filesRaw = { files: (formData.getAll("files") as File[]).filter(file => file.name !== 'undefined' && file.size !== 0) };
    const filesParsed = historyAddSchema.pick({ files: true }).safeParse(filesRaw);
    if (!filesParsed.success) {
      const errors = filesParsed.error.issues;
      return {
        ok: false,
        uploaded: 0,
        failed: 0,
        error: 'Error de formato',
        errorCode: "BAD_REQUEST",
        details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
      };
    }

    const { files } = filesParsed.data;


    const results = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const path = `${parentPath}/${file.name}`;
      const message = `Subir archivo ${file.name}`;

      // Check if the file exists
      let sha: string | undefined = undefined;
      const shaRes = await fetch(`https://api.github.com/repos/gemif-web/Archive/contents/${path}`, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN!}`,
          Accept: "application/vnd.github+json"
        }
      });
      if (shaRes.ok) {
        const data = await shaRes.json();
        sha = data.sha;
      }

      const res = await fetch((process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL) + "/api/history", {
        method: "POST",
        headers: {
          Cookie: cookies().toString(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path, message, content: base64, sha }),
      });
      const resJson: ApiResponse = await res.json();
      if (!res.ok) {
        
        results.push({ name: file.name, success: false, error: resJson.publicError });
      } else {
        results.push({ name: file.name, success: true });
      }
    }
    const successCount = results.filter(r => r.success).length;
    const ok = successCount === results.length;
    return {
      ok,
      uploaded: successCount,
      failed: results.length - successCount,
      details: results,
      error: ok ? null : "Uno o más archivos no pudieron ser subidos",
      errorCode: ok ? null : "EXTERNAL_PARTIAL_POST",
    };
  } else {
    return { ok: false, uploaded: 0, failed: 0, error: "Tipo de archivo no reconocido", errorCode: 'INVALID_TYPE', details: [] };
  }
}


export async function deleteHistoryItem(formData: FormData): Promise<{ ok: boolean | null; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  const inputRaw = {
    path: formData.get("path"),
    type: formData.get("type"),
  };

  
  const input = normalizeEmptyStrings(inputRaw);
  
  const parsed = historyDeleteSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues;
    return {
      ok: false,
      error: 'Error de formato',
      errorCode: "BAD_REQUEST",
      details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
    };
  }

  const { path, type } = parsed.data;

  const res = await fetch((process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL) + "/api/history", {
    method: "DELETE",
    headers: {
      Cookie: cookies().toString(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path, type }),
  });
  const resJson: ApiResponse = await res.json();
  
  if (!res.ok) {
    return { ok: false, error: resJson.publicError?? "Error al eliminar el recurso", errorCode: resJson.errorCode, details: resJson.details };
  }

  return { ok: true, error: null, errorCode: null, details: [] };
}