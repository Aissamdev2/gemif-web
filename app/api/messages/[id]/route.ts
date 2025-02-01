import { sql } from '@vercel/postgres'
import { verifySession } from '@/app/lib/helpers'

export async function GET(request: Request, { params }: { params: { id: string } }) {

  try {
    const verification = await verifySession();
    const session = verification.session
    if (!session) return new Response('Unauthorized', { status: 401 })
    const { id: userId } = session
    const { id } = params
    const message = (await sql`SELECT id, name, description, year, scope, userid, createdat AT TIME ZONE 'UTC' AS createdat FROM messages WHERE id = ${id}`).rows[0]
    return new Response(JSON.stringify(message))
  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const verification = await verifySession();
    const session = verification.session
    if (!session) return new Response('Unauthorized', { status: 401 })
    const { id: userId } = session;
    const { id } = params;

    const body = await request.json();
    if (!body) return new Response('Invalid request body', { status: 400 });

    const { name, description, scope, year } = body;

    // Prepare the fields to update based on the provided fields
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      fieldsToUpdate.push(`name = $${fieldsToUpdate.length + 1}`);
      values.push(name);
    }
    if (description !== undefined) {
      fieldsToUpdate.push(`description = $${fieldsToUpdate.length + 1}`);
      values.push(description);
    }
    if (year !== undefined) {
      fieldsToUpdate.push(`year = $${fieldsToUpdate.length + 1}`);
      values.push(year);
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
      UPDATE messages 
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${fieldsToUpdate.length + 1} AND userId = $${fieldsToUpdate.length + 2}
    `;

    console.log('query: ',query, 'values: ', values);

    // Execute the SQL query using sql.query()
    await sql.query(query, values);

    return new Response('Message updated');
  } catch (error) {
    console.log(error);
    return new Response('Unauthorized', { status: 401 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const verification = await verifySession();
    const session = verification.session
    if (!session) return new Response('Unauthorized', { status: 401 })
    const { id: userId } = session;
    const { id } = params;
    await sql`DELETE FROM messages WHERE id = ${id} AND userId = ${userId}`;
    return new Response('Message deleted');
  } catch (error) {
    console.log(error);
    return new Response('Unauthorized', { status: 401 });
  }
}

