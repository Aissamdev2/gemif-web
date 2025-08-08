import { sql } from "@vercel/postgres";
import { jsonResponse } from "@/app/lib/helpers";

// 🔹 GET all main posts
export async function GET(request: Request) {
  const userId = request.headers.get("X-User-Id");

  if (!userId) {
    return jsonResponse(
      {
        error: "Missing X-User-Id header",
        publicError: "Permiso denegado",
        errorCode: "NO_AUTH",
      },
      401
    );
  }

  try {
    const result = await sql`SELECT * FROM main_posts ORDER BY createdat DESC`;
    return jsonResponse({ data: result.rows });
  } catch (error: any) {
    return jsonResponse(
      {
        error: error.message || "SQL error",
        publicError: "No se pudieron cargar las publicaciones",
        errorCode: "DB_MAIN_POSTS_GET_FAILED",
        details: { query: "SELECT * FROM main_posts", error },
      },
      500
    );
  }
}

// 🔹 POST new main post
export async function POST(request: Request) {
  const userId = request.headers.get("X-User-Id");

  if (!userId) {
    return jsonResponse(
      {
        error: "Missing X-User-Id header",
        publicError: "Permiso denegado",
        errorCode: "NO_AUTH",
      },
      401
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse(
      {
        error: "Invalid JSON body",
        publicError: "Petición inválida",
        errorCode: "BAD_REQUEST",
      },
      400
    );
  }

  const { name, description, subjectId, type, folderName, fileNames, links } = body;
  if (!name || !type) {
    return jsonResponse(
      {
        error: "Missing required fields: name or type",
        publicError: "Datos insuficientes o inválidos",
        errorCode: "MISSING_FIELDS",
      },
      400
    );
  }

  if (!folderName && !Array.isArray(fileNames) && !Array.isArray(links)) {
    return jsonResponse(
      {
        error: "Neither files nor link was provided",
        publicError: "Debe proporcionar un archivo o un enlace",
        errorCode: "MISSING_FIELDS",
      },
      400
    );
  }

  try {
    const result = await sql`
      INSERT INTO main_posts (name, description, subjectid, type, foldername, filenames, links, userId)
      VALUES (${name}, ${description}, ${subjectId}, ${type}, ${folderName}, ${fileNames}, ${links}, ${userId})
      RETURNING *;
    `;

    return jsonResponse(
      { data: result.rows[0] },
      201
    );
  } catch (error: any) {
    return jsonResponse(
      {
        error: error.message || "Db error",
        publicError: "No se pudo crear la publicación",
        errorCode: "DB_MAIN_POSTS_POST_FAILED",
        details: { body, error },
      },
      500
    );
  }
}
