import { sql } from '@vercel/postgres'
import { jsonResponse } from '@/app/lib/helpers';



export async function GET(request: Request) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return jsonResponse({
        error: 'Missing X-User-Id header',
        publicError: 'Permiso denegado',
        errorCode: 'NO_AUTH',
      }, 401);
    }

    const usersResult = await sql`SELECT id, year FROM users`;
    const users = usersResult.rows;

    const subjectsResult = await sql`SELECT * FROM subjects WHERE userId = ${userId};`;
    const subjects = subjectsResult.rows;

    const primitiveSubjectsResult = await sql`SELECT * FROM primitive_subjects;`;
    const primitiveSubjects = primitiveSubjectsResult.rows;

    const primitiveIds = subjects
      .filter(subject => !subject.archived && subject.primitiveid !== '00000000')
      .map(subject => subject.primitiveid)
      .filter((id): id is string => !!id);

    const years = subjects
      .filter(subject => !subject.archived && subject.primitiveid !== '00000000')
      .map((sbj) => primitiveSubjects.find(ps => ps.id === sbj.primitiveid)?.year)

    const individualEvents = (await sql`SELECT * FROM events WHERE userId = ${userId};`).rows;

    let classEvents = [];
    if (primitiveIds.length > 0) {
      const placeholders = primitiveIds.map((_, index) => `$${index + 1}`).join(', ');
      const query = `
        SELECT * FROM events 
        WHERE primitiveId IN (${placeholders}) 
        AND scope = 'admin' 
        AND userId != $${primitiveIds.length + 1};
      `;
      classEvents = (await sql.query(query, [...primitiveIds, userId])).rows;
    }

    const otherEvents = (await sql`
      SELECT * FROM events 
      WHERE primitiveId = '00000000' 
      AND userId != ${userId} 
      AND scope = 'admin';
    `).rows;

    const otherEventsYear = otherEvents.filter(event => 
      years.includes(users.find(user => user.id === event.userid)?.year)
    );

    const globalEvents = (await sql`
      SELECT * FROM events 
      WHERE scope = 'dev' 
      AND userId != ${userId};
    `).rows;

    const allEvents = [...individualEvents, ...classEvents, ...otherEventsYear, ...globalEvents];

    return jsonResponse({ data: allEvents });
  } catch (error: any) {
    return jsonResponse({
      error: error?.message ?? 'Unknown error',
      publicError: 'Error interno. Contacta al administrador si el problema persiste.',
      details: { stack: error?.stack },
      errorCode: 'DB_EVENTS_GET_FAILED',
    }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return jsonResponse({
        error: 'Missing X-User-Id header',
        publicError: 'Permiso denegado',
        errorCode: 'NO_AUTH',
      }, 401);
    }

    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({
        error: 'Invalid JSON body',
        publicError: 'Petición inválida',
        errorCode: 'BAD_REQUEST',
      }, 400);
    }

    if (!body || typeof body !== 'object') {
      return jsonResponse({
        error: 'Body missing or not an object',
        publicError: 'Petición inválida',
        errorCode: 'BAD_REQUEST',
      }, 400);
    }

    const { name, date, time, description, subjectid, primitiveid, scope } = body;
    
    if (!name || !date) {
      return jsonResponse({
        error: 'Missing required fields: name or date',
        publicError: 'Datos insuficientes o inválidos',
        errorCode: 'MISSING_FIELDS',
        details: { name, date },
      }, 400);
    }

    await sql`
      INSERT INTO events 
        (name, description, date, time, userId, subjectId, primitiveid, scope) 
      VALUES 
        (${name}, ${description}, ${date}, ${time}, ${userId}, ${subjectid}, ${primitiveid}, ${scope});
    `;

    return jsonResponse({ data: { ok: true } });
  } catch (error: any) {
    return jsonResponse({
      error: error?.message ?? 'Unknown error',
      publicError: 'Error interno. Contacta al administrador si el problema persiste.',
      details: { stack: error?.stack },
      errorCode: 'DB_EVENT_POST_FAILED',
    }, 500);
  }
}
