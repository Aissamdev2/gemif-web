import { sql } from '@vercel/postgres'
import { User } from '@/app/lib/definitions';

export async function GET(request: Request) {

  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    const user = (await sql`SELECT * FROM users WHERE id = ${userId}`).rows[0] as User
    return new Response(JSON.stringify(user))
  } catch (error) {
    return new Response('Unauthorized', { status: 401 })
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    if (!body) return new Response('Invalid request body', { status: 400 });

    const { name, email, year, role, logincount, lastseen, color } = body;

    // Prepare the fields to update based on the provided fields
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      fieldsToUpdate.push(`name = $${fieldsToUpdate.length + 1}`);
      values.push(name);
    }
    if (email !== undefined) {
      fieldsToUpdate.push(`email = $${fieldsToUpdate.length + 1}`);
      values.push(email);
    }
    if (year !== undefined) {
      fieldsToUpdate.push(`year = $${fieldsToUpdate.length + 1}`);
      values.push(year);
    }
    if (role !== undefined) {
      fieldsToUpdate.push(`role = $${fieldsToUpdate.length + 1}`);
      values.push(role);
    }
    if (lastseen !== undefined) {
      fieldsToUpdate.push(`lastseen = $${fieldsToUpdate.length + 1}`);
      values.push(lastseen);
    }
    if (logincount !== undefined) {
      fieldsToUpdate.push(`logincount = $${fieldsToUpdate.length + 1}`);
      values.push(logincount);
    }
    if (color !== undefined) {
      fieldsToUpdate.push(`color = $${fieldsToUpdate.length + 1}`);
      values.push(color);
    }

    if (fieldsToUpdate.length === 0) {
      return new Response('No fields to update', { status: 400 });
    }

    // Add the event id and user id to the values array
    values.push(userId);

    // Construct the SQL query with placeholders
    const query = `
      UPDATE users 
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${fieldsToUpdate.length + 1}
      RETURNING *
    `;

    console.log('query: ',query, 'values: ', values);

    // Execute the SQL query using sql.query()
    const user = await sql.query(query, values);

    return new Response(JSON.stringify(user.rows[0]));
  } catch (error) {
    console.log(error);
    return new Response('Unauthorized', { status: 401 });
  }
}