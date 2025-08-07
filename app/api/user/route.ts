import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';
import { User } from '@/app/lib/definitions';

export async function GET(request: Request) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return jsonResponse({
      error: 'Falta encabezado X-User-Id',
      publicError: 'Permiso denegado',
      errorCode: 'NO_AUTH'
    }, 401);
  }

  try {
    const result = await sql`SELECT * FROM users WHERE id = ${userId}`;
    const user = result.rows[0] as User | undefined;

    if (!user) {
      return jsonResponse({
        error: `Usuario con ID ${userId} no encontrado`,
        publicError: 'Usuario no encontrado',
        errorCode: 'DB_USER_GET_FAILED'
      }, 404);
    }

    return jsonResponse({ data: user }, 200);
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_USER_GET_FAILED'
    }, 500);
  }
}

export async function PATCH(request: Request) {
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
        error: 'Cuerpo de petición inválido',
        publicError: 'Petición inválida',
        errorCode: 'BAD_REQUEST',
        details: []
      }, 400);
    }

    const { name, email, password, year, role, logincount, lastseen, color } = body;

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      fieldsToUpdate.push(`publicname = $${values.length + 1}`);
      values.push(name);
    }
    if (email !== undefined) {
      fieldsToUpdate.push(`email = $${values.length + 1}`);
      values.push(email);
    }
    if (year !== undefined) {
      fieldsToUpdate.push(`year = $${values.length + 1}`);
      values.push(year);
    }
    if (role !== undefined) {
      fieldsToUpdate.push(`role = $${values.length + 1}`);
      values.push(role);
    }
    if (lastseen !== undefined) {
      fieldsToUpdate.push(`lastseen = $${values.length + 1}`);
      values.push(lastseen);
    }
    if (logincount !== undefined) {
      fieldsToUpdate.push(`logincount = $${values.length + 1}`);
      values.push(logincount);
    }
    if (color !== undefined) {
      fieldsToUpdate.push(`color = $${values.length + 1}`);
      values.push(color);
    }

    if (fieldsToUpdate.length === 0) {
      return jsonResponse({
        error: 'No se proporcionaron campos para actualizar',
        publicError: 'No se especificaron cambios',
        errorCode: 'MISSING_FIELDS',
        details: []
      }, 400);
    }

    values.push(userId); // final param for WHERE clause

    const query = `
      UPDATE users
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${fieldsToUpdate.length + 1}
      RETURNING *
    `;

    const updatedUser = await sql.query<User>(query, values);

    return jsonResponse({ data: updatedUser.rows[0] }, 200);
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_USER_PATCH_FAILED'
    }, 500);
  }
}
