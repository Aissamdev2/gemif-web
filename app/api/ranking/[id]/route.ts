import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';
import { PrimitiveSubject, Subject } from '@/app/lib/definitions';


export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
        error: "Missing message ID",
        publicError: "ID de asignatura requerido",
        errorCode: "MISSING_PARAMS",
        details: []
      },
        400
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({
        error: 'Invalid JSON body',
        publicError: 'Petición inválida',
        errorCode: 'BAD_REQUEST',
        details: [],
      }, 400);
    }

    if (!body || typeof body !== 'object') {
      return jsonResponse({
        error: 'Body missing or not an object',
        publicError: 'Petición inválida',
        errorCode: 'BAD_REQUEST',
        details: [],
      }, 400);
    }

    let { type, score } = body;
    
    if (!type || !score) {
      return jsonResponse({
        error: 'Missing required fields: name or date',
        publicError: 'Falta puntuación o tipo de puntuación',
        errorCode: 'MISSING_FIELDS',
        details: [],
      }, 400);
    }

    try {
      const prevSubject = (await sql`
          SELECT *
          FROM subjects
          WHERE id = ${id} AND userid = ${userId};
        `).rows[0] as Subject;
  
      const prevPrimitive = (await sql`
          SELECT *
          FROM primitive_subjects
          WHERE id = ${prevSubject.primitiveid};
        `).rows[0] as PrimitiveSubject;
  
      if (type === "qual") {
        await sql`
          UPDATE subjects
          SET qual = ${score}
          WHERE id = ${id} AND userid = ${userId};
        `;
  
        const scoreDifference = score - (prevSubject.qual || 0);
        const denomFactor = prevSubject.qual ? 0 : 1;
        await sql`
          UPDATE primitive_subjects
          SET qual = ARRAY[${prevPrimitive.qual[0] + scoreDifference},${prevPrimitive.qual[1] + denomFactor}]::REAL[]
          WHERE id = ${prevSubject.primitiveid};`
  
  
      } else {
        await sql`
          UPDATE subjects
          SET diff = ${score}
          WHERE id = ${id} AND userid = ${userId};
        `;
  
        const scoreDifference = score - (prevSubject?.diff || 0);
        const denomFactor = prevSubject.diff ? 0 : 1;
        await sql`
          UPDATE primitive_subjects
          SET diff = ARRAY[${prevPrimitive.diff[0] + scoreDifference}, ${prevPrimitive.diff[1] + denomFactor}]::REAL[]
          WHERE id = ${prevSubject.primitiveid};`
      }
    } catch (error: any) {
      return jsonResponse({
        error: error?.message ?? 'Unknown error',
        publicError: 'No se pudo modificar la puntuación',
        errorCode: 'DB_RANKING_PATCH_FAILED',
        details: [],
      }, 500);
    }


    return jsonResponse({ data: { ok: true } });
  } catch (error: any) {
    return jsonResponse({
      error: error?.message ?? 'Unknown error',
      publicError: 'Error interno. Contacta al administrador si el problema persiste.',
      errorCode: 'DB_RANKING_PATCH_FAILED',
      details: [],
    }, 500);
  }
}
