import {  sql } from '@vercel/postgres'
import { getPrimitiveSubjects, getSubjects } from '@/app/lib/actions';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Fetch subjects and extract primitive IDs
    const individualMessages = (await sql`SELECT id, name, description, year, scope, userid, createdat AT TIME ZONE 'UTC' AS createdat FROM messages WHERE userId = ${userId};`).rows;
    const subjects = (await sql`SELECT * FROM subjects WHERE userId = ${userId};`).rows;
    const primitiveSubjects = (await sql`SELECT * FROM primitive_subjects`).rows;
    const primitiveIds = subjects.filter((subject) => !subject.archived)
      .map(subject => subject.primitiveid)
      .filter((id): id is string => !!id); // Ensure primitiveIds is string[]

    const yearsFromSubjects = primitiveSubjects.filter((subject) => primitiveIds.includes(subject.id)).map((subject) => subject.year)

    // Fetch class events using a dynamically constructed query
    let yearMessages = [];
    if (yearsFromSubjects.length > 0) {
      const placeholders = yearsFromSubjects.map((_, index) => `$${index + 1}`).join(', ');
      const query = `
        SELECT id, name, description, year, scope, userid, createdat AT TIME ZONE 'UTC' AS createdat FROM messages 
        WHERE year IN (${placeholders}) 
        AND scope = 'year' 
        AND userId != $${yearsFromSubjects.length + 1};
      `;
      yearMessages = (await sql.query(query, [...yearsFromSubjects, userId])).rows;
    }

    // Fetch global events
    const globalMessages = (await sql`SELECT id, name, description, year, scope, userid, createdat AT TIME ZONE 'UTC' AS createdat FROM messages WHERE scope = 'global' AND userId != ${userId};`).rows;

    // Combine all events
    const allMessages = [...individualMessages, ...yearMessages, ...globalMessages];

    return new Response(JSON.stringify(allMessages));
  } catch (error) {
    console.error(error);
    return new Response('Unauthorized', { status: 401 });
  }
}


export async function POST(request: Request) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    const body = await request.json()
    if (!body)return new Response('Invalid request body', { status: 400 })
    const { name, description, scope, year } = body
    if (!name) return new Response('Missing required fields', { status: 400 })
    await sql`INSERT INTO messages (name, description, userId, scope, year) VALUES (${name}, ${description}, ${userId}, ${scope}, ${year});`
    return new Response('Message created')
  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
  
}