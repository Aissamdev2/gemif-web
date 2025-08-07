import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';

export async function GET(request: Request) {
  const userId = request.headers.get('X-User-Id');

  if (!userId) {
    return jsonResponse({
      error: "Falta el encabezado X-User-Id",
      publicError: "Permiso denegado",
      errorCode: "NO_AUTH",
      details: []
    }, 401);
  }

  
  try {
    const result = await sql`
      SELECT * FROM primitive_subjects 
      WHERE qual != ARRAY[0.0,0.0]::REAL[] OR diff != ARRAY[0.0,0.0]::REAL[];
    `;
    
    if (!result || !Array.isArray(result.rows)) {
      return jsonResponse({
        error: "No hay ranking o es inválido",
        publicError: "No se pudo obtener el ranking",
        errorCode: "DB_RANKING_GET_FAILED",
        details: []
      }, 500);
    }

    return jsonResponse({ data: result.rows }, 200);
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: "Error interno, contacta al administrador si el problema persiste",
      errorCode: "DB_SUBJECTS_GET_FAILED",
      details: []
    }, 500);
  }
}
