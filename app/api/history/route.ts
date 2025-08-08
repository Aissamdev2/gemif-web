import { jsonResponse } from '@/app/lib/helpers';
import { NextRequest } from 'next/server';

const GITHUB_API_BASE = 'https://api.github.com/repos/gemif-web/Archive/contents';

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("X-User-Id");
    const token = req.headers.get("X-User-Github-Token");

    if (!userId || !token) {
      return jsonResponse({
        error: 'Missing auth headers',
        publicError: 'Permiso denegado',
        errorCode: 'NO_AUTH',
        details: []
      }, 401);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({
        error: 'Invalid JSON in request body',
        publicError: 'Datos inválidos',
        errorCode: 'BAD_REQUEST',
        details: []
      }, 400);
    }

    const { path, message, content, sha } = body;

    if (!path || !message || typeof content !== 'string') {
      return jsonResponse({
        error: 'Missing or invalid fields: path, message or content',
        publicError: 'Datos insuficientes o inválidos',
        errorCode: 'MISSING_FIELDS',
        details: [],
      }, 400);
    }

    const payload: any = { message, content };
    if (sha) payload.sha = sha;

    const uploadRes = await fetch(`${GITHUB_API_BASE}/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      console.log(uploadRes)
      console.log(err)
      return jsonResponse({
        error: 'GitHub upload failed',
        publicError: err.message.includes('sha') ? 'Elemento existente' : 'No se pudo subir el elemento',
        errorCode: 'EXTERNAL_POST_FAILED',
        details: [],
      }, 500);
    }

    return jsonResponse({ data: { ok: true } });
  } catch (error: any) {
    return jsonResponse({
      error: error.message,
      publicError: 'Error interno. Contacta al administrador si el problema persiste.',
      errorCode: 'EXTERNAL_FILE_POST_FAILED',
      details: [],
    }, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.headers.get("X-User-Id");
    const token = req.headers.get("X-User-Github-Token");

    if (!userId || !token) {
      return jsonResponse({
        error: 'Missing auth headers',
        publicError: 'Permiso denegado',
        errorCode: 'NO_AUTH',
        details: []
      }, 401);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({
        error: 'Invalid JSON in request body',
        publicError: 'Datos inválidos',
        errorCode: 'BAD_REQUEST',
        details: []
      }, 400);
    }

    const { path, type } = body;

    if (!path || !type || typeof path !== "string") {
      return jsonResponse({
        error: 'Missing or invalid path/type',
        publicError: 'Datos insuficientes o inválidos',
        errorCode: 'MISSING_FIELDS',
        details: [],
      }, 400);
    }

    if (type === "file") {
      return await deleteSingleFile(path, token);
    } else if (type === "folder") {
      return await deleteFolder(path, token);
    } else {
      return jsonResponse({
        error: 'Invalid type value',
        publicError: 'Tipo de archivo inválido',
        errorCode: 'INVALID_TYPE',
        details: [],
      }, 400);
    }
  } catch (error: any) {
    return jsonResponse({
      error: error.message,
      publicError: 'Error interno. Contacta al administrador si el problema persiste.',
      errorCode: 'EXTERNAL_FILE_DELETE_FAILED',
      details: [],
    }, 500);
  }
}

async function deleteSingleFile(path: string, token: string) {
  try {
    const shaRes = await fetch(`${GITHUB_API_BASE}/${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!shaRes.ok) {
      const err = await shaRes.json().catch(() => ({}));
      return jsonResponse({
        error: 'Failed to retrieve file SHA',
        publicError: 'No se pudo obtener información del archivo',
        errorCode: 'EXTERNAL_CREDENTIALS_ERROR',
        details: [],
      }, 500);
    }

    const { sha } = await shaRes.json();
    if (!sha) {
      return jsonResponse({
        error: 'SHA not present in response',
        publicError: 'No se pudo obtener información del archivo',
        errorCode: 'EXTERNAL_CREDENTIALS_ERROR',
        details: [],
      }, 500);
    }

    const fileName = path.split("/").pop() || "archivo";

    const deleteRes = await fetch(`${GITHUB_API_BASE}/${path}`, {
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
      const err = await deleteRes.json().catch(() => ({}));
      return jsonResponse({
        error: 'GitHub delete failed',
        publicError: 'No se pudo eliminar el archivo',
        errorCode: 'EXTERNAL_FILE_DELETE_FAILED',
        details: [],
      }, 500);
    }

    return jsonResponse({ data: { ok: true } });
  } catch (error: any) {
    return jsonResponse({
      error: error.message,
      publicError: 'Error interno al eliminar archivo',
      errorCode: 'EXTERNAL_FILE_DELETE_FAILED',
      details: [],
    }, 500);
  }
}

async function deleteFolder(folderPath: string, token: string) {
  try {
    const queue = [folderPath];
    const filesToDelete: { path: string; sha: string }[] = [];

    while (queue.length > 0) {
      const currentPath = queue.pop()!;
      const res = await fetch(`${GITHUB_API_BASE}/${currentPath}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return jsonResponse({
          error: 'Failed to fetch folder contents',
          publicError: 'No se pudo leer el contenido de la carpeta',
          errorCode: 'EXTERNAL_FOLDER_GET_FAILED',
          details: [],
        }, 500);
      }

      const contents = await res.json();

      for (const item of contents) {
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

      const deleteRes = await fetch(`${GITHUB_API_BASE}/${path}`, {
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
        const err = await deleteRes.json().catch(() => ({}));
        results.push({ success: false, name: path.split("/").pop(), error: err.message });
      } else {
        results.push({ success: true, name: path.split("/").pop() });
      }
    }


    const failed = results.filter((r) => !r.success);

    if (failed.length === filesToDelete.length) {
      return jsonResponse({
        error: 'All files failed to delete',
        publicError: 'Ningun archivo pudo ser eliminados',
        errorCode: 'EXTERNAL_FOLDER_DELETE_FAILED',
        details: results,
      }, 500);
    }

    if (failed.length > 0) {
      return jsonResponse({
        error: 'Some files failed to delete',
        publicError: 'Uno o varios archivos no pudieron ser eliminados',
        errorCode: 'EXTERNAL_PARTIAL_DELETE',
        details: results,
      }, 500);
    }

    return jsonResponse({ data: { ok: true, deleted: results.length } });
  } catch (error: any) {
    return jsonResponse({
      error: error.message,
      publicError: 'Error interno al eliminar carpeta',
      errorCode: 'EXTERNAL_FOLDER_DELETE_FAILED',
      details: [],
    }, 500);
  }
}
