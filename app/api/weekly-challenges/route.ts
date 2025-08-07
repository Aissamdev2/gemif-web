import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';

export async function GET(request: Request) {
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
    const result = await sql`
      SELECT * FROM weekly_challenges ORDER BY deadline DESC
    `;

    return jsonResponse({ data: result.rows });
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_WEEKLY_CHALLENGES_GET_FAILED',
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

    if (!body || typeof body !== 'object') {
      return jsonResponse({
        error: 'Cuerpo de la petición inválido o ausente',
        publicError: 'Datos insuficientes o inválidos',
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

    if (!title || difficulty == null || !deadline) {
      return jsonResponse({
        error: 'Faltan campos requeridos: título, dificultad o deadline',
        publicError: 'Datos insuficientes o inválidos',
        errorCode: 'MISSING_FIELDS',
        details: []
      }, 400);
    }
    
    await sql`
      INSERT INTO weekly_challenges (
        title,
        description,
        ismultiplechoice,
        options,
        correctanswers,
        difficulty,
        deadline,
        strictanswer,
        active,
        suggested,
        userid
      ) VALUES (
        ${title},
        ${description},
        ${isMultipleChoice},
        ${options},
        ${correctAnswers},
        ${difficulty},
        ${deadline},
        ${strictAnswer},
        ${active},
        ${suggested},
        ${userId}
      )
    `;

    return jsonResponse({ data: { created: true } });
  } catch (error: any) {
    console.error(error);
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_WEEKLY_CHALLENGES_POST_FAILED',
      details: []
    }, 500);
  }
}
