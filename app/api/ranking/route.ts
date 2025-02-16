import { sql } from '@vercel/postgres'

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    const subjects = (await sql`SELECT * FROM subjects WHERE score IS NOT NULL;`).rows
    return new Response(JSON.stringify(subjects))
  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
}