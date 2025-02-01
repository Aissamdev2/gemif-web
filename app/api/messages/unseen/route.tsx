import {  sql } from '@vercel/postgres'

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const user = (await sql`SELECT lastseen AT TIME ZONE 'UTC' AS lastseen FROM users WHERE id = ${userId}`).rows[0];

    // Fetch subjects and extract primitive IDs
    const individualMessages = (await sql`SELECT id, name, description, year, scope, userid, createdat AT TIME ZONE 'UTC' AS createdat FROM messages WHERE userId = ${userId};`).rows;
    const subjects = (await sql`SELECT * FROM subjects WHERE userId = ${userId};`).rows
    const primitiveSubjects = (await sql`SELECT * FROM primitive_subjects`).rows
    const primitiveIds = subjects
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
      `;
      yearMessages = (await sql.query(query, [...yearsFromSubjects])).rows;
    }

    // Fetch global events
    const globalMessages = (await sql`SELECT id, name, description, year, scope, userid, createdat AT TIME ZONE 'UTC' AS createdat FROM messages WHERE scope = 'global';`).rows;

    // Combine all events
    const allMessages = [...individualMessages, ...yearMessages, ...globalMessages];

    const unseenMessages = allMessages.filter((message) => {
      return (new Date(message.createdat)).getTime() > (new Date(user.lastseen)).getTime()
    })
    return new Response(JSON.stringify(unseenMessages));
  } catch (error) {
    console.error(error);
    return new Response('Unauthorized', { status: 401 });
  }
}