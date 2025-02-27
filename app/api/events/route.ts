import {  sql } from '@vercel/postgres'
// export async function GET() {
//   try {
//     const verification = await verifySession();
//     const session = verification.session
//     if (!session) return new Response('Unauthorized', { status: 401 })
//     const { id: userId } = session
//     const subjects = await getSubjects()
//     const individualEvents = (await sql`SELECT * FROM events WHERE userId = ${userId};`).rows
//     const classEvents: QueryResultRow[] = []
//     console.log('subjects', subjects)
    
//     subjects.forEach(async (subject) => {
//       const query = (await sql`SELECT * FROM events WHERE primitiveId = ${subject.primitiveid} AND scope = 'admin' AND userId != ${userId};`).rows
//       classEvents.push(...query)
//     })
//     const globalEvents = (await sql`SELECT * FROM events WHERE scope = 'global' AND userId != ${userId};`).rows
//     const allEvents = [...individualEvents, ...classEvents, ...globalEvents]
//     return new Response(JSON.stringify(allEvents))

//   } catch (error) {
//     console.log(error)
//     return new Response('Unauthorized', { status: 401 })
//   }
// }

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    // Fetch subjects and extract primitive IDs
    const users = (await sql`SELECT id, year FROM users`).rows;
    const subjects = (await sql`SELECT * FROM subjects WHERE userId = ${userId};`).rows;
    const primitiveIds = subjects
      .filter((subject) => !subject.archived && subject.primitiveid !== '00000000')
      .map(subject => subject.primitiveid)
      .filter((id): id is string => !!id); // Ensure primitiveIds is string[]

    const years = subjects.filter((subject) => !subject.archived && subject.primitiveid !== '00000000').map(subject => subject.year);

    // Fetch individual events for the user
    const individualEvents = (await sql`SELECT * FROM events WHERE userId = ${userId};`).rows;

    // Fetch class events using a dynamically constructed query
    let classEvents = [];
    if (primitiveIds.length > 0) {
      const placeholders = primitiveIds.filter((id) => id !== '00000000').map((_, index) => `$${index + 1}`).join(', ');
      const query = `
        SELECT * FROM events 
        WHERE primitiveId IN (${placeholders}) 
        AND scope = 'admin' 
        AND userId != $${primitiveIds.length + 1};
      `;
      classEvents = (await sql.query(query, [...primitiveIds, userId])).rows;
    }

    const otherEvents = (await sql`SELECT * FROM events WHERE primitiveId = '00000000' AND userId != ${userId} AND scope = 'admin';`).rows;
    const otherEventsYear = otherEvents.filter((event) => years.includes(users.find((user) => user.id === event.userid)?.year));

    // Fetch global events
    const globalEvents = (await sql`SELECT * FROM events WHERE scope = 'dev' AND userId != ${userId};`).rows;

    // Combine all events
    const allEvents = [...individualEvents, ...classEvents,...otherEventsYear, ...globalEvents];

    return new Response(JSON.stringify(allEvents));
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
    const { name, date, time, description, subjectid, primitiveid, scope } = body
    if (!name || !date) return new Response('Missing required fields', { status: 400 })
    await sql`INSERT INTO events (name, description, date, time, userId, subjectId, primitiveid, scope) VALUES (${name}, ${description}, ${date}, ${time}, ${userId}, ${subjectid}, ${primitiveid}, ${scope});`
    return new Response('Event created')
  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
  
}