import { sql } from '@vercel/postgres'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    const result = await sql`SELECT role FROM users WHERE id = ${userId}`;
    const role = result.rows[0].role;
    if (role !== 'admin' && role !== 'dev') return new Response('Unauthorized, not enough permission', { status: 401 })
    const { id } = params;
    await sql`DELETE FROM main_posts WHERE id = ${id}`;
    return new Response('Main post deleted');
  } catch (error) {
    console.log(error);
    return new Response('Unauthorized', { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    const result = await sql`SELECT role FROM users WHERE id = ${userId}`;
    const role = result.rows[0].role;
    if (role !== 'admin' && role !== 'dev') return new Response('Unauthorized, not enough permission', { status: 401 })

    const { id } = params;

    const body = await request.json();
    if (!body) return new Response('Invalid request body', { status: 400 });

    const { name, description, fileName, link } = body;

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

    if (fileName !== undefined) {
      fieldsToUpdate.push(`fileName = $${fieldsToUpdate.length + 1}`);
      values.push(fileName);
    }
    
    if (link !== undefined) {
      fieldsToUpdate.push(`link = $${fieldsToUpdate.length + 1}`);
      values.push(link);
    }

    if (fieldsToUpdate.length === 0) {
      return new Response('No fields to update', { status: 400 });
    }

    // Add the event id and user id to the values array
    values.push(id);

    // Construct the SQL query with placeholders
    const query = `
      UPDATE main_posts 
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${fieldsToUpdate.length + 1}
    `;

    // Execute the SQL query using sql.query()
    await sql.query(query, values);

    return new Response('Main post updated');
  } catch (error) {
    console.log(error);
    return new Response('Unauthorized', { status: 401 });
  }
}
