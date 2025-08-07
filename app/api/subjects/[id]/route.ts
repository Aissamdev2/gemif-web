import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return jsonResponse({
      error: 'Falta encabezado X-User-Id',
      publicError: 'Permiso denegado',
      errorCode: 'NO_AUTH',
      details: []
    }, 401);
  }

  const { id } = params;
  if (!id) {
    return jsonResponse({
      error: 'Falta parámetro id',
      publicError: 'Petición inválida',
      errorCode: 'MISSING_PARAMS',
      details: []
    }, 400);
  }

  try {
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return jsonResponse({
        error: 'Cuerpo de petición inválido o ausente',
        publicError: 'Datos insuficientes o inválidos',
        errorCode: 'BAD_REQUEST',
        details: []
      }, 400);
    }

    const { color, bgcolor, bordercolor, archived, qual, diff } = body;

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (color !== undefined) {
      fieldsToUpdate.push(`color = $${fieldsToUpdate.length + 1}`);
      values.push(color);
    }
    if (bgcolor !== undefined) {
      fieldsToUpdate.push(`bgcolor = $${fieldsToUpdate.length + 1}`);
      values.push(bgcolor);
    }
    if (bordercolor !== undefined) {
      fieldsToUpdate.push(`bordercolor = $${fieldsToUpdate.length + 1}`);
      values.push(bordercolor);
    }
    if (qual !== undefined) {
      fieldsToUpdate.push(`qual = $${fieldsToUpdate.length + 1}`);
      values.push(qual);
    }
    if (diff !== undefined) {
      fieldsToUpdate.push(`diff = $${fieldsToUpdate.length + 1}`);
      values.push(diff);
    }
    if (archived !== undefined) {
      fieldsToUpdate.push(`archived = $${fieldsToUpdate.length + 1}`);
      values.push(archived);
    }

    if (fieldsToUpdate.length === 0) {
      return jsonResponse({
        error: 'No se proporcionaron campos para actualizar',
        publicError: 'No se especificaron cambios',
        errorCode: 'MISSING_FIELDS',
        details: []
      }, 400);
    }

    values.push(id);
    values.push(userId);

    const query = `
      UPDATE subjects
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${fieldsToUpdate.length + 1} AND userId = $${fieldsToUpdate.length + 2}
    `;

    await sql.query(query, values);

    return jsonResponse({ data: { ok: true } }, 200);
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_SUBJECTS_PATCH_FAILED',
      details: []
    }, 500);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return jsonResponse({
      error: 'Falta encabezado X-User-Id',
      publicError: 'Permiso denegado',
      errorCode: 'NO_AUTH',
      details: []
    }, 401);
  }

  const { id } = params;
  if (!id) {
    return jsonResponse({
      error: 'Falta parámetro id',
      publicError: 'Petición inválida',
      errorCode: 'MISSING_PARAMS',
      details: []
    }, 400);
  }

  try {
    const result = await sql`DELETE FROM subjects WHERE id = ${id} AND userId = ${userId}`;

    return jsonResponse({ data: { ok: true } }, 200);
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_SUBJECT_DELETE_FAILED',
      details: []
    }, 500);
  }
}
