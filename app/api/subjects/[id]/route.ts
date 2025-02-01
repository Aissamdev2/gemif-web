import { sql } from '@vercel/postgres'
import { verifySession } from '@/app/lib/helpers'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const verification = await verifySession();
    const session = verification.session
    if (!session) return new Response('Unauthorized', { status: 401 })
    const { id: userId } = session;
    const { id } = params;

    const body = await request.json();
    if (!body) return new Response('Invalid request body', { status: 400 });

    const { color, bgcolor, bordercolor, archived, score } = body;

    // Prepare the fields to update based on the provided fields
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (color) {
      fieldsToUpdate.push(`color = $${fieldsToUpdate.length + 1}`);
      values.push(color);
    }
    if (bgcolor) {
      fieldsToUpdate.push(`bgcolor = $${fieldsToUpdate.length + 1}`);
      values.push(bgcolor);
    }
    if (bordercolor) {
      fieldsToUpdate.push(`bordercolor = $${fieldsToUpdate.length + 1}`);
      values.push(bordercolor);
    }
    if (score) {
      fieldsToUpdate.push(`score = $${fieldsToUpdate.length + 1}`);
      values.push(score);
    }
    if (archived) {
      fieldsToUpdate.push(`archived = $${fieldsToUpdate.length + 1}`);
      values.push(archived);
    }
    if (fieldsToUpdate.length === 0) {
      return new Response('No fields to update', { status: 400 });
    }

    // Add the event id and user id to the values array
    values.push(id);
    values.push(userId);

    // Construct the SQL query with placeholders
    const query = `
      UPDATE subjects 
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${fieldsToUpdate.length + 1} AND userId = $${fieldsToUpdate.length + 2}
    `;

    console.log('query: ',query, 'values: ', values);

    // Execute the SQL query using sql.query()
    await sql.query(query, values);

    return new Response('Subject updated');
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
    await sql`DELETE FROM subjects WHERE id = ${id} AND userId = ${userId}`;
    return new Response('Subject deleted');
  } catch (error) {
    console.log(error);
    return new Response('Unauthorized', { status: 401 });
  }
}

