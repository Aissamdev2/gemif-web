import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';

export async function GET(request: Request) {
  const userId = request.headers.get('X-User-Id');

  if (!userId) {
    return jsonResponse({
      error: "Missing user ID",
      publicError: "Permiso denegado",
      errorCode: "NO_AUTH",
    }, 401);
  }

  try {
    const result = await sql`SELECT * FROM primitive_subjects ORDER BY id`;

    if (!result || !result.rows) {
      return jsonResponse({
        error: "No rows returned from query",
        publicError: "No se pudieron obtener los datos",
        errorCode: "DB_PRIMITIVE_SUBJECTS_GET_FAILED",
      }, 500);
    }

    return jsonResponse({ data: result.rows }, 200);
  } catch (error: any) {
    return jsonResponse({
      error: error.message,
      publicError: "Error interno, contacta al administrador si el problema persiste",
      errorCode: "DB_PRIMITIVE_SUBJECTS_GET_FAILED",
    }, 500);
  }
}
