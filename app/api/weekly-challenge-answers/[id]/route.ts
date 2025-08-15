import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';

export async function GET(request: Request, { params }: any) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return jsonResponse({
      error: 'Falta el encabezado X-User-Id',
      publicError: 'Permiso denegado',
      errorCode: 'NO_AUTH',
      details: []
    }, 401);
  }

  try {
    const { id } = await params;

    const result = await sql`
      SELECT * FROM weekly_challenge_answers
      WHERE id = ${id} AND userid = ${userId}
    `;
    const row = result.rows[0];

    if (!row) {
      return jsonResponse({
        error: `No se encontró respuesta con ID ${id}`,
        publicError: 'Respuesta no encontrada',
        errorCode: 'DB_WEEKLY_CHALLENGE_ANSWER_GET_FAILED',
        details: []
      }, 404);
    }

    return jsonResponse({ data: row });
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_WEEKLY_CHALLENGE_ANSWER_GET_FAILED',
      details: []
    }, 500);
  }
}


export async function PATCH(request: Request, { params }: any) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return jsonResponse({
      error: 'Falta el encabezado X-User-Id',
      publicError: 'Permiso denegado',
      errorCode: 'NO_AUTH',
      details: []
    }, 401);
  }

  try {
    const { id } = await params;
    const body = await request.json();

    if (!body || Object.keys(body).length === 0) {
      return jsonResponse({
        error: 'No se proporcionaron campos para actualizar',
        publicError: 'No se proporcionaron cambios',
        errorCode: 'MISSING_PARAMS',
        details: []
      }, 400);
    }

    const keys = Object.keys(body);
    const fields = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = keys.map(k => body[k]);
    values.push(id, userId);

    const result = await sql.query(
      `UPDATE weekly_challenge_answers SET ${fields} WHERE id = $${keys.length + 1} AND userid = $${keys.length + 2} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return jsonResponse({
        error: `No se pudo actualizar la respuesta con ID ${id}`,
        publicError: 'No se encontró o no tienes permiso para editar esta respuesta',
        errorCode: 'DB_WEEKLY_CHALLENGE_ANSWER_PATCH_FAILED',
        details: []
      }, 404);
    }

    return jsonResponse({ data: result.rows[0] });
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_WEEKLY_CHALLENGE_ANSWER_PATCH_FAILED',
      details: []
    }, 500);
  }
}


export async function DELETE(request: Request, { params }: any) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return jsonResponse({
      error: 'Falta el encabezado X-User-Id',
      publicError: 'Permiso denegado',
      errorCode: 'NO_AUTH',
      details: []
    }, 401);
  }

  try {
    const { id } = await params;

    const result = await sql`
      DELETE FROM weekly_challenge_answers
      WHERE id = ${id} AND userid = ${userId}
      RETURNING *
    `;

    if (result.rowCount === 0) {
      return jsonResponse({
        error: `No se pudo eliminar la respuesta con ID ${id}`,
        publicError: 'No se encontró o no tienes permiso para eliminar esta respuesta',
        errorCode: 'DB_WEEKLY_CHALLENGE_ANSWER_DELETE_FAILED',
        details: []
      }, 404);
    }

    return jsonResponse({ data: { deleted: true } });
  } catch (error: any) {
    console.error('❌ Error DELETE respuesta individual:', error);
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_WEEKLY_CHALLENGE_ANSWER_DELETE_FAILED',
      details: []
    }, 500);
  }
}
