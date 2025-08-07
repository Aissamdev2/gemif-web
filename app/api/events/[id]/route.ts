import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';

type Params = { params: { id: string } };

export async function GET(request: Request, { params }: Params) {
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

    const { id } = params;
    if (!id) {
      return jsonResponse({
        error: 'Missing event ID in params',
        publicError: 'ID del evento no proporcionado',
        errorCode: 'MISSING_FIELDS',
        details: []
      }, 400);
    }

    const result = await sql`SELECT * FROM events WHERE id = ${id} AND userId = ${userId}`;
    const event = result.rows[0];

    if (!event) {
      return jsonResponse({
        error: `Event not found for id ${id}`,
        publicError: 'Evento no encontrado',
        errorCode: 'DB_EVENT_GET_FAILED',
        details: []
      }, 404);
    }

    return jsonResponse({ data: event });
  } catch (error: any) {
    return jsonResponse({
      error: error.message,
      publicError: 'Error interno. Contacta al administrador si el problema persiste.',
      errorCode: 'DB_EVENT_GET_FAILED',
      details: [],
    }, 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
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

    const { id } = params;
    if (!id) {
      return jsonResponse({
        error: 'Missing event ID in params',
        publicError: 'ID del evento no proporcionado',
        errorCode: 'MISSING_FIELDS',
        details: []
      }, 400);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({
        error: 'Invalid JSON in request body',
        publicError: 'Cuerpo de la petición inválido',
        errorCode: 'BAD_REQUEST',
        details: []
      }, 400);
    }

    const { name, date, time, description, subjectid, primitiveid, scope } = body ?? {};

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      fieldsToUpdate.push(`name = $${fieldsToUpdate.length + 1}`);
      values.push(name);
    }
    if (date !== undefined) {
      fieldsToUpdate.push(`date = $${fieldsToUpdate.length + 1}`);
      values.push(date);
    }
    if (time !== undefined) {
      fieldsToUpdate.push(`time = $${fieldsToUpdate.length + 1}`);
      values.push(time);
    }
    if (description !== undefined) {
      fieldsToUpdate.push(`description = $${fieldsToUpdate.length + 1}`);
      values.push(description);
    }
    if (subjectid !== undefined) {
      fieldsToUpdate.push(`subjectId = $${fieldsToUpdate.length + 1}`);
      values.push(subjectid);
    }
    if (primitiveid !== undefined) {
      fieldsToUpdate.push(`primitiveId = $${fieldsToUpdate.length + 1}`);
      values.push(primitiveid);
    }
    if (scope !== undefined) {
      fieldsToUpdate.push(`scope = $${fieldsToUpdate.length + 1}`);
      values.push(scope);
    }

    if (fieldsToUpdate.length === 0) {
      return jsonResponse({
        error: 'No fields provided for update',
        publicError: 'No se proporcionaron campos para actualizar',
        errorCode: 'MISSING_FIELDS',
        details: []
      }, 400);
    }

    values.push(id);
    values.push(userId);

    const query = `
      UPDATE events 
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${fieldsToUpdate.length + 1} AND userId = $${fieldsToUpdate.length + 2}
      RETURNING *;
    `;

    const result = await sql.query(query, values);

    return jsonResponse({ data: result.rows[0] });
  } catch (error: any) {
    return jsonResponse({
      error: error.message,
      publicError: 'Error interno. Contacta al administrador si el problema persiste.',
      errorCode: 'DB_EVENT_PATCH_FAILED',
      details: [],
    }, 500);
  }
}

export async function DELETE(request: Request, { params }: Params) {
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

    const { id } = params;
    if (!id) {
      return jsonResponse({
        error: 'Missing event ID in params',
        publicError: 'ID del evento faltante',
        errorCode: 'MISSING_FIELDS',
        details: []
      }, 400);
    }

    const result = await sql`DELETE FROM events WHERE id = ${id} AND userId = ${userId}`;

    return jsonResponse({ data: { ok: true } });
  } catch (error: any) {
    return jsonResponse({
      error: error.message,
      publicError: 'Error interno. Contacta al administrador si el problema persiste.',
      errorCode: 'DB_EVENT_DELETE_FAILED',
      details: [],
    }, 500);
  }
}
