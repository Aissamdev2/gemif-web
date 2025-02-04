import { sql } from '@vercel/postgres'

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    const primitive_subjects = (await sql`SELECT * FROM primitive_subjects ORDER BY createdat`).rows;
    return new Response(JSON.stringify(primitive_subjects))
  } catch (error) {
    return new Response('Unauthorized', { status: 401 })
  }
}