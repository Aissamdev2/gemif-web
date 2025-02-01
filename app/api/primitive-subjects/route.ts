import { sql } from '@vercel/postgres'

export async function GET(request: Request) {
  console.log('Awawaw1')
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    console.log('Awawaw2')
    const primitive_subjects = (await sql`SELECT * FROM primitive_subjects`).rows;
    console.log(primitive_subjects.length)
    return new Response(JSON.stringify(primitive_subjects))
  } catch (error) {
    return new Response('Unauthorized', { status: 401 })
  }
}