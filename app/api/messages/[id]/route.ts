import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return jsonResponse(
      { error: "Missing user ID", publicError: "Permiso denegado", errorCode: "NO_AUTH" },
      401
    );
  }

  const { id } = params;
  if (!id) {
    return jsonResponse(
      { error: "Missing message ID", publicError: "ID requerido", errorCode: "MISSING_PARAMS" },
      400
    );
  }

  try {
    const result = await sql`
      SELECT id, name, description, year, scope, userid, createdat AT TIME ZONE 'UTC' AS createdat
      FROM messages
      WHERE id = ${id}
    `;
    const message = result.rows[0];

    if (!message) {
      return jsonResponse(
        { error: "Message not found", publicError: "Mensaje no encontrado", errorCode: "DB_MESSAGE_GET_FAILED" },
        404
      );
    }

    return jsonResponse({ data: message }, 200);
  } catch (error: any) {
    return jsonResponse(
      {
        error: error.message,
        publicError: "Error al obtener el mensaje",
        errorCode: "DB_MESSAGE_GET_FAILED",
        details: { id },
      },
      500
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return jsonResponse(
      { error: "Missing user ID", publicError: "Permiso denegado", errorCode: "NO_AUTH" },
      401
    );
  }

  const { id } = params;
  if (!id) {
    return jsonResponse(
      { error: "Missing message ID", publicError: "ID requerido", errorCode: "MISSING_PARAMS" },
      400
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { error: "Invalid JSON", publicError: "Petición inválida", errorCode: "BAD_REQUEST" },
      400
    );
  }

  const { name, description, scope, year } = body || {};

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

  if (year !== undefined) {
    fieldsToUpdate.push(`year = $${fieldsToUpdate.length + 1}`);
    values.push(year);
  }

  if (scope !== undefined) {
    fieldsToUpdate.push(`scope = $${fieldsToUpdate.length + 1}`);
    values.push(scope);
  }

  if (fieldsToUpdate.length === 0) {
    return jsonResponse(
      { error: "No fields provided", publicError: "No se proporcionaron campos para actualizar", errorCode: "MISSING_FIELDS" },
      400
    );
  }

  values.push(id, userId);

  const query = `
    UPDATE messages
    SET ${fieldsToUpdate.join(', ')}
    WHERE id = $${fieldsToUpdate.length + 1} AND userId = $${fieldsToUpdate.length + 2}
  `;

  try {
    const result = await sql.query(query, values);
    if (result.rowCount === 0) {
      return jsonResponse(
        { error: "No message updated", publicError: "Mensaje no encontrado o sin permisos", errorCode: "DB_MESSAGES_PATCH_FAILED" },
        404
      );
    }

    return jsonResponse({ data: { ok: true } }, 200);
  } catch (error: any) {
    return jsonResponse(
      {
        error: error.message,
        publicError: "Error al actualizar el mensaje",
        errorCode: "DB_MESSAGES_PATCH_FAILED",
        details: { input: body },
      },
      500
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return jsonResponse(
      { error: "Missing user ID", publicError: "Permiso denegado", errorCode: "NO_AUTH" },
      401
    );
  }

  const { id } = params;
  if (!id) {
    return jsonResponse(
      { error: "Missing message ID", publicError: "ID requerido", errorCode: "MISSING_PARAMS" },
      400
    );
  }

  try {
    const result = await sql`
      DELETE FROM messages WHERE id = ${id} AND userId = ${userId};
    `;
    if (result.rowCount === 0) {
      return jsonResponse(
        { error: "Message not found or unauthorized", publicError: "Mensaje no encontrado o sin permisos", errorCode: "DB_MESSAGE_DELETE_FAILED" },
        404
      );
    }

    return jsonResponse({ data: { ok: true } }, 200);
  } catch (error: any) {
    return jsonResponse(
      {
        error: error.message,
        publicError: "Error al eliminar el mensaje",
        errorCode: "DB_MESSAGE_DELETE_FAILED",
        details: { id },
      },
      500
    );
  }
}
