import { sql } from "@vercel/postgres";
import { jsonResponse } from "@/app/lib/helpers";



export async function GET(request: Request, { params }: any) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return jsonResponse({
        error: 'Missing X-User-Id header',
        publicError: 'Permiso denegado',
        errorCode: 'NO_AUTH',
        details: []
      }, 401);
    }

    const { id } = await params;
    if (!id) {
      return jsonResponse({
        error: 'Missing main post ID in params',
        publicError: 'ID de la publicación no proporcionado',
        errorCode: 'MISSING_FIELDS',
        details: []
      }, 400);
    }

    const result = await sql`SELECT * FROM main_posts WHERE id = ${id}`;
    const mainPost = result.rows[0];

    if (!mainPost) {
      return jsonResponse({
        error: `Main post not found for id ${id}`,
        publicError: 'Publicación no encontrada',
        errorCode: 'DB_MAIN_POST_GET_FAILED',
        details: []
      }, 404);
    }

    return jsonResponse({ data: mainPost });
  } catch (error: any) {
    console.error(error);
    return jsonResponse({
      error: error.message,
      publicError: 'Error interno. Contacta al administrador si el problema persiste.',
      errorCode: 'DB_MAIN_POST_GET_FAILED',
      details: [],
    }, 500);
  }
}


// 🔹 DELETE main post
export async function DELETE(request: Request, { params }: any) {
  const userId = request.headers.get("X-User-Id");
  const { id } = await params;

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

  if (!id) {
    return jsonResponse(
      {
        error: "Missing post ID in params",
        publicError: "ID no proporcionado",
        errorCode: "MISSING_PARAMS",
      },
      400
    );
  }

  try {
    const result = await sql`SELECT role FROM users WHERE id = ${userId}`;
    const role = result.rows[0]?.role;

    if (role !== "admin" && role !== "dev") {
      return jsonResponse(
        {
          error: `Role ${role} is not authorized`,
          publicError: "No tienes suficientes permisos",
          errorCode: "PERMISSION_DENIED",
        },
        403
      );
    }

    await sql`DELETE FROM main_posts WHERE id = ${id}`;
    return jsonResponse({ data: { ok: true } }, 200);
  } catch (error: any) {
    return jsonResponse(
      {
        error: error.message,
        publicError: "No se pudo eliminar la publicación",
        errorCode: "DB_MAIN_POSTS_DELETE_FAILED",
        details: { postId: id, error },
      },
      500
    );
  }
}

// 🔹 PATCH main post
export async function PATCH(request: Request, { params }: any) {
  const userId = request.headers.get("X-User-Id");
  const { id } = await params;

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

  if (!id) {
    return jsonResponse(
      {
        error: "Missing post ID in params",
        publicError: "ID no proporcionado",
        errorCode: "MISSING_PARAMS",
      },
      400
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        error: "Invalid JSON body",
        publicError: "Petición inválida",
        errorCode: "BAD_REQUEST",
      },
      400
    );
  }

  const { name, description, links, fileNames, subjectId } = body || {};

  
  if (
    name === undefined &&
    description === undefined &&
    subjectId === undefined &&
    links === undefined && 
    fileNames === undefined
  ) {
    return jsonResponse(
      {
        error: "No fields provided for update",
        publicError: "No se proporcionaron campos para actualizar",
        errorCode: "MISSING_FIELDS",
      },
      400
    );
  }

  if (
    !links && !Array.isArray(links) &&
    !fileNames && !Array.isArray(fileNames)
  ) {

    return jsonResponse(
      {
        error: "No fields provided for update",
        publicError: "No se proporcionaron campos para actualizar",
        errorCode: "MISSING_FIELDS",
      },
      400
    );
  }

  try {
    const result = await sql`SELECT role FROM users WHERE id = ${userId}`;
    const role = result.rows[0]?.role;

    if (role !== "admin" && role !== "dev") {
      return jsonResponse(
        {
          error: `Role ${role} is not authorized`,
          publicError: "No tienes suficientes permisos",
          errorCode: "PERMISSION_DENIED",
        },
        403
      );
    }

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      fieldsToUpdate.push(`name = $${fieldsToUpdate.length + 1}`);
      values.push(name);
    }

    if (description !== undefined) {
      fieldsToUpdate.push(`description = $${fieldsToUpdate.length + 1}`);
      values.push(description);
    }

    if (links !== undefined) {
      fieldsToUpdate.push(`links = $${fieldsToUpdate.length + 1}`);
      values.push(links);
    }

    if (fileNames !== undefined) {
      fieldsToUpdate.push(`filenames = $${fieldsToUpdate.length + 1}`);
      values.push(fileNames);
    }

    if (subjectId !== undefined) {
      fieldsToUpdate.push(`subjectId = $${fieldsToUpdate.length + 1}`);
      values.push(subjectId);
    }

    values.push(id); // Last param: WHERE id = $n

    const query = `
      UPDATE main_posts 
      SET ${fieldsToUpdate.join(", ")}
      WHERE id = $${fieldsToUpdate.length + 1}
    `;

    await sql.query(query, values);

    return jsonResponse({ data: { ok: true } }, 200);
  } catch (error: any) {
    return jsonResponse(
      {
        error: error.message,
        publicError: "No se pudo actualizar la publicación",
        errorCode: "DB_MAIN_POSTS_PATCH_FAILED",
        details: { postId: id, attemptedFields: body },
      },
      500
    );
  }
}
