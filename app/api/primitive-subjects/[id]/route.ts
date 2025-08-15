import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';


export async function PATCH(request: Request, { params }: any) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return jsonResponse({
      error: 'Falta encabezado X-User-Id',
      publicError: 'Permiso denegado',
      errorCode: 'NO_AUTH',
      details: []
    }, 401);
  }

  const { id } = await params;
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

    const { name, info } = body;

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (name) {
      fieldsToUpdate.push(`name = $${fieldsToUpdate.length + 1}`);
      values.push(name);
    }
    if (info) {
      fieldsToUpdate.push(`info = $${fieldsToUpdate.length + 1}`);
      values.push(info);
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

    const query = `
      UPDATE primitive_subjects
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${fieldsToUpdate.length + 1}
    `;

    await sql.query(query, values);

    return jsonResponse({ data: { ok: true } }, 200);
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_PRIMITIVE_SUBJECTS_PATCH_FAILED',
      details: []
    }, 500);
  }
}