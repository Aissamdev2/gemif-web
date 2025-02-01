import { sql } from '@vercel/postgres'

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    const users = (await sql`SELECT id, name, year, color, role FROM users`).rows
    return new Response(JSON.stringify(users))

  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
}