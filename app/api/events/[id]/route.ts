import { sql } from '@vercel/postgres'

export async function GET(request: Request, { params }: { params: { id: string } }) {

  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    const { id } = params
    const event = (await sql`SELECT * FROM events WHERE id = ${id} AND userId = ${userId}`).rows[0]
    return new Response(JSON.stringify(event))
  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    const { id } = params;

    const body = await request.json();
    if (!body) return new Response('Invalid request body', { status: 400 });

    const { name, date, time, description, subjectid, primitiveid, scope } = body;

    // Prepare the fields to update based on the provided fields
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      fieldsToUpdate.push(`name = $${fieldsToUpdate.length + 1}`);
      values.push(name);
    }
    if (date !== undefined) {
      fieldsToUpdate.push(`date = $${fieldsToUpdate.length + 1}`);
      values.push(date);
    }
    if (time !== undefined) {
      fieldsToUpdate.push(`time = $${fieldsToUpdate.length + 1}`);
      values.push(time);
    }
    if (description !== undefined) {
      fieldsToUpdate.push(`description = $${fieldsToUpdate.length + 1}`);
      values.push(description);
    }
    if (subjectid !== undefined) {
      fieldsToUpdate.push(`subjectId = $${fieldsToUpdate.length + 1}`);
      values.push(subjectid);
    }
    if (primitiveid !== undefined) {
      fieldsToUpdate.push(`primitiveId = $${fieldsToUpdate.length + 1}`);
      values.push(primitiveid);
    }
    if (scope !== undefined) {
      fieldsToUpdate.push(`scope = $${fieldsToUpdate.length + 1}`);
      values.push(scope);
    }

    if (fieldsToUpdate.length === 0) {
      return new Response('No fields to update', { status: 400 });
    }

    // Add the event id and user id to the values array
    values.push(id);
    values.push(userId);

    // Construct the SQL query with placeholders
    const query = `
      UPDATE events 
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${fieldsToUpdate.length + 1} AND userId = $${fieldsToUpdate.length + 2}
    `;

    console.log('query: ',query, 'values: ', values);

    // Execute the SQL query using sql.query()
    await sql.query(query, values);

    return new Response('Event updated');
  } catch (error) {
    console.log(error);
    return new Response('Unauthorized', { status: 401 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    const { id } = params;
    await sql`DELETE FROM events WHERE id = ${id} AND userId = ${userId}`;
    return new Response('Event deleted');
  } catch (error) {
    console.log(error);
    return new Response('Unauthorized', { status: 401 });
  }
}

