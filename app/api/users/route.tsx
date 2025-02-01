import { sql } from '@vercel/postgres'
import { verifySession } from '@/app/lib/helpers'

export async function GET() {
  try {
    const verification = await verifySession();
    const session = verification.session
    if (!session) return new Response('Unauthorized', { status: 401 })
    const users = (await sql`SELECT id, name, year, color, role FROM users`).rows
    return new Response(JSON.stringify(users))

  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
}