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
    const result = await sql`
      SELECT * FROM subjects
      WHERE userId = ${userId}
      ORDER BY createdat;
    `;

    return jsonResponse({ data: result.rows }, 200);
  } catch (error: any) {

    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_SUBJECTS_GET_FAILED',
      details: []
    }, 500);
  }
}

export async function POST(request: Request) {
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
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return jsonResponse({
        error: 'Falta o formato incorrecto del cuerpo',
        publicError: 'Datos insuficientes o inválidos',
        errorCode: 'BAD_REQUEST',
        details: []
      }, 400);
    }

    const {
      name,
      color,
      bgcolor,
      bordercolor,
      primitiveid,
      archived,
      qual,
      diff
    } = body;

    if (!name) {
      return jsonResponse({
        error: 'Campo "name" obligatorio',
        publicError: 'Datos insuficientes o inválidos',
        errorCode: 'MISSING_FIELDS',
        details: []
      }, 400);
    }

    await sql`
      INSERT INTO subjects (
        name, color, bgColor, borderColor,
        primitiveid, archived, qual, diff, userId
      )
      VALUES (
        ${name}, ${color}, ${bgcolor}, ${bordercolor}, ${primitiveid}, ${archived},
        ${qual}, ${diff}, ${userId}
      );
    `;

    return jsonResponse({ data: { ok: true } }, 201);
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_SUBJECTS_POST_FAILED',
      details: []
    }, 500);
  }
}
