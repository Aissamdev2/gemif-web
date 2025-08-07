import { jsonResponse, parseGitHubError } from "@/app/lib/helpers";
import { NextRequest } from "next/server";
import { ErrorCode } from "@/app/lib/definitions";

const OWNER = "gemif-web";
const REPO = "Archive";
const BRANCH = "main";
const BASE_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/`;

export async function GET(request: Request) {
  const userId = request.headers.get("X-User-Id");
  const token = request.headers.get("X-User-Github-Token");

  if (!userId || !token) {
    return jsonResponse({
      error: "Missing headers",
      publicError: "Permiso denegado",
      errorCode: "NO_AUTH",
      details: []
    }, 401);
  }

  try {
    const structure = await fetchStructure(token, "main-data");
    return jsonResponse({ data: structure });
  } catch (error: any) {
    if (error.errorCode === "RATE_LIMIT") {
      return jsonResponse({
        error: error.error,
        publicError: "Límite de peticiones alcanzado",
        errorCode: "RATE_LIMIT",
        details: error.details?? [],
      }, 429);
    }

    return jsonResponse({
      error: error.error || "Error desconocido",
      publicError: "Error de comunicación externa",
      errorCode: "EXTERNAL_GET_FAILED",
      details: error.details ?? [],
    }, 500);
  }
}

async function fetchStructure(token: string, path = "main-data") {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw await parseGitHubError(res, json);
  }

  return json;
}

export async function POST(req: Request) {
  const userId = req.headers.get("X-User-Id");
  const token = req.headers.get("X-User-Github-Token");

  if (!userId || !token) {
    return jsonResponse({ error: "Missing headers", publicError: "Permiso denegado", errorCode: "NO_AUTH", details: [] }, 401);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({
      error: "Invalid JSON",
      publicError: "Datos inválidos",
      errorCode: "BAD_REQUEST",
      details: []
    }, 400);
  }

  const { path, content, message } = body;
  if (!path || !content || !message) {
    return jsonResponse({
      error: "Missing required fields",
      publicError: "Datos insuficientes o inválidos",
      errorCode: "MISSING_FIELDS",
      details: []
    }, 400);
  }

  // Check if file exists to get SHA
  let sha: string | undefined;
  const shaRes = await fetch(`${BASE_URL}${encodeURIComponent(path)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (shaRes.ok) {
    const shaJson = await shaRes.json();
    sha = shaJson.sha;
  }

  try {
    const uploadRes = await fetch(`${BASE_URL}${encodeURIComponent(path)}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content,
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!uploadRes.ok) {
      const result = await uploadRes.json().catch(() => ({}));
      const err = await parseGitHubError(uploadRes, result) as { errorCode: ErrorCode; error: string; details: any };
      return jsonResponse(err, 500);
    }

    return jsonResponse({ data: { ok: true } });
  } catch (error: any) {
    return jsonResponse({
      error: error.error,
      publicError: "Error de comunicación externa",
      errorCode: "EXTERNAL_POST_FAILED",
      details: [],
    }, 500);
  }
}

export async function DELETE(req: NextRequest) {
  const userId = req.headers.get("X-User-Id");
  const token = req.headers.get("X-User-Github-Token");

  

  if (!userId || !token) {
    return jsonResponse({ error: "Missing headers", publicError: "Permiso denegado", errorCode: "NO_AUTH", details: [] }, 401);
  }

  const { path, type } = await req.json();


  if (!path || !type || typeof path !== "string") {
    return jsonResponse({ error: "Invalid parameters", publicError: "Datos insuficientes o inválidos", errorCode: "BAD_REQUEST", details: [] }, 400);
  }


  if (type === "file") {
    return await deleteSingleFile(path, token);
  } else if (type === "folder") {
    return await deleteFolder(path, token);
  } else {
    return jsonResponse({ error: "Invalid type", publicError: "Tipo de archivo inválido", errorCode: "INVALID_TYPE", details: [] }, 400);
  }
}



async function deleteSingleFile(path: string, token: string) {
  const shaRes = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  const shaJson = await shaRes.json().catch(() => ({}));
  if (!shaRes.ok) {
    const err = await parseGitHubError(shaRes, shaJson) as { errorCode: ErrorCode; error: string; details: any };
    return jsonResponse(err, 500);
  }

  const sha = shaJson.sha;
  if (!sha) {
    return jsonResponse({ error: "SHA not found", publicError: "No se encontró el archivo", errorCode: "EXTERNAL_CREDENTIALS_ERROR", details: [] }, 404);
  }

  const fileName = path.split("/").pop() || "archivo";

  const deleteRes = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Eliminar archivo ${fileName}`,
      sha,
    }),
  });

  if (!deleteRes.ok) {
    const deleteJson = await deleteRes.json().catch(() => ({}));
    const err = await parseGitHubError(deleteRes, deleteJson) as { errorCode: ErrorCode; error: string; details: any };
    return jsonResponse(err, 500);
  }
  return jsonResponse({ data: { ok: true } });
}

async function deleteFolder(folderPath: string, token: string) {
  const queue = [folderPath];
  const filesToDelete: { path: string; sha: string }[] = [];

  while (queue.length) {
    const currentPath = queue.pop()!;
    const res = await fetch(`${BASE_URL}${currentPath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = await parseGitHubError(res, json) as { errorCode: ErrorCode; error: string; details: any };
      return jsonResponse(err, 500);
    }

    for (const item of json) {
      if (item.type === "dir") {
        queue.push(item.path);
      } else {
        filesToDelete.push({ path: item.path, sha: item.sha });
      }
    }
  }

  const results = [];

  for (const { path, sha } of filesToDelete) {
    const fileName = path.split("/").pop()!;

    const res = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Eliminar archivo ${fileName}`,
        sha,
      }),
    });

    const resJson = await res.json().catch(() => ({}));

    if (!res.ok) {
      results.push({ success: false, name: path.split("/").pop(), error: resJson.message });
    } else {
      results.push({ success: true, name: path.split("/").pop() });
    }
  }


  const failed = results.filter((r) => !r.success);
  if (failed.length > 0) {
    return jsonResponse({
      error: "Some deletions failed",
      publicError: "Uno o varios archivos no pudieron ser eliminados",
      errorCode: "EXTERNAL_PARTIAL_DELETE",
      details: results,
    }, 500);
  }

  return jsonResponse({ data: { ok: true, deleted: results.length } });
}
