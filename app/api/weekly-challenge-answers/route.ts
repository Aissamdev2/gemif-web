import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';


export async function GET(request: Request) {
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
    const result = (await sql`
      SELECT * FROM weekly_challenge_answers
      WHERE userid = ${userId}
    `).rows;

    if (!result) {
      return jsonResponse({
        error: `No se encontró respuestas`,
        publicError: 'Respuesta no encontrada',
        errorCode: 'DB_WEEKLY_CHALLENGE_ANSWERS_GET_FAILED',
        details: []
      }, 404);
    }

    return jsonResponse({ data: result });
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_WEEKLY_CHALLENGE_ANSWERS_GET_FAILED',
      details: []
    }, 500);
  }
}




export async function POST(request: Request) {
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
    const body = await request.json();
    const { challengeId, answer, score } = body;

    if (!challengeId || answer == null || score == null) {
      return jsonResponse({
        error: 'challengeId, answer o score faltan o son nulos',
        publicError: 'Datos insuficientes o inválidos',
        errorCode: 'MISSING_FIELDS',
        details: []
      }, 400);
    }

    await sql`
      INSERT INTO weekly_challenge_answers
        (challengeid, userid, answer, score)
      VALUES
        (${challengeId}, ${userId}, ${answer}, ${score})
    `;

    const result = await sql`
      SELECT weeklychallengesscore FROM users WHERE id = ${userId}
    `;
    const currentScore = result.rows[0]?.weeklychallengesscore ?? 0;

    await sql`
      UPDATE users
      SET weeklychallengesscore = ${currentScore + score}
      WHERE id = ${userId}
    `;

    return jsonResponse({ data: { message: 'Respuesta registrada correctamente' } }, 201);
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_WEEKLY_CHALLENGE_ANSWERS_POST_FAILED',
      details: []
    }, 500);
  }
}
