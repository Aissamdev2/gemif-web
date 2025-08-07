import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';

export async function GET(request: Request) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return jsonResponse({
      error: "Missing user ID",
      publicError: "Permiso denegado",
      errorCode: "NO_AUTH"
    }, 401);
  }

  try {
    const userRes = await sql`
      SELECT lastseen AT TIME ZONE 'UTC' AS lastseen
      FROM users
      WHERE id = ${userId};
    `;
    const user = userRes.rows[0];

    if (!user || !user.lastseen) {
      return jsonResponse({
        error: "User not found or missing lastseen timestamp",
        publicError: "Usuario no encontrado o incompleto",
        errorCode: "DB_USER_GET_FAILED",
        details: { userId }
      }, 404);
    }

    const lastSeen = new Date(user.lastseen).getTime();

    // Fetch individual messages
    const individualMessagesRes = await sql`
      SELECT id, name, description, year, scope, userid, createdat AT TIME ZONE 'UTC' AS createdat
      FROM messages
      WHERE userId = ${userId};
    `;
    const individualMessages = individualMessagesRes.rows;

    // Fetch subjects and primitive subjects
    const subjectsRes = await sql`SELECT * FROM subjects WHERE userId = ${userId};`;
    const primitiveSubjectsRes = await sql`SELECT * FROM primitive_subjects;`;

    const subjects = subjectsRes.rows;
    const primitiveSubjects = primitiveSubjectsRes.rows;

    const primitiveIds = subjects
      .map(subject => subject.primitiveid)
      .filter((id): id is string => !!id);

    const yearsFromSubjects = primitiveSubjects
      .filter(subject => primitiveIds.includes(subject.id))
      .map(subject => subject.year);

    // Fetch year messages
    let yearMessages = [];
    if (yearsFromSubjects.length > 0) {
      const placeholders = yearsFromSubjects.map((_, index) => `$${index + 1}`).join(', ');
      const query = `
        SELECT id, name, description, year, scope, userid, createdat AT TIME ZONE 'UTC' AS createdat
        FROM messages
        WHERE year IN (${placeholders})
        AND scope = 'year'
      `;
      const result = await sql.query(query, [...yearsFromSubjects]);
      yearMessages = result.rows;
    }

    // Fetch global messages
    const globalMessagesRes = await sql`
      SELECT id, name, description, year, scope, userid, createdat AT TIME ZONE 'UTC' AS createdat
      FROM messages
      WHERE scope = 'global';
    `;
    const globalMessages = globalMessagesRes.rows;

    // Combine and filter
    const allMessages = [...individualMessages, ...yearMessages, ...globalMessages];
    const unseenMessages = allMessages.filter(msg => {
      const created = new Date(msg.createdat).getTime();
      return created > lastSeen;
    });

    return jsonResponse({ data: unseenMessages }, 200);

  } catch (error: any) {
    return jsonResponse({
      error: error.message,
      publicError: "Error interno, contacta al administrador si el problema persiste",
      errorCode: "DB_UNSEEN_GET_FAILED"
    }, 500);
  }
}
