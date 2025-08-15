import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';

export async function GET(request: Request, { params }: any) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return jsonResponse({
      error: 'Falta encabezado X-User-Id',
      publicError: 'Permiso denegado',
      errorCode: 'NO_AUTH',
      details: []
    }, 401);
  }

  try {
    const { id } = await params;
    const result = await sql`
      SELECT * FROM weekly_challenges WHERE id = ${id} AND userid = ${userId}
    `;
    return jsonResponse({ data: result.rows[0] });
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_WEEKLY_CHALLENGE_GET_FAILED',
      details: []
    }, 500);
  }
}

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

  try {
    const { id } = await params;
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return jsonResponse({
        error: 'Petición inválida o cuerpo vacío',
        publicError: 'Datos inválidos',
        errorCode: 'BAD_REQUEST',
        details: []
      }, 400);
    }

    const {
      title,
      description,
      isMultipleChoice,
      options,
      correctAnswers,
      difficulty,
      deadline,
      strictAnswer,
      active,
      suggested
    } = body;

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      fieldsToUpdate.push(`title = $${fieldsToUpdate.length + 1}`);
      values.push(title);
    }
    if (description !== undefined) {
      fieldsToUpdate.push(`description = $${fieldsToUpdate.length + 1}`);
      values.push(description);
    }
    if (isMultipleChoice !== undefined) {
      fieldsToUpdate.push(`ismultiplechoice = $${fieldsToUpdate.length + 1}`);
      values.push(isMultipleChoice);
    }
    if (options !== undefined) {
      fieldsToUpdate.push(`options = $${fieldsToUpdate.length + 1}`);
      values.push(options);
    }
    if (correctAnswers !== undefined) {
      fieldsToUpdate.push(`correctanswers = $${fieldsToUpdate.length + 1}`);
      values.push(correctAnswers);
    }
    if (difficulty !== undefined) {
      fieldsToUpdate.push(`difficulty = $${fieldsToUpdate.length + 1}`);
      values.push(difficulty);
    }
    if (deadline !== undefined) {
      fieldsToUpdate.push(`deadline = $${fieldsToUpdate.length + 1}`);
      values.push(deadline);
    }
    if (strictAnswer !== undefined) {
      fieldsToUpdate.push(`strictanswer = $${fieldsToUpdate.length + 1}`);
      values.push(strictAnswer);
    }
    if (active !== undefined) {
      fieldsToUpdate.push(`active = $${fieldsToUpdate.length + 1}`);
      values.push(active);
    }
    if (suggested !== undefined) {
      fieldsToUpdate.push(`suggested = $${fieldsToUpdate.length + 1}`);
      values.push(suggested);
    }

    if (fieldsToUpdate.length === 0) {
      return jsonResponse({
        error: 'No se proporcionaron campos para actualizar',
        publicError: 'Datos insuficientes',
        errorCode: 'MISSING_FIELDS',
        details: []
      }, 400);
    }

    values.push(id);

    const query = `
      UPDATE weekly_challenges
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${fieldsToUpdate.length + 1}
    `;

    await sql.query(query, values);

    return jsonResponse({ data: 'Challenge updated' });
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_WEEKLY_CHALLENGE_PATCH_FAILED',
      details: []
    }, 500);
  }
}

export async function DELETE(request: Request, { params }: any) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return jsonResponse({
      error: 'Falta encabezado X-User-Id',
      publicError: 'Permiso denegado',
      errorCode: 'NO_AUTH',
      details: []
    }, 401);
  }

  try {
    const { id } = await params;
    await sql`
      DELETE FROM weekly_challenges WHERE id = ${id} AND userid = ${userId}
    `;

    return jsonResponse({ data: 'Challenge deleted' });
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_WEEKLY_CHALLENGE_DELETE_FAILED',
      details: []
    }, 500);
  }
}
