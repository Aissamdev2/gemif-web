import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';

export async function GET(request: Request) {
  const userId = request.headers.get('X-User-Id');

  if (!userId) {
    return jsonResponse(
      {
        error: "Missing user ID",
        publicError: "Permiso denegado",
        errorCode: "NO_AUTH",
      },
      401
    );
  }

  try {
    const individualMessages = (
      await sql`
        SELECT id, name, description, year, scope, userid, createdat AT TIME ZONE 'UTC' AS createdat
        FROM messages
        WHERE userId = ${userId};
      `
    ).rows;

    const subjects = (
      await sql`
        SELECT * FROM subjects WHERE userId = ${userId};
      `
    ).rows;

    const primitiveSubjects = (
      await sql`
        SELECT * FROM primitive_subjects;
      `
    ).rows;

    const primitiveIds = subjects
      .filter((s) => !s.archived)
      .map((s) => s.primitiveid)
      .filter((id): id is string => !!id);

    const yearsFromSubjects = primitiveSubjects
      .filter((p) => primitiveIds.includes(p.id))
      .map((p) => p.year);

    let yearMessages = [];

    if (yearsFromSubjects.length > 0) {
      const placeholders = yearsFromSubjects.map((_, i) => `$${i + 1}`).join(", ");
      const query = `
        SELECT id, name, description, year, scope, userid, createdat AT TIME ZONE 'UTC' AS createdat
        FROM messages
        WHERE year IN (${placeholders})
        AND scope = 'year'
        AND userId != $${yearsFromSubjects.length + 1};
      `;
      const values = [...yearsFromSubjects, userId];
      yearMessages = (await sql.query(query, values)).rows;
    }

    const globalMessages = (
      await sql`
        SELECT id, name, description, year, scope, userid, createdat AT TIME ZONE 'UTC' AS createdat
        FROM messages
        WHERE scope = 'global' AND userId != ${userId};
      `
    ).rows;

    const allMessages = [...individualMessages, ...yearMessages, ...globalMessages];

    return jsonResponse({ data: allMessages }, 200);
  } catch (error: any) {
    return jsonResponse(
      {
        error: error.message,
        publicError: "Error al cargar los mensajes",
        errorCode: "DB_MESSAGES_GET_FAILED",
        details: { error },
      },
      500
    );
  }
}

export async function POST(request: Request) {
  const userId = request.headers.get('X-User-Id');

  if (!userId) {
    return jsonResponse(
      {
        error: "Missing X-User-Id",
        publicError: "Permiso denegado",
        errorCode: "NO_AUTH",
      },
      401
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        error: "Invalid JSON in request body",
        publicError: "Petición inválida",
        errorCode: "BAD_REQUEST",
      },
      400
    );
  }

  const { name, description, scope, year } = body || {};

  if (!name) {
    return jsonResponse(
      {
        error: "Missing 'name' field",
        publicError: "Nombre requerido",
        errorCode: "MISSING_FIELDS",
      },
      400
    );
  }

  try {
    await sql`
      INSERT INTO messages (name, description, userId, scope, year)
      VALUES (${name}, ${description}, ${userId}, ${scope}, ${year});
    `;

    return jsonResponse({ data: { ok: true } }, 201);
  } catch (error: any) {
    return jsonResponse(
      {
        error: error.message,
        publicError: "No se pudo crear el mensaje",
        errorCode: "DB_MESSAGES_POST_FAILED",
        details: { input: body, error },
      },
      500
    );
  }
}
